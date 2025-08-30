-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage events" 
ON public.events 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add event_id to penalties table
ALTER TABLE public.penalties 
ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Add event_id to inspection_sessions table  
ALTER TABLE public.inspection_sessions
ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Create trigger for events timestamps
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get active event
CREATE OR REPLACE FUNCTION public.get_active_event()
RETURNS TABLE (
  id UUID,
  name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_archived BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
AS $$
  SELECT e.id, e.name, e.start_date, e.end_date, e.notes, e.is_archived, e.created_at, e.updated_at
  FROM public.events e
  WHERE CURRENT_DATE BETWEEN e.start_date AND e.end_date
    AND e.is_archived = false
  ORDER BY e.start_date ASC
  LIMIT 1;
$$;