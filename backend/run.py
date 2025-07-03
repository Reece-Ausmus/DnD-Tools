import eventlet
eventlet.monkey_patch() # Patch standard library to support async operations

from app import create_app, db, socketio
import os
from dotenv import load_dotenv
from app.models import ClassType, Race
import app.socket_events  # Import socket events to register them with the app

load_dotenv()

app, socketio = create_app()

def populate_class_types():
    if not ClassType.query.first():
        class_types = [
            {"name": "Barbarian", "description": "A fierce warrior of primitive background who can enter a battle rage."},
            {"name": "Bard", "description": "An inspiring magician whose power echoes the music of creation."},
            {"name": "Cleric", "description": "A priestly champion who wields divine magic in service of a higher power."},
            {"name": "Druid", "description": "A priest of the Old Faith, wielding the powers of nature and adopting animal forms."},
            {"name": "Fighter", "description": "A master of martial combat, skilled with a variety of weapons and armor."},
            {"name": "Monk", "description": "A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection."},
            {"name": "Paladin", "description": "A holy warrior bound to a sacred oath."},
            {"name": "Ranger", "description": "A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization."},
            {"name": "Rogue", "description": "A scoundrel who uses stealth and trickery to overcome obstacles and enemies."},
            {"name": "Sorcerer", "description": "A spellcaster who draws on inherent magic from a gift or bloodline."},
            {"name": "Warlock", "description": "A wielder of magic that is derived from a bargain with an extraplanar entity."},
            {"name": "Wizard", "description": "A scholarly magic-user capable of manipulating the structures of reality."}
        ]

        for class_type in class_types:
            existing_class_type = ClassType.query.filter_by(name=class_type["name"]).first()
            if not existing_class_type:
                db.session.add(ClassType(**class_type))

        db.session.commit()

def populate_races():
    if not Race.query.first():
        races = [
            {"name": "Human", "description": "Versatile and adaptable, humans excel in many areas."},
            {"name": "Elf", "description": "Graceful, long-lived, and attuned to nature and magic."},
            {"name": "Dwarf", "description": "Hardy and strong, known for their craftsmanship and endurance."},
            {"name": "Halfling", "description": "Small and nimble, often lucky and naturally stealthy."},
            {"name": "Aasimar", "description": "Celestial-touched beings with divine heritage."},
            {"name": "Dragonborn", "description": "Draconic humanoids with breath weapons and strong presence."},
            {"name": "Gnome", "description": "Inventive and curious, often skilled in magic or tinkering."},
            {"name": "Goliath", "description": "Towering, strong nomads from the mountains."},
            {"name": "Orc", "description": "Strong and brutal, orcs are often savage warriors."},
            {"name": "Tiefling", "description": "Descended from fiends, they have infernal heritage and magic."}
        ]

        for race in races:
            existing_race = Race.query.filter_by(name=race["name"]).first()
            if not existing_race:
                db.session.add(Race(**race))

        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        # db.create_all()
        populate_class_types()
        populate_races()

    # app.run(debug=True, port=os.getenv('PORT') or 5001)
    # sockio.run() essentially wraps app.run() to enable socket support
    socketio.run(app, debug=True, host="0.0.0.0", port=5001)