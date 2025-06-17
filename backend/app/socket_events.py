from flask_socketio import join_room, leave_room, emit
from flask import session, request
from . import socketio
from .models import User, Campaign, Map

@socketio.on('connect')
def on_connect():
    print(f'\033[92mClient {request.sid} connected\033[0m')

@socketio.on('join_map_room')
def handle_join_map_room(data):
    user_id = session.get('user_id')
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return

    map_id = data.get('mapId')
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return

    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return

    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return
    
    campaign_id = map.campaign_id

    join_room(f'map_{map_id}')
    emit('map_connected', {'message': f'Connected to map {map.name}', 'campaign_id': campaign_id}, room=f'map_{map_id}', to=request.sid)
    print(f'\033[94mUser {user.username} joined map room {map_id} (campaign id: {campaign_id})\033[0m')

@socketio.on_error_default
def default_error_handler(e):
    print(f"⚠️ Socket error: {e}")