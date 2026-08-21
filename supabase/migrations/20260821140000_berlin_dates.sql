-- Use Europe/Berlin local date instead of UTC CURRENT_DATE,
-- so entries between midnight and 2:00 belong to the right day.
CREATE OR REPLACE FUNCTION public.get_active_event()
 RETURNS TABLE(id uuid, name text, start_date date, end_date date, notes text, is_archived boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT e.id, e.name, e.start_date, e.end_date, e.notes, e.is_archived, e.created_at, e.updated_at
  FROM public.events e
  WHERE (now() AT TIME ZONE 'Europe/Berlin')::date BETWEEN e.start_date AND e.end_date
    AND e.is_archived = false
  ORDER BY e.start_date ASC
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_penalty_stats()
 RETURNS TABLE(total_penalties bigint, total_amount numeric, penalties_today bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(p.id) as total_penalties,
    COALESCE(SUM(p.amount), 0) as total_amount,
    COUNT(CASE WHEN p.date = (now() AT TIME ZONE 'Europe/Berlin')::date THEN 1 END) as penalties_today
  FROM public.penalties p
  JOIN public.members m ON p.member_id = m.id;
$function$;
