-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  completed BOOLEAN DEFAULT false,
  date_started DATE,
  date_completed DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Manga table
CREATE TABLE manga (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  chapter INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  link TEXT,
  date_started DATE,
  date_completed DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anime table
CREATE TABLE anime (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  season INTEGER DEFAULT 1,
  episode INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  link TEXT,
  date_started DATE,
  date_completed DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date_watched DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX books_user_id_idx ON books(user_id);
CREATE INDEX manga_user_id_idx ON manga(user_id);
CREATE INDEX anime_user_id_idx ON anime(user_id);
CREATE INDEX movies_user_id_idx ON movies(user_id);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Books Policies
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);

-- Manga Policies
CREATE POLICY "Users can view own manga" ON manga
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manga" ON manga
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manga" ON manga
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own manga" ON manga
  FOR DELETE USING (auth.uid() = user_id);

-- Anime Policies
CREATE POLICY "Users can view own anime" ON anime
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own anime" ON anime
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own anime" ON anime
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own anime" ON anime
  FOR DELETE USING (auth.uid() = user_id);

-- Movies Policies
CREATE POLICY "Users can view own movies" ON movies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movies" ON movies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movies" ON movies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own movies" ON movies
  FOR DELETE USING (auth.uid() = user_id);
