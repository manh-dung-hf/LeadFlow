from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')


# Make JWT work with integer user IDs
@jwt.additional_claims_loader
def add_claims(identity):
    return {"user_id": identity}


@jwt.user_identity_loader
def user_identity_lookup(user_id):
    """Convert user_id to string for JWT subject claim."""
    return str(user_id)


@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    """Auto-load user from JWT. get_jwt_identity() returns string, but we need int for DB."""
    identity = jwt_data["sub"]
    from .models.user import User
    return User.query.get(int(identity))
