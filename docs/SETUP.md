# StoryVerse - Complete Setup Guide

This guide covers everything needed to set up StoryVerse from scratch.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free at [supabase.com](https://supabase.com))
- A Vercel account for deployment (free at [vercel.com](https://vercel.com))

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose your organization
4. Enter project details:
   - **Name**: StoryVerse
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"** and wait 1-2 minutes

## 2. Get API Credentials

1. In Supabase dashboard, click **Settings** (gear icon) → **API**
2. Copy:
   - **Project URL**: e.g., `https://xxxxx.supabase.co`
   - **anon/public key**: Your API key
3. Save these for your `.env` file

## 3. Run Database Migrations

Execute these SQL migrations **in order** from the SQL Editor:

1. `001_initial_schema.sql` - Core tables (books, manga, anime, movies)
2. `002_custom_categories.sql` - Custom categories system
3. `003_user_profiles.sql` - Username authentication
4. `004_cover_images.sql` - Cover image support
5. `005_search_optimization.sql` - Full-text search

See `/docs/migrations/README.md` for detailed instructions.

## 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 6. Verify Setup

1. **Table Editor**: You should see tables: `books`, `manga`, `anime`, `movies`, `categories`, `category_fields`, `category_items`, `profiles`
2. **Sign up**: Create a test account
3. **Test**: Add and view items

## Security Notes

✅ **Row Level Security (RLS)** - Users can only access their own data  
✅ **Foreign key constraints** - Automatic cleanup when users are deleted  
✅ **The anon key is safe to expose** - RLS policies protect data

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "relation 'auth.users' does not exist" | Run SQL in Supabase, not local database |
| "permission denied for table" | Re-run RLS policy SQL |
| "Failed to fetch" | Check `.env` has correct Supabase credentials |

## Need Help?

- [Supabase Docs](https://supabase.com/docs)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Supabase Discord](https://discord.supabase.com/)
