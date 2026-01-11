# Database Migrations

Run these migrations in numerical order using the Supabase SQL Editor.

## Migration Files

| # | File | Description |
|---|------|-------------|
| 1 | `001_initial_schema.sql` | Core tables, indexes, and RLS for media tables |
| 2 | `002_custom_categories.sql` | Custom category templates, fields, and RLS |
| 3 | `003_user_profiles.sql` | Profiles table, triggers, and RLS for username support |
| 4 | `004_cover_images.sql` | Cover image columns and storage policy notes |
| 5 | `005_search_optimization.sql` | GIN indexes and search helper functions |

## Instructions

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Paste each file's contents and click **Run**
4. Verify changes in **Table Editor** after each step
