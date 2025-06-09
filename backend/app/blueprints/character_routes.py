from flask import Blueprint, request, jsonify, session
from app import db
from app.models import ClassType, User, Character, Race

## Character routes

character_bp = Blueprint('character', __name__, url_prefix='/character')

@character_bp.route('/create_character', methods=['POST'])
def create_character():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 

    data = request.get_json()

    name = data.get('name')
    gender = data.get('gender')
    race_id = data.get('race')
    class_id = data.get('classType')
    level = data.get('level', 1)

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
        user_id=user.id
    )

    db.session.add(new_character)
    db.session.commit()

    return jsonify({
        "message": f"Character {new_character.name} created successfully!",
        "character": {
            "id": new_character.id,
            "name": new_character.name,
            "gender": new_character.gender,
            "race": new_character.race.name,
            "class_type": new_character.class_type.name,
            "level": new_character.level,
            "user_id": new_character.user_id
        }
    }), 201

@character_bp.route('/get_characters', methods=['GET'])
def get_characters():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    characters = Character.query.filter_by(user_id=user.id).all()

    return jsonify({
        "characters": [
            {
                "id": character.id,
                "name": character.name,
                "gender": character.gender,
                "race_id": character.race_id,
                "race": character.race.name,
                "class_id": character.class_id,
                "classType": character.class_type.name,
                "level": character.level,
                "user_id": character.user_id
            } for character in characters
        ]
    }), 200

@character_bp.route('/get_character/<int:character_id>', methods=['GET'])
def get_character(character_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    character = Character.query.get(character_id)
    if not character:
        return jsonify({"error": "Character not found"}), 404

    if character.user_id != user.id:
        return jsonify({"error": "Character does not belong to user"}), 403

    return jsonify({
        "character": {
            "id": character.id,
            "name": character.name,
            "gender": character.gender,
                "race_id": character.race_id,
                "race": character.race.name,
                "class_id": character.class_id,
                "classType": character.class_type.name,
                "level": character.level,
                "user_id": character.user_id
        }
    }), 200

@character_bp.route('/edit_character/<int:character_id>', methods=['PUT'])
def update_character(character_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

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

    db.session.commit()

    return jsonify({
        "message": f"Character {character.name} updated successfully!",
        "character": {
            "id": character.id,
            "name": character.name
        }
    }), 200

@character_bp.route('/delete_character/<int:character_id>', methods=['DELETE'])
def delete_character(character_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

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
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    races = Race.query.order_by(Race.name).all()

    return jsonify({
        "races": [
            {
                "id": race.id,
                "name": race.name,
                "description": race.description
            } for race in races
        ]
    }), 200

@character_bp.route('/get_classes', methods=['GET'])
def get_classes():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    classes = ClassType.query.order_by(ClassType.name).all()

    return jsonify({
        "classes": [
            {
                "id": class_type.id,
                "name": class_type.name,
                "description": class_type.description
            } for class_type in classes
        ]
    }), 200