-- First drop all policies that reference the rank column
DROP POLICY IF EXISTS "Only authorized users can manage penalties" ON penalties;

-- Create temporary policies without rank references
CREATE POLICY "temp_manage_penalties" 
ON penalties FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.is_oberadmin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.is_oberadmin = true
  )
);

-- Update member ranks to the correct hierarchy
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

-- Remove the default first
ALTER TABLE members ALTER COLUMN rank DROP DEFAULT;

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

-- Set default value for rank column
ALTER TABLE members ALTER COLUMN rank SET DEFAULT 'schuetze'::member_rank;

-- Now recreate the proper policy with rank references
DROP POLICY "temp_manage_penalties" ON penalties;

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