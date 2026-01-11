-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for templates
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  is_template BOOLEAN DEFAULT false,
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
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  placeholder TEXT,
  options JSONB,
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
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_category_fields_category_id ON category_fields(category_id);
CREATE INDEX idx_category_fields_order ON category_fields(category_id, order_index);
CREATE INDEX idx_category_items_category_id ON category_items(category_id);
CREATE INDEX idx_category_items_user_id ON category_items(user_id);
CREATE INDEX idx_category_items_data ON category_items USING GIN(data);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_items ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies
CREATE POLICY "Users can view own categories and templates" ON categories
  FOR SELECT USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_template = false);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id AND is_template = false);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id AND is_template = false);

-- Category Fields RLS Policies
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

-- Category Items RLS Policies
CREATE POLICY "Users can view own items" ON category_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own items" ON category_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON category_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON category_items
  FOR DELETE USING (auth.uid() = user_id);
