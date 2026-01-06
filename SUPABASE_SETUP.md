# Supabase Setup Guide

This guide will walk you through setting up Supabase for the StoryVerse application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Click **"New Project"**
3. Choose your organization (or create one)
4. Enter project details:
   - **Name**: StoryVerse (or any name you prefer)
   - **Database Password**: Choose a strong password (save it somewhere safe!)
   - **Region**: Choose the region closest to you
5. Click **"Create new project"** and wait 1-2 minutes for it to provision

## 2. Get Your API Credentials

1. In your Supabase project dashboard, click on **Settings** (gear icon) in the left sidebar
2. Click **API** under "Configuration"
3. You'll see:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon/public**: Copy this key
4. Save these values - you'll need them for your `.env` file

## 3. Create Database Tables

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Copy and paste the SQL below
4. Click **"Run"** or press `Ctrl/Cmd + Enter`

```sql
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
```

## 4. Verify Setup

1. After running the SQL, click on **Table Editor** in the left sidebar
2. You should see 4 tables: `books`, `manga`, `anime`, `movies`
3. Click on each table to verify the columns are correct

## 5. Configure Your App

1. In your project directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace with your actual values:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 6. Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Create a test account
4. You should be able to log in successfully!

## Security Notes

✅ **Row Level Security (RLS)** is enabled on all tables - this means users can only see and modify their own data

✅ **Foreign key constraints** ensure data integrity - when a user is deleted, their data is automatically removed

✅ **The anon key is safe to expose** in your client code because RLS policies protect the data

## Troubleshooting

### Issue: "relation 'auth.users' does not exist"
- **Solution**: Make sure you're running the SQL in your Supabase project, not a local database

### Issue: "permission denied for table"
- **Solution**: Make sure RLS is enabled and policies are created correctly. Re-run the policy SQL.

### Issue: "Failed to fetch"
- **Solution**: Check that your `.env` file has the correct Supabase URL and anon key

## Next Steps

Once Supabase is set up, you're ready to:
1. Run the development server: `npm run dev`
2. Create an account on the login page
3. Start tracking your media!

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com/)
