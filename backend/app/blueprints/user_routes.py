from flask import Blueprint, jsonify, request, session
from ..models import User
from .. import db
import bcrypt
from uuid import UUID

## User routes

user_bp = Blueprint('user', __name__, url_prefix='/user')

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if not check_password(data['password'], user.password):
        return jsonify({'error': 'Invalid password'}), 401
    session.clear()
    session['user_id'] = user.id
    return jsonify({'isLoggedIn': True, 'username': user.username}), 200

@user_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    try:
        user = User.query.filter_by(email=data['email']).first()
        if user:
            return jsonify({'error': 'Email already exists', 'emailTaken': True}), 400
        user = User.query.filter_by(username=data['username']).first()
        if user:
            return jsonify({'error': 'Username already exists', 'usernameTaken': True}), 400
        new_user = User(
            email=data['email'], 
            password=hash_password(data['password']), 
            first=data['first'], 
            last=data['last'], 
            username=data['username'])
        db.session.add(new_user)
        db.session.commit()
        session.clear()
        session['user_id'] = new_user.id
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

    return jsonify({'message': 'Signup route works!'})

@user_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.clear()
    return jsonify({'message': 'Logout successful!'}), 200

@user_bp.route('/auth/status', methods=['GET'])
def auth_status():
    if 'user_id' not in session:
            return jsonify({'isLoggedIn': False}), 201

    user = User.query.get(UUID(session['user_id']))
    if not user:
        return jsonify({'isLoggedIn': False}), 201
    
    return jsonify({'isLoggedIn': True, 'username': user.username}), 200


@user_bp.route('/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = UUID(session['user_id'])
    if not user_id:
        return jsonify({'error': 'User not found'}), 404
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'email': user.email, 'first': user.first, 'last': user.last, 'username': user.username})

## Helper functions

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    if isinstance(hashed, str):
        hashed = hashed.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed)