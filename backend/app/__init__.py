import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_socketio import join_room
from .config import Config
from .extensions import db, migrate, jwt, socketio


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    socketio.init_app(app, cors_allowed_origins="*")

    # Import models so they are registered
    from . import models  # noqa: F401

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.leads import leads_bp
    from .routes.knowledge import knowledge_bp
    from .routes.integrations import integrations_bp
    from .routes.analytics import analytics_bp
    from .routes.messages import messages_bp
    from .routes.scripts import scripts_bp
    from .routes.files import files_bp
    from .routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(leads_bp, url_prefix='/api/leads')
    app.register_blueprint(knowledge_bp, url_prefix='/api/knowledge')
    app.register_blueprint(integrations_bp, url_prefix='/api/integrations')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(scripts_bp, url_prefix='/api/scripts')
    app.register_blueprint(files_bp, url_prefix='/api/files')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    from .routes.shifts import shifts_bp
    app.register_blueprint(shifts_bp, url_prefix='/api/shifts')

    @socketio.on('join')
    def on_join(data):
        user_id = data.get('user_id')
        if user_id:
            join_room(f'user_{user_id}')

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        upload_dir = os.path.join(app.instance_path, 'uploads')
        return send_from_directory(upload_dir, filename)

    return app
