-- Add phonepe and paytm to payment_method enum
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'phonepe';
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'paytm';