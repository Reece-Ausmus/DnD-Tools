import uuid
from sqlalchemy.dialects.postgresql import UUID
from . import db

# Define a many-to-many relationship between Campaign and Character
campaign_users = db.Table('campaign_users',
    db.Column('campaign_id', UUID(as_uuid=True), db.ForeignKey('campaign.id'), primary_key=True),
    db.Column('user_id', UUID(as_uuid=True), db.ForeignKey('user.id'), primary_key=True),
    db.Column('character_id', UUID(as_uuid=True), db.ForeignKey('character.id'), nullable=True)
)

campaign_invites = db.Table('campaign_invites',
    db.Column('campaign_id', UUID(as_uuid=True), db.ForeignKey('campaign.id'), primary_key=True),
    db.Column('user_id', UUID(as_uuid=True), db.ForeignKey('user.id'), primary_key=True)
)

class Campaign(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    dm_id = db.Column(UUID(as_uuid=True), db.ForeignKey("user.id"), nullable=False)
    dm = db.relationship("User", back_populates="dm_campaigns")
    players = db.relationship("User", secondary=campaign_users, back_populates="player_campaigns")
    invited_users = db.relationship("User", secondary=campaign_invites, back_populates="invited_campaigns")
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    meeting_time = db.Column(db.Time, nullable=False)
    meeting_day = db.Column(db.String(50), nullable=False)
    meeting_frequency = db.Column(db.String(50), nullable=False)
    maps = db.relationship("Map", back_populates="campaign", cascade="all, delete-orphan")

    def __init__(self, name, description, dm_id, start_date, end_date, meeting_time, meeting_day, meeting_frequency):
        self.name = name
        self.description = description
        self.dm_id = dm_id
        self.start_date = start_date
        self.end_date = end_date
        self.meeting_time = meeting_time
        self.meeting_day = meeting_day
        self.meeting_frequency = meeting_frequency
    
    def __repr__(self):
        return f'<Campaign: {self.name}, DM: {self.dm.id}, ID: {self.id}>'
    
    __table_args__ = (
        db.Index('ix_campaign_dm_id', 'dm_id'),
        db.Index('ix_campaign_id', 'id'),
    )
    
class ClassType(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=False)

    def __init__(self, name, description):
        self.name = name
        self.description = description

    def __repr__(self):
        return f'<ClassType: {self.name}>'
    
class Race(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=False)

    def __init__(self, name, description):
        self.name = name
        self.description = description

    def __repr__(self):
        return f'<Race: {self.name}>'
    
class User(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first = db.Column(db.String(50), nullable=False)
    last = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(128), nullable=False)
    username = db.Column(db.String(50), nullable=False)
    characters = db.relationship("Character", back_populates="user", cascade="all, delete-orphan")
    dm_campaigns = db.relationship("Campaign", back_populates="dm", cascade="all, delete-orphan")
    invited_campaigns = db.relationship(
        "Campaign", secondary=campaign_invites, 
        primaryjoin=(id==campaign_invites.c.user_id), 
        secondaryjoin=(campaign_invites.c.campaign_id==Campaign.id),
        back_populates="invited_users"
    )
    player_campaigns = db.relationship(
        "Campaign", secondary=campaign_users, 
        primaryjoin=(id==campaign_users.c.user_id) & (campaign_users.c.character_id != None), 
        secondaryjoin=(campaign_users.c.campaign_id==Campaign.id),
        back_populates="players"
    )
    maps = db.relationship("Map", back_populates="owner", cascade="all, delete-orphan")

    def __init__(self, first, last, email, password, username):
        self.first = first
        self.last = last
        self.email = email
        self.password = password
        self.username = username

    def __repr__(self):
        return f'<User: {self.username}>'
    
    __table_args__ = (
        db.Index('ix_user_id', 'id'),
    )
    
class Character(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), nullable=False)
    gender = db.Column(db.String(50), nullable=False)
    race_id = db.Column(UUID(as_uuid=True), db.ForeignKey("race.id"), nullable=False)
    race = db.relationship("Race")
    class_id = db.Column(UUID(as_uuid=True), db.ForeignKey("class_type.id"), nullable=False)
    class_type = db.relationship("ClassType")
    level = db.Column(db.Integer, default=1)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("user.id"), nullable=False)
    user = db.relationship("User", back_populates="characters")
    speed = db.Column(db.Integer, default=30)
    size = db.Column(db.String(50), default='medium')
    marker_color = db.Column(db.String(7), default='#ff9800')  

    def __init__(self, name, gender, race_id, class_id, level, user_id, speed, size, marker_color):
        self.name = name
        self.gender = gender
        self.race_id = race_id
        self.class_id = class_id
        self.level = level
        self.user_id = user_id
        self.speed = speed
        self.size = size
        self.marker_color = marker_color

    def __repr__(self):
        return f'<Character: {self.name} (Level {self.level} {self.race} {self.class_type})>'
    
    __table_args__ = (
        db.Index('ix_character_id', 'id'),
        db.Index('ix_race_id', 'race_id'),
        db.Index('ix_class_id', 'class_id'),
    )

class Map(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), nullable=False)
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey("user.id"), nullable=False)
    campaign_id = db.Column(UUID(as_uuid=True), db.ForeignKey("campaign.id"), nullable=False)
    markers = db.Column(db.JSON, nullable=True, default=[])
    lines = db.Column(db.JSON, nullable=True, default=[])
    is_open = db.Column(db.Boolean, default=False)

    campaign = db.relationship("Campaign", back_populates="maps")
    owner = db.relationship("User", back_populates="maps")

    def __init__(self, name, owner_id, campaign_id):
        self.owner_id = owner_id
        self.name = name
        self.campaign_id = campaign_id

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'owner_id': str(self.owner_id),
            'campaign_id': str(self.campaign_id),
            'markers': self.markers or [],
            'lines': self.lines or [],
            'is_open': self.is_open
        }

    def __repr__(self):
        return f'<Map: {self.name}>'