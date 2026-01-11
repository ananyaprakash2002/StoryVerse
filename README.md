# StoryVerse - Personal Media Tracker

A beautiful, modern web application for tracking your books, manga, anime, movies, and any custom media categories. Built with SvelteKit and Supabase.

## ✨ Features

### Custom Categories
- 📚 **Templates**: Pre-built templates for Books, Movies, Anime, and Manga
- 🎨 **Fully Customizable**: Create your own categories with custom fields, icons, and colors
- 📋 **Flexible Fields**: Support for text, numbers, dates, ratings, tags, URLs, and more

### Dashboard & Analytics
- 📊 **Analytics Dashboard**: View statistics, trends, and insights across all your media
- 📈 **Time Series Charts**: Track your activity over time (7d, 30d, 90d, 1y)
- 🏆 **Category Distribution**: See how your collection is distributed
- ⭐ **Rating Analysis**: Visualize your rating patterns

### Search & Discovery
- 🔍 **Global Search**: Search across all categories with instant results
- 🏷️ **Filter & Sort**: Filter by category, status, rating, and more
- 📜 **Recent Searches**: Quick access to your search history

### User Experience
- 🌙 **Dark/Light Theme**: Toggle between themes with system preference detection
- 📱 **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- ✨ **Modern UI**: Glassmorphism effects and smooth animations
- 🖼️ **Cover Images**: Add cover images to your tracked items

### Security
- 🔐 **Authentication**: Secure user accounts with Supabase Auth
- 🛡️ **Row Level Security**: Users can only access their own data
- 👤 **User Profiles**: Customizable usernames

## 🚀 Tech Stack

- **Frontend**: SvelteKit 2 + TypeScript + Svelte 5
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Charts**: Chart.js
- **Styling**: Custom CSS with design tokens
- **Hosting**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account (free at [supabase.com](https://supabase.com))
- A Vercel account for deployment (free at [vercel.com](https://vercel.com))

## 🛠️ Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/StoryVerse.git
cd StoryVerse
npm install
```

### 2. Set Up Supabase

See [docs/SETUP.md](docs/SETUP.md) for detailed Supabase configuration and database migrations.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_BOOKS_API_KEY=your-google-api-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
src/
├── routes/              # SvelteKit file-based routing
│   ├── +page.svelte     # Dashboard
│   ├── analytics/       # Analytics dashboard
│   ├── categories/      # Category management
│   ├── search/          # Global search
│   └── login/           # Authentication
├── lib/
│   ├── components/      # Reusable UI components
│   │   ├── analytics/   # Charts and insights
│   │   ├── category/    # Category-related UI
│   │   ├── common/      # Buttons, inputs, modals
│   │   └── layout/      # Navigation, sidebar
│   ├── services/        # API/database layer
│   ├── stores/          # Global state (theme, UI, user)
│   ├── types/           # TypeScript definitions
│   └── utils/           # Utility functions
└── app.css              # Global styles and design tokens
```

## 🚢 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel deployment instructions.

## 📝 Database Migrations

Run migrations in order from [docs/migrations/](docs/migrations/):

1. `001_initial_schema.sql` - Core tables
2. `002_custom_categories.sql` - Custom categories
3. `003_user_profiles.sql` - User profiles
4. `004_cover_images.sql` - Cover image support
5. `005_search_optimization.sql` - Full-text search

## 🎨 Customization

Design tokens are defined in `src/app.css`. Customize:
- Colors and themes
- Typography
- Spacing and layout
- Shadows and effects

## 📄 License

MIT License

---

Made with ❤️ using SvelteKit and Supabase
