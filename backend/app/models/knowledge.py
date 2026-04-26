from ..extensions import db


class KnowledgeBase(db.Model):
    __tablename__ = 'knowledge_base'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    embedding = db.Column(db.JSON)
    category = db.Column(db.String(50))
    tags = db.Column(db.String(200))
    file_path = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'content': self.content,
            'category': self.category, 'tags': self.tags, 'file_path': self.file_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
