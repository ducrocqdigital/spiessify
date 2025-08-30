-- CRITICAL: Further restrict public access to exclude sensitive fields
-- The current policy still exposes sensitive data to the public

-- We need a more granular approach using column-level security or a secure view

-- First, let's restrict the public policy to only allow access when using the secure function
DROP POLICY IF EXISTS "Public basic access for leaderboard" ON public.members;

-- Create a restrictive public policy that only works with our secure function
CREATE POLICY "Public access only via secure function" 
ON public.members 
FOR SELECT 
USING (false); -- Block direct public access

-- Update the authenticated policy to allow SELECT for authenticated users
CREATE POLICY "Authenticated users can view all member data" 
ON public.members 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- The public will only be able to access member data through our secure function
-- which filters out sensitive information automatically