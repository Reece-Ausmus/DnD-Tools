from flask import Flask
from .config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO(cors_allowed_origins="https://dndtoolbox.com", manage_session=False, async_mode='eventlet')

def create_app(test_config=None):
    app = Flask(__name__)

    # Apply test configuration if passed in
    if test_config:
        app.config.update(test_config)
    else:
        app.config.from_object(Config)

    db.init_app(app)
    app.config["SESSION_SQLALCHEMY"] = db

    socketio.init_app(app, cors_allowed_origins=[
        "https://dndtoolbox.com",
        "http://localhost:5173"
    ])
    migrate.init_app(app, db)

    from flask_session import Session
    Session(app)

    from flask_cors import CORS
    CORS(app, resources={r"/*": {"origins": "https://dndtoolbox.com"}}, supports_credentials=True)

    from .routes import blueprints
    for blueprint in blueprints:
        app.register_blueprint(blueprint)

    return app, socketio

__all__ = ["create_app", "db", "socketio"]
