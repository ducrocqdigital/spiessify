-- Create storage policies for member photos

-- Allow anyone to upload to member-photos bucket
CREATE POLICY "Anyone can upload member photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'member-photos');

-- Allow anyone to view member photos (since bucket is public)
CREATE POLICY "Anyone can view member photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'member-photos');

-- Allow anyone to update member photos
CREATE POLICY "Anyone can update member photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'member-photos');

-- Allow anyone to delete member photos
CREATE POLICY "Anyone can delete member photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'member-photos');