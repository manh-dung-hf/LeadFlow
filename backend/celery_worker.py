from celery import Celery
from app import create_app
from datetime import datetime, timedelta


def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL'],
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


app = create_app()
celery = make_celery(app)

celery.conf.beat_schedule = {
    'check-sla-every-minute': {
        'task': 'celery_worker.check_sla_violations',
        'schedule': 60.0,
    },
    'check-follow-ups-every-5-minutes': {
        'task': 'celery_worker.check_follow_up_reminders',
        'schedule': 300.0,
    },
}


@celery.task
def process_lead_ai(lead_id):
    """Process lead with AI, then auto-reply to the customer via their channel."""
    from app.models.lead import Lead
    from app.models.message import Message
    from app.extensions import db
    from app.services.ai_service import AIService

    lead = Lead.query.get(lead_id)
    if not lead:
        return

    ai_service = AIService()
    analysis = ai_service.process_lead(lead.content or '')

    if not analysis:
        return

    # Save AI results
    lead.language = analysis.get('language')
    lead.intent = analysis.get('intent')
    lead.temperature = analysis.get('temperature', lead.temperature)
    lead.product_interest = str(analysis.get('product_interest', ''))
    lead.budget = analysis.get('budget')
    lead.urgency = analysis.get('urgency')
    lead.ai_summary = analysis.get('summary')
    lead.ai_suggested_reply = analysis.get('suggested_reply')
    lead.ai_next_action = analysis.get('next_action')

    # Log activity
    from app.models.activity_log import ActivityLog
    log = ActivityLog(
        user_id=None, lead_id=lead_id, action='ai_processed',
        details={'temperature': lead.temperature, 'intent': lead.intent,
                 'language': lead.language, 'urgency': lead.urgency},
    )
    db.session.add(log)
    db.session.commit()

    # ── AUTO-REPLY to customer via their channel ──
    suggested_reply = analysis.get('suggested_reply', '')
    if suggested_reply and lead.phone and lead.source:
        try:
            from app.services.channel_service import reply_to_lead
            ok, channel, detail = reply_to_lead(lead, suggested_reply)

            # Save auto-reply as a message in conversation
            if ok:
                auto_msg = Message(
                    lead_id=lead_id,
                    sender_type='ai',
                    sender_id=None,
                    content=suggested_reply,
                    channel=channel.upper(),
                )
                db.session.add(auto_msg)

                # Update lead status
                if lead.status == 'NEW':
                    lead.status = 'CONTACTED'
                    lead.first_response_at = datetime.utcnow()
                    if lead.created_at:
                        delta = datetime.utcnow() - lead.created_at.replace(tzinfo=None)
                        lead.response_time_seconds = int(delta.total_seconds())

                # Log auto-reply activity
                reply_log = ActivityLog(
                    user_id=None, lead_id=lead_id, action='ai_auto_reply',
                    details={'channel': channel, 'reply_length': len(suggested_reply)},
                )
                db.session.add(reply_log)
                db.session.commit()

        except Exception as e:
            print(f"Auto-reply error for lead {lead_id}: {e}")

    # Emit update via WebSocket
    try:
        from app.extensions import socketio
        socketio.emit('lead_updated', lead.to_dict())
    except Exception:
        pass


@celery.task
def process_and_reply(lead_id, new_message_content):
    """
    For follow-up messages in existing thread:
    - Use conversation history to generate contextual reply
    - Only reply if no human (sales) has replied
    - Send reply via the lead's channel
    """
    from app.models.lead import Lead
    from app.models.message import Message
    from app.models.activity_log import ActivityLog
    from app.extensions import db
    from app.services.ai_service import AIService

    lead = Lead.query.get(lead_id)
    if not lead:
        return

    # Check again: if sales already replied, skip AI reply
    has_human_reply = Message.query.filter_by(
        lead_id=lead_id, sender_type='sales'
    ).first() is not None

    if has_human_reply:
        return  # Human took over, AI stays quiet

    # Get conversation history
    messages = (
        Message.query
        .filter_by(lead_id=lead_id)
        .order_by(Message.timestamp.asc())
        .limit(20)
        .all()
    )
    conversation = "\n".join(
        [f"[{m.sender_type}]: {m.content}" for m in messages]
    )

    # Generate contextual reply using follow-up suggestion
    ai_service = AIService()
    suggestion = ai_service.suggest_follow_up(lead.to_dict(), conversation)

    if not suggestion:
        return

    reply_text = suggestion.get('follow_up_message', '')
    if not reply_text or not lead.phone:
        return

    # Send reply via channel
    try:
        from app.services.channel_service import reply_to_lead
        ok, channel, detail = reply_to_lead(lead, reply_text)

        if ok:
            auto_msg = Message(
                lead_id=lead_id,
                sender_type='ai',
                sender_id=None,
                content=reply_text,
                channel=channel.upper(),
            )
            db.session.add(auto_msg)

            log = ActivityLog(
                user_id=None, lead_id=lead_id, action='ai_auto_reply',
                details={'channel': channel, 'context': 'follow_up'},
            )
            db.session.add(log)
            db.session.commit()

            try:
                from app.extensions import socketio
                socketio.emit('new_message', {'lead_id': lead_id, 'message': auto_msg.to_dict()})
            except Exception:
                pass

    except Exception as e:
        print(f"Follow-up auto-reply error for lead {lead_id}: {e}")


@celery.task
def check_sla_violations():
    from app.models.lead import Lead
    from app.extensions import db
    from app.services.notification_service import notify_sla_warning, notify_sla_violation

    now = datetime.utcnow()
    five_min_ago = now - timedelta(minutes=5)
    ten_min_ago = now - timedelta(minutes=10)

    warning_leads = Lead.query.filter(
        Lead.status == 'NEW', Lead.created_at <= five_min_ago,
        Lead.created_at > ten_min_ago, Lead.sla_warning.is_(False),
    ).all()

    for lead in warning_leads:
        lead.sla_warning = True
        try:
            from app.extensions import socketio
            notify_sla_warning(lead, socketio)
        except Exception:
            notify_sla_warning(lead)

    violation_leads = Lead.query.filter(
        Lead.status == 'NEW', Lead.created_at <= ten_min_ago,
        Lead.sla_violated.is_(False),
    ).all()

    for lead in violation_leads:
        lead.sla_violated = True
        try:
            from app.extensions import socketio
            notify_sla_violation(lead, socketio)
        except Exception:
            notify_sla_violation(lead)

    if warning_leads or violation_leads:
        db.session.commit()


@celery.task
def check_follow_up_reminders():
    from app.models.lead import Lead
    from app.extensions import db
    from app.services.notification_service import notify_follow_up_due

    now = datetime.utcnow()

    due_leads = Lead.query.filter(
        Lead.next_follow_up.isnot(None), Lead.next_follow_up <= now,
        Lead.status.notin_(['WON', 'LOST']),
    ).all()

    for lead in due_leads:
        try:
            from app.extensions import socketio
            notify_follow_up_due(lead, socketio)
        except Exception:
            notify_follow_up_due(lead)
        lead.next_follow_up = now + timedelta(days=1)
        lead.follow_up_count = (lead.follow_up_count or 0) + 1

    stale_leads = Lead.query.filter(
        Lead.status.in_(['CONTACTED', 'QUOTED', 'NEGOTIATION']),
        Lead.updated_at <= now - timedelta(hours=24),
        Lead.next_follow_up.is_(None),
    ).all()

    for lead in stale_leads:
        lead.next_follow_up = now + timedelta(hours=4)

    if due_leads or stale_leads:
        db.session.commit()
