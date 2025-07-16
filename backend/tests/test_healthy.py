# tests/test_healthy.py

import pytest
from sqlalchemy.orm import clear_mappers
from app import create_app, db, socketio
from app.populate_db import populate_class_types, populate_races

@pytest.fixture(autouse=True)
def reset_sqlalchemy_state():
    yield
    clear_mappers()
    db.metadata.clear()

@pytest.fixture(scope='module')
def app():
    config = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "SESSION_TYPE": "sqlalchemy",
    }
    flask_app, sio = create_app(config)

    with flask_app.app_context():
        import app.models
        db.create_all()
        populate_class_types()
        populate_races()

    yield flask_app, sio

    # teardown: drop everything under app context
    with flask_app.app_context():
        db.drop_all()


def test_http_get(app):
    flask_app, _ = app
    client = flask_app.test_client()
    resp = client.get("/test/")
    assert resp.status_code == 200


def test_socket_connection(app):
    flask_app, sio = app
    client = sio.test_client(flask_app)
    assert client.is_connected()
    client.disconnect()
