"""
Send outbound messages to leads via their original channel (Telegram, WhatsApp, Zalo).
"""
import requests
from ..models.integration import Integration


def send_telegram_message(chat_id, text):
    """Send a message to a Telegram chat."""
    try:
        integration = Integration.query.filter_by(name='telegram', is_active=True).first()
        if not integration or not integration.config:
            return False, "Telegram not configured"

        token = integration.config.get('token')
        if not token:
            return False, "No bot token"

        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10,
        )

        if resp.status_code == 200 and resp.json().get('ok'):
            return True, "Sent"
        return False, resp.json().get('description', 'Unknown error')
    except Exception as e:
        return False, str(e)


def send_whatsapp_message(phone_number, text):
    """Send a message via WhatsApp Business API."""
    try:
        integration = Integration.query.filter_by(name='whatsapp', is_active=True).first()
        if not integration or not integration.config:
            return False, "WhatsApp not configured"

        api_key = integration.config.get('api_key')
        phone_id = integration.config.get('phone_number_id')
        api_url = integration.config.get('api_url', 'https://graph.facebook.com/v18.0')

        if not api_key or not phone_id:
            return False, "Missing API key or Phone Number ID"

        resp = requests.post(
            f"{api_url}/{phone_id}/messages",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "messaging_product": "whatsapp",
                "to": phone_number,
                "type": "text",
                "text": {"body": text},
            },
            timeout=10,
        )

        if resp.status_code == 200:
            return True, "Sent"
        return False, resp.text[:200]
    except Exception as e:
        return False, str(e)


def send_zalo_message(user_id, text):
    """Send a message via Zalo OA API."""
    try:
        integration = Integration.query.filter_by(name='zalo', is_active=True).first()
        if not integration or not integration.config:
            return False, "Zalo not configured"

        # Zalo OA API requires access token (obtained via OAuth)
        # This is a simplified version
        return False, "Zalo reply requires OAuth access token (not implemented for dev)"
    except Exception as e:
        return False, str(e)


def reply_to_lead(lead, text):
    """
    Send a reply to a lead via their original channel.
    Returns (success: bool, channel: str, detail: str)
    """
    source = (lead.source or '').upper()
    phone = lead.phone or ''

    if source == 'TELEGRAM' and phone:
        ok, detail = send_telegram_message(phone, text)
        return ok, 'telegram', detail

    elif source == 'WHATSAPP' and phone:
        ok, detail = send_whatsapp_message(phone, text)
        return ok, 'whatsapp', detail

    elif source == 'ZALO' and phone:
        ok, detail = send_zalo_message(phone, text)
        return ok, 'zalo', detail

    else:
        return False, source.lower(), f"No reply channel for source '{source}' or missing contact info"
