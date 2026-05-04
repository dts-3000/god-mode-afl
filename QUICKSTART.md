# 🏈 God Mode AFL - Quick Start

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```

Open: http://localhost:5173

### 3. Test It Works
- Click "New Squad"
- Create a squad
- Click "Edit Squad"
- Add 22 players
- Select a captain
- Save!

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free)

### Steps

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push
```

2. **Go to vercel.com**
3. **Click "New Project"**
4. **Import your GitHub repo**
5. **Click "Deploy"**

Done! Your app is live. 🎉

## 📊 Your Custom Scoring

- Handball = 2 pts
- Kick = 3 pts
- Mark = 3 pts
- Tackle = 4 pts
- Hit Out = 1 pt
- Goal = 6 pts
- Behind = 1 pt
- Clearance = 3 pts
- Inside 50 = 2 pts
- Goal Assist = 2 pts
- Captain = 2x multiplier

## 💾 Data Storage

- **Automatic:** Saves to `data.json` every minute
- **Persistent:** Data loads on server restart
- **Simple:** No database needed!

## 📁 Project Structure

```
├── api/              # Node.js backend
│   └── index.js     # API server (no DB!)
├── frontend/        # React app
│   └── src/         # Pages & components
├── data.json        # Auto-created data file
└── package.json     # Root config
```

## 🎯 Features

✅ 22-player squad selection (unlimited!)
✅ Captain system (2x points)
✅ Real-time scoring
✅ Player management
✅ Leaderboards
✅ Admin panel
✅ No database needed
✅ Works on Vercel

## 🔧 Environment

Create `.env` (optional):
```
PORT=3000
NODE_ENV=development
```

## ❓ Need Help?

- See DEPLOY.md for deployment steps
- See README.md for features
- Check `/health` endpoint to verify API working

## 🎉 You're Ready!

Your God Mode is ready to:
1. Run locally
2. Push to GitHub
3. Deploy to Vercel

Let's go! ⚡
