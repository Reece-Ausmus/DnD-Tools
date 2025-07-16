from flask import Blueprint, jsonify, request, session

test_bp = Blueprint('test_bp', __name__, url_prefix='/test')

@test_bp.route('/', methods=['GET'])
def health_check():
    return "OK", 200