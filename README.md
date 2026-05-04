# 🏈 God Mode AFL - No Database Edition

**Unlimited AFL Fantasy Game with ZERO database setup!**

Run on your local machine, push to GitHub, deploy to Vercel in minutes.

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Clone repo
git clone https://github.com/YOUR_USERNAME/god-mode-afl.git
cd god-mode-afl

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev

# 4. Visit http://localhost:5173
```

## 🚀 Deploy to Vercel

```bash
# 1. Push to GitHub
git push

# 2. Connect to Vercel
# Go to vercel.com → New Project → Import from GitHub

# 3. Deploy!
# Vercel handles everything automatically
```

## 📊 Your Custom Scoring System

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
- **Captain = 2x multiplier**

## ✨ What's Included

✅ 22-player squad selection (unlimited picks)
✅ Captain system with 2x points
✅ Real-time scoring calculations
✅ Squad management interface
✅ Leaderboard & rankings
✅ Admin panel for player management
✅ No database needed!
✅ 5 sample AFL players pre-loaded

## 🎯 Features

- Build unlimited squads
- Select 22 players per squad
- Pick captain (2x points)
- Track scores in real-time
- View leaderboards
- Manage players (admin)
- All data saved to file
- Works with Vercel

## 📁 Folder Structure

```
├── frontend/        # React app
├── api/            # Node.js API (no database!)
├── data.json       # Auto-created data backup
└── [config files]
```

## 💾 Data Storage

- **In-Memory:** Fast access while running
- **File Backup:** Auto-saves to `data.json` every minute
- **Persistent:** Data loads from file on restart
- **Safe:** Version control `data.json` in Git

## 🌐 Deploy Steps

1. Create GitHub repo
2. Push all files
3. Go to vercel.com
4. Click "New Project"
5. Select "Import from Git"
6. Choose your repository
7. Click Deploy
8. Done! 🎉

Vercel automatically detects your setup and deploys.

## 🆘 Troubleshooting

**Port in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Module not found:**
```bash
npm install
```

**Need MongoDB later?**
Easy! Just swap the API file when you're ready to scale.

## 📞 Support

All files are ready to deploy. No additional setup needed.

For more info, see files in root directory.

---

**God Mode AFL v1.0 | No Database | Vercel Ready** 🚀⚡
