from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.message import Message
from ..extensions import db
from ..models.lead import Lead
from ..models.user import User
from datetime import datetime

messages_bp = Blueprint('messages', __name__)


@messages_bp.route('/lead/<int:lead_id>', methods=['GET'])
@jwt_required()
def get_lead_messages(lead_id):
    """Get all messages for a specific lead with pagination."""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    lead = Lead.query.get_or_404(lead_id)
    if user.role == 'SALES' and lead.assigned_to != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    pagination = (
        Message.query
        .filter_by(lead_id=lead_id)
        .order_by(Message.timestamp.asc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        'messages': [msg.to_dict() for msg in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
    }), 200


@messages_bp.route('', methods=['POST'])
@jwt_required()
def create_message():
    """Create a new message and optionally send via lead's channel."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('lead_id') or not data.get('content'):
        return jsonify({"error": "lead_id and content are required"}), 400

    lead = Lead.query.get_or_404(data['lead_id'])
    user = User.query.get(int(user_id))

    if user.role == 'SALES' and lead.assigned_to != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    message = Message(
        lead_id=data['lead_id'],
        sender_type='sales',
        sender_id=int(user_id),
        content=data['content'],
        channel=data.get('channel', lead.source or 'MANUAL'),
    )
    db.session.add(message)

    # Update lead status and SLA on first contact
    now = datetime.utcnow()
    if lead.status == 'NEW':
        lead.status = 'CONTACTED'
        lead.first_response_at = now
        if lead.created_at:
            response_time = now - lead.created_at.replace(tzinfo=None)
            lead.response_time_seconds = int(response_time.total_seconds())
            if lead.response_time_seconds > 600:
                lead.sla_violated = True
            elif lead.response_time_seconds > 300:
                lead.sla_warning = True

    db.session.commit()

    # ── Send reply via lead's original channel ──
    channel_result = {"sent": False, "channel": "none", "detail": ""}
    try:
        from ..services.channel_service import reply_to_lead
        ok, channel, detail = reply_to_lead(lead, data['content'])
        channel_result = {"sent": ok, "channel": channel, "detail": detail}
    except Exception as e:
        channel_result = {"sent": False, "channel": "error", "detail": str(e)}

    # Emit real-time
    try:
        from app.extensions import socketio
        socketio.emit('new_message', {
            'lead_id': message.lead_id,
            'message': message.to_dict(),
        })
    except Exception:
        pass

    result = message.to_dict()
    result['channel_reply'] = channel_result
    return jsonify(result), 201


@messages_bp.route('/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    message = Message.query.get_or_404(message_id)

    if user.role != 'ADMIN' and (message.sender_type != 'sales' or message.sender_id != int(user_id)):
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(message)
    db.session.commit()
    return jsonify({"message": "Message deleted"}), 200
