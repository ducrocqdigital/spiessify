-- Fix security definer view issue by removing the problematic view
-- and keeping only the secure function approach

DROP VIEW IF EXISTS public.members_public;

-- The function approach is secure and appropriate for this use case
-- since it implements proper access control for public data