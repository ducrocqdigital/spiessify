-- Add missing foreign key constraint for penalties.assigned_by_user_id
ALTER TABLE public.penalties 
ADD CONSTRAINT penalties_assigned_by_user_id_fkey 
FOREIGN KEY (assigned_by_user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;