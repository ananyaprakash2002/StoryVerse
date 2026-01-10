-- ============================================
-- StoryVerse: Cover Images Migration
-- ============================================
-- This migration adds support for cover images and API integration

-- 1. Add new columns to category_items table
ALTER TABLE category_items 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_path TEXT,
ADD COLUMN IF NOT EXISTS api_source TEXT CHECK (api_source IN ('google_books')),
ADD COLUMN IF NOT EXISTS api_id TEXT;

-- 2. Add indexes for image queries
CREATE INDEX IF NOT EXISTS idx_category_items_cover_url ON category_items(cover_image_url) WHERE cover_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_category_items_api_source ON category_items(api_source) WHERE api_source IS NOT NULL;

-- 3. Create Supabase Storage bucket for cover images (run this in Supabase Dashboard -> Storage)
-- Bucket name: 'category-covers'
-- Public bucket: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Note: You need to create the storage bucket manually in Supabase Dashboard
-- Then set up the following policies:

-- Storage Policies (run in Supabase SQL Editor after creating the bucket):
/*
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload own images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'category-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'category-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'category-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'category-covers' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- 4. Add comment to document the schema
COMMENT ON COLUMN category_items.cover_image_url IS 'URL to cover image (external or Supabase storage)';
COMMENT ON COLUMN category_items.cover_image_path IS 'Storage path if uploaded to Supabase storage';
COMMENT ON COLUMN category_items.api_source IS 'Source API for auto-filled data (google_books)';
COMMENT ON COLUMN category_items.api_id IS 'ID from the external API for reference';
