-- Create public access policies for the public dashboard

-- Allow public access to penalties view (read-only) 
CREATE POLICY "Public can view penalties via functions" ON public.penalties
FOR SELECT USING (false); -- This will be bypassed by security definer functions

-- Allow public access to members view (read-only, limited fields)
CREATE POLICY "Public can view limited member data via functions" ON public.members  
FOR SELECT USING (false); -- This will be bypassed by security definer functions

-- Update the public functions to ensure they work correctly
-- Grant execute permissions to anon role
GRANT EXECUTE ON FUNCTION get_recent_penalties_public(integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_members_with_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_public_penalty_stats() TO anon;