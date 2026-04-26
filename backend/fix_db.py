"""Add missing columns and tables to existing database."""
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    # Create any new tables (shift_schedules, shift_config)
    db.create_all()
    print("✅ All tables created/verified")

    # Add missing columns
    alterations = [
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_auto_reply_enabled BOOLEAN DEFAULT TRUE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50)",
    ]
    for sql in alterations:
        try:
            db.session.execute(text(sql))
            db.session.commit()
        except Exception:
            db.session.rollback()

    from app.models.user import User
    u = User.query.filter_by(email='admin@leadflow.ai').first()
    print(f"✅ DB OK — Admin: {u.name}" if u else "❌ Run seed.py")
