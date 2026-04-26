"""
Handle staff commands via Telegram bot.
Staff can manage leads directly from Telegram without logging into the UI.

Commands:
  /take_<id>           - Take ownership of a lead, disable AI auto-reply
  /reply_<id> <text>   - Reply to a lead's customer via their channel
  /stop_<id>           - Disable AI auto-reply for a lead
  /ai_<id>             - Re-enable AI auto-reply for a lead
  /info_<id>           - Get lead details
  /myleads             - List your assigned leads
  /register            - Link your Telegram to your staff account
"""
import re
from ..models.lead import Lead
from ..models.user import User
from ..models.message import Message
from ..models.activity_log import ActivityLog
from ..extensions import db


def handle_staff_command(chat_id, text, bot_token):
    """
    Process a staff command. Returns reply text for the staff.
    Returns None if not a command (i.e., it's a customer message).
    """
    text = (text or '').strip()

    if not text.startswith('/'):
        return None  # Not a command → treat as customer message

    # Find staff user by telegram_chat_id
    staff = User.query.filter_by(telegram_chat_id=str(chat_id)).first()

    # /register <email> <password>
    m = re.match(r'^/register\s+(\S+)\s+(\S+)', text)
    if m:
        email, password = m.group(1), m.group(2)
        user = User.query.filter_by(email=email).first()
        if not user:
            return "❌ Email không tồn tại trong hệ thống."
        if not user.check_password(password):
            return "❌ Sai mật khẩu."
        user.telegram_chat_id = str(chat_id)
        db.session.commit()
        return f"✅ Đã liên kết Telegram với tài khoản {user.name} ({user.role}).\n\nBạn sẽ nhận thông báo lead mới tại đây.\n\nCác lệnh:\n/myleads - Xem lead của bạn\n/info_<id> - Xem chi tiết lead\n/reply_<id> <text> - Trả lời khách\n/take_<id> - Nhận lead\n/stop_<id> - Tắt AI\n/ai_<id> - Bật AI"

    if not staff:
        return "⚠️ Telegram chưa liên kết. Dùng:\n/register <email> <password>\n\nVí dụ: /register sales@leadflow.ai sales123"

    # /myleads
    if text.strip() == '/myleads':
        leads = Lead.query.filter_by(assigned_to=staff.id).filter(
            Lead.status.notin_(['WON', 'LOST'])
        ).order_by(Lead.created_at.desc()).limit(10).all()
        if not leads:
            return "📭 Bạn chưa có lead nào."
        lines = [f"📋 Lead của {staff.name}:\n"]
        for l in leads:
            ai_icon = "🤖" if l.ai_auto_reply_enabled else "👤"
            lines.append(f"  #{l.id} {l.name} | {l.temperature} | {l.status} {ai_icon}")
        return "\n".join(lines)

    # /take_<id>
    m = re.match(r'^/take_(\d+)', text)
    if m:
        lead_id = int(m.group(1))
        lead = Lead.query.get(lead_id)
        if not lead:
            return f"❌ Lead #{lead_id} không tồn tại."
        # Reassign
        old_user_id = lead.assigned_to
        if old_user_id and old_user_id != staff.id:
            old_user = User.query.get(old_user_id)
            if old_user and old_user.current_lead_count > 0:
                old_user.current_lead_count -= 1
        lead.assigned_to = staff.id
        lead.ai_auto_reply_enabled = False  # Staff takes over
        staff.current_lead_count = (staff.current_lead_count or 0) + 1
        db.session.add(ActivityLog(user_id=staff.id, lead_id=lead_id, action='lead_assigned',
                                   details={'via': 'telegram', 'ai_disabled': True}))
        db.session.commit()
        return f"✅ Bạn đã nhận lead #{lead_id} ({lead.name}).\n🤖 AI auto-reply: TẮT\n\nDùng /reply_{lead_id} <tin nhắn> để trả lời khách."

    # /reply_<id> <text>
    m = re.match(r'^/reply_(\d+)\s+(.+)', text, re.DOTALL)
    if m:
        lead_id = int(m.group(1))
        reply_text = m.group(2).strip()
        lead = Lead.query.get(lead_id)
        if not lead:
            return f"❌ Lead #{lead_id} không tồn tại."

        # Save message
        msg = Message(
            lead_id=lead_id, sender_type='sales', sender_id=staff.id,
            content=reply_text, channel='TELEGRAM',
        )
        db.session.add(msg)

        # Disable AI auto-reply (staff took over)
        lead.ai_auto_reply_enabled = False
        if lead.status == 'NEW':
            lead.status = 'CONTACTED'

        db.session.add(ActivityLog(user_id=staff.id, lead_id=lead_id, action='message_sent',
                                   details={'via': 'telegram', 'length': len(reply_text)}))
        db.session.commit()

        # Send to customer via their channel
        from .channel_service import reply_to_lead
        ok, channel, detail = reply_to_lead(lead, reply_text)

        # Emit WebSocket
        try:
            from ..extensions import socketio
            socketio.emit('new_message', {'lead_id': lead_id, 'message': msg.to_dict()})
            socketio.emit('lead_updated', lead.to_dict())
        except Exception:
            pass

        if ok:
            return f"✅ Đã gửi cho {lead.name} qua {channel}.\n🤖 AI auto-reply: TẮT"
        else:
            return f"⚠️ Tin nhắn đã lưu nhưng gửi {channel} thất bại: {detail}"

    # /stop_<id>
    m = re.match(r'^/stop_(\d+)', text)
    if m:
        lead_id = int(m.group(1))
        lead = Lead.query.get(lead_id)
        if not lead:
            return f"❌ Lead #{lead_id} không tồn tại."
        lead.ai_auto_reply_enabled = False
        db.session.commit()
        return f"🔇 AI auto-reply TẮT cho lead #{lead_id} ({lead.name})."

    # /ai_<id>
    m = re.match(r'^/ai_(\d+)', text)
    if m:
        lead_id = int(m.group(1))
        lead = Lead.query.get(lead_id)
        if not lead:
            return f"❌ Lead #{lead_id} không tồn tại."
        lead.ai_auto_reply_enabled = True
        db.session.commit()
        return f"🤖 AI auto-reply BẬT cho lead #{lead_id} ({lead.name})."

    # /info_<id>
    m = re.match(r'^/info_(\d+)', text)
    if m:
        lead_id = int(m.group(1))
        lead = Lead.query.get(lead_id)
        if not lead:
            return f"❌ Lead #{lead_id} không tồn tại."
        ai_status = "🤖 BẬT" if lead.ai_auto_reply_enabled else "👤 TẮT"
        assigned = lead.assigned_user.name if lead.assigned_user else "Chưa assign"
        return (
            f"📋 Lead #{lead.id}\n"
            f"👤 {lead.name}\n"
            f"📱 {lead.source} | 🌡 {lead.temperature} | {lead.status}\n"
            f"💬 {(lead.content or '')[:150]}\n"
            f"👨‍💼 Assigned: {assigned}\n"
            f"🤖 AI auto-reply: {ai_status}\n"
            f"📊 Budget: {lead.budget or 'N/A'} | Urgency: {lead.urgency or 'N/A'}\n"
            f"\n/reply_{lead.id} <text> - Trả lời\n/take_{lead.id} - Nhận lead\n/stop_{lead.id} - Tắt AI"
        )

    # /start or /help
    if text.strip() in ('/start', '/help'):
        if staff:
            return (
                f"👋 Xin chào {staff.name}!\n\n"
                f"📋 Lệnh:\n"
                f"/myleads - Xem lead của bạn\n"
                f"/info_<id> - Chi tiết lead\n"
                f"/reply_<id> <text> - Trả lời khách\n"
                f"/take_<id> - Nhận lead + tắt AI\n"
                f"/stop_<id> - Tắt AI auto-reply\n"
                f"/ai_<id> - Bật AI auto-reply\n"
            )

    return "❓ Lệnh không hợp lệ. Dùng /help để xem danh sách lệnh."


def notify_staff_new_lead(lead, assigned_user, bot_token):
    """Send notification to assigned staff's Telegram about new lead."""
    if not assigned_user or not assigned_user.telegram_chat_id or not bot_token:
        return

    ai_note = "🤖 AI đang xử lý và sẽ tự động trả lời..." if lead.ai_auto_reply_enabled else ""

    text = (
        f"🔔 <b>Lead mới được assign cho bạn!</b>\n\n"
        f"👤 <b>{lead.name}</b>\n"
        f"📱 {lead.source} | 🌡 {lead.temperature}\n"
        f"💬 {(lead.content or '')[:200]}\n"
        f"{ai_note}\n\n"
        f"📋 Lệnh:\n"
        f"/info_{lead.id} - Xem chi tiết\n"
        f"/reply_{lead.id} &lt;text&gt; - Trả lời khách\n"
        f"/take_{lead.id} - Nhận lead + tắt AI\n"
        f"/stop_{lead.id} - Tắt AI"
    )

    try:
        import requests as http_requests
        http_requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": assigned_user.telegram_chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10,
        )
    except Exception as e:
        print(f"Staff notification error: {e}")
