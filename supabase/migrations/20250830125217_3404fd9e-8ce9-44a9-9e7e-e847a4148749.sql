-- Fix RLS policies for user_roles to prevent infinite recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Only oberadmin can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "User roles are viewable by authenticated users" ON public.user_roles;

-- Create new simplified policies
CREATE POLICY "Users can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);