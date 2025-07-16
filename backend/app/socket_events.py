user_sockets = {}
from flask_socketio import join_room, leave_room, emit
from flask import jsonify, session, request
from . import socketio, db
from .models import User, Campaign, Map, campaign_users
from uuid import UUID

@socketio.on('connect')
def on_connect():
    print(f'\033[92mClient {request.sid} connected\033[0m')
    user_id = UUID(session.get('user_id'))
    if user_id:
        user_sockets[user_id] = request.sid

@socketio.on('disconnect')
def on_disconnect(reason):
    print(f'\033[91mClient {request.sid} disconnected (reason: {reason})\033[0m')
    user_id = UUID(session.get('user_id'))
    if user_id and user_id in user_sockets:
        del user_sockets[user_id]

@socketio.on_error_default
def default_error_handler(e):
    print(f"⚠️ Socket error: {e}")

@socketio.on('create_map')
def handle_create_map(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return

    name = data.get('name')
    if not name:
        emit('error', {'message': 'Name is required'})
        return
    
    campaign_id = UUID(data.get('campaign_id'))
    if not campaign_id:
        emit('error', {'message': 'Campaign ID is required'})
        return
    
    campaign = next((c for c in user.dm_campaigns if c.id == campaign_id), None)
    if not campaign:
        emit('error', {'message': 'Campagin not found or you are not the DM'})
        return
    
    if Map.query.filter_by(name=name, owner_id=user_id).first():
        emit('error', {'message': 'Map with this name already exists'})
        return

    map = Map(name=name, owner_id=user_id, campaign_id=campaign_id)

    db.session.add(map)
    db.session.commit()
 
    emit('map_created', {
        'message': f'Map {map.name} created successfully!',
        'map': map.to_dict()
    }, to=request.sid)
    print(f'\033[92mMap {map.name} created by user {user.username}\033[0m')

    join_room(f'map_{map.id}')
    emit('map_connected', {'message': f'Connected to map {map.name}', 'map': map.to_dict(), 'isDM': True}, room=f'map_{map.id}', to=request.sid)
    print(f'\033[94mUser {user.username} joined map room {map.id} (campaign id: {campaign_id})\033[0m')

@socketio.on('delete_map')
def handle_delete_map(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return

    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return

    if map.owner_id != user_id:
        emit('error', {'message': 'You are not the owner of this map'})
        return

    db.session.delete(map)
    db.session.commit()

    leave_room(f'map_{map.id}')
    emit('map_deleted', {'message': f'Map {map.name} deleted successfully'}, room=f'map_{map.id}', to=request.sid)
    print(f'\033[91mMap {map.name} deleted by user {user.username}\033[0m')

@socketio.on('join_map_room')
def handle_join_map_room(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return

    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return

    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return
    
    campaign_id = map.campaign_id

    isDM = user_id == map.owner_id

    if not isDM and not map.is_open:
        emit('refresh_maps', {'message': 'This map is currently closed by the DM'}, to=request.sid)
        return

    if not isDM:
        character_id = db.session.query(
            campaign_users.c.character_id
        ).filter_by(
            user_id=user_id,
            campaign_id=campaign_id
        ).scalar()
    else:
        character_id = None

    join_room(f'map_{map_id}')
    emit('map_connected', {'message': f'Connected to map {map.name}', 'map': map.to_dict(), 'isDM': isDM, 'character_id': str(character_id)}, room=f'map_{map_id}', to=request.sid)
    print(f'\033[94mUser {user.username} joined map room {map_id} (campaign id: {campaign_id})\033[0m')

    # If the joining user is the map owner (DM), send the saved map state directly to them
    if isDM or map.is_open:
        emit('initialize_map_state', {
            'map_id': str(map_id),
            'markers': map.markers or [],
            'lines': map.lines or [],
            'circles': map.circles or []
        }, to=request.sid)
    elif map.owner_id in user_sockets:
        owner_sid = user_sockets[map.owner_id]
        emit('request_map_state', {'map_id': str(map_id), 'target_sid': request.sid}, to=owner_sid)

@socketio.on('leave_map_room')
def handle_leave_map_room(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return

    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return

    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return

    # If user is the DM, set map visibility to false and notify others
    if map.owner_id == user_id:
        map.is_open = False
        db.session.commit()
        emit('map_force_closed', {'message': 'The DM has closed the map.'}, room=f'map_{map_id}', skip_sid=request.sid)

    leave_room(f'map_{map_id}')
    emit('map_disconnected', {'message': f'Disconnected from map {map_id}'}, room=f'map_{map_id}', to=request.sid)
    print(f'\033[94mUser {user.username} left map room {map_id}\033[0m')

@socketio.on('add_marker')
def handle_add_marker(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return

    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return

    marker = data.get('marker')
    if not marker:
        emit('error', {'message': 'Marker data is required'})
        return

    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return

    emit('marker_added', {'marker': marker}, room=f'map_{map_id}', skip_sid=request.sid)
    print(f'\033[92mMarker added to map {map.name} by user {user_id}\033[0m')

@socketio.on('remove_marker')
def handle_remove_marker(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return
    
    marker_id = UUID(data.get('marker_id'))
    if not marker_id:
        emit('error', {'message': 'Marker ID is required'})
        return
    
    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return

    emit('marker_removed', {'marker_id': str(marker_id)}, room=f'map_{map_id}', skip_sid=request.sid)
    print(f'\033[92mMarker {marker_id} removed from map {map.name} by user {user_id}\033[0m')

@socketio.on('move_marker')
def handle_move_marker(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return
    
    marker_id = UUID(data.get('marker_id'))
    if not marker_id:
        emit('error', {'message': 'Marker ID is required'})
        return

    new_position = data.get('new_position')
    if not new_position:
        emit('error', {'message': 'New position is required'})
        return

    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return

    emit('marker_moved', {'marker_id': str(marker_id), 'new_position': new_position}, room=f'map_{map_id}', skip_sid=request.sid)
    print(f'\033[92mMarker {marker_id} moved to {new_position} on map {map.name} by user {user_id}\033[0m')

@socketio.on('add_line')
def handle_add_line(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return

    line = data.get('line')
    if not line:
        emit('error', {'message': 'Line data is required'})
        return

    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return

    emit('line_added', {'line': line}, room=f'map_{map_id}', skip_sid=request.sid)
    print(f'\033[92mLine added to map {map.name} by user {user_id}\033[0m')

@socketio.on('remove_line')
def handle_remove_line(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return
    
    line_id = UUID(data.get('line_id'))
    if not line_id:
        emit('error', {'message': 'Line ID is required'})
        return

    map = Map.query.get(map_id)
    if not map:
        emit('error', {'message': 'Map not found'})
        return

    emit('line_removed', {'line_id': str(line_id)}, room=f'map_{map_id}', skip_sid=request.sid)
    print(f'\033[92mLine {line_id} removed from map {map.name} by user {user_id}\033[0m')

@socketio.on('send_map_state')
def handle_send_map_state(data):
    user_id = UUID(session.get('user_id'))
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return
    
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    target_sid = data.get('target_sid')
    if not target_sid:
        emit('error', {'message': 'target_sid is required'})
        return
    
    map_id = UUID(data.get('map_id'))
    if not map_id:
        emit('error', {'message': 'map_id is required'})
        return

    markers = data.get('markers', [])
    if not markers:
        emit('error', {'message': 'markers data is required'})
        return
    
    lines = data.get('lines', [])
    if not lines:
        emit('error', {'message': 'lines data is required'})
        return
    
    circles = data.get('circles', [])
    if not circles:
        emit('error', {'message': 'circles data is required'})
        return

    emit('initialize_map_state', {
        'map_id': str(map_id),
        'markers': markers,
        'lines': lines,
        'circles': circles
    }, to=target_sid)
