-- Add admin policy for viewing all cart items (needed for abandoned cart feature)
CREATE POLICY "Admins can view all cart items" 
ON public.cart_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));