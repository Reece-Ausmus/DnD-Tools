from flask import Blueprint, jsonify, request, session
from ..models import Map, User
from .. import db

## Map routes

map_bp = Blueprint('map', __name__, url_prefix='/map')

@map_bp.route('/get_dm_maps', methods=['GET'])
def get_dm_maps():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    campaigns = user.dm_campaigns
    maps = Map.query.filter(Map.campaign_id.in_([campaign.id for campaign in campaigns])).all()

    maps_data = [
        {
            "id": map.id,
            "name": map.name,
            "campaign_id": map.campaign_id,
        }
        for map in maps
    ]

    return jsonify({"maps": maps_data}), 200

@map_bp.route('/get_player_maps', methods=['GET'])
def get_player_maps():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    campaigns = user.player_campaigns
    maps = Map.query.filter(Map.campaign_id.in_([campaign.id for campaign in campaigns])).all()

    maps_data = [
        {
            "id": map.id,
            "name": map.name,
            "campaign_id": map.campaign_id,
        }
        for map in maps
    ]

    return jsonify({"maps": maps_data}), 200


@map_bp.route('/save_state', methods=['POST'])
def save_map_state():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    map_id = data.get('map_id')
    markers = data.get('markers', [])
    lines = data.get('lines', [])

    if not map_id:
        return jsonify({"error": "Map ID is required"}), 400

    map = Map.query.get(map_id)
    if not map or map.owner_id != user_id:
        return jsonify({"error": "Map not found or unauthorized"}), 403

    map.markers = markers
    map.lines = lines
    db.session.commit()

    return jsonify({"message": "Map state saved successfully."}), 200