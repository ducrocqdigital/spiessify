-- Fix security issue: Set search_path for the function
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
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.id, e.name, e.start_date, e.end_date, e.notes, e.is_archived, e.created_at, e.updated_at
  FROM public.events e
  WHERE CURRENT_DATE BETWEEN e.start_date AND e.end_date
    AND e.is_archived = false
  ORDER BY e.start_date ASC
  LIMIT 1;
$$;