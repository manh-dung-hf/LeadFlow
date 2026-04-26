from ..extensions import db


class Lead(db.Model):
    __tablename__ = 'leads'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    country = db.Column(db.String(50))
    source = db.Column(db.String(50))
    content = db.Column(db.Text)
    temperature = db.Column(db.String(20), default='WARM')
    status = db.Column(db.String(20), default='NEW')
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    language = db.Column(db.String(50))
    intent = db.Column(db.String(100))
    product_interest = db.Column(db.String(200))
    budget = db.Column(db.String(100))
    urgency = db.Column(db.String(50))
    ai_summary = db.Column(db.Text)
    ai_suggested_reply = db.Column(db.Text)
    ai_next_action = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    first_response_at = db.Column(db.DateTime)
    sla_violated = db.Column(db.Boolean, default=False)
    sla_warning = db.Column(db.Boolean, default=False)
    response_time_seconds = db.Column(db.Integer)
    next_follow_up = db.Column(db.DateTime)
    follow_up_count = db.Column(db.Integer, default=0)
    estimated_value = db.Column(db.Float, default=0)
    ai_auto_reply_enabled = db.Column(db.Boolean, default=True)

    assigned_user = db.relationship('User', backref='leads', foreign_keys=[assigned_to])

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'phone': self.phone, 'email': self.email,
            'country': self.country, 'source': self.source, 'content': self.content,
            'temperature': self.temperature, 'status': self.status,
            'assigned_to': self.assigned_to,
            'assigned_user_name': self.assigned_user.name if self.assigned_user else None,
            'language': self.language, 'intent': self.intent,
            'product_interest': self.product_interest, 'budget': self.budget,
            'urgency': self.urgency, 'ai_summary': self.ai_summary,
            'ai_suggested_reply': self.ai_suggested_reply, 'ai_next_action': self.ai_next_action,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'first_response_at': self.first_response_at.isoformat() if self.first_response_at else None,
            'sla_violated': self.sla_violated, 'sla_warning': self.sla_warning,
            'response_time_seconds': self.response_time_seconds,
            'next_follow_up': self.next_follow_up.isoformat() if self.next_follow_up else None,
            'follow_up_count': self.follow_up_count, 'estimated_value': self.estimated_value,
            'ai_auto_reply_enabled': self.ai_auto_reply_enabled,
        }
