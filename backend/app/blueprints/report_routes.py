from flask import Blueprint, request, jsonify, session
from sqlalchemy import text
from app import db
from datetime import datetime
import pytz

def extract_date(iso_str):
    return datetime.fromisoformat(iso_str.replace("Z", "+00:00")).date()

local_tz = pytz.timezone("America/New_York")

def extract_time(iso_str):
    utc_dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    local_dt = utc_dt.astimezone(local_tz)
    return local_dt.time()

report_bp = Blueprint('report', __name__, url_prefix='/report')

@report_bp.route('/generate_campaign', methods=['POST'])
def generate_campaign():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    filters = []
    params = {}

    if data.get("campaignName"):
        filters.append("LOWER(c.name) LIKE LOWER(:campaignName)")
        params["campaignName"] = f"%{data['campaignName']}%"

    if data.get("startDateStart") and data.get("startDateEnd"):
        filters.append("c.start_date BETWEEN :startDateStart AND :startDateEnd")
        params["startDateStart"] = extract_date(data["startDateStart"])
        params["startDateEnd"] = extract_date(data["startDateEnd"])
    elif data.get("startDateStart"):
        filters.append("c.start_date >= :startDateStart")
        params["startDateStart"] = extract_date(data["startDateStart"])
    elif data.get("startDateEnd"):
        filters.append("c.start_date <= :startDateEnd")
        params["startDateEnd"] = extract_date(data["startDateEnd"])
    
    if data.get("endDateStart") and data.get("endDateEnd"):
        filters.append("c.end_date BETWEEN :endDateStart AND :endDateEnd")
        params["endDateStart"] = extract_date(data["endDateStart"])
        params["endDateEnd"] = extract_date(data["endDateEnd"])
    elif data.get("endDateStart"):
        filters.append("c.end_date >= :endDateStart")
        params["endDateStart"] = extract_date(data["endDateStart"])
    elif data.get("endDateEnd"):
        filters.append("c.end_date <= :endDateEnd")
        params["endDateEnd"] = extract_date(data["endDateEnd"])
    
    if data.get("meetingTimeStart") and data.get("meetingTimeEnd"):
        filters.append("(c.meeting_time >= :meetingTimeStart AND c.meeting_time <= :meetingTimeEnd)")
        params["meetingTimeStart"] = extract_time(data["meetingTimeStart"]).strftime("%H:%M:%S")
        params["meetingTimeEnd"] = extract_time(data["meetingTimeEnd"]).strftime("%H:%M:%S")
    elif data.get("meetingTimeStart"):
        filters.append("c.meeting_time >= :meetingTimeStart")
        params["meetingTimeStart"] = extract_time(data["meetingTimeStart"]).strftime("%H:%M:%S")
    elif data.get("meetingTimeEnd"):
        filters.append("c.meeting_time <= :meetingTimeEnd")
        params["meetingTimeEnd"] = extract_time(data["meetingTimeEnd"]).strftime("%H:%M:%S")

    if data.get("meetingDay"):
        placeholders = ", ".join(f":md{i}" for i in range(len(data["meetingDay"])))
        filters.append(f"c.meeting_day IN ({placeholders})")
        for i, day in enumerate(data["meetingDay"]):
            params[f"md{i}"] = day

    if data.get("meetingFrequency"):
        placeholders = ", ".join(f":mf{i}" for i in range(len(data["meetingFrequency"])))
        filters.append(f"c.meeting_frequency IN ({placeholders})")
        for i, freq in enumerate(data["meetingFrequency"]):
            params[f"mf{i}"] = freq

    if data.get("searchMode") == "lax":
        logic = " OR "
    else:
        logic = " AND "

    where_clause = logic.join(filters) if filters else "TRUE"

    having_filters = []

    if data.get("charCountMin") and data.get("charCountMax"):
        having_filters.append("COUNT(cu2.character_id) BETWEEN :charCountMin AND :charCountMax")
        params["charCountMin"] = data["charCountMin"]
        params["charCountMax"] = data["charCountMax"]
    elif data.get("charCountMin"):
        having_filters.append("COUNT(cu2.character_id) >= :charCountMin")
        params["charCountMin"] = data["charCountMin"]
    elif data.get("charCountMax"):
        having_filters.append("COUNT(cu2.character_id) <= :charCountMax")
        params["charCountMax"] = data["charCountMax"]

    having_clause = logic.join(having_filters) if having_filters else "TRUE"

    query_str = f"""
SELECT 
    c.id AS campaign_id,
    c.name AS campaign_name,
    c.start_date,
    c.end_date,
    c.meeting_day,
    c.meeting_time,
    c.meeting_frequency,
    c.description,
    u.username AS dm_name,
    COUNT(DISTINCT cu2.character_id) AS char_count,
    
    ch.id AS character_id,
    ch.name AS character_name,
    ch.gender AS character_gender,
    ch.race_id AS character_race_id,
    r.name AS character_race_name,
    ch.class_id AS character_class_id,
    ct.name AS character_class_type,
    ch.level AS character_level,
    owner.username AS character_owner_username

FROM campaign c
JOIN "user" u ON c.dm_id = u.id
LEFT JOIN campaign_users cu2 ON cu2.campaign_id = c.id AND cu2.character_id IS NOT NULL

LEFT JOIN campaign_users cu ON cu.campaign_id = c.id
LEFT JOIN character ch ON cu.character_id = ch.id
LEFT JOIN "user" owner ON cu.user_id = owner.id
LEFT JOIN race r ON ch.race_id = r.id
LEFT JOIN class_type ct ON ch.class_id = ct.id

WHERE {where_clause}

GROUP BY 
    c.id, u.username,
    ch.id, ch.name, ch.gender, ch.race_id, r.name, ch.class_id, ct.name, ch.level, owner.username

HAVING {having_clause}
"""
    
    try:
        campaigns = db.session.execute(text(query_str), params).fetchall()
        if not campaigns:
            return jsonify({"message": "no results"}), 200
        campaign_map = {}

        for row in campaigns:
            campaign_id = row.campaign_id
            if campaign_id not in campaign_map:
                campaign_map[campaign_id] = {
                    "id": str(row.campaign_id),
                    "name": row.campaign_name,
                    "description": row.description,
                    "dm": row.dm_name,
                    "char_count": row.char_count,
                    "start_date": str(row.start_date),
                    "end_date": str(row.end_date) if row.end_date else None,
                    "meeting_time": str(row.meeting_time),
                    "meeting_day": row.meeting_day,
                    "meeting_frequency": row.meeting_frequency,
                    "characters": []
                }
            
            if row.character_id is not None:
                campaign_map[campaign_id]["characters"].append({
                    "id": str(row.character_id),
                    "name": row.character_name,
                    "gender": row.character_gender,
                    "race_id": str(row.character_race_id),
                    "race": row.character_race_name,
                    "class_id": str(row.character_class_id),
                    "classType": row.character_class_type,
                    "level": row.character_level,
                    "username": row.character_owner_username
                })

        num_campaigns = len(campaign_map)
        
        total_duration = 0
        count = 0
        for campaign in campaign_map.values():
            if campaign["start_date"] and campaign["end_date"]:
                start_date = datetime.strptime(campaign["start_date"], "%Y-%m-%d")
                end_date = datetime.strptime(campaign["end_date"], "%Y-%m-%d")
                total_duration += (end_date - start_date).days
                count += 1

        avg_duration = total_duration / count if count > 0 else -1

        avg_char_count = sum(campaign["char_count"] for campaign in campaign_map.values()) / num_campaigns if num_campaigns > 0 else -1

        meeting_days = {
            "Monday": 0,
            "Tuesday": 0,
            "Wednesday": 0,
            "Thursday": 0,
            "Friday": 0,
            "Saturday": 0,
            "Sunday": 0
        }
        
        meeting_frequencies = {
            "Weekly": 0,
            "Bi-Weekly": 0,
            "Monthly": 0,
            "One-Shot": 0
        }

        for campaign in campaign_map.values():
            if campaign["meeting_day"]:
                meeting_days[campaign["meeting_day"]] += 1
            if campaign["meeting_frequency"]:
                meeting_frequencies[campaign["meeting_frequency"]] += 1

        return jsonify({
            "num_campaigns": num_campaigns,
            "avg_duration": avg_duration,
            "avg_char_count": avg_char_count,
            "meeting_days": meeting_days,
            "meeting_frequencies": meeting_frequencies,
            "campaigns": list(campaign_map.values())
            }), 200
    except Exception as e:
        print("Error in /report/generate_campaign:", e)
        return jsonify({"error": "Something went wrong while generating the report."}), 500



@report_bp.route('/generate_character', methods=['POST'])
def generate_character():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    filters = []
    params = {}

    if data.get("characterName"):
        filters.append("LOWER(ch.name) LIKE LOWER(:characterName)")
        params["characterName"] = f"%{data['characterName']}%"

    if data.get("gender"):
        placeholders = ", ".join(f":g{i}" for i in range(len(data["gender"])))
        filters.append(f"ch.gender IN ({placeholders})")
        for i, g in enumerate(data["gender"]):
            params[f"g{i}"] = g

    if data.get("classType"):
        placeholders = ", ".join(f":ct{i}" for i in range(len(data["classType"])))
        filters.append(f"ct.name IN ({placeholders})")
        for i, ct in enumerate(data["classType"]):
            params[f"ct{i}"] = ct

    if data.get("race"):
        placeholders = ", ".join(f":r{i}" for i in range(len(data["race"])))
        filters.append(f"r.name IN ({placeholders})")
        for i, r in enumerate(data["race"]):
            params[f"r{i}"] = r

    if data.get("levelMin") and data.get("levelMax"):
        filters.append("ch.level BETWEEN :levelMin AND :levelMax")
        params["levelMin"] = data["levelMin"]
        params["levelMax"] = data["levelMax"]
    elif data.get("levelMin"):
        filters.append("ch.level >= :levelMin")
        params["levelMin"] = data["levelMin"]
    elif data.get("levelMax"):
        filters.append("ch.level <= :levelMax")
        params["levelMax"] = data["levelMax"]

    logic = " OR " if data.get("searchMode") == "lax" else " AND "
    where_clause = logic.join(filters) if filters else "TRUE"

    query_str = f"""
SELECT
    ch.id,
    ch.name,
    ch.gender,
    ch.level,
    r.name AS race,
    ct.name AS class_type,
    u.username AS owner
FROM character ch
JOIN "user" u ON ch.user_id = u.id
LEFT JOIN race r ON ch.race_id = r.id
LEFT JOIN class_type ct ON ch.class_id = ct.id
WHERE {where_clause}
"""

    try:
        characters = db.session.execute(text(query_str), params).fetchall()
        if not characters:
            return jsonify({"message": "no results"}), 200

        result = []
        for row in characters:
            result.append({
                "id": str(row.id),
                "name": row.name,
                "gender": row.gender,
                "level": row.level,
                "race": row.race,
                "classType": row.class_type,
                "username": row.owner
            })
        
        num_characters = len(result)

        avg_level = sum(character["level"] for character in result) / num_characters if num_characters > 0 else -1

        gender_counts = {}
        race_counts = {}
        class_counts = {}
        for character in result:
            if character["gender"] not in gender_counts:
                gender_counts[character["gender"]] = 0
            gender_counts[character["gender"]] += 1
            if character["race"] not in race_counts:
                race_counts[character["race"]] = 0
            race_counts[character["race"]] += 1
            if character["classType"] not in class_counts:
                class_counts[character["classType"]] = 0
            class_counts[character["classType"]] += 1

        return jsonify({
            "characters": result,
            "num_characters": num_characters,
            "avg_level": avg_level,
            "gender_counts": gender_counts,
            "race_counts": race_counts,
            "class_counts": class_counts
            }), 200
    except Exception as e:
        print("Error in /report/generate_character:", e)
        return jsonify({"error": "Something went wrong while generating the character report."}), 500