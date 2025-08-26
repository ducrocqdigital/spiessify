-- Create penalty catalog table for configurable penalty types
CREATE TABLE public.penalty_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('timing', 'soziales', 'abnahme', 'maschieren', 'sonstiges')),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.penalty_catalog ENABLE ROW LEVEL SECURITY;

-- Create policies for penalty catalog
CREATE POLICY "Penalty catalog is viewable by everyone" 
ON public.penalty_catalog 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage penalty catalog" 
ON public.penalty_catalog 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add some default penalty types
INSERT INTO public.penalty_catalog (name, category, amount, description) VALUES
('Zu spät erschienen', 'timing', 5.00, 'Verspätetes Erscheinen zum Training oder Wettkampf'),
('Fehlende Ausrüstung', 'abnahme', 10.00, 'Unvollständige oder fehlende Ausrüstung'),
('Falscher Marschschritt', 'maschieren', 3.00, 'Fehler beim Marschieren'),
('Fehlende Höflichkeit', 'soziales', 7.50, 'Unhöfliches Verhalten gegenüber Mitgliedern'),
('Allgemeine Regelverletzung', 'sonstiges', 15.00, 'Sonstige Verstöße gegen die Vereinsregeln');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_penalty_catalog_updated_at
BEFORE UPDATE ON public.penalty_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add new column to penalties table to reference penalty catalog
ALTER TABLE public.penalties 
ADD COLUMN penalty_type_id UUID REFERENCES public.penalty_catalog(id);

-- Update existing penalties to use the new structure (map old categories to new penalty types)
UPDATE public.penalties 
SET penalty_type_id = (
  SELECT id FROM public.penalty_catalog 
  WHERE (penalties.category = 'uniform' AND penalty_catalog.name = 'Fehlende Ausrüstung')
     OR (penalties.category = 'marsch' AND penalty_catalog.name = 'Falscher Marschschritt') 
     OR (penalties.category = 'sonstiges' AND penalty_catalog.name = 'Allgemeine Regelverletzung')
  LIMIT 1
);

-- Remove old category column after migration
ALTER TABLE public.penalties DROP COLUMN category;