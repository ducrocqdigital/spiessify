-- Add assigned_by_user_id to penalties table to track who assigned the penalty
ALTER TABLE public.penalties 
ADD COLUMN assigned_by_user_id UUID REFERENCES auth.users(id);