
-- Add image_url column to jobs
ALTER TABLE public.jobs ADD COLUMN image_url text;

-- Create storage bucket for job images
INSERT INTO storage.buckets (id, name, public) VALUES ('job-images', 'job-images', true);

-- Allow public read
CREATE POLICY "Job images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload job images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own job images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'job-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own job images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-images');
