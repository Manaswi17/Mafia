# How to Get Supabase API Keys

## Step-by-Step Guide

### Step 1: Create/Login to Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign in"**
3. Sign up with GitHub, Google, or email

### Step 2: Create a New Project
1. After logging in, click **"New Project"** (green button)
2. Fill in:
   - **Name**: Give your project a name (e.g., "Mafia Game")
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the closest region to you
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to finish setting up

### Step 3: Get Your API Keys
1. In your Supabase dashboard, look at the left sidebar
2. Click on **"Settings"** (gear icon at the bottom)
3. Click on **"API"** in the settings menu
4. You'll see a page with your API credentials

### Step 4: Copy the Values

On the API page, you'll see:

#### Project URL
- **Go to Settings → General** (in the left sidebar, under PROJECT SETTINGS)
- Look for **"Reference ID"** or **"Project URL"** section
- You'll see a URL that looks like: `https://xxxxxxxxxxxxx.supabase.co`
- Copy this entire URL
- This is your `VITE_SUPABASE_URL`

**Alternative:** Sometimes the Project URL is also shown at the top of your Supabase dashboard when you first open your project.

#### Publishable Key (Anon/Public Key)
- Look for the **"Publishable key"** section (at the top of the page)
- You'll see a key that starts with `sb_publishable_...`
- Click the **copy icon** (📋) next to the key to copy it
- This is your `VITE_SUPABASE_ANON_KEY`

**⚠️ Important:** 
- Use the **"Publishable key"** (starts with `sb_publishable_...`)
- Do NOT use any key from the **"Secret keys"** section (those start with `sb_secret_...`)
- Secret keys are for backend only and should NEVER be used in frontend code

## Visual Guide

```
Supabase Dashboard
├── Left Sidebar
│   └── Settings (⚙️ icon at bottom)
│       └── API
│           ├── Project URL ← Copy this
│           └── Project API keys
│               ├── anon/public ← Copy this one
│               └── service_role ← DON'T use this
```

## Example of What You'll See

```
Publishable key
┌─────────────────────────────────────┐
│ sb_publishable_26dgBL...            │
│ [📋 Copy]                            │
│ "This key is safe to use in browser"│
└─────────────────────────────────────┘
↑ Copy this one for VITE_SUPABASE_ANON_KEY

Secret keys
┌─────────────────────────────────────┐
│ NAME: default                        │
│ API KEY: sb_secret_zEkHD••••••••     │
│ [👁️ Show] [📋 Copy]                 │
│ ⚠️ Never expose this key            │
└─────────────────────────────────────┘
↑ DON'T use this (backend only)
```

## After Getting the Keys

1. Create a `.env` file in your project root
2. Add these lines:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_26dgBL...
```

**Note:** The key format may be `sb_publishable_...` (new format) or `eyJ...` (old JWT format). Both work the same way!

Replace with your actual values!

## Quick Checklist

- [ ] Created Supabase account
- [ ] Created a new project
- [ ] Went to Settings → API
- [ ] Copied Project URL
- [ ] Copied Publishable key (starts with `sb_publishable_...`, NOT secret keys)
- [ ] Created `.env` file with both values
- [ ] Started the app with `npm run dev`

## Troubleshooting

**Can't find the API section?**
- Make sure you're in your project (not the main dashboard)
- Look for "Settings" in the left sidebar (scroll down if needed)

**Key is hidden?**
- Click the eye icon (👁️) to reveal it
- Or click the copy icon (📋) to copy without revealing

**Project still setting up?**
- Wait a few more minutes
- Check the project status in the dashboard

