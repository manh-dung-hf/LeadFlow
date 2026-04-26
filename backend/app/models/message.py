from ..extensions import db


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False)
    sender_type = db.Column(db.String(20))
    sender_id = db.Column(db.Integer)
    content = db.Column(db.Text, nullable=False)
    channel = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, server_default=db.func.now())

    lead = db.relationship('Lead', backref='messages')

    def to_dict(self):
        return {
            'id': self.id, 'lead_id': self.lead_id, 'sender_type': self.sender_type,
            'sender_id': self.sender_id, 'content': self.content, 'channel': self.channel,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }
