# StoryVerse - Media Tracker

A beautiful, modern web application for tracking your books, manga, anime, and movies. Built with SvelteKit and Supabase, deployed on Vercel for free.

## ✨ Features

- 📚 **Books**: Track title, author, reading progress, and completion status
- 📖 **Manga**: Monitor chapters, completion status, and website links
- 🎬 **Anime**: Keep tabs on episodes, seasons, and streaming links
- 🎥 **Movies**: Log watched movies with dates
- 📊 **Dashboard**: View statistics and recent activity across all media
- 🔐 **Authentication**: Secure user accounts with Supabase Auth
- 📱 **Responsive**: Works beautifully on desktop, tablet, and mobile
- 🎨 **Modern UI**: Dark theme with glassmorphism and smooth animations

## 🚀 Tech Stack

- **Frontend**: SvelteKit + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Auto-generated API)
- **Styling**: Custom CSS with design tokens
- **Hosting**: Vercel (free tier)
- **Database**: Supabase PostgreSQL (free tier)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account (free at [supabase.com](https://supabase.com))
- A Vercel account (free at [vercel.com](https://vercel.com))

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd /Users/ananyaprakash/Repos/StoryVerse
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to **Project Settings** → **API**
3. Copy your **Project URL** and **anon/public** key
4. In the Supabase dashboard, go to the **SQL Editor**
5. Run the SQL commands from `SUPABASE_SETUP.md` to create tables and policies

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
src/
├── routes/              # Pages (SvelteKit file-based routing)
│   ├── +layout.svelte   # Root layout with auth guard
│   ├── +page.svelte     # Dashboard
│   ├── login/           # Authentication page
│   ├── books/           # Books management
│   ├── manga/           # Manga management
│   ├── anime/           # Anime management
│   └── movies/          # Movies management
├── lib/
│   ├── components/      # Reusable UI components
│   ├── services/        # API/database layer
│   ├── stores/          # Global state management
│   ├── types/           # TypeScript type definitions
│   ├── supabase/        # Supabase client configuration
│   └── utils/           # Utility functions
└── app.css              # Global styles and design tokens
```

## 🚢 Deployment to Vercel

### Option 1: One-Click Deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Option 2: Command Line

```bash
npm install -g vercel
vercel
```

Follow the prompts and add your environment variables when asked.

## 🔒 Security

- **Row Level Security (RLS)**: All database tables have RLS policies ensuring users can only access their own data
- **Authentication**: Handled by Supabase Auth with secure session management
- **API Keys**: Never exposed in client code; only public anon key is used (which is safe with RLS)

## 📝 Usage

1. **Sign Up**: Create an account on the login page
2. **Add Media**: Navigate to any section (Books, Manga, Anime, Movies) and click "Add New"
3. **Track Progress**: Update progress, mark items as completed
4. **View Dashboard**: See your overall statistics and recent activity

## 🎨 Customization

The design system is defined in `src/app.css` using CSS custom properties. You can easily customize:

- Colors (theme, accents)
- Typography
- Spacing
- Border radius
- Shadows and effects

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

This is a personal project, but feel free to fork and adapt it for your needs!

## 💡 Future Enhancements

- [ ] Search and filter functionality
- [ ] Export data to CSV/JSON
- [ ] Dark/light theme toggle
- [ ] Integration with external APIs (MyAnimeList, Goodreads, etc.)
- [ ] Statistics and analytics visualizations
- [ ] Tags and custom categories

---

Made with ❤️ using SvelteKit and Supabase
