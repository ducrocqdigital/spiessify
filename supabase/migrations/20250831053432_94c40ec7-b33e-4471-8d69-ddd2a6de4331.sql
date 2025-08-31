-- Drop and recreate the function with correct return type
DROP FUNCTION IF EXISTS get_recent_penalties_public(integer, integer);

-- Create function to get recent penalties for public display (bypasses RLS)
CREATE OR REPLACE FUNCTION get_recent_penalties_public(limit_count INTEGER DEFAULT 10, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  id UUID,
  amount NUMERIC,
  penalty_date DATE,
  created_time TIMESTAMP WITH TIME ZONE,
  penalty_type_name TEXT,
  member_first_name TEXT,
  member_last_name TEXT,
  member_family_name_particle TEXT,
  member_nickname TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.amount,
    p.date as penalty_date,
    COALESCE(p.created_time, p.date::timestamp) as created_time,
    pc.name as penalty_type_name,
    m.first_name as member_first_name,
    m.last_name as member_last_name,
    m.family_name_particle as member_family_name_particle,
    m.nickname as member_nickname
  FROM penalties p
  JOIN members m ON p.member_id = m.id
  LEFT JOIN penalty_catalog pc ON p.penalty_type_id = pc.id
  WHERE m.is_active = true
  ORDER BY COALESCE(p.created_time, p.date::timestamp) DESC
  LIMIT limit_count OFFSET offset_count;
$$;