from .blueprints.user_routes import user_bp
from .blueprints.character_routes import character_bp
from .blueprints.campaign_routes import campaign_bp
from .blueprints.report_routes import report_bp
from .blueprints.map_routes import map_bp

blueprints = [
    user_bp,
    character_bp,
    campaign_bp,
    report_bp,
    map_bp
]