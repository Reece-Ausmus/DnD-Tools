from flask_socketio import join_room, leave_room, emit
from flask import session, request
from . import socketio, db
from .models import User, Campaign, Map

@socketio.on('connect')
def on_connect():
    print(f'\033[92mClient {request.sid} connected\033[0m')

@socketio.on('disconnect')
def on_disconnect(reason):
    print(f'\033[91mClient {request.sid} disconnected (reason: {reason})\033[0m')

@socketio.on_error_default
def default_error_handler(e):
    print(f"⚠️ Socket error: {e}")

@socketio.on('create_map')
def handle_create_map(data):
    user_id = session.get('user_id')
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return

    name = data.get('name')
    campaign_id = data.get('campaign_id')

    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return

    if not name:
        emit('error', {'message': 'Name is required'})
        return

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
        'map': {
            'id': map.id,
            'name': map.name,
            'owner_id': map.owner_id,
            'campaign_id': map.campaign_id,
        }
    }, to=request.sid)
    print(f'\033[92mMap {map.name} created by user {user.username}\033[0m')

    join_room(f'map_{map.id}')
    emit('map_connected', {'message': f'Connected to map {map.name}', 'campaign_id': campaign_id, 'map_id': map.id}, room=f'map_{map.id}', to=request.sid)
    print(f'\033[94mUser {user.username} joined map room {map.id} (campaign id: {campaign_id})\033[0m')

@socketio.on('join_map_room')
def handle_join_map_room(data):
    user_id = session.get('user_id')
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return

    map_id = data.get('map_id')
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
    emit('map_connected', {'message': f'Connected to map {map.name}', 'campaign_id': campaign_id, 'map_id': map_id}, room=f'map_{map_id}', to=request.sid)
    print(f'\033[94mUser {user.username} joined map room {map_id} (campaign id: {campaign_id})\033[0m')

@socketio.on('leave_map_room')
def handle_leave_map_room(data):
    user_id = session.get('user_id')
    if not user_id:
        emit('error', {'message': 'User not logged in'})
        return

    map_id = data.get('map_id')
    if not map_id:
        emit('error', {'message': 'Map ID is required'})
        return

    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return

    leave_room(f'map_{map_id}')
    emit('map_disconnected', {'message': f'Disconnected from map {map_id}'}, room=f'map_{map_id}', to=request.sid)
    print(f'\033[94mUser {user.username} left map room {map_id}\033[0m')


##  The following code is not tested and will be committed in the future

##  @socketio.on('add_marker')
##  def handle_add_marker(data):
##      user_id = session.get('user_id')
##      if not user_id:
##          emit('error', {'message': 'User not logged in'})
##          return
##  
##      map_id = data.get('map_id')
##      marker = data.get('marker')
##  
##      if not map_id or not marker:
##          emit('error', {'message': 'Map ID and marker data are required'})
##          return
##  
##      map = Map.query.get(map_id)
##      if not map:
##          emit('error', {'message': 'Map not found'})
##          return
##  
##  
##      emit('marker_added', {'marker': marker}, room=f'map_{map_id}', skip_sid=request.sid)
##      print(f'\033[92mMarker added to map {map.name} by user {user_id}\033[0m')
##  
##  @socketio.on('remove_marker')
##  def handle_remove_marker(data):
##      user_id = session.get('user_id')
##      if not user_id:
##          emit('error', {'message': 'User not logged in'})
##          return
##  
##      map_id = data.get('map_id')
##      marker_id = data.get('marker_id')
##  
##      if not map_id or not marker_id:
##          emit('error', {'message': 'Map ID and marker ID are required'})
##          return
##  
##      map = Map.query.get(map_id)
##      if not map:
##          emit('error', {'message': 'Map not found'})
##          return
##  
##      emit('marker_removed', {'marker_id': marker_id}, room=f'map_{map_id}', skip_sid=request.sid)
##      print(f'\033[92mMarker {marker_id} removed from map {map.name} by user {user_id}\033[0m')
##  
##  @socketio.on('move_marker')
##  def handle_move_marker(data):
##      user_id = session.get('user_id')
##      if not user_id:
##          emit('error', {'message': 'User not logged in'})
##          return
##  
##      map_id = data.get('map_id')
##      marker_id = data.get('marker_id')
##      new_position = data.get('new_position')
##  
##      if not map_id or not marker_id or not new_position:
##          emit('error', {'message': 'Map ID, marker ID, and new position are required'})
##          return
##  
##      map = Map.query.get(map_id)
##      if not map:
##          emit('error', {'message': 'Map not found'})
##          return
##  
##      emit('marker_moved', {'marker_id': marker_id, 'new_position': new_position}, room=f'map_{map_id}', skip_sid=request.sid)
##      print(f'\033[92mMarker {marker_id} moved to {new_position} on map {map.name} by user {user_id}\033[0m')
##  
##  @socketio.on('add_line')
##  def handle_add_line(data):
##      user_id = session.get('user_id')
##      if not user_id:
##          emit('error', {'message': 'User not logged in'})
##          return
##  
##      map_id = data.get('map_id')
##      line = data.get('line')
##  
##      if not map_id or not line:
##          emit('error', {'message': 'Map ID and line data are required'})
##          return
##  
##      map = Map.query.get(map_id)
##      if not map:
##          emit('error', {'message': 'Map not found'})
##          return
##  
##      emit('line_added', {'line': line}, room=f'map_{map_id}', skip_sid=request.sid)
##      print(f'\033[92mLine added to map {map.name} by user {user_id}\033[0m')
##  
##  @socketio.on('remove_line')
##  def handle_remove_line(data):
##      user_id = session.get('user_id')
##      if not user_id:
##          emit('error', {'message': 'User not logged in'})
##          return
##  
##      map_id = data.get('map_id')
##      line_id = data.get('line_id')
##  
##      if not map_id or not line_id:
##          emit('error', {'message': 'Map ID and line ID are required'})
##          return
##  
##      map = Map.query.get(map_id)
##      if not map:
##          emit('error', {'message': 'Map not found'})
##          return
##  
##      emit('line_removed', {'line_id': line_id}, room=f'map_{map_id}', skip_sid=request.sid)
##      print(f'\033[92mLine {line_id} removed from map {map.name} by user {user_id}\033[0m')

