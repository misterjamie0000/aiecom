-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('categories', 'categories', true);

-- RLS Policies for products bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for banners bucket
CREATE POLICY "Anyone can view banner images"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banner images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update banner images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banner images"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for categories bucket
CREATE POLICY "Anyone can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'categories');

CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));