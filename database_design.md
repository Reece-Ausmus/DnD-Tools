user(<u>id</u>, first, last, email, password, username)

race(<u>id</u>, name, description)

class_type(<u>id</u>, name, description)

campaign(<u>id</u>, name, description, dm_id, start_date, end_date, meeting_time, meeting_day, meeting_frequency) - <i>dm_id: foreign key to user.id</i>

character(<u>id</u>, name, gender, race_id, class_id, level, user_id) - <i>race_id: fk to race.id, class_id: fk to class_type.id, user_id: fk to user.id</i>

campaign_users(<u>campaign_id, user_id</u>, character_id) - <i>campaign_id: fk to campaign.id, user_id: fk to user.id, character_id: fk to character.id</i>

campaign_invites(<u>campaign_id, user_id</u>) - <i>campaign_id: fk to campaign.id, user_id: fk to user.id</i>

sessions(<u>id</u>, session_id, data, expiry) - <i>used for flask-sessions authentication</i>
