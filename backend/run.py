import eventlet
eventlet.monkey_patch() # Patch standard library to support async operations

from app import create_app, db, socketio
import os
from dotenv import load_dotenv
from app.models import ClassType, Race
import app.socket_events  # Import socket events to register them with the app
from backend.app.populate_db import populate_class_types, populate_races

load_dotenv()

app, socketio = create_app()

if __name__ == '__main__':
    with app.app_context():
        # db.create_all()
        populate_class_types()
        populate_races()

    # app.run(debug=True, port=os.getenv('PORT') or 5000)
    # sockio.run() essentially wraps app.run() to enable socket support
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)