from app import create_app, db
from flask_migrate import Migrate
from app.models import *

app = create_app()[0]
migrate = Migrate(app, db)