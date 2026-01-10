-- ============================================
-- StoryVerse: Search Optimization Migration
-- ============================================
-- This migration adds full-text search capabilities
-- to the category_items table for fast global search

-- 1. Add GIN index for JSONB data field (already exists but ensure it's optimized)
-- This index enables fast searching within the JSONB data column
DROP INDEX IF EXISTS idx_category_items_data;
CREATE INDEX idx_category_items_data ON category_items USING GIN(data jsonb_path_ops);

-- 2. Create a function for searching items with ranking
CREATE OR REPLACE FUNCTION search_category_items(
    search_query TEXT,
    user_uuid UUID
)
RETURNS TABLE (
    id UUID,
    category_id UUID,
    user_id UUID,
    data JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.category_id,
        ci.user_id,
        ci.data,
        ci.created_at,
        ci.updated_at,
        -- Calculate ranking based on text similarity
        ts_rank(
            to_tsvector('english', ci.data::text),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM category_items ci
    WHERE ci.user_id = user_uuid
      AND to_tsvector('english', ci.data::text) @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, ci.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Add index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_category_items_updated_at ON category_items(updated_at DESC);

-- 4. Add index on created_at for filtering
CREATE INDEX IF NOT EXISTS idx_category_items_created_at ON category_items(created_at DESC);

-- 5. Composite index for user + category filtering
CREATE INDEX IF NOT EXISTS idx_category_items_user_category ON category_items(user_id, category_id);
