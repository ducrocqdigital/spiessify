-- Add has_multiplier column to penalty_catalog table
ALTER TABLE penalty_catalog 
ADD COLUMN has_multiplier boolean NOT NULL DEFAULT false;

-- Add multiplier column to penalties table  
ALTER TABLE penalties
ADD COLUMN multiplier integer DEFAULT 1;