-- Create a new penalty type for credits using existing category
INSERT INTO public.penalty_catalog (name, category, amount, description, has_multiplier, is_active)
VALUES ('Gutschrift', 'sonstiges', 0, 'Gutschrift für Mitglieder', false, true);