-- Create rank enum for different member ranks
CREATE TYPE public.member_rank AS ENUM (
  'rekrut',
  'schuetze', 
  'gefreiter',
  'obergefreiter',
  'unteroffizier',
  'feldwebel',
  'oberfeldwebel',
  'leutnant',
  'oberleutnant',
  'hauptmann',
  'major',
  'oberst'
);

-- Create members table with comprehensive profile data
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  rank member_rank DEFAULT 'schuetze',
  join_year INTEGER,
  birth_date DATE,
  profile_photo TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for members (public read for now, can be restricted later)
CREATE POLICY "Members are viewable by everyone" 
ON public.members 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert members" 
ON public.members 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update members" 
ON public.members 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can delete members" 
ON public.members 
FOR DELETE 
TO authenticated
USING (true);

-- Update penalties table to reference members
ALTER TABLE public.penalties 
ADD CONSTRAINT fk_penalties_member 
FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-photos', 'member-photos', true);

-- Create storage policies for member photos
CREATE POLICY "Member photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can upload member photos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can update member photos" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can delete member photos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'member-photos');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on common queries
CREATE INDEX idx_members_active ON public.members(is_active);
CREATE INDEX idx_members_name ON public.members(last_name, first_name);
CREATE INDEX idx_members_rank ON public.members(rank);