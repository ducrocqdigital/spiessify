-- Create a new penalty type for credits
INSERT INTO public.penalty_catalog (name, category, amount, description, has_multiplier, is_active)
VALUES ('Gutschrift', 'gutschrift', 0, 'Gutschrift für Mitglieder', false, true);