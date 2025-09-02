-- Update member ranks to the correct hierarchy
-- First, drop all policies that reference the rank column
DROP POLICY IF EXISTS "Only authorized users can manage penalties" ON penalties;

-- Remove the default value temporarily
ALTER TABLE members ALTER COLUMN rank DROP DEFAULT;

-- Create the new enum with correct values
CREATE TYPE member_rank_new AS ENUM (
  'passiv',
  'gastschuetze', 
  'schuetze',
  'oberschuetze',
  'gefreiter',
  'obergefreiter', 
  'stabsgefreiter',
  'unteroffizier',
  'stabsunteroffizier',
  'feldwebel',
  'faehnrich',
  'leutnant',
  'oberleutnant'
);

-- Update the members table to use the new enum
ALTER TABLE members 
ALTER COLUMN rank TYPE member_rank_new 
USING CASE 
  WHEN rank::text = 'rekrut' THEN 'passiv'::member_rank_new
  WHEN rank::text = 'gastschuetze' THEN 'gastschuetze'::member_rank_new
  WHEN rank::text = 'schuetze' THEN 'schuetze'::member_rank_new
  WHEN rank::text = 'gefreiter' THEN 'gefreiter'::member_rank_new
  WHEN rank::text = 'obergefreiter' THEN 'obergefreiter'::member_rank_new
  WHEN rank::text = 'unteroffizier' THEN 'unteroffizier'::member_rank_new
  WHEN rank::text = 'feldwebel' THEN 'feldwebel'::member_rank_new
  WHEN rank::text = 'oberfeldwebel' THEN 'stabsunteroffizier'::member_rank_new
  WHEN rank::text = 'leutnant' THEN 'leutnant'::member_rank_new
  WHEN rank::text = 'oberleutnant' THEN 'oberleutnant'::member_rank_new
  WHEN rank::text = 'hauptmann' THEN 'oberleutnant'::member_rank_new
  WHEN rank::text = 'major' THEN 'oberleutnant'::member_rank_new
  WHEN rank::text = 'oberst' THEN 'oberleutnant'::member_rank_new
  ELSE 'schuetze'::member_rank_new
END;

-- Drop the old enum and rename the new one
DROP TYPE member_rank;
ALTER TYPE member_rank_new RENAME TO member_rank;

-- Set new default value for rank column
ALTER TABLE members ALTER COLUMN rank SET DEFAULT 'schuetze'::member_rank;

-- Recreate the policy with updated ranks
CREATE POLICY "Only authorized users can manage penalties" 
ON penalties FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.is_oberadmin = true
  ) 
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN members m ON ur.member_id = m.id 
    WHERE ur.user_id = auth.uid() 
    AND m.rank IN ('faehnrich', 'leutnant', 'oberleutnant')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.is_oberadmin = true
  ) 
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN members m ON ur.member_id = m.id 
    WHERE ur.user_id = auth.uid() 
    AND m.rank IN ('faehnrich', 'leutnant', 'oberleutnant')
  )
);

-- Update functions that reference ranks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        AND m.rank IN ('faehnrich', 'leutnant', 'oberleutnant')
      )
    WHEN _role = 'schuetze' THEN
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.members m ON ur.member_id = m.id
        WHERE ur.user_id = _user_id 
        AND m.rank NOT IN ('faehnrich', 'leutnant', 'oberleutnant')
      )
    ELSE false
  END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id uuid)
 RETURNS TABLE(user_id uuid, member_id uuid, is_oberadmin boolean, is_chargierte boolean, member_data jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ur.user_id,
    ur.member_id,
    ur.is_oberadmin,
    CASE 
      WHEN m.rank IN ('faehnrich', 'leutnant', 'oberleutnant') THEN true
      ELSE false
    END as is_chargierte,
    to_jsonb(m.*) as member_data
  FROM public.user_roles ur
  JOIN public.members m ON ur.member_id = m.id
  WHERE ur.user_id = _user_id;
$function$;

CREATE OR REPLACE FUNCTION public.user_can_manage_members()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.is_oberadmin = true
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.member_id IN (
      SELECT id FROM public.members 
      WHERE rank IN ('faehnrich', 'leutnant', 'oberleutnant')
    )
  );
$function$;