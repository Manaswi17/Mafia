# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to you)
3. Wait for the project to finish setting up (takes ~2 minutes)

### Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** (or press Ctrl+Enter)

### Enable Real-time
1. Go to **Database** → **Replication** in Supabase dashboard
2. Enable replication for these tables:
   - `games`
   - `players`
   - `actions`

### Get API Keys
1. In your Supabase dashboard, click **Settings** (⚙️ icon in left sidebar)
2. Click **API** in the settings menu
3. You'll see two things to copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`) → This is `VITE_SUPABASE_URL`
     - If not visible here, find it in Settings → General
   - **Publishable key** (starts with `sb_publishable_...`) → This is `VITE_SUPABASE_ANON_KEY`
     - Located in the "Publishable key" section at the top
   - ⚠️ **Important:** Use the **Publishable key**, NOT any key from the "Secret keys" section!

**See `HOW_TO_GET_API_KEYS.md` for detailed step-by-step instructions with screenshots guide.**

## 3. Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**OR** edit `src/lib/supabase.js` directly and replace:
- `YOUR_SUPABASE_URL` with your project URL
- `YOUR_SUPABASE_ANON_KEY` with your anon key

## 4. Run the App

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 5. Test the Game

1. Open the app in multiple browser tabs/windows (or on different devices)
2. Create a room in one tab
3. Join the same room in other tabs using the room code
4. Once 4+ players join, the creator can start the game
5. The randomly assigned God will see the special dashboard

## Troubleshooting

### Real-time not working?
- Make sure you enabled replication in Supabase dashboard
- Check browser console for errors
- Verify your API keys are correct

### Can't create/join rooms?
- Check that the database schema was created successfully
- Verify RLS policies are set to allow all (for testing)
- Check Supabase logs for errors

### Actions not syncing?
- Ensure real-time is enabled for all three tables
- Check that actions are being inserted into the database
- Verify God is confirming actions

## Production Notes

For production deployment:
1. Set up proper RLS policies (restrict access appropriately)
2. Add authentication if needed
3. Deploy to Vercel, Netlify, or similar
4. Update environment variables in your hosting platform

