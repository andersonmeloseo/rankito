-- Create storage bucket for GBP photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('gbp_photos', 'gbp_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload GBP photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gbp_photos');

-- Allow authenticated users to update their own photos
CREATE POLICY "Authenticated users can update their GBP photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'gbp_photos');

-- Allow authenticated users to delete their own photos
CREATE POLICY "Authenticated users can delete their GBP photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gbp_photos');

-- Allow public read access to GBP photos
CREATE POLICY "Public read access to GBP photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'gbp_photos');