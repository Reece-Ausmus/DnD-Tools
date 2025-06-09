from flask import Blueprint, jsonify, request, session
from ..models import User
from .. import db

## Map routes

map_bp = Blueprint('map', __name__, url_prefix='/map')