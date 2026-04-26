from ..models.user import User
from ..models.lead import Lead
from ..extensions import db
from sqlalchemy import func


def auto_assign_lead(lead):
    """
    Round-robin assignment to active sales users with the fewest current leads.
    Returns the assigned user or None.
    """
    # Find active sales users ordered by current lead count (ascending)
    sales_users = (
        User.query
        .filter(User.role == 'SALES', User.is_active.is_(True))
        .order_by(User.current_lead_count.asc())
        .all()
    )

    if not sales_users:
        # Fallback: try managers
        sales_users = (
            User.query
            .filter(User.role == 'MANAGER', User.is_active.is_(True))
            .order_by(User.current_lead_count.asc())
            .all()
        )

    if not sales_users:
        return None

    # Pick the user with fewest leads who hasn't hit max
    for user in sales_users:
        if user.current_lead_count < user.max_leads:
            lead.assigned_to = user.id
            user.current_lead_count = (user.current_lead_count or 0) + 1
            db.session.commit()
            return user

    # If all are at max, assign to the one with fewest anyway
    user = sales_users[0]
    lead.assigned_to = user.id
    user.current_lead_count = (user.current_lead_count or 0) + 1
    db.session.commit()
    return user


def reassign_lead(lead, new_user_id):
    """Reassign a lead to a different user."""
    old_user_id = lead.assigned_to

    # Decrement old user count
    if old_user_id:
        old_user = User.query.get(old_user_id)
        if old_user and old_user.current_lead_count > 0:
            old_user.current_lead_count -= 1

    # Assign to new user
    new_user = User.query.get(new_user_id)
    if new_user:
        lead.assigned_to = new_user.id
        new_user.current_lead_count = (new_user.current_lead_count or 0) + 1
        db.session.commit()
        return new_user

    return None
