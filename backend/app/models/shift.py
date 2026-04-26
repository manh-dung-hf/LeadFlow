from ..extensions import db


class ShiftSchedule(db.Model):
    """
    Staff shift schedule.
    Each shift defines a time slot for a staff member on a specific day of week.
    - day_of_week: 0=Monday, 1=Tuesday, ..., 6=Sunday
    - start_hour/end_hour: 0-23 (24h format, Vietnam timezone)
    - max_hours_per_day: max total working hours per day for this staff
    """
    __tablename__ = 'shift_schedules'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Mon, 6=Sun
    start_hour = db.Column(db.Integer, nullable=False)    # 0-23
    end_hour = db.Column(db.Integer, nullable=False)      # 0-23
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship('User', backref='shifts')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'day_of_week', 'start_hour', name='uq_user_day_hour'),
    )

    def to_dict(self):
        DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'day_of_week': self.day_of_week,
            'day_name': DAY_NAMES[self.day_of_week] if 0 <= self.day_of_week <= 6 else '?',
            'start_hour': self.start_hour,
            'end_hour': self.end_hour,
            'is_active': self.is_active,
            'shift_label': f"{self.start_hour:02d}:00 - {self.end_hour:02d}:00",
        }


class ShiftConfig(db.Model):
    """Global shift configuration."""
    __tablename__ = 'shift_config'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.String(200))

    @staticmethod
    def get(key, default=None):
        row = ShiftConfig.query.filter_by(key=key).first()
        return row.value if row else default

    @staticmethod
    def set(key, value):
        row = ShiftConfig.query.filter_by(key=key).first()
        if row:
            row.value = str(value)
        else:
            db.session.add(ShiftConfig(key=key, value=str(value)))
        db.session.commit()
