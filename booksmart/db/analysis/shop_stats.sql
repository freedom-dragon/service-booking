select
  datetime(request_log.timestamp / 1000, 'unixepoch') as datetime
, url
-- , user_id
, user.nickname
-- , request_session_id
, request_session.timezone
from request_log
inner join url on url.id = url_id
left join user on user.id = user_id
left join request_session on request_session.id = request_session_id
where url like '%MrGemstoneHK%'
  and url not like '%.webp?t=%'
--   and url like '%fbclid=%'
order by request_log.timestamp
