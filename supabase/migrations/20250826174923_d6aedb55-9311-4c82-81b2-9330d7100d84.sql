-- Update RLS policies for penalties table to allow public access
-- Drop the restrictive policies first
DROP POLICY IF EXISTS "Only authenticated users can insert penalties" ON public.penalties;
DROP POLICY IF EXISTS "Only authenticated users can update penalties" ON public.penalties;
DROP POLICY IF EXISTS "Only authenticated users can delete penalties" ON public.penalties;

-- Create new policies that allow public access (for the shooting club admin system)
CREATE POLICY "Allow public insert access to penalties" 
ON public.penalties 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update access to penalties" 
ON public.penalties 
FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access to penalties" 
ON public.penalties 
FOR DELETE 
TO public
USING (true);