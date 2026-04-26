from ..models.user import User
from ..models.shift import ShiftSchedule
from ..extensions import db
from datetime import datetime


def _get_on_duty_users():
    """Get users currently on shift (Vietnam timezone)."""
    try:
        import pytz
        vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        now = datetime.now(vn_tz)
    except ImportError:
        now = datetime.utcnow()

    current_day = now.weekday()
    current_hour = now.hour

    on_duty_shifts = ShiftSchedule.query.filter(
        ShiftSchedule.day_of_week == current_day,
        ShiftSchedule.start_hour <= current_hour,
        ShiftSchedule.end_hour > current_hour,
        ShiftSchedule.is_active == True,
    ).all()

    user_ids = [s.user_id for s in on_duty_shifts]
    if not user_ids:
        return []

    return User.query.filter(
        User.id.in_(user_ids), User.is_active == True
    ).order_by(User.current_lead_count.asc()).all()


def auto_assign_lead(lead):
    """
    Assign lead to staff. Priority:
    1. On-duty staff (from shift schedule) with fewest leads
    2. Any active sales staff with fewest leads (fallback)
    """
    # Try on-duty staff first
    on_duty = _get_on_duty_users()
    for user in on_duty:
        if user.current_lead_count < user.max_leads:
            lead.assigned_to = user.id
            user.current_lead_count = (user.current_lead_count or 0) + 1
            db.session.commit()
            return user

    # Fallback: any active sales/manager
    fallback = (
        User.query
        .filter(User.role.in_(['SALES', 'MANAGER']), User.is_active == True)
        .order_by(User.current_lead_count.asc())
        .all()
    )

    for user in fallback:
        if user.current_lead_count < user.max_leads:
            lead.assigned_to = user.id
            user.current_lead_count = (user.current_lead_count or 0) + 1
            db.session.commit()
            return user

    # All at max → assign to least loaded anyway
    if fallback:
        user = fallback[0]
        lead.assigned_to = user.id
        user.current_lead_count = (user.current_lead_count or 0) + 1
        db.session.commit()
        return user

    return None


def reassign_lead(lead, new_user_id):
    old_user_id = lead.assigned_to
    if old_user_id:
        old_user = User.query.get(old_user_id)
        if old_user and old_user.current_lead_count > 0:
            old_user.current_lead_count -= 1

    new_user = User.query.get(new_user_id)
    if new_user:
        lead.assigned_to = new_user.id
        new_user.current_lead_count = (new_user.current_lead_count or 0) + 1
        db.session.commit()
        return new_user
    return None
