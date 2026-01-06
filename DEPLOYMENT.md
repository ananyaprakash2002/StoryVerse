# Deploying StoryVerse to Vercel

This guide will walk you through deploying your StoryVerse application to Vercel for free.

## Prerequisites

- A GitHub account
- A Vercel account (sign up at [vercel.com](https://vercel.com) - it's free!)
- Your Supabase project set up (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))

## Step 1: Push Your Code to GitHub

1. **Initialize Git repository** (if not already done):
   ```bash
   cd /Users/ananyaprakash/Repos/StoryVerse
   git init
   git add .
   git commit -m "Initial commit - StoryVerse media tracker"
   ```

2. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new)
   - Name it `StoryVerse` (or any name you prefer)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/StoryVerse.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign Up" or "Log In" (you can use your GitHub account)

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Find and select your `StoryVerse` repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vercel should auto-detect it as "SvelteKit" ✅
   - **Root Directory**: Leave as `./` (root)
   - **Build Command**: `npm run build` (already set)
   - **Output Directory**: `.svelte-kit` (already set)

4. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add the following variables:
     ```
     VITE_SUPABASE_URL = your_supabase_url_here
     VITE_SUPABASE_ANON_KEY = your_supabase_anon_key_here
     ```
   - Get these values from your Supabase project dashboard:
     - Go to **Settings** → **API**
     - Copy **Project URL** and **anon/public key**

5. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes for the build to complete
   - 🎉 Your app is live!

### Option 2: Deploy via CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd /Users/ananyaprakash/Repos/StoryVerse
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? (Select your account)
   - Link to existing project? **N**
   - Project name? **StoryVerse** (or press Enter)
   - In which directory? **./** (press Enter)
   - Auto-detected SvelteKit? **Y**
   - Override settings? **N**

5. **Add environment variables**:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```
   Paste your values when prompted.

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Step 3: Verify Your Deployment

1. **Visit your app**:
   - Vercel will give you a URL like: `https://story-verse-xyz.vercel.app`
   - Open it in your browser

2. **Test functionality**:
   - ✅ Sign up for a new account
   - ✅ Add a book, manga, anime, or movie
   - ✅ Edit and delete items
   - ✅ Check the dashboard
   - ✅ Sign out and sign back in

## Step 4: Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project → **Settings** → **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

## Automatic Deployments

🚀 **Great news!** Every time you push to the `main` branch on GitHub, Vercel will automatically:
- Build your app
- Run tests
- Deploy the new version

This happens within 1-2 minutes of your push!

## Environment Variables Management

### Adding New Variables

**Via Dashboard**:
1. Go to your project in Vercel
2. **Settings** → **Environment Variables**
3. Add the variable
4. Redeploy to apply changes

**Via CLI**:
```bash
vercel env add VARIABLE_NAME
```

### Updating Variables

1. Remove the old variable
2. Add the new one
3. Redeploy

## Troubleshooting

### Build Failed

**Issue**: Build fails with "Missing environment variables"
- **Solution**: Make sure you've added both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel

**Issue**: Build fails with TypeScript errors
- **Solution**: Run `npm run check` locally to see the errors and fix them

### Runtime Errors

**Issue**: "Failed to fetch" errors
- **Solution**: Check that your Supabase environment variables are correct in Vercel

**Issue**: "Not authenticated" errors
- **Solution**: Verify your Supabase RLS policies are set up correctly

**Issue**: Can't see data across devices
- **Solution**: Make sure you're using the same login credentials on all devices

## Monitoring Your App

1. **Analytics**:
   - Vercel provides free analytics
   - Go to your project → **Analytics** tab

2. **Logs**:
   - View real-time logs in the **Deployments** tab
   - Click on any deployment → **Functions** tab

## Updating Your App

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. Vercel automatically deploys the changes!

## Cost

✅ **Completely Free!**
- Vercel Free tier includes:
  - Unlimited deployments
  - Automatic HTTPS
  - 100GB bandwidth/month
  - 100 hours of build time/month
  - Custom domains

This is more than enough for personal projects!

## Next Steps

- Share your app URL with friends!
- Access it from any device with a browser
- Your data syncs across all devices via Supabase

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Congratulations!** 🎉 Your StoryVerse app is now live and accessible from anywhere!
