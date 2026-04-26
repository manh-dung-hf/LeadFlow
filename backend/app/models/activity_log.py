from ..extensions import db


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'))
    action = db.Column(db.String(50), nullable=False)
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship('User', backref='activity_logs', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'lead_id': self.lead_id, 'action': self.action, 'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
