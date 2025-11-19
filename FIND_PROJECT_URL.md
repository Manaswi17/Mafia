# How to Find Your Supabase Project URL

## Method 1: Settings → General (Most Common)

1. In your Supabase dashboard, look at the **left sidebar**
2. Click on **"Settings"** (⚙️ gear icon)
3. Under **PROJECT SETTINGS**, click **"General"** (it's the first option)
4. On the General page, look for:
   - **"Reference ID"** section
   - Or **"Project URL"** section
5. You'll see a URL like: `https://abcdefghijklmnop.supabase.co`
6. **Copy this entire URL** - this is your `VITE_SUPABASE_URL`

## Method 2: Project Dashboard

1. When you first open your Supabase project, look at the **top of the page**
2. Sometimes the Project URL is displayed near the project name
3. It will look like: `https://xxxxx.supabase.co`

## Method 3: API Settings (Sometimes)

1. Go to **Settings → API Keys**
2. Scroll to the top of the page
3. Sometimes the Project URL is displayed there
4. If not visible, use Method 1 instead

## What It Looks Like

```
Settings → General

┌─────────────────────────────────────┐
│ Reference ID                         │
│ https://abcdefghijklmnop.supabase.co │
│ [📋 Copy]                           │
└─────────────────────────────────────┘
```

## Quick Steps

1. **Left Sidebar** → Click **Settings** (⚙️)
2. Under **PROJECT SETTINGS** → Click **General**
3. Find **Reference ID** or **Project URL**
4. Copy the URL (starts with `https://` and ends with `.supabase.co`)

## Still Can't Find It?

- Make sure you're inside your project (not the main Supabase dashboard)
- Check that your project has finished setting up
- The URL format is always: `https://[random-letters].supabase.co`

