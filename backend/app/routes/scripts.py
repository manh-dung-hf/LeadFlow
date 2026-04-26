from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.script import Script
from ..extensions import db
from ..models.user import User
from ..models.lead import Lead

scripts_bp = Blueprint('scripts', __name__)


@scripts_bp.route('', methods=['GET'])
@jwt_required()
def get_scripts():
    """Get all sales scripts with optional category filter."""
    category = request.args.get('category')
    query = Script.query

    if category:
        query = query.filter_by(category=category)

    scripts = query.order_by(Script.category, Script.title).all()
    return jsonify([script.to_dict() for script in scripts]), 200


@scripts_bp.route('', methods=['POST'])
@jwt_required()
def create_script():
    """Create a new script (ADMIN/MANAGER only)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role == 'SALES':
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    if not data.get('title') or not data.get('content'):
        return jsonify({"error": "title and content are required"}), 400

    script = Script(
        title=data['title'],
        content=data['content'],
        category=data.get('category', 'general'),
    )
    db.session.add(script)
    db.session.commit()
    return jsonify(script.to_dict()), 201


@scripts_bp.route('/<int:script_id>', methods=['GET'])
@jwt_required()
def get_script(script_id):
    script = Script.query.get_or_404(script_id)
    return jsonify(script.to_dict()), 200


@scripts_bp.route('/<int:script_id>', methods=['PATCH'])
@jwt_required()
def update_script(script_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role == 'SALES':
        return jsonify({"error": "Unauthorized"}), 403

    script = Script.query.get_or_404(script_id)
    data = request.get_json()

    if 'title' in data:
        script.title = data['title']
    if 'content' in data:
        script.content = data['content']
    if 'category' in data:
        script.category = data['category']

    db.session.commit()
    return jsonify(script.to_dict()), 200


@scripts_bp.route('/<int:script_id>', methods=['DELETE'])
@jwt_required()
def delete_script(script_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'ADMIN':
        return jsonify({"error": "Unauthorized"}), 403

    script = Script.query.get_or_404(script_id)
    db.session.delete(script)
    db.session.commit()
    return jsonify({"message": "Script deleted"}), 200


@scripts_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    categories = db.session.query(Script.category).distinct().all()
    return jsonify([cat[0] for cat in categories if cat[0]]), 200


@scripts_bp.route('/<int:script_id>/personalize', methods=['POST'])
@jwt_required()
def personalize_script(script_id):
    """AI-personalize a script for a specific lead."""
    script = Script.query.get_or_404(script_id)
    data = request.get_json()
    lead_id = data.get('lead_id')

    if not lead_id:
        return jsonify({"error": "lead_id is required"}), 400

    lead = Lead.query.get_or_404(lead_id)

    try:
        from ..services.ai_service import AIService
        ai_service = AIService()
        result = ai_service.modify_script(
            script.content,
            lead.to_dict(),
            data.get('context', ''),
        )
        if result:
            return jsonify(result), 200
        return jsonify({"error": "AI service unavailable"}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500
