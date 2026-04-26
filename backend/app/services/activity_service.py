from flask import request as flask_request
from ..models.activity_log import ActivityLog
from ..extensions import db


def log_activity(user_id, action, lead_id=None, details=None):
    """Log a user action."""
    ip = None
    try:
        ip = flask_request.remote_addr
    except RuntimeError:
        pass

    entry = ActivityLog(
        user_id=user_id,
        lead_id=lead_id,
        action=action,
        details=details or {},
        ip_address=ip,
    )
    db.session.add(entry)
    # Don't commit here — let the caller commit with their transaction
    return entry
