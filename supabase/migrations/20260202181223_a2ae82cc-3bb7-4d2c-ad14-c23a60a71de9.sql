-- Allow admins to view all wishlist items for customer management
CREATE POLICY "Admins can view all wishlist items"
ON public.wishlist
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));