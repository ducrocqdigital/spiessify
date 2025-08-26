-- Add location and precise time fields to penalties table
ALTER TABLE public.penalties 
ADD COLUMN location_latitude DECIMAL(10, 8),
ADD COLUMN location_longitude DECIMAL(11, 8),
ADD COLUMN created_time TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records to have created_time based on created_at
UPDATE public.penalties 
SET created_time = created_at 
WHERE created_time IS NULL;