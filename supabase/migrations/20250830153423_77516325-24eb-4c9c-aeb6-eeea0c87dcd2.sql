-- Check and ensure RLS is enabled on user_roles table
-- and fix any issues with the policies

-- First, make sure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Only authenticated users can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only authenticated users can manage user roles" ON public.user_roles;

-- Create new, properly restrictive policies
CREATE POLICY "Authenticated users only - view user roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users only - manage user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);