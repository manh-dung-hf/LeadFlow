from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.shift import ShiftSchedule, ShiftConfig
from ..models.user import User
from ..extensions import db

shifts_bp = Blueprint('shifts', __name__)

MAX_HOURS_PER_DAY_DEFAULT = 12  # 24/7 operation allows longer shifts


def _validate_shift(user_id, day_of_week, start_hour, end_hour, exclude_id=None):
    errors = []
    if not (0 <= day_of_week <= 6):
        errors.append("day_of_week phải từ 0 (Thứ 2) đến 6 (CN)")
    if not (0 <= start_hour <= 23) or not (1 <= end_hour <= 24):
        errors.append("Giờ không hợp lệ")
    if start_hour >= end_hour:
        errors.append("Giờ bắt đầu phải nhỏ hơn giờ kết thúc")

    max_hours = int(ShiftConfig.get('max_hours_per_day', MAX_HOURS_PER_DAY_DEFAULT))
    shift_hours = end_hour - start_hour

    # Check total hours for this user on this day
    existing = ShiftSchedule.query.filter_by(user_id=user_id, day_of_week=day_of_week, is_active=True)
    if exclude_id:
        existing = existing.filter(ShiftSchedule.id != exclude_id)
    total = sum(s.end_hour - s.start_hour for s in existing.all())
    if total + shift_hours > max_hours:
        errors.append(f"Vượt {max_hours}h/ngày cho staff này (hiện {total}h + {shift_hours}h)")

    # Only check self-overlap (allow multiple staff same slot)
    self_overlap = ShiftSchedule.query.filter(
        ShiftSchedule.day_of_week == day_of_week, ShiftSchedule.is_active == True,
        ShiftSchedule.user_id == user_id,
        ShiftSchedule.start_hour < end_hour, ShiftSchedule.end_hour > start_hour,
    )
    if exclude_id:
        self_overlap = self_overlap.filter(ShiftSchedule.id != exclude_id)
    if self_overlap.first():
        errors.append("Trùng ca khác của cùng staff trong ngày")

    return errors


@shifts_bp.route('', methods=['GET'])
@jwt_required()
def get_shifts():
    caller = User.query.get(int(get_jwt_identity()))
    if caller.role == 'SALES':
        shifts = ShiftSchedule.query.filter_by(user_id=caller.id).all()
    else:
        user_id = request.args.get('user_id', type=int)
        day = request.args.get('day_of_week', type=int)
        query = ShiftSchedule.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        if day is not None:
            query = query.filter_by(day_of_week=day)
        shifts = query.order_by(ShiftSchedule.day_of_week, ShiftSchedule.start_hour).all()
    return jsonify([s.to_dict() for s in shifts]), 200


@shifts_bp.route('', methods=['POST'])
@jwt_required()
def create_shift():
    caller = User.query.get(int(get_jwt_identity()))
    if caller.role == 'SALES':
        return jsonify({"msg": "Unauthorized"}), 403
    data = request.get_json()
    user_id = data.get('user_id')
    day_of_week = data.get('day_of_week')
    start_hour = data.get('start_hour')
    end_hour = data.get('end_hour')
    if None in (user_id, day_of_week, start_hour, end_hour):
        return jsonify({"msg": "user_id, day_of_week, start_hour, end_hour required"}), 400
    errors = _validate_shift(user_id, day_of_week, start_hour, end_hour)
    if errors:
        return jsonify({"msg": " | ".join(errors)}), 400
    shift = ShiftSchedule(user_id=user_id, day_of_week=day_of_week, start_hour=start_hour, end_hour=end_hour)
    db.session.add(shift)
    db.session.commit()
    return jsonify(shift.to_dict()), 201


@shifts_bp.route('/<int:shift_id>', methods=['PATCH'])
@jwt_required()
def update_shift(shift_id):
    caller = User.query.get(int(get_jwt_identity()))
    if caller.role == 'SALES':
        return jsonify({"msg": "Unauthorized"}), 403
    shift = ShiftSchedule.query.get_or_404(shift_id)
    data = request.get_json()
    new_day = data.get('day_of_week', shift.day_of_week)
    new_start = data.get('start_hour', shift.start_hour)
    new_end = data.get('end_hour', shift.end_hour)
    new_user = data.get('user_id', shift.user_id)
    errors = _validate_shift(new_user, new_day, new_start, new_end, exclude_id=shift_id)
    if errors:
        return jsonify({"msg": " | ".join(errors)}), 400
    shift.user_id = new_user
    shift.day_of_week = new_day
    shift.start_hour = new_start
    shift.end_hour = new_end
    if 'is_active' in data:
        shift.is_active = data['is_active']
    db.session.commit()
    return jsonify(shift.to_dict()), 200


@shifts_bp.route('/<int:shift_id>', methods=['DELETE'])
@jwt_required()
def delete_shift(shift_id):
    caller = User.query.get(int(get_jwt_identity()))
    if caller.role == 'SALES':
        return jsonify({"msg": "Unauthorized"}), 403
    shift = ShiftSchedule.query.get_or_404(shift_id)
    db.session.delete(shift)
    db.session.commit()
    return jsonify({"msg": "Deleted"}), 200


@shifts_bp.route('/config', methods=['GET'])
@jwt_required()
def get_shift_config():
    return jsonify({'max_hours_per_day': int(ShiftConfig.get('max_hours_per_day', MAX_HOURS_PER_DAY_DEFAULT))}), 200


@shifts_bp.route('/config', methods=['PUT'])
@jwt_required()
def update_shift_config():
    caller = User.query.get(int(get_jwt_identity()))
    if caller.role != 'ADMIN':
        return jsonify({"msg": "Only ADMIN"}), 403
    data = request.get_json()
    if 'max_hours_per_day' in data:
        ShiftConfig.set('max_hours_per_day', data['max_hours_per_day'])
    return jsonify({"msg": "Updated"}), 200


@shifts_bp.route('/auto-generate', methods=['POST'])
@jwt_required()
def auto_generate_shifts():
    """Auto-generate 24/7 shifts distributed across all staff."""
    caller = User.query.get(int(get_jwt_identity()))
    if caller.role != 'ADMIN':
        return jsonify({"msg": "Only ADMIN"}), 403

    data = request.get_json() or {}
    start_hour = data.get('start_hour', 0)
    end_hour = data.get('end_hour', 24)
    hours_per_shift = data.get('hours_per_shift', 8)

    sales_users = User.query.filter(
        User.role.in_(['SALES', 'MANAGER']), User.is_active == True
    ).all()
    if not sales_users:
        return jsonify({"msg": "Không có staff active"}), 400

    ShiftSchedule.query.delete()
    db.session.flush()

    created = []
    for day in range(7):
        current_hour = start_hour
        user_idx = day % len(sales_users)
        while current_hour + hours_per_shift <= end_hour:
            user = sales_users[user_idx % len(sales_users)]
            shift = ShiftSchedule(
                user_id=user.id, day_of_week=day,
                start_hour=current_hour, end_hour=current_hour + hours_per_shift,
            )
            db.session.add(shift)
            created.append(shift)
            current_hour += hours_per_shift
            user_idx += 1

    db.session.commit()
    return jsonify({
        "msg": f"Đã tạo {len(created)} ca cho {len(sales_users)} staff (24/7)",
        "shifts": [s.to_dict() for s in created],
    }), 201


@shifts_bp.route('/on-duty', methods=['GET'])
@jwt_required()
def get_on_duty():
    from datetime import datetime
    try:
        import pytz
        now = datetime.now(pytz.timezone('Asia/Ho_Chi_Minh'))
    except ImportError:
        now = datetime.utcnow()

    current_day = now.weekday()
    current_hour = now.hour

    on_duty = ShiftSchedule.query.filter(
        ShiftSchedule.day_of_week == current_day,
        ShiftSchedule.start_hour <= current_hour,
        ShiftSchedule.end_hour > current_hour,
        ShiftSchedule.is_active == True,
    ).all()

    return jsonify({
        'current_time': now.strftime('%H:%M %d/%m/%Y'),
        'day_of_week': current_day,
        'on_duty': [s.to_dict() for s in on_duty],
    }), 200
