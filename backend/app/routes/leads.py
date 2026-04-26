from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.lead import Lead
from ..extensions import db
from ..models.user import User
from ..services.assignment_service import auto_assign_lead, reassign_lead

leads_bp = Blueprint('leads', __name__)


@leads_bp.route('', methods=['GET'])
@jwt_required()
def get_leads():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    query = Lead.query
    if user.role == 'SALES':
        query = query.filter_by(assigned_to=user.id)

    # Filtering
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    temperature = request.args.get('temperature')
    if temperature:
        query = query.filter_by(temperature=temperature)

    source = request.args.get('source')
    if source:
        query = query.filter_by(source=source)

    search = request.args.get('search')
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                Lead.name.ilike(search_term),
                Lead.email.ilike(search_term),
                Lead.phone.ilike(search_term),
                Lead.country.ilike(search_term),
                Lead.content.ilike(search_term),
            )
        )

    assigned = request.args.get('assigned_to')
    if assigned:
        query = query.filter_by(assigned_to=int(assigned))

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)  # Cap at 100

    pagination = query.order_by(Lead.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'leads': [lead.to_dict() for lead in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    }), 200


@leads_bp.route('', methods=['POST'])
@jwt_required()
def create_lead():
    data = request.get_json()
    lead = Lead(
        name=data.get('name'),
        phone=data.get('phone'),
        email=data.get('email'),
        country=data.get('country'),
        source=data.get('source', 'MANUAL'),
        content=data.get('content'),
        estimated_value=data.get('estimated_value', 0),
    )
    db.session.add(lead)
    db.session.flush()  # Get the ID before commit

    # Auto-assign lead
    assigned_user = auto_assign_lead(lead)
    db.session.commit()

    # Trigger AI processing
    try:
        from celery_worker import process_lead_ai
        process_lead_ai.delay(lead.id)
    except Exception as e:
        print(f"Celery task error: {e}")

    # Notify
    try:
        from app import socketio
        from ..services.notification_service import notify_new_lead
        notify_new_lead(lead, assigned_user, socketio)
        socketio.emit('lead_created', lead.to_dict())
    except Exception as e:
        print(f"Notification error: {e}")

    # Log activity
    from ..services.activity_service import log_activity
    log_activity(get_jwt_identity(), 'lead_created', lead.id, {'name': lead.name, 'source': lead.source})
    db.session.commit()

    return jsonify(lead.to_dict()), 201


@leads_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_lead(id):
    lead = Lead.query.get_or_404(id)
    return jsonify(lead.to_dict()), 200


@leads_bp.route('/<int:id>', methods=['PATCH'])
@jwt_required()
def update_lead(id):
    lead = Lead.query.get_or_404(id)
    data = request.get_json()

    # Handle reassignment
    if 'assigned_to' in data and data['assigned_to'] != lead.assigned_to:
        reassign_lead(lead, data['assigned_to'])
        data.pop('assigned_to')

    for key, value in data.items():
        if hasattr(lead, key):
            setattr(lead, key, value)

    db.session.commit()

    # Log activity
    from ..services.activity_service import log_activity
    log_activity(get_jwt_identity(), 'lead_updated', lead.id, {'changes': list(data.keys())})
    db.session.commit()

    # Emit update
    try:
        from app import socketio
        socketio.emit('lead_updated', lead.to_dict())
    except Exception:
        pass

    return jsonify(lead.to_dict()), 200


@leads_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_lead(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role not in ('ADMIN', 'MANAGER'):
        return jsonify({"error": "Unauthorized"}), 403

    lead = Lead.query.get_or_404(id)

    # Decrement assigned user count
    if lead.assigned_to:
        assigned_user = User.query.get(lead.assigned_to)
        if assigned_user and assigned_user.current_lead_count > 0:
            assigned_user.current_lead_count -= 1

    db.session.delete(lead)
    db.session.commit()
    return jsonify({"message": "Lead deleted"}), 200


@leads_bp.route('/<int:id>/assign', methods=['POST'])
@jwt_required()
def assign_lead(id):
    """Manually assign or reassign a lead."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role == 'SALES':
        return jsonify({"error": "Unauthorized"}), 403

    lead = Lead.query.get_or_404(id)
    data = request.get_json()
    new_user_id = data.get('user_id')

    if not new_user_id:
        return jsonify({"error": "user_id is required"}), 400

    assigned_user = reassign_lead(lead, new_user_id)
    if not assigned_user:
        return jsonify({"error": "User not found"}), 404

    try:
        from app import socketio
        from ..services.notification_service import create_notification
        create_notification(
            new_user_id, lead.id, 'assignment',
            f"Lead Assigned: {lead.name}",
            f"You have been assigned lead: {lead.name} ({lead.temperature})",
            socketio
        )
    except Exception:
        pass

    return jsonify(lead.to_dict()), 200


@leads_bp.route('/<int:id>/follow-up', methods=['POST'])
@jwt_required()
def get_follow_up_suggestion(id):
    """Get AI follow-up suggestion for a lead."""
    lead = Lead.query.get_or_404(id)

    # Get conversation history
    from ..models.message import Message
    messages = Message.query.filter_by(lead_id=id).order_by(Message.timestamp.asc()).limit(20).all()
    conversation = "\n".join(
        [f"[{m.sender_type}] {m.content}" for m in messages]
    )

    from ..services.ai_service import AIService
    ai_service = AIService()
    suggestion = ai_service.suggest_follow_up(lead.to_dict(), conversation)

    if suggestion:
        return jsonify(suggestion), 200
    return jsonify({"error": "AI service unavailable"}), 503


@leads_bp.route('/pipeline', methods=['GET'])
@jwt_required()
def get_pipeline():
    """Get leads grouped by status for kanban view."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    query = Lead.query
    if user.role == 'SALES':
        query = query.filter_by(assigned_to=user.id)

    leads = query.order_by(Lead.updated_at.desc()).all()

    pipeline = {}
    for status in ['NEW', 'CONTACTED', 'WHATSAPP_MOVED', 'QUOTED', 'NEGOTIATION', 'WON', 'LOST']:
        pipeline[status] = [l.to_dict() for l in leads if l.status == status]

    return jsonify(pipeline), 200


@leads_bp.route('/users', methods=['GET'])
@jwt_required()
def get_sales_users():
    """Get list of sales users for assignment dropdown."""
    users = User.query.filter(
        User.role.in_(['SALES', 'MANAGER']),
        User.is_active.is_(True)
    ).all()
    return jsonify([u.to_dict() for u in users]), 200
