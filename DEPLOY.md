# How to Deploy the Mafia Game

## Quick Deploy to Vercel (Recommended - Free)

### Step 1: Prepare Your Code
1. Make sure your `.env` file is set up with Supabase credentials
2. **Important:** Don't commit `.env` to git - Vercel will handle environment variables

### Step 2: Push to GitHub
1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/mafia-game.git
   git push -u origin main
   ```

### Step 3: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add Environment Variables:
   - Click **"Environment Variables"**
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
7. Click **"Deploy"**
8. Wait 2-3 minutes
9. Your app will be live at `https://your-project.vercel.app`

### Step 4: Test
- Share the Vercel URL with friends
- Or open it in multiple browser tabs yourself
- Each tab = one player

## Alternative: Deploy to Netlify

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up/login with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Select your GitHub repository
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **"Show advanced"** → **"New variable"**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
7. Click **"Deploy site"**
8. Your app will be live at `https://your-project.netlify.app`

## Important Notes

### Environment Variables
- **Never commit** `.env` file to GitHub
- Add environment variables in Vercel/Netlify dashboard
- They will be available to your app at build time

### Supabase Configuration
- Make sure your Supabase project allows connections from your domain
- Free tier Supabase works fine for this
- No additional configuration needed

### Testing After Deployment
1. Open the deployed URL
2. Create a room
3. Share the room code with others
4. Or open multiple tabs yourself

## Troubleshooting

**Build fails?**
- Check that all environment variables are set in Vercel/Netlify
- Make sure `package.json` has all dependencies

**Can't connect to Supabase?**
- Verify environment variables are correct
- Check Supabase dashboard for any errors
- Make sure real-time is enabled

**App works locally but not deployed?**
- Environment variables might not be set correctly
- Check browser console for errors
- Verify Supabase URL and key are correct

