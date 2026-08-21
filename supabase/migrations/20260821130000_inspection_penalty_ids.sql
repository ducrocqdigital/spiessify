ALTER TABLE public.inspection_results
  ADD COLUMN penalty_ids uuid[] NOT NULL DEFAULT '{}';
