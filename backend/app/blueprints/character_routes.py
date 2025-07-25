from flask import Blueprint, request, jsonify, session
from app import db
from app.models import ClassType, User, Character, Race
from uuid import UUID

## Character routes

character_bp = Blueprint('character', __name__, url_prefix='/character')

@character_bp.route('/create_character', methods=['POST'])
def create_character():
    user_id = UUID(session.get('user_id'))
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 

    data = request.get_json()

    name = data.get('name')
    gender = data.get('gender')
    race_id = data.get('race')
    class_id = data.get('classType')
    level = data.get('level', 1)
    speed = data.get('speed', 30)
    size = data.get('size', 'medium')
    marker_color = data.get('markerColor', '#ff9800')

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    class_type = ClassType.query.filter_by(id=class_id).first()
    if not class_type:
        return jsonify({"error": "Class not found"}), 404
    
    race = Race.query.filter_by(id=race_id).first()
    if not race:
        return jsonify({"error": "Race not found"}), 404

    new_character = Character(
        name=name,
        gender=gender,
        race_id=race.id,
        class_id=class_type.id,
        level=level,
        user_id=user.id,
        speed=speed,
        size=size,
        marker_color=marker_color
    )

    db.session.add(new_character)
    db.session.commit()

    return jsonify({
        "message": f"Character {new_character.name} created successfully!",
        "character": {
            "id": str(new_character.id),
            "name": new_character.name,
            "gender": new_character.gender,
            "race": new_character.race.name,
            "class_type": new_character.class_type.name,
            "level": new_character.level,
            "user_id": str(new_character.user_id),
            "speed": new_character.speed,
            "size": new_character.size,
            "marker_color": new_character.marker_color
        }
    }), 201

@character_bp.route('/get_characters', methods=['GET'])
def get_characters():
    user_id = UUID(session.get('user_id'))
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    characters = Character.query.filter_by(user_id=user.id).all()

    return jsonify({
        "characters": [
            {
                "id": str(character.id),
                "name": character.name,
                "gender": character.gender,
                "race_id": character.race_id,
                "race": character.race.name,
                "class_id": character.class_id,
                "classType": character.class_type.name,
                "level": character.level,
                "user_id": str(character.user_id),
                "speed": character.speed,
                "size": character.size,
                "marker_color": character.marker_color
            } for character in characters
        ]
    }), 200

@character_bp.route('/get_character/<string:character_id>', methods=['GET'])
def get_character(character_id):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    character_id = UUID(character_id)

    character = Character.query.get(character_id)
    if not character:
        return jsonify({"error": "Character not found"}), 404

    if character.user_id != user.id:
        return jsonify({"error": "Character does not belong to user"}), 403

    return jsonify({
        "character": {
            "id": str(character.id),
            "name": character.name,
            "gender": character.gender,
            "race_id": str(character.race_id),
            "race": character.race.name,
            "class_id": str(character.class_id),
            "classType": character.class_type.name,
            "level": character.level,
            "user_id": str(character.user_id),
            "speed": character.speed,
            "size": character.size,
            "marker_color": character.marker_color
        }
    }), 200

@character_bp.route('/edit_character/<string:character_id>', methods=['PUT'])
def update_character(character_id):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    character_id = UUID(character_id)

    character = Character.query.get(character_id)
    if not character:
        return jsonify({"error": "Character not found"}), 404

    if character.user_id != user.id:
        return jsonify({"error": "Character does not belong to user"}), 403

    data = request.get_json()

    name = data.get('name')
    gender = data.get('gender')
    race_id = data.get('race')
    class_id = data.get('classType')
    level = data.get('level')
    speed = data.get('speed', character.speed)
    size = data.get('size', character.size)
    marker_color = data.get('markerColor', character.marker_color)

    class_type = ClassType.query.filter_by(id=class_id).first()
    if not class_type:
        return jsonify({"error": "Class not found"}), 404
    
    race = Race.query.filter_by(id=race_id).first()
    if not race:
        return jsonify({"error": "Race not found"}), 404

    character.name = name
    character.gender = gender
    character.race_id = race.id
    character.class_id = class_type.id
    character.level = level
    character.speed = speed
    character.size = size
    character.marker_color = marker_color

    db.session.commit()

    return jsonify({
        "message": f"Character {character.name} updated successfully!",
        "character": {
            "id": str(character.id),
            "name": character.name
        }
    }), 200

@character_bp.route('/delete_character/<string:character_id>', methods=['DELETE'])
def delete_character(character_id):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    character_id = UUID(character_id)

    character = Character.query.get(character_id)
    if not character:
        return jsonify({"error": "Character not found"}), 404

    if character.user_id != user.id:
        return jsonify({"error": "Character does not belong to user"}), 403

    db.session.delete(character)
    db.session.commit()

    return jsonify({
        "message": f"Character {character.name} deleted successfully!"
    }), 200

@character_bp.route('/get_races', methods=['GET'])
def get_races():
    user_id = UUID(session.get('user_id'))
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    races = Race.query.order_by(Race.name).all()

    return jsonify({
        "races": [
            {
                "id": str(race.id),
                "name": race.name,
                "description": race.description
            } for race in races
        ]
    }), 200

@character_bp.route('/get_classes', methods=['GET'])
def get_classes():
    user_id = UUID(session.get('user_id'))
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    classes = ClassType.query.order_by(ClassType.name).all()

    return jsonify({
        "classes": [
            {
                "id": str(class_type.id),
                "name": class_type.name,
                "description": class_type.description
            } for class_type in classes
        ]
    }), 200