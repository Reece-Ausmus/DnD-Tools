from flask import Blueprint, jsonify, request, session
from ..models import Map, User
from .. import db

## Map routes

map_bp = Blueprint('map', __name__, url_prefix='/map')

@map_bp.route('/create_map', methods=['POST'])
def create_map():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401 

    data = request.get_json()
    name = data.get('name')
    campaign_id = data.get('campaign_id')

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not name:
        return jsonify({"error": "Name is required"}), 400

    if not campaign_id:
        return jsonify({"error": "Campaign ID is required"}), 400
    
    campaign = next((c for c in user.dm_campaigns if c.id == campaign_id), None)
    if not campaign:
        return jsonify({"error": "Campaign not found or you are not the DM"}), 404
    
    if Map.query.filter_by(name=name, owner_id=user_id).first():
        return jsonify({"error": "Map with this name already exists"}), 400

    map = Map(name=name, owner_id=user_id, campaign_id=campaign_id)

    db.session.add(map)
    db.session.commit()

    return jsonify({
        "message": f"Map {map.name} created successfully!",
        "map": {
            "id": map.id,
            "name": map.name,
            "owner_id": map.owner_id,
            "campaign_id": map.campaign_id,
        }
    }), 201