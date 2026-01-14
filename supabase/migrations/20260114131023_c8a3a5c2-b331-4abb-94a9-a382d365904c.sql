-- Add request_type column to return_requests table to support both return and replace requests
ALTER TABLE public.return_requests 
ADD COLUMN request_type TEXT NOT NULL DEFAULT 'return' CHECK (request_type IN ('return', 'replace'));