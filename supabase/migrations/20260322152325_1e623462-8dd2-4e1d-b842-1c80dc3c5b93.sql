ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload category images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view category images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'category-images');
CREATE POLICY "Admins can delete category images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'::app_role));