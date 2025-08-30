-- Update the secure public function to also provide penalty stats and recent penalties
-- without exposing sensitive details

-- Create a function to get safe penalty statistics for public display
CREATE OR REPLACE FUNCTION public.get_public_penalty_stats()
RETURNS TABLE(
  total_penalties bigint,
  total_amount numeric,
  unique_days bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COUNT(p.id) as total_penalties,
    COALESCE(SUM(p.amount), 0) as total_amount,
    COUNT(DISTINCT p.date) as unique_days
  FROM public.penalties p
  JOIN public.members m ON p.member_id = m.id
  WHERE m.is_active = true;
$$;

-- Create a function to get safe recent penalties for public display (no sensitive details)
CREATE OR REPLACE FUNCTION public.get_recent_penalties_public(limit_count integer DEFAULT 10, offset_count integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  member_first_name text,
  member_last_name text,
  member_family_name_particle text,
  member_nickname text,
  penalty_type_name text,
  amount numeric,
  penalty_date date,
  created_time timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    m.first_name as member_first_name,
    m.last_name as member_last_name,
    m.family_name_particle as member_family_name_particle,
    m.nickname as member_nickname,
    pc.name as penalty_type_name,
    p.amount,
    p.date as penalty_date,
    COALESCE(p.created_time, p.date::timestamp) as created_time
  FROM public.penalties p
  JOIN public.members m ON p.member_id = m.id
  LEFT JOIN public.penalty_catalog pc ON p.penalty_type_id = pc.id
  WHERE m.is_active = true
  ORDER BY COALESCE(p.created_time, p.date::timestamp) DESC
  LIMIT limit_count OFFSET offset_count;
$$;