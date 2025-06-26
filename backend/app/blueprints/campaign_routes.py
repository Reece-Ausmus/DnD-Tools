from datetime import datetime
from flask import Blueprint, jsonify, request, session
from ..models import User, Campaign, Character, campaign_users
from .. import db

## Campaign routes

campaign_bp = Blueprint('campaign', __name__, url_prefix='/campaign')

@campaign_bp.route('/create_campaign', methods=['POST'])
def create_campaign():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    # Required fields validation
    required_fields = ['name', 'startDate', 'meetingTime', 'meetingDay', 'meetingFrequency']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    name = data.get('name')
    description = data.get('description')
    dm_id = user_id
    start_date = data.get('startDate') # Expect date in format 'YYYY-MM-DD'
    end_date = data.get('endDate') 
    meeting_time = data.get('meetingTime') # Expect time in format 'HH:MM'
    meeting_day = data.get('meetingDay')
    meeting_frequency = data.get('meetingFrequency')

    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        meeting_time = datetime.strptime(meeting_time, '%H:%M').time()
    except ValueError:
        return jsonify({"error": "Invalid date or time format"}), 400

    try:
        new_campaign = Campaign(
            name=name,
            description=description,
            dm_id=dm_id,
            start_date=start_date,
            end_date=end_date,
            meeting_time=meeting_time,
            meeting_day=meeting_day,
            meeting_frequency=meeting_frequency
        )

        db.session.add(new_campaign)
        db.session.commit()

        campaign_user = campaign_users.insert().values(campaign_id=new_campaign.id, user_id=dm_id)
        db.session.execute(campaign_user)

        db.session.commit()

        return jsonify({
            "message": f"Campaign {new_campaign.name} created successfully!",
            "campaign": {
                "id": new_campaign.id,
                "name": new_campaign.name,
                "description": new_campaign.description,
                "dm_id": new_campaign.dm_id,
                "start_date": str(new_campaign.start_date),
                "end_date": str(new_campaign.end_date) if new_campaign.end_date else None,
                "meeting_time": new_campaign.meeting_time.strftime('%H:%M'),
                "meeting_day": new_campaign.meeting_day,
                "meeting_frequency": new_campaign.meeting_frequency
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    
@campaign_bp.route('/edit_campaign/<int:campaign_id>', methods=['PUT'])
def edit_campaign(campaign_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    
    if user.id != campaign.dm_id:
        return jsonify({"error": "User is not the DM of the campaign"}), 403
    
    data = request.get_json()

    # Required fields validation
    required_fields = ['name', 'startDate', 'meetingTime', 'meetingDay', 'meetingFrequency']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    
    name = data.get('name') or campaign.name
    description = data.get('description') or campaign.description
    start_date = data.get('startDate') or campaign.start_date
    end_date = data.get('endDate') or campaign.end_date
    meeting_time = data.get('meetingTime') or campaign.meeting_time
    meeting_day = data.get('meetingDay') or campaign.meeting_day
    meeting_frequency = data.get('meetingFrequency') or campaign.meeting_frequency

    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        meeting_time = datetime.strptime(meeting_time, '%H:%M').time()
    except ValueError:
        return jsonify({"error": "Invalid date or time format"}), 400
    
    campaign.name = name
    campaign.description = description
    campaign.start_date = start_date
    campaign.end_date = end_date
    campaign.meeting_time = meeting_time
    campaign.meeting_day = meeting_day
    campaign.meeting_frequency = meeting_frequency

    try:
        db.session.commit()

        return jsonify({
            "message": f"Campaign {campaign.name} updated successfully!",
            "campaign": {
                "id": campaign.id,
                "name": campaign.name,
                "description": campaign.description,
                "dm_id": campaign.dm_id,
                "start_date": str(campaign.start_date),
                "end_date": str(campaign.end_date) if campaign.end_date else None,
                "meeting_time": campaign.meeting_time.strftime('%H:%M'),
                "meeting_day": campaign.meeting_day,
                "meeting_frequency": campaign.meeting_frequency
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    
@campaign_bp.route('/delete_campaign/<int:campaign_id>', methods=['DELETE'])
def delete_campaign(campaign_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    
    # Check if user is the DM of the campaign
    if user.id != campaign.dm_id:
        return jsonify({"error": "User is not the DM of the campaign"}), 403
    
    try:
        db.session.delete(campaign)
        db.session.commit()

        return jsonify({
            "message": f"Campaign {campaign.name} deleted successfully!"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    
@campaign_bp.route('/leave_campaign/<int:campaign_id>', methods=['DELETE'])
def leave_campaign(campaign_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    # Check if user is a player in the campaign
    if user not in campaign.players:
        return jsonify({"error": "User is not a player in the campaign"}), 403
    try:
        # Remove user from campaign
        campaign.players.remove(user)
        db.session.commit()

        return jsonify({
            "message": f"User {user.username} left campaign {campaign.name}!"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    
@campaign_bp.route('/remove_character/<int:campaign_id>/<int:character_id>', methods=['DELETE'])
def remove_character(campaign_id, character_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    # Check if user is a player in the campaign
    if user not in campaign.players:
        return jsonify({"error": "User is not a player in the campaign"}), 403
    
    # Check if user is the DM of the campaign
    if user.id != campaign.dm_id:
        return jsonify({"error": "User is not the DM of the campaign"}), 403
    character = Character.query.get(character_id)
    if not character:
        return jsonify({"error": "Character not found"}), 404
    # Check if character is in the campaign
    if not db.session.query(campaign_users).filter_by(campaign_id=campaign.id, character_id=character.id).first():
        return jsonify({"error": "Character is not in the campaign"}), 403
    try:
        # Remove character from campaign
        db.session.execute(campaign_users.delete().where(
            (campaign_users.c.campaign_id == campaign.id) & 
            (campaign_users.c.character_id == character.id)
        ))
        db.session.commit()

        return jsonify({
            "message": f"Character {character.name} removed from campaign {campaign.name}!"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@campaign_bp.route('/get_campaigns', methods=['GET'])
def get_campaigns():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get campaigns where the user is a player or DM
    campaigns = user.player_campaigns + user.dm_campaigns

    # Get DM usernames for each campaign
    dm_usernames = {dm.id: dm.username for dm in User.query.filter(
        User.id.in_([campaign.dm_id for campaign in campaigns])
    ).all()}

    # Get characters for each campaign
    campaign_characters = (
        db.session.query(campaign_users.c.campaign_id, Character, User.username)
        .join(Character, campaign_users.c.character_id == Character.id)
        .join(User, campaign_users.c.user_id == User.id)
        .filter(campaign_users.c.campaign_id.in_([campaign.id for campaign in campaigns]))
        .all()
    )

    # Organize character data
    campaign_character_map = {}
    for campaign_id, character, username in campaign_characters:
        if campaign_id not in campaign_character_map:
            campaign_character_map[campaign_id] = []
        campaign_character_map[campaign_id].append({
            "id": character.id,
            "name": character.name,
            "gender": character.gender,
            "race_id": character.race_id,
            "race": character.race.name,
            "class_id": character.class_id,
            "classType": character.class_type.name,
            "level": character.level,
            "username": username
        })

    
    campaign_maps = {
        c.id: [
            {
                "id": m.id,
                "name": m.name,
                "owner_id": m.owner_id,
                "campaign_id": m.campaign_id
            } for m in c.maps
        ] for c in campaigns
    }

    return jsonify({
        "campaigns": [
            {
                "id": campaign.id,
                "name": campaign.name,
                "description": campaign.description,
                "dm": dm_usernames.get(campaign.dm_id),
                "char_count": len(campaign_character_map.get(campaign.id, [])),
                "characters": campaign_character_map.get(campaign.id, []),  # List of characters
                "start_date": str(campaign.start_date),
                "end_date": str(campaign.end_date) if campaign.end_date else None,
                "meeting_time": campaign.meeting_time.strftime('%H:%M'),
                "meeting_day": campaign.meeting_day,
                "meeting_frequency": campaign.meeting_frequency,
                "maps": campaign_maps.get(campaign.id, [])
            } for campaign in campaigns
        ]
    }), 200

@campaign_bp.route('/get_campaign/<int:campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    
    # Check if user is a player or DM of the campaign
    if user not in campaign.players and user.id != campaign.dm_id:
        return jsonify({"error": "User is not a player or DM of the campaign"}), 403
    
    # Get DM username
    dm_username = User.query.get(campaign.dm_id).username

    # Get characters for the campaign
    characters = db.session.query(Character).join(campaign_users, campaign_users.c.character_id == Character.id).filter(campaign_users.c.campaign_id == campaign.id).all()

    return jsonify({
        "campaign": {
            "id": campaign.id,
            "name": campaign.name,
            "description": campaign.description,
            "dm": dm_username,
            "start_date": str(campaign.start_date),
            "end_date": str(campaign.end_date) if campaign.end_date else None,
            "meeting_time": campaign.meeting_time.strftime('%H:%M'),
            "meeting_day": campaign.meeting_day,
            "meeting_frequency": campaign.meeting_frequency,
            "characters": [
                {
                    "id": character.id,
                    "name": character.name,
                    "gender": character.gender,
                    "race_id": character.race_id,
                    "race": character.race.name,
                    "class_id": character.class_id,
                    "classType": character.class_type.name,
                    "level": character.level
                } for character in characters
            ]
        }
    }), 200

@campaign_bp.route('/invite', methods=['POST'])
def invite():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    # Required fields validation
    required_fields = ['campaign_id', 'username']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    campaign_id = data.get('campaign_id')
    username = data.get('username')

    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    
    # Check if user is the DM of the campaign
    if user.id != campaign.dm_id:
        return jsonify({"error": "User is not the DM of the campaign"}), 403

    invited_user = User.query.filter_by(username=username).first()
    if not invited_user:
        return jsonify({"error": "User not found"}), 404

    # Check if user is already in the campaign
    if invited_user in campaign.players:
        return jsonify({"error": "User is already in the campaign"}), 400

    # Check if user has already been invited to the campaign
    if invited_user in campaign.invited_users:
        return jsonify({"error": "User has already been invited to the campaign"}), 400
    
    campaign.invited_users.append(invited_user)
    try:
        db.session.commit()
        return jsonify({
            "message": f"User {invited_user.username} invited to campaign {campaign.name}!"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    
@campaign_bp.route('/get_invites', methods=['GET'])
def get_invites():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get campaigns where the user has been invited
    campaigns = user.invited_campaigns

    # Get DM usernames for each campaign
    dm_usernames = {dm.id: dm.username for dm in User.query.filter(
        User.id.in_([campaign.dm_id for campaign in campaigns])
    ).all()}

    return jsonify({
        "invites": [
            {
                "id": campaign.id,
                "name": campaign.name,
                "description": campaign.description,
                "dm": dm_usernames.get(campaign.dm_id),
                "start_date": str(campaign.start_date),
                "end_date": str(campaign.end_date) if campaign.end_date else None,
                "meeting_time": campaign.meeting_time.strftime('%H:%M'),
                "meeting_day": campaign.meeting_day,
                "meeting_frequency": campaign.meeting_frequency
            } for campaign in campaigns
        ]
    }), 200

@campaign_bp.route('/accept_invite', methods=['POST'])
def accept_invite():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    # Required fields validation
    required_fields = ['campaign_id', 'character_id']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    campaign_id = data.get('campaign_id')
    character_id = data.get('character_id')

    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    # Check if user has been invited to the campaign
    if user not in campaign.invited_users:
        return jsonify({"error": "User has not been invited to the campaign"}), 403

    character = Character.query.get(character_id)
    if not character:
        return jsonify({"error": "Character not found"}), 404
    
    try:
        db.session.execute(
            campaign_users.insert().values(campaign_id=campaign.id, character_id=character.id, user_id=user.id)
        )
        campaign.invited_users.remove(user)

        return jsonify({
            "message": f"User {user.username} accepted invite to campaign {campaign.name}!"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    
@campaign_bp.route('/decline_invite', methods=['POST'])
def decline_invite():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    # Required fields validation
    required_fields = ['campaign_id']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    campaign_id = data.get('campaign_id')

    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    # Check if user has been invited to the campaign
    if user not in campaign.invited_users:
        return jsonify({"error": "User has not been invited to the campaign"}), 403
    
    try:
        campaign.invited_users.remove(user)
        db.session.commit()

        return jsonify({
            "message": f"User {user.username} declined invite to campaign {campaign.name}!"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500