-- Add family_name_particle field to members table
ALTER TABLE public.members 
ADD COLUMN family_name_particle TEXT;