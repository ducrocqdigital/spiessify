-- Update the function to include inactive members
CREATE OR REPLACE FUNCTION public.get_members_with_public_stats()
 RETURNS TABLE(id uuid, first_name text, last_name text, family_name_particle text, nickname text, rank member_rank, is_active boolean, profile_photo text, total_penalties bigint, total_amount numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    m.id,
    m.first_name,
    m.last_name,
    m.family_name_particle,
    m.nickname,
    m.rank,
    m.is_active,
    m.profile_photo,
    COUNT(p.id) as total_penalties,
    COALESCE(SUM(p.amount), 0) as total_amount
  FROM public.members m
  LEFT JOIN public.penalties p ON m.id = p.member_id
  GROUP BY m.id, m.first_name, m.last_name, m.family_name_particle, m.nickname, m.rank, m.is_active, m.profile_photo
  ORDER BY total_amount DESC;
$function$