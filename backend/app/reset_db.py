from . import create_app, db

app, _ = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()
    print("✅ Database wiped and reinitialized.")