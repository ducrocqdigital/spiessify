-- Extend public stats with today's amount (Berlin time)
DROP FUNCTION IF EXISTS public.get_public_penalty_stats();
CREATE FUNCTION public.get_public_penalty_stats()
 RETURNS TABLE(total_penalties bigint, total_amount numeric, penalties_today bigint, amount_today numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(p.id) as total_penalties,
    COALESCE(SUM(p.amount), 0) as total_amount,
    COUNT(CASE WHEN p.date = (now() AT TIME ZONE 'Europe/Berlin')::date THEN 1 END) as penalties_today,
    COALESCE(SUM(CASE WHEN p.date = (now() AT TIME ZONE 'Europe/Berlin')::date THEN p.amount END), 0) as amount_today
  FROM public.penalties p
  JOIN public.members m ON p.member_id = m.id;
$function$;
GRANT EXECUTE ON FUNCTION public.get_public_penalty_stats() TO anon, authenticated;

-- Public penalty list for one member (used by the person detail modal)
CREATE OR REPLACE FUNCTION public.get_member_penalties_public(p_member_id uuid, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, amount numeric, multiplier integer, penalty_date date, created_time timestamp with time zone, penalty_type_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.amount,
    p.multiplier,
    p.date as penalty_date,
    COALESCE(p.created_time, p.date::timestamp) as created_time,
    pc.name as penalty_type_name
  FROM penalties p
  JOIN members m ON p.member_id = m.id
  LEFT JOIN penalty_catalog pc ON p.penalty_type_id = pc.id
  WHERE p.member_id = p_member_id AND m.is_active = true
  ORDER BY COALESCE(p.created_time, p.date::timestamp) DESC
  LIMIT p_limit;
$function$;
GRANT EXECUTE ON FUNCTION public.get_member_penalties_public(uuid, integer) TO anon, authenticated;
