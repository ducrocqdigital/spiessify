-- CRITICAL SECURITY FIX: Restrict penalties table access
-- Currently completely open to public with sensitive financial and location data

-- Drop all dangerous public access policies
DROP POLICY IF EXISTS "Allow public delete access to penalties" ON public.penalties;
DROP POLICY IF EXISTS "Allow public insert access to penalties" ON public.penalties;
DROP POLICY IF EXISTS "Allow public update access to penalties" ON public.penalties;
DROP POLICY IF EXISTS "Penalties are viewable by everyone" ON public.penalties;

-- Ensure RLS is enabled
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

-- Create secure policies for proper access control

-- 1. Only authenticated chargierten and oberadmins can manage penalties
CREATE POLICY "Only authorized users can manage penalties" 
ON public.penalties 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.is_oberadmin = true
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.members m ON ur.member_id = m.id
    WHERE ur.user_id = auth.uid() 
    AND m.rank IN ('leutnant', 'oberleutnant', 'hauptmann', 'major', 'oberst')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.is_oberadmin = true
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.members m ON ur.member_id = m.id
    WHERE ur.user_id = auth.uid() 
    AND m.rank IN ('leutnant', 'oberleutnant', 'hauptmann', 'major', 'oberst')
  )
);

-- 2. Members can view their own penalties (optional - you can remove this if not needed)
CREATE POLICY "Members can view their own penalties" 
ON public.penalties 
FOR SELECT 
USING (
  member_id IN (
    SELECT ur.member_id FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
  )
);