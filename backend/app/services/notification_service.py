import requests
from ..models.notification import Notification
from ..models.integration import Integration
from ..extensions import db


def create_notification(user_id, lead_id, notif_type, title, message, socketio=None):
    """Create an in-app notification and optionally push via WebSocket."""
    notif = Notification(
        user_id=user_id,
        lead_id=lead_id,
        type=notif_type,
        title=title,
        message=message,
    )
    db.session.add(notif)
    db.session.commit()

    # Push via WebSocket if available
    if socketio:
        socketio.emit('notification', notif.to_dict(), room=f'user_{user_id}')

    return notif


def send_telegram_notification(message_text, chat_id=None):
    """Send a notification message via Telegram bot."""
    try:
        integration = Integration.query.filter_by(name='telegram', is_active=True).first()
        if not integration or not integration.config:
            return False

        token = integration.config.get('token')
        notify_chat_id = chat_id or integration.config.get('notify_chat_id')

        if not token or not notify_chat_id:
            return False

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        response = requests.post(url, json={
            'chat_id': notify_chat_id,
            'text': message_text,
            'parse_mode': 'HTML',
        }, timeout=10)

        return response.status_code == 200
    except Exception as e:
        print(f"Telegram notification error: {e}")
        return False


def notify_new_lead(lead, assigned_user, socketio=None):
    """Notify about a new lead assignment."""
    title = f"New Lead: {lead.name}"
    message = f"New {lead.temperature} lead from {lead.source}: {lead.name} ({lead.country or 'Unknown'})"

    # In-app notification
    if assigned_user:
        create_notification(
            assigned_user.id, lead.id, 'new_lead', title, message, socketio
        )

    # Telegram notification
    telegram_msg = (
        f"🔔 <b>New Lead Assigned</b>\n"
        f"👤 {lead.name}\n"
        f"🌡 {lead.temperature}\n"
        f"📱 Source: {lead.source}\n"
        f"🌍 {lead.country or 'N/A'}\n"
        f"👨‍💼 Assigned to: {assigned_user.name if assigned_user else 'Unassigned'}"
    )
    send_telegram_notification(telegram_msg)


def notify_sla_warning(lead, socketio=None):
    """Notify about SLA warning (>5 min no response)."""
    if lead.assigned_to:
        create_notification(
            lead.assigned_to, lead.id, 'sla_warning',
            f"⚠️ SLA Warning: {lead.name}",
            f"Lead {lead.name} has not been responded to in over 5 minutes!",
            socketio
        )
        send_telegram_notification(
            f"⚠️ <b>SLA Warning</b>\n"
            f"Lead {lead.name} waiting >5 min for response!\n"
            f"Temperature: {lead.temperature}"
        )


def notify_sla_violation(lead, socketio=None):
    """Notify about SLA violation (>10 min no response)."""
    if lead.assigned_to:
        create_notification(
            lead.assigned_to, lead.id, 'sla_violation',
            f"🚨 SLA Violation: {lead.name}",
            f"Lead {lead.name} has not been responded to in over 10 minutes! Immediate action required.",
            socketio
        )

    # Also notify all managers
    from ..models.user import User
    managers = User.query.filter(User.role.in_(['ADMIN', 'MANAGER'])).all()
    for manager in managers:
        create_notification(
            manager.id, lead.id, 'sla_violation',
            f"🚨 SLA Violation: {lead.name}",
            f"Lead {lead.name} (assigned to user #{lead.assigned_to}) exceeded 10-min SLA!",
            socketio
        )

    send_telegram_notification(
        f"🚨 <b>SLA VIOLATION</b>\n"
        f"Lead {lead.name} waiting >10 min!\n"
        f"Temperature: {lead.temperature}\n"
        f"Immediate action required!"
    )


def notify_follow_up_due(lead, socketio=None):
    """Notify that a follow-up is due."""
    if lead.assigned_to:
        create_notification(
            lead.assigned_to, lead.id, 'follow_up_due',
            f"📋 Follow-up Due: {lead.name}",
            f"Follow-up is due for lead {lead.name}. Status: {lead.status}, Temperature: {lead.temperature}",
            socketio
        )
        send_telegram_notification(
            f"📋 <b>Follow-up Due</b>\n"
            f"Lead: {lead.name}\n"
            f"Status: {lead.status}\n"
            f"Temperature: {lead.temperature}"
        )
