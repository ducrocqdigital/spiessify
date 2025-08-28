-- Create inspection sessions table
CREATE TABLE public.inspection_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anlass TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection results table
CREATE TABLE public.inspection_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.inspection_sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'gemustert')),
  inspection_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, member_id)
);

-- Enable RLS
ALTER TABLE public.inspection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;

-- Create policies for inspection_sessions
CREATE POLICY "Inspection sessions are viewable by everyone" 
ON public.inspection_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage inspection sessions" 
ON public.inspection_sessions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for inspection_results
CREATE POLICY "Inspection results are viewable by everyone" 
ON public.inspection_results 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage inspection results" 
ON public.inspection_results 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_inspection_sessions_updated_at
  BEFORE UPDATE ON public.inspection_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_results_updated_at
  BEFORE UPDATE ON public.inspection_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();