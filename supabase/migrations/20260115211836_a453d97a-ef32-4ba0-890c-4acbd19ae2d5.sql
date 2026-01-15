-- Add alternative_phone column to addresses table
ALTER TABLE public.addresses 
ADD COLUMN alternative_phone text;