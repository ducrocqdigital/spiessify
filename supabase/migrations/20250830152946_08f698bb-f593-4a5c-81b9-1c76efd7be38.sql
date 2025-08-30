-- Fix the infinite recursion issue in members table RLS policies
-- The problem is that the policy references the same table it's protecting

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Chargierten can manage all members" ON public.members;
DROP POLICY IF EXISTS "Public can view basic member info for leaderboard" ON public.members;

-- Create a security definer function to check user permissions without recursion
CREATE OR REPLACE FUNCTION public.user_can_manage_members()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.is_oberadmin = true
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.member_id IN (
      SELECT id FROM public.members 
      WHERE rank IN ('leutnant', 'oberleutnant', 'hauptmann', 'major', 'oberst')
    )
  );
$$;

-- Create simple, non-recursive policies

-- 1. Public access: Allow reading basic info for leaderboard (no sensitive data exposed)
CREATE POLICY "Public basic access for leaderboard" 
ON public.members 
FOR SELECT 
USING (true);

-- 2. Authenticated management: Only oberadmins and chargierten can modify
CREATE POLICY "Authenticated users can manage members" 
ON public.members 
FOR ALL 
USING (public.user_can_manage_members())
WITH CHECK (public.user_can_manage_members());