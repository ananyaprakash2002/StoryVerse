# Deploying StoryVerse to Vercel

## Prerequisites

- GitHub account
- Vercel account (free at [vercel.com](https://vercel.com))
- Supabase project set up (see [SETUP.md](./SETUP.md))

## Deploy via Vercel Dashboard (Recommended)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - StoryVerse media tracker"
git remote add origin https://github.com/YOUR_USERNAME/StoryVerse.git
git branch -M main
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Select your `StoryVerse` repository
4. Click **"Import"**

### 3. Configure

- **Framework Preset**: SvelteKit (auto-detected)
- **Root Directory**: `./`
- **Build Command**: `npm run build`

### 4. Add Environment Variables

Click **"Environment Variables"** and add:
```
VITE_SUPABASE_URL = your_supabase_url_here
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key_here
```

### 5. Deploy

Click **"Deploy"** - your app will be live in 1-2 minutes!

## Automatic Deployments

Every push to `main` triggers automatic deployment within 1-2 minutes.

## Custom Domain (Optional)

1. Go to Project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Managing Environment Variables

**Via Dashboard**: Project Settings → Environment Variables → Add/Update → Redeploy

**Via CLI**:
```bash
npm install -g vercel
vercel env add VARIABLE_NAME
vercel --prod
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing environment variables" | Add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| TypeScript errors | Run `npm run check` locally and fix errors |
| "Failed to fetch" | Verify environment variables are correct |
| "Not authenticated" | Check Supabase RLS policies |

## Cost

✅ **Completely Free** with Vercel's free tier:
- Unlimited deployments
- Automatic HTTPS
- 100GB bandwidth/month
- Custom domains

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
