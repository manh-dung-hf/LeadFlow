import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
from ..models.user import User
from ..extensions import db

auth_bp = Blueprint('auth', __name__)

ALLOWED_AVATAR_EXT = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_avatar(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_AVATAR_EXT


# ─── Public ───

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not user.is_active:
        return jsonify({"msg": "Bad email or password"}), 401
    if user.check_password(data.get('password')):
        access_token = create_access_token(identity=user.id)
        from ..services.activity_service import log_activity
        log_activity(user.id, 'login', details={'email': user.email})
        db.session.commit()
        return jsonify(access_token=access_token, user=user.to_dict()), 200
    return jsonify({"msg": "Bad email or password"}), 401


# ─── Authenticated ───

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    return jsonify(user.to_dict()), 200


@auth_bp.route('/me', methods=['PATCH'])
@jwt_required()
def update_profile():
    """Update own profile (name, phone, welcome_message)."""
    user = User.query.get(get_jwt_identity())
    data = request.get_json()

    if 'name' in data:
        user.name = data['name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'welcome_message' in data:
        user.welcome_message = data['welcome_message']
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"msg": "Email already in use"}), 400
        user.email = data['email']

    db.session.commit()
    return jsonify(user.to_dict()), 200


@auth_bp.route('/me/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change own password."""
    user = User.query.get(get_jwt_identity())
    data = request.get_json()

    current_pw = data.get('current_password', '')
    new_pw = data.get('new_password', '')

    if not user.check_password(current_pw):
        return jsonify({"msg": "Current password is incorrect"}), 400
    if len(new_pw) < 6:
        return jsonify({"msg": "New password must be at least 6 characters"}), 400

    user.set_password(new_pw)
    db.session.commit()
    return jsonify({"msg": "Password updated successfully"}), 200


@auth_bp.route('/me/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """Upload avatar image."""
    user = User.query.get(get_jwt_identity())

    if 'file' not in request.files:
        return jsonify({"msg": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_avatar(file.filename):
        return jsonify({"msg": "Invalid file. Use PNG, JPG, GIF, or WebP"}), 400

    upload_dir = os.path.join(current_app.instance_path, 'uploads', 'avatars')
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"user_{user.id}_{int(datetime.now().timestamp())}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    user.avatar_url = f"/uploads/avatars/{filename}"
    db.session.commit()
    return jsonify({"msg": "Avatar uploaded", "avatar_url": user.avatar_url, "user": user.to_dict()}), 200


# ─── Admin: User Management ───

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    """List all users (ADMIN / MANAGER only)."""
    caller = User.query.get(get_jwt_identity())
    if caller.role == 'SALES':
        return jsonify({"msg": "Unauthorized"}), 403

    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@auth_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user (ADMIN only)."""
    caller = User.query.get(get_jwt_identity())
    if caller.role != 'ADMIN':
        return jsonify({"msg": "Only ADMIN can create users"}), 403

    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    role = data.get('role', 'SALES')

    if not email or not password or not name:
        return jsonify({"msg": "email, password, and name are required"}), 400
    if role not in ('ADMIN', 'MANAGER', 'SALES'):
        return jsonify({"msg": "Invalid role. Use ADMIN, MANAGER, or SALES"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already exists"}), 400
    if len(password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters"}), 400

    user = User(
        email=email,
        name=name,
        role=role,
        phone=data.get('phone', ''),
        max_leads=data.get('max_leads', 50),
        welcome_message=data.get('welcome_message', ''),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a single user (ADMIN / MANAGER)."""
    caller = User.query.get(get_jwt_identity())
    if caller.role == 'SALES' and caller.id != user_id:
        return jsonify({"msg": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@auth_bp.route('/users/<int:user_id>', methods=['PATCH'])
@jwt_required()
def admin_update_user(user_id):
    """Update any user (ADMIN only). Manager can update SALES users."""
    caller = User.query.get(get_jwt_identity())
    target = User.query.get_or_404(user_id)

    # Permission check
    if caller.role == 'SALES':
        return jsonify({"msg": "Unauthorized"}), 403
    if caller.role == 'MANAGER' and target.role in ('ADMIN', 'MANAGER') and caller.id != target.id:
        return jsonify({"msg": "Managers can only edit SALES users"}), 403

    data = request.get_json()

    if 'name' in data:
        target.name = data['name']
    if 'phone' in data:
        target.phone = data['phone']
    if 'welcome_message' in data:
        target.welcome_message = data['welcome_message']
    if 'max_leads' in data:
        target.max_leads = data['max_leads']
    if 'is_active' in data:
        if caller.role != 'ADMIN':
            return jsonify({"msg": "Only ADMIN can activate/deactivate users"}), 403
        target.is_active = data['is_active']
    if 'role' in data:
        if caller.role != 'ADMIN':
            return jsonify({"msg": "Only ADMIN can change roles"}), 403
        if data['role'] not in ('ADMIN', 'MANAGER', 'SALES'):
            return jsonify({"msg": "Invalid role"}), 400
        target.role = data['role']
    if 'email' in data and data['email'] != target.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"msg": "Email already in use"}), 400
        target.email = data['email']

    db.session.commit()
    return jsonify(target.to_dict()), 200


@auth_bp.route('/users/<int:user_id>/password', methods=['PUT'])
@jwt_required()
def admin_reset_password(user_id):
    """Reset a user's password (ADMIN only)."""
    caller = User.query.get(get_jwt_identity())
    if caller.role != 'ADMIN':
        return jsonify({"msg": "Only ADMIN can reset passwords"}), 403

    target = User.query.get_or_404(user_id)
    data = request.get_json()
    new_pw = data.get('new_password', '')

    if len(new_pw) < 6:
        return jsonify({"msg": "Password must be at least 6 characters"}), 400

    target.set_password(new_pw)
    db.session.commit()
    return jsonify({"msg": f"Password reset for {target.name}"}), 200


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (ADMIN only). Cannot delete yourself."""
    caller = User.query.get(get_jwt_identity())
    if caller.role != 'ADMIN':
        return jsonify({"msg": "Only ADMIN can delete users"}), 403
    if caller.id == user_id:
        return jsonify({"msg": "Cannot delete yourself"}), 400

    target = User.query.get_or_404(user_id)
    db.session.delete(target)
    db.session.commit()
    return jsonify({"msg": f"User {target.name} deleted"}), 200
