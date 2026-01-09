# Custom Categories - Database Setup

Run this SQL in your Supabase SQL Editor to set up the custom categories system.

## 1. Create Tables

```sql
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for templates
  name TEXT NOT NULL,
  icon TEXT, -- Emoji or icon identifier
  color TEXT, -- Hex color for theming
  description TEXT,
  is_template BOOLEAN DEFAULT false, -- System templates vs user categories
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_category UNIQUE(user_id, name),
  CONSTRAINT check_user_or_template CHECK (user_id IS NOT NULL OR is_template = true)
);

-- Category fields definition
CREATE TABLE IF NOT EXISTS category_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL, -- Display label
  field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'boolean', 'url', 'textarea', 'select', 'multiselect', 'tags', 'rating'
  placeholder TEXT, -- Placeholder text for input
  options JSONB, -- For select/multiselect: ["Option 1", "Option 2"], for rating: {"max": 5}
  required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_category_field UNIQUE(category_id, name)
);

-- Category items (user data)
CREATE TABLE IF NOT EXISTS category_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL, -- Field values stored as JSON: {"title": "Book Name", "rating": 5}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_category_fields_category_id ON category_fields(category_id);
CREATE INDEX idx_category_fields_order ON category_fields(category_id, order_index);
CREATE INDEX idx_category_items_category_id ON category_items(category_id);
CREATE INDEX idx_category_items_user_id ON category_items(user_id);
CREATE INDEX idx_category_items_data ON category_items USING GIN(data);
```

## 2. Enable Row Level Security

```sql
-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_template = false);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id AND is_template = false);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id AND is_template = false);

-- Category Fields RLS
ALTER TABLE category_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fields for accessible categories" ON category_fields
  FOR SELECT USING (
    category_id IN (
      SELECT id FROM categories 
      WHERE user_id = auth.uid() OR is_template = true
    )
  );

CREATE POLICY "Users can create fields for own categories" ON category_fields
  FOR INSERT WITH CHECK (
    category_id IN (
      SELECT id FROM categories WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fields for own categories" ON category_fields
  FOR UPDATE USING (
    category_id IN (
      SELECT id FROM categories WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fields for own categories" ON category_fields
  FOR DELETE USING (
    category_id IN (
      SELECT id FROM categories WHERE user_id = auth.uid()
    )
  );

-- Category Items RLS
ALTER TABLE category_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items" ON category_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own items" ON category_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON category_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON category_items
  FOR DELETE USING (auth.uid() = user_id);
```

## 3. Create System Templates

These are the base templates users can use when creating new categories.

```sql
-- Insert system template categories (shared across all users, is_template = true)
-- Note: These have a special UUID and no user_id to make them system-wide

-- Books Template
INSERT INTO categories (id, user_id, name, icon, color, description, is_template) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, NULL, 'Books', '📚', '#10b981', 'Track your reading journey', true);

INSERT INTO category_fields (category_id, name, label, field_type, placeholder, required, order_index) VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'title', 'Title', 'text', 'Enter book title', true, 1),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'author', 'Author', 'text', 'Enter author name', false, 2),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'rating', 'Rating', 'rating', NULL, false, 3),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'status', 'Status', 'select', NULL, false, 4),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'start_date', 'Start Date', 'date', NULL, false, 5),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'finish_date', 'Finish Date', 'date', NULL, false, 6),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'notes', 'Notes', 'textarea', 'Add your thoughts...', false, 7),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'tags', 'Tags', 'tags', 'Add tags', false, 8);

-- Update select field options for status
UPDATE category_fields 
SET options = '["To Read", "Reading", "Completed", "On Hold", "Dropped"]'::jsonb
WHERE category_id = '00000000-0000-0000-0000-000000000001'::uuid AND name = 'status';

-- Update rating options
UPDATE category_fields 
SET options = '{"max": 5}'::jsonb
WHERE category_id = '00000000-0000-0000-0000-000000000001'::uuid AND name = 'rating';

-- Movies Template
INSERT INTO categories (id, user_id, name, icon, color, description, is_template) VALUES
  ('00000000-0000-0000-0000-000000000002'::uuid, NULL, 'Movies', '🎬', '#ef4444', 'Track movies you''ve watched', true);

INSERT INTO category_fields (category_id, name, label, field_type, placeholder, required, order_index) VALUES
  ('00000000-0000-0000-0000-000000000002'::uuid, 'title', 'Title', 'text', 'Enter movie title', true, 1),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'year', 'Year', 'number', 'Release year', false, 2),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'rating', 'Rating', 'rating', NULL, false, 3),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'watched_date', 'Date Watched', 'date', NULL, false, 4),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'genres', 'Genres', 'multiselect', NULL, false, 5),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'notes', 'Notes', 'textarea', 'Your review...', false, 6),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'tags', 'Tags', 'tags', 'Add tags', false, 7);

UPDATE category_fields 
SET options = '["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller", "Documentary"]'::jsonb
WHERE category_id = '00000000-0000-0000-0000-000000000002'::uuid AND name = 'genres';

UPDATE category_fields 
SET options = '{"max": 5}'::jsonb
WHERE category_id = '00000000-0000-0000-0000-000000000002'::uuid AND name = 'rating';

-- Anime Template
INSERT INTO categories (id, user_id, name, icon, color, description, is_template) VALUES
  ('00000000-0000-0000-0000-000000000003'::uuid, NULL, 'Anime', '🎌', '#f59e0b', 'Track anime series', true);

INSERT INTO category_fields (category_id, name, label, field_type, placeholder, required, order_index) VALUES
  ('00000000-0000-0000-0000-000000000003'::uuid, 'name', 'Name', 'text', 'Enter anime name', true, 1),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'season', 'Season', 'number', 'Season number', false, 2),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'current_episode', 'Current Episode', 'number', 'Episode number', false, 3),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'total_episodes', 'Total Episodes', 'number', 'Total episodes', false, 4),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'rating', 'Rating', 'rating', NULL, false, 5),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'status', 'Status', 'select', NULL, false, 6),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'streaming_link', 'Streaming Link', 'url', 'https://...', false, 7),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'tags', 'Tags', 'tags', 'Add tags', false, 8);

UPDATE category_fields 
SET options = '["Watching", "Completed", "On Hold", "Dropped", "Plan to Watch"]'::jsonb
WHERE category_id = '00000000-0000-0000-0000-000000000003'::uuid AND name = 'status';

UPDATE category_fields 
SET options = '{"max": 5}'::jsonb
WHERE category_id = '00000000-0000-0000-0000-000000000003'::uuid AND name = 'rating';

-- Manga Template
INSERT INTO categories (id, user_id, name, icon, color, description, is_template) VALUES
  ('00000000-0000-0000-0000-000000000004'::uuid, NULL, 'Manga', '📖', '#8b5cf6', 'Track manga series', true);

INSERT INTO category_fields (category_id, name, label, field_type, placeholder, required, order_index) VALUES
  ('00000000-0000-0000-0000-000000000004'::uuid, 'name', 'Name', 'text', 'Enter manga name', true, 1),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'current_chapter', 'Current Chapter', 'number', 'Chapter number', false, 2),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'total_chapters', 'Total Chapters', 'number', 'Total chapters', false, 3),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'rating', 'Rating', 'rating', NULL, false, 4),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'status', 'Status', 'select', NULL, false, 5),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'reading_link', 'Reading Link', 'url', 'https://...', false, 6),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'tags', 'Tags', 'tags', 'Add tags', false, 7);

UPDATE category_fields 
SET options = '["Reading", "Completed", "On Hold", "Dropped", "Plan to Read"]'::jsonb
WHERE category_id = '00000000-0000-0000-0000-000000000004'::uuid AND name = 'status';

UPDATE category_fields 
SET options = '{"max": 5}'::jsonb
WHERE category_id = '00000000-0000-0000-0000-000000000004'::uuid AND name = 'rating';
```

## 4. Update RLS for Templates

```sql
-- Allow anyone to view template categories and their fields
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view own and template categories" ON categories
  FOR SELECT USING (auth.uid() = user_id OR is_template = true);
```

## 5. Verify Setup

Run this to check everything is created correctly:

```sql
-- Check templates
SELECT name, icon, color, description FROM categories WHERE is_template = true;

-- Check fields for Books template
SELECT label, field_type, required, order_index 
FROM category_fields 
WHERE category_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY order_index;
```

You should see 4 templates (Books, Movies, Anime, Manga) with their respective fields!
