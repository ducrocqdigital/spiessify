-- Complete the security fix with proper role-based access control

-- 2. AUTHENTICATED USERS: Allow chargierten and oberadmins to manage members
CREATE POLICY "Chargierten can manage all members" 
ON public.members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.members m ON ur.member_id = m.id
    WHERE ur.user_id = auth.uid() 
    AND (ur.is_oberadmin = true OR m.rank IN ('leutnant', 'oberleutnant', 'hauptmann', 'major', 'oberst'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.members m ON ur.member_id = m.id
    WHERE ur.user_id = auth.uid() 
    AND (ur.is_oberadmin = true OR m.rank IN ('leutnant', 'oberleutnant', 'hauptmann', 'major', 'oberst'))
  )
);

-- 3. Create a secure public view that only exposes safe data for leaderboard
CREATE OR REPLACE VIEW public.members_public AS
SELECT 
  id,
  first_name,
  last_name,
  family_name_particle,
  nickname,
  rank,
  is_active,
  profile_photo
FROM public.members
WHERE is_active = true;

-- Enable RLS on the view (inherits from the base table)
ALTER VIEW public.members_public SET (security_barrier = true);

-- Create a secure function for getting member stats for public leaderboard
CREATE OR REPLACE FUNCTION public.get_members_with_public_stats()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  family_name_particle text,
  nickname text,
  rank member_rank,
  is_active boolean,
  profile_photo text,
  total_penalties bigint,
  total_amount numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  WHERE m.is_active = true
  GROUP BY m.id, m.first_name, m.last_name, m.family_name_particle, m.nickname, m.rank, m.is_active, m.profile_photo
  ORDER BY total_amount DESC;
$$;