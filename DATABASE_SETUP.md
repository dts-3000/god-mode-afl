# Database Setup Guide - Supabase

## Supabase Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Click **"Start your project"** (or "New Project" if you have an account)
3. **Sign in** with GitHub/Email
4. Click **"New Project"**
5. Enter:
   - **Name:** god-mode-afl
   - **Database Password:** (create a strong password - save it!)
   - **Region:** Choose closest to you
6. Click **"Create new project"** (takes ~2 minutes)

### 2. Run Database Schema
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the editor
5. Click **"Run"** (bottom right)
6. You should see: "Success. No rows returned"

### 3. Get API Keys
1. Go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (under "Project API keys")

### 4. Add to Vercel
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add two variables:
   - **Name:** `SUPABASE_URL` → **Value:** (paste Project URL)
   - **Name:** `SUPABASE_ANON_KEY` → **Value:** (paste anon key)
4. Click **Save**

### 5. Deploy
```bash
git add .
git commit -m "Add Supabase database"
git push
```

Vercel will auto-redeploy with Supabase connected!

---

## Database Tables

Your schema creates:
- **users** - User accounts
- **squads** - Fantasy squads
- **squad_players** - Players in each squad (18 per squad)
- **match_stats** - Match information (Round, Teams)
- **player_stats** - Player statistics per match
- **squad_player_stats** - Stats linked to squad players

---

## Free Tier Limits

Supabase Free Tier:
- ✅ **500 MB database** storage
- ✅ **Unlimited** API requests
- ✅ **Auto backups** (7 days)
- ✅ **Perfect for this app!**

---

## Local Development

For local testing, create `.env.local`:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Then run:
```bash
cd api
npm install
npm run dev
```

---

## Viewing Your Data

1. Go to Supabase dashboard
2. Click **Table Editor** (left sidebar)
3. Select any table to view/edit data
4. Real-time updates as your app runs!

---

## Migration from File-Based

The app currently uses `data.json` for storage.
Once Supabase is connected, the database will take over automatically.
Your old data stays in `data.json` as backup.

---

## Troubleshooting

**"Error: Invalid API key"**
- Double-check you copied the anon public key, not the service role key

**"Error: relation does not exist"**
- Make sure you ran the schema.sql in SQL Editor

**Local development not working?**
- Check `.env.local` has correct URL and key
- Make sure @supabase/supabase-js is installed: `npm install`

