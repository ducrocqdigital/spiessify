-- Enable Row Level Security on members table if not already enabled
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to members" ON public.members;
DROP POLICY IF EXISTS "Allow public write access to members" ON public.members;
DROP POLICY IF EXISTS "Allow public insert access to members" ON public.members;
DROP POLICY IF EXISTS "Allow public update access to members" ON public.members;
DROP POLICY IF EXISTS "Allow public delete access to members" ON public.members;

-- Create policies for members table to allow full access
CREATE POLICY "Allow public read access to members" 
ON public.members 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to members" 
ON public.members 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to members" 
ON public.members 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public delete access to members" 
ON public.members 
FOR DELETE 
USING (true);