-- CRITICAL SECURITY FIX: Restrict user_roles access to authenticated users only
-- Currently anyone can see admin privileges and user IDs

-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Users can view all user roles" ON public.user_roles;

-- Create a secure policy that only allows authenticated users to view user roles
CREATE POLICY "Only authenticated users can view user roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Ensure only authenticated users can manage user roles (this should already exist but let's be explicit)
DROP POLICY IF EXISTS "Only authenticated users can manage user roles" ON public.user_roles;

CREATE POLICY "Only authenticated users can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);