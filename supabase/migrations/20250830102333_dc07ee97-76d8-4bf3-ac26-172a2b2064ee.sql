-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  is_oberadmin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (member_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "User roles are viewable by authenticated users" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only oberadmin can manage user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.is_oberadmin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.is_oberadmin = true
  )
);

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _role = 'oberadmin' THEN
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = _user_id AND ur.is_oberadmin = true
      )
    WHEN _role = 'chargierte' THEN
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.members m ON ur.member_id = m.id
        WHERE ur.user_id = _user_id 
        AND m.rank IN ('oberleutnant', 'leutnant', 'feldwebel')
      )
    WHEN _role = 'schuetze' THEN
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.members m ON ur.member_id = m.id
        WHERE ur.user_id = _user_id 
        AND m.rank NOT IN ('oberleutnant', 'leutnant', 'feldwebel')
      )
    ELSE false
  END;
$$;

-- Create function to get user profile with role info
CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  member_id UUID,
  is_oberadmin BOOLEAN,
  is_chargierte BOOLEAN,
  member_data JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id,
    ur.member_id,
    ur.is_oberadmin,
    CASE 
      WHEN m.rank IN ('oberleutnant', 'leutnant', 'feldwebel') THEN true
      ELSE false
    END as is_chargierte,
    to_jsonb(m.*) as member_data
  FROM public.user_roles ur
  JOIN public.members m ON ur.member_id = m.id
  WHERE ur.user_id = _user_id;
$$;

-- Add trigger for updating updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();