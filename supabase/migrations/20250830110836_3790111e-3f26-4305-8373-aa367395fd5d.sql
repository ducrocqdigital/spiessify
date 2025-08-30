-- Create a function to handle initial user registration and linking
-- This bypasses the RLS restriction for the first oberadmin user
CREATE OR REPLACE FUNCTION public.link_user_to_member_on_signup(
  _user_id uuid,
  _member_id uuid,
  _is_oberadmin boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oberadmin_exists boolean;
BEGIN
  -- Check if any oberadmin already exists
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE is_oberadmin = true
  ) INTO oberadmin_exists;
  
  -- Allow linking if:
  -- 1. No oberadmin exists yet (first signup), OR
  -- 2. The current user is already an oberadmin
  IF NOT oberadmin_exists OR 
     EXISTS (
       SELECT 1 FROM public.user_roles 
       WHERE user_id = auth.uid() AND is_oberadmin = true
     ) THEN
    
    -- Insert the user role record
    INSERT INTO public.user_roles (user_id, member_id, is_oberadmin)
    VALUES (_user_id, _member_id, _is_oberadmin);
    
  ELSE
    RAISE EXCEPTION 'Unauthorized: Only oberadmin can create new user accounts';
  END IF;
END;
$$;