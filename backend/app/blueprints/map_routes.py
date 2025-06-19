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