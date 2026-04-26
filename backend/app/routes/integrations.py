import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..models.integration import Integration
from ..extensions import db
from ..models.lead import Lead

integrations_bp = Blueprint('integrations', __name__)


@integrations_bp.route('', methods=['GET'])
@jwt_required()
def get_integrations():
    integrations = Integration.query.all()
    return jsonify([i.to_dict() for i in integrations]), 200


@integrations_bp.route('/<name>', methods=['PUT'])
@jwt_required()
def update_integration(name):
    data = request.get_json()
    integration = Integration.query.filter_by(name=name).first()
    if not integration:
        integration = Integration(name=name)
        db.session.add(integration)

    integration.config = data.get('config')
    integration.is_active = data.get('is_active', True)
    db.session.commit()
    return jsonify(integration.to_dict()), 200


@integrations_bp.route('/test/<name>', methods=['POST'])
@jwt_required()
def test_integration(name):
    """Test connection to an integration."""
    integration = Integration.query.filter_by(name=name).first()
    if not integration or not integration.config:
        return jsonify({"status": "error", "message": f"No configuration found for {name}"}), 400

    if name == 'telegram':
        token = integration.config.get('token')
        if not token:
            return jsonify({"status": "error", "message": "No bot token configured"}), 400
        try:
            resp = requests.get(
                f"https://api.telegram.org/bot{token}/getMe",
                timeout=10,
            )
            if resp.status_code == 200 and resp.json().get('ok'):
                bot_info = resp.json()['result']
                return jsonify({
                    "status": "success",
                    "message": f"Connected to bot @{bot_info.get('username', 'unknown')}",
                    "bot_info": bot_info,
                }), 200
            return jsonify({"status": "error", "message": "Invalid bot token"}), 400
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    elif name == 'whatsapp':
        api_key = integration.config.get('api_key')
        api_url = integration.config.get('api_url', '')
        if not api_key:
            return jsonify({"status": "error", "message": "No API key configured"}), 400
        # WhatsApp Business API health check
        try:
            if api_url:
                resp = requests.get(
                    api_url,
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=10,
                )
                if resp.status_code == 200:
                    return jsonify({"status": "success", "message": "WhatsApp API connected"}), 200
            return jsonify({"status": "success", "message": "API key configured (connection test requires API URL)"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    elif name == 'zalo':
        return jsonify({"status": "success", "message": "Zalo OA configured (manual verification required)"}), 200

    elif name == 'alibaba':
        return jsonify({"status": "success", "message": "Alibaba webhook configured"}), 200

    return jsonify({"status": "success", "message": f"Configuration saved for {name}"}), 200


@integrations_bp.route('/webhook/<name>', methods=['POST'])
def handle_webhook(name):
    """
    Generic webhook handler for all channels.
    - If the same contact (phone/chat_id) already has an open lead → add message to that thread
    - If new contact → create new lead
    - AI auto-reply only if no human (sales) has replied yet
    """
    from ..models.message import Message
    data = request.get_json() or {}

    lead_name = "New Lead"
    lead_content = ""
    lead_phone = ""
    lead_email = ""
    lead_country = ""

    if name == 'telegram':
        msg = data.get('message', {})
        if not msg:
            return jsonify({"status": "ignored"}), 200
        user = msg.get('from', {})
        lead_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get('username', 'Telegram User')
        lead_content = msg.get('text', '')
        lead_phone = str(msg.get('chat', {}).get('id', ''))

    elif name == 'zalo':
        sender = data.get('sender', {})
        lead_name = sender.get('name', 'Zalo User')
        lead_content = data.get('message', {}).get('text', '')
        lead_phone = str(sender.get('id', ''))

    elif name == 'whatsapp':
        entry = data.get('entry', [{}])[0] if data.get('entry') else {}
        changes = entry.get('changes', [{}])[0] if entry.get('changes') else {}
        value = changes.get('value', {})
        contacts = value.get('contacts', [{}])
        messages = value.get('messages', [{}])
        if contacts:
            contact = contacts[0]
            lead_name = contact.get('profile', {}).get('name', 'WhatsApp User')
            lead_phone = contact.get('wa_id', '')
        if messages:
            m = messages[0]
            lead_content = m.get('text', {}).get('body', '') if m.get('type') == 'text' else f"[{m.get('type', 'media')}]"

    elif name == 'alibaba':
        lead_name = data.get('buyer_name', data.get('name', 'Alibaba Lead'))
        lead_content = data.get('message', data.get('inquiry', ''))
        lead_email = data.get('email', '')
        lead_country = data.get('country', '')
        lead_phone = data.get('phone', '')

    elif name == 'web':
        lead_name = data.get('name', 'Web Lead')
        lead_content = data.get('message', data.get('content', ''))
        lead_email = data.get('email', '')
        lead_phone = data.get('phone', '')
        lead_country = data.get('country', '')

    if not lead_content:
        return jsonify({"status": "ignored", "reason": "empty message"}), 200

    # ── THREAD MERGING: find existing open lead from same contact ──
    existing_lead = None
    if lead_phone:
        existing_lead = (
            Lead.query
            .filter_by(phone=lead_phone, source=name.upper())
            .filter(Lead.status.notin_(['WON', 'LOST']))
            .order_by(Lead.created_at.desc())
            .first()
        )

    if existing_lead:
        # ── EXISTING THREAD: add message to conversation ──
        new_msg = Message(
            lead_id=existing_lead.id,
            sender_type='lead',
            sender_id=None,
            content=lead_content,
            channel=name.upper(),
        )
        db.session.add(new_msg)
        # Update lead content with latest message
        existing_lead.content = lead_content
        db.session.commit()

        # Emit real-time update
        try:
            from app.extensions import socketio
            socketio.emit('new_message', {'lead_id': existing_lead.id, 'message': new_msg.to_dict()})
            socketio.emit('lead_updated', existing_lead.to_dict())
        except Exception:
            pass

        # AI auto-reply ONLY if no human has replied yet
        has_human_reply = Message.query.filter_by(
            lead_id=existing_lead.id, sender_type='sales'
        ).first() is not None

        if not has_human_reply:
            try:
                from celery_worker import process_and_reply
                process_and_reply.delay(existing_lead.id, lead_content)
            except Exception:
                pass

        return jsonify({"status": "thread_updated", "lead_id": existing_lead.id}), 200

    else:
        # ── NEW LEAD ──
        new_lead = Lead(
            name=lead_name,
            content=lead_content,
            phone=lead_phone,
            email=lead_email,
            country=lead_country,
            source=name.upper(),
            status='NEW',
        )
        db.session.add(new_lead)
        db.session.flush()

        # Save first message in conversation
        first_msg = Message(
            lead_id=new_lead.id,
            sender_type='lead',
            sender_id=None,
            content=lead_content,
            channel=name.upper(),
        )
        db.session.add(first_msg)

        # Auto-assign
        from ..services.assignment_service import auto_assign_lead
        assigned_user = auto_assign_lead(new_lead)
        db.session.commit()

        # Trigger AI processing + auto-reply
        try:
            from celery_worker import process_lead_ai
            process_lead_ai.delay(new_lead.id)
        except Exception as e:
            print(f"Celery task error: {e}")

        # Notify
        try:
            from app.extensions import socketio
            from ..services.notification_service import notify_new_lead
            notify_new_lead(new_lead, assigned_user, socketio)
            socketio.emit('lead_created', new_lead.to_dict())
        except Exception:
            pass

        return jsonify({"status": "received", "lead_id": new_lead.id}), 200


# Public web form endpoint (no auth required)
@integrations_bp.route('/public/lead', methods=['POST'])
def public_lead_form():
    """Public endpoint for web form lead submission."""
    data = request.get_json() or {}

    if not data.get('name'):
        return jsonify({"error": "Name is required"}), 400

    new_lead = Lead(
        name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone'),
        country=data.get('country'),
        content=data.get('message', data.get('content', '')),
        source='WEB',
        status='NEW',
    )
    db.session.add(new_lead)
    db.session.flush()

    from ..services.assignment_service import auto_assign_lead
    assigned_user = auto_assign_lead(new_lead)
    db.session.commit()

    try:
        from celery_worker import process_lead_ai
        process_lead_ai.delay(new_lead.id)
    except Exception:
        pass

    try:
        from app import socketio
        from ..services.notification_service import notify_new_lead
        notify_new_lead(new_lead, assigned_user, socketio)
        socketio.emit('lead_created', new_lead.to_dict())
    except Exception:
        pass

    return jsonify({"status": "success", "message": "Thank you! We will contact you soon."}), 201
