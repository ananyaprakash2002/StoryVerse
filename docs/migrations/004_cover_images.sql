-- Adds support for cover images and API integration

ALTER TABLE category_items 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_path TEXT,
ADD COLUMN IF NOT EXISTS api_source TEXT CHECK (api_source IN ('google_books')),
ADD COLUMN IF NOT EXISTS api_id TEXT;

CREATE INDEX IF NOT EXISTS idx_category_items_cover_url ON category_items(cover_image_url) WHERE cover_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_category_items_api_source ON category_items(api_source) WHERE api_source IS NOT NULL;

-- Note: Create Supabase Storage bucket 'category-covers' and configure storage policies in the Supabase dashboard

COMMENT ON COLUMN category_items.cover_image_url IS 'URL to cover image (external or Supabase storage)';
COMMENT ON COLUMN category_items.cover_image_path IS 'Storage path if uploaded to Supabase storage';
COMMENT ON COLUMN category_items.api_source IS 'Source API for auto-filled data (google_books)';
COMMENT ON COLUMN category_items.api_id IS 'ID from the external API for reference';
