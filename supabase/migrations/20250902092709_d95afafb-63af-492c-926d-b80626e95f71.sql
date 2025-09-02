-- Update the get_public_penalty_stats function to include penalties from inactive members
CREATE OR REPLACE FUNCTION public.get_public_penalty_stats()
 RETURNS TABLE(total_penalties bigint, total_amount numeric, penalties_today bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    COUNT(p.id) as total_penalties,
    COALESCE(SUM(p.amount), 0) as total_amount,
    COUNT(CASE WHEN p.date = CURRENT_DATE THEN 1 END) as penalties_today
  FROM public.penalties p
  JOIN public.members m ON p.member_id = m.id;
$function$;