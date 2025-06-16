from flask import Flask
from .config import Config, init_extensions
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO(cors_allowed_origins="http://localhost:5173")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app, db)
    socketio.init_app(app)
    migrate.init_app(app, db)

    from flask_session import Session
    Session(app)

    from flask_cors import CORS
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

    from .routes import blueprints
    for blueprint in blueprints:
        app.register_blueprint(blueprint)

    return app, socketio

__all__ = ["create_app", "db", "socketio"]