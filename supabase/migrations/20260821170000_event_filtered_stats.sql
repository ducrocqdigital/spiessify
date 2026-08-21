-- Leaderboard and public stats: when an event is active, only count
-- penalties of that event. Without an active event: all-time totals.

CREATE OR REPLACE FUNCTION public.get_members_with_public_stats()
 RETURNS TABLE(id uuid, first_name text, last_name text, family_name_particle text, nickname text, rank member_rank, is_active boolean, profile_photo text, total_penalties bigint, total_amount numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH ae AS (SELECT id FROM public.get_active_event())
  SELECT
    m.id, m.first_name, m.last_name, m.family_name_particle, m.nickname,
    m.rank, m.is_active, m.profile_photo,
    COUNT(p.id) as total_penalties,
    COALESCE(SUM(p.amount), 0) as total_amount
  FROM public.members m
  LEFT JOIN public.penalties p
    ON m.id = p.member_id
   AND (NOT EXISTS (SELECT 1 FROM ae) OR p.event_id IN (SELECT id FROM ae))
  GROUP BY m.id, m.first_name, m.last_name, m.family_name_particle, m.nickname, m.rank, m.is_active, m.profile_photo
  ORDER BY total_amount DESC;
$function$;

DROP FUNCTION IF EXISTS public.get_public_penalty_stats();
CREATE FUNCTION public.get_public_penalty_stats()
 RETURNS TABLE(total_penalties bigint, total_amount numeric, penalties_today bigint, amount_today numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH ae AS (SELECT id FROM public.get_active_event())
  SELECT
    COUNT(p.id) as total_penalties,
    COALESCE(SUM(p.amount), 0) as total_amount,
    COUNT(CASE WHEN p.date = (now() AT TIME ZONE 'Europe/Berlin')::date THEN 1 END) as penalties_today,
    COALESCE(SUM(CASE WHEN p.date = (now() AT TIME ZONE 'Europe/Berlin')::date THEN p.amount END), 0) as amount_today
  FROM public.penalties p
  JOIN public.members m ON p.member_id = m.id
  WHERE (NOT EXISTS (SELECT 1 FROM ae) OR p.event_id IN (SELECT id FROM ae));
$function$;
GRANT EXECUTE ON FUNCTION public.get_public_penalty_stats() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_recent_penalties_public(limit_count integer DEFAULT 10, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, amount numeric, penalty_date date, created_time timestamp with time zone, penalty_type_name text, member_first_name text, member_last_name text, member_family_name_particle text, member_nickname text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH ae AS (SELECT id FROM public.get_active_event())
  SELECT
    p.id, p.amount, p.date as penalty_date,
    COALESCE(p.created_time, p.date::timestamp) as created_time,
    pc.name as penalty_type_name,
    m.first_name, m.last_name, m.family_name_particle, m.nickname
  FROM penalties p
  JOIN members m ON p.member_id = m.id
  LEFT JOIN penalty_catalog pc ON p.penalty_type_id = pc.id
  WHERE m.is_active = true
    AND (NOT EXISTS (SELECT 1 FROM ae) OR p.event_id IN (SELECT id FROM ae))
  ORDER BY COALESCE(p.created_time, p.date::timestamp) DESC
  LIMIT limit_count OFFSET offset_count;
$function$;

CREATE OR REPLACE FUNCTION public.get_member_penalties_public(p_member_id uuid, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, amount numeric, multiplier integer, penalty_date date, created_time timestamp with time zone, penalty_type_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH ae AS (SELECT id FROM public.get_active_event())
  SELECT
    p.id, p.amount, p.multiplier, p.date as penalty_date,
    COALESCE(p.created_time, p.date::timestamp) as created_time,
    pc.name as penalty_type_name
  FROM penalties p
  JOIN members m ON p.member_id = m.id
  LEFT JOIN penalty_catalog pc ON p.penalty_type_id = pc.id
  WHERE p.member_id = p_member_id AND m.is_active = true
    AND (NOT EXISTS (SELECT 1 FROM ae) OR p.event_id IN (SELECT id FROM ae))
  ORDER BY COALESCE(p.created_time, p.date::timestamp) DESC
  LIMIT p_limit;
$function$;
