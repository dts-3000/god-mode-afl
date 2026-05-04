# 🚀 God Mode AFL - Deployment Guide

## Quick Deploy to Vercel (5 Minutes)

### Step 1: Push to GitHub

```bash
# Create GitHub repo first at github.com

cd god-mode-afl-no-db

git init
git add .
git commit -m "Initial commit - God Mode AFL"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/god-mode-afl.git
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm i -g vercel
vercel
# Follow prompts
# Select your GitHub repo
# Click Deploy
```

**Option B: Using Vercel Dashboard**
1. Go to vercel.com
2. Click "New Project"
3. Click "Import Git Repository"
4. Select your `god-mode-afl` repo
5. Click "Deploy"

That's it! 🎉

## After Deployment

Your app will be live at: `https://your-project-name.vercel.app`

The backend API runs on the same domain automatically.

## Environment Variables (Vercel)

You don't need any! This version has NO database.

Optional:
- `PORT=3000` (usually not needed on Vercel)
- `NODE_ENV=production` (auto-set by Vercel)

## Local Testing Before Deploy

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

## Vercel Project Structure

Vercel automatically:
- ✅ Builds frontend to `dist/`
- ✅ Runs backend API
- ✅ Routes `/api` to backend
- ✅ Serves frontend for all other routes

Perfect for no-database setup!

## Troubleshooting

**API calls fail?**
- Check that backend is running
- Ensure API URL is correct
- Check Vercel logs: `vercel logs`

**Data not persisting?**
- Check `/health` endpoint: `https://your-domain.vercel.app/api/health`
- Should show file-based storage active

**Frontend not loading?**
- Check Vercel logs
- Run `npm run build` locally to test

## Production Notes

- Data saves to `data.json` automatically
- File persists between deployments
- Back up `data.json` occasionally
- Optional: Back up to GitHub via git
- Optional: Add S3 backup for safety

## Scaling Later

When you grow:
1. Create MongoDB Atlas account
2. Get connection string
3. Swap API implementation
4. Add `MONGODB_URI` env var to Vercel
5. No frontend changes needed!

---

**Your God Mode is now live!** 🏈⚡

Visit: `https://your-project-name.vercel.app`
