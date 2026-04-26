from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='SALES')
    name = db.Column(db.String(100))
    phone = db.Column(db.String(30))
    avatar_url = db.Column(db.String(512))
    welcome_message = db.Column(db.Text, default='')
    telegram_chat_id = db.Column(db.String(50))  # Staff's personal Telegram chat ID for notifications
    is_active = db.Column(db.Boolean, default=True)
    current_lead_count = db.Column(db.Integer, default=0)
    max_leads = db.Column(db.Integer, default=50)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id, 'email': self.email, 'role': self.role, 'name': self.name,
            'phone': self.phone, 'avatar_url': self.avatar_url,
            'welcome_message': self.welcome_message,
            'telegram_chat_id': self.telegram_chat_id,
            'is_active': self.is_active,
            'current_lead_count': self.current_lead_count, 'max_leads': self.max_leads,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
