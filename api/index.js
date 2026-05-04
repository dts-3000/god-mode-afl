import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'god-mode-afl-secret-key-2025';

app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY DATABASE (NO MongoDB NEEDED!)
// ============================================

let DATABASE = {
  players: [],
  squads: [],
  scores: {},
  admins: [],
  liveMatches: []
};

// Load data from file on startup
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      DATABASE = JSON.parse(data);
      console.log('✅ Data loaded from file');
    } else {
      DATABASE.players = initializeSamplePlayers();
      saveData();
      console.log('✅ Sample data created');
    }
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DATABASE, null, 2));
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

// Initialize sample AFL players
function initializeSamplePlayers() {
  return [
    {
      id: 1,
      aflId: 'marcus-bontempelli',
      firstName: 'Marcus',
      lastName: 'Bontempelli',
      position: 'Midfielder',
      teamId: 'wd',
      teamName: 'Western Bulldogs',
      status: 'ACTIVE',
      seasonStats: { totalPoints: 450 }
    },
    {
      id: 2,
      aflId: 'dustin-martin',
      firstName: 'Dustin',
      lastName: 'Martin',
      position: 'Midfielder',
      teamId: 'rich',
      teamName: 'Richmond',
      status: 'ACTIVE',
      seasonStats: { totalPoints: 380 }
    },
    {
      id: 3,
      aflId: 'patrick-cripps',
      firstName: 'Patrick',
      lastName: 'Cripps',
      position: 'Midfielder',
      teamId: 'carl',
      teamName: 'Carlton',
      status: 'ACTIVE',
      seasonStats: { totalPoints: 420 }
    },
    {
      id: 4,
      aflId: 'tom-mitchell',
      firstName: 'Tom',
      lastName: 'Mitchell',
      position: 'Midfielder',
      teamId: 'haw',
      teamName: 'Hawthorn',
      status: 'ACTIVE',
      seasonStats: { totalPoints: 500 }
    },
    {
      id: 5,
      aflId: 'shai-bolton',
      firstName: 'Shai',
      lastName: 'Bolton',
      position: 'Small Forward',
      teamId: 'rich',
      teamName: 'Richmond',
      status: 'ACTIVE',
      seasonStats: { totalPoints: 390 }
    }
  ];
}

// ============================================
// PLAYERS ENDPOINTS
// ============================================

app.get('/api/players', (req, res) => {
  res.json({
    total: DATABASE.players.length,
    players: DATABASE.players
  });
});

app.get('/api/players/:aflId', (req, res) => {
  const player = DATABASE.players.find(p => p.aflId === req.params.aflId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  res.json(player);
});

// ============================================
// ADMIN - PLAYER IMPORT (CSV)
// ============================================

app.post('/api/admin/import-players', (req, res) => {
  const { players } = req.body;

  if (!Array.isArray(players)) {
    return res.status(400).json({ error: 'Players must be an array' });
  }

  // Add or replace players
  for (const newPlayer of players) {
    const existing = DATABASE.players.findIndex(p => p.aflId === newPlayer.aflId);
    if (existing >= 0) {
      // Update existing
      DATABASE.players[existing] = { ...DATABASE.players[existing], ...newPlayer };
    } else {
      // Add new
      DATABASE.players.push(newPlayer);
    }
  }

  saveData();
  res.json({ message: `Imported ${players.length} players`, count: DATABASE.players.length });
});

app.post('/api/players', (req, res) => {
  const { aflId, firstName, lastName, position, teamId, teamName } = req.body;

  if (DATABASE.players.some(p => p.aflId === aflId)) {
    return res.status(409).json({ error: 'Player already exists' });
  }

  const player = {
    id: DATABASE.players.length + 1,
    aflId,
    firstName,
    lastName,
    position,
    teamId,
    teamName,
    status: 'ACTIVE',
    seasonStats: { totalPoints: 0 }
  };

  DATABASE.players.push(player);
  saveData();
  res.status(201).json(player);
});

app.put('/api/players/:aflId', (req, res) => {
  const player = DATABASE.players.find(p => p.aflId === req.params.aflId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  Object.assign(player, req.body);
  saveData();
  res.json(player);
});

app.delete('/api/players/:aflId', (req, res) => {
  const index = DATABASE.players.findIndex(p => p.aflId === req.params.aflId);
  if (index === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }

  DATABASE.players[index].status = 'DELISTED';
  saveData();
  res.json({ message: 'Player delisted' });
});

// ============================================
// SQUADS ENDPOINTS
// ============================================

app.get('/api/squads', (req, res) => {
  const { userId } = req.query;
  const squads = userId
    ? DATABASE.squads.filter(s => s.userId === userId)
    : DATABASE.squads;
  res.json(squads);
});

app.get('/api/squads/:squadId', (req, res) => {
  const squad = DATABASE.squads.find(s => s.id === req.params.squadId);
  if (!squad) {
    return res.status(404).json({ error: 'Squad not found' });
  }
  res.json(squad);
});

app.post('/api/squads', (req, res) => {
  const { userId, teamName, season } = req.body;

  const squad = {
    id: Date.now().toString(),
    userId,
    teamName,
    season: season || new Date().getFullYear(),
    players: [],
    currentRound: 1,
    seasonTotal: 0,
    roundTotal: 0,
    createdAt: new Date()
  };

  DATABASE.squads.push(squad);
  saveData();
  res.status(201).json(squad);
});

app.put('/api/squads/:squadId/players', (req, res) => {
  const { players } = req.body;

  if (!Array.isArray(players) || players.length !== 18) {
    return res.status(400).json({ error: 'Must have exactly 18 players (6 Def, 5 Mid, 1 Ruck, 6 Fwd)' });
  }

  const captainCount = players.filter(p => p.isCaptain).length;
  if (captainCount !== 1) {
    return res.status(400).json({ error: 'Must have exactly 1 captain' });
  }

  const squad = DATABASE.squads.find(s => s.id === req.params.squadId);
  if (!squad) {
    return res.status(404).json({ error: 'Squad not found' });
  }

  squad.players = players;
  squad.updatedAt = new Date();
  saveData();

  res.json({ message: 'Squad updated', squad });
});

app.put('/api/squads/:squadId/captain', (req, res) => {
  const { playerId } = req.body;

  const squad = DATABASE.squads.find(s => s.id === req.params.squadId);
  if (!squad) {
    return res.status(404).json({ error: 'Squad not found' });
  }

  squad.players.forEach(p => {
    if (p.isCaptain) p.isCaptain = false;
  });

  const newCaptain = squad.players.find(p => p.playerId === playerId);
  if (!newCaptain) {
    return res.status(404).json({ error: 'Player not in squad' });
  }

  newCaptain.isCaptain = true;
  squad.updatedAt = new Date();
  saveData();

  res.json({ message: 'Captain updated', captain: newCaptain });
});

app.delete('/api/squads/:squadId', (req, res) => {
  const index = DATABASE.squads.findIndex(s => s.id === req.params.squadId);
  if (index === -1) {
    return res.status(404).json({ error: 'Squad not found' });
  }

  DATABASE.squads.splice(index, 1);
  saveData();
  res.json({ message: 'Squad deleted' });
});

// ============================================
// SCORING ENDPOINTS
// ============================================

const SCORING_RULES = {
  handball: 2,
  kick: 3,
  mark: 3,
  tackle: 4,
  hitOut: 1,
  goal: 6,
  behind: 1,
  clearance: 3,
  inside50: 2,
  goalAssist: 2
};

app.post('/api/scores/calculate', (req, res) => {
  const { playerStats, isCaptain } = req.body;

  let points = 0;
  points += (playerStats.handballs || 0) * SCORING_RULES.handball;
  points += (playerStats.kicks || 0) * SCORING_RULES.kick;
  points += (playerStats.marks || 0) * SCORING_RULES.mark;
  points += (playerStats.tackles || 0) * SCORING_RULES.tackle;
  points += (playerStats.hitOuts || 0) * SCORING_RULES.hitOut;
  points += (playerStats.goals || 0) * SCORING_RULES.goal;
  points += (playerStats.behinds || 0) * SCORING_RULES.behind;
  points += (playerStats.clearances || 0) * SCORING_RULES.clearance;
  points += (playerStats.inside50s || 0) * SCORING_RULES.inside50;
  points += (playerStats.goalAssists || 0) * SCORING_RULES.goalAssist;

  if (isCaptain) {
    points *= 2;
  }

  res.json({
    points: Math.max(0, Math.round(points)),
    breakdown: {
      handballs: (playerStats.handballs || 0) * SCORING_RULES.handball,
      kicks: (playerStats.kicks || 0) * SCORING_RULES.kick,
      marks: (playerStats.marks || 0) * SCORING_RULES.mark,
      tackles: (playerStats.tackles || 0) * SCORING_RULES.tackle,
      goals: (playerStats.goals || 0) * SCORING_RULES.goal,
      clearances: (playerStats.clearances || 0) * SCORING_RULES.clearance,
      inside50s: (playerStats.inside50s || 0) * SCORING_RULES.inside50
    }
  });
});

// ============================================
// ADMIN AUTHENTICATION
// ============================================

// Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// JWT Middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  const admin = DATABASE.admins.find(a => a.username === username);
  if (!admin || admin.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, admin: { id: admin.id, username: admin.username } });
});

// Create default admin (on first load)
function initializeAdmin() {
  if (DATABASE.admins.length === 0) {
    DATABASE.admins.push({
      id: crypto.randomUUID(),
      username: 'admin',
      password: hashPassword('admin123'),
      createdAt: new Date()
    });
    saveData();
    console.log('✅ Default admin created (username: admin, password: admin123)');
  }
}

// ============================================
// PLAYER MANAGEMENT (ADMIN)
// ============================================

// Add/Update Player
app.post('/api/admin/players', authMiddleware, (req, res) => {
  const { firstName, lastName, position, teamName, teamId, jumperNumber, seasonStats } = req.body;
  
  const newPlayer = {
    id: crypto.randomUUID(),
    aflId: `${teamId}-${jumperNumber}`,
    firstName,
    lastName,
    position,
    teamName,
    teamId,
    jumperNumber,
    seasonStats: seasonStats || {},
    createdAt: new Date()
  };

  DATABASE.players.push(newPlayer);
  saveData();
  res.json({ message: 'Player added', player: newPlayer });
});

// Update Player Stats
app.put('/api/admin/players/:playerId/stats', authMiddleware, (req, res) => {
  const { playerId } = req.params;
  const stats = req.body;
  
  const player = DATABASE.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  player.seasonStats = { ...player.seasonStats, ...stats };
  saveData();
  res.json({ message: 'Stats updated', player });
});

// Delete Player
app.delete('/api/admin/players/:playerId', authMiddleware, (req, res) => {
  const { playerId } = req.params;
  DATABASE.players = DATABASE.players.filter(p => p.id !== playerId);
  saveData();
  res.json({ message: 'Player deleted' });
});

// ============================================
// LIVE MATCH MANAGEMENT
// ============================================

// Start Live Match
app.post('/api/admin/matches/start', authMiddleware, (req, res) => {
  const { matchId, homeTeam, awayTeam, round } = req.body;
  
  const match = {
    id: matchId || crypto.randomUUID(),
    homeTeam,
    awayTeam,
    round,
    status: 'LIVE',
    startedAt: new Date(),
    playerStats: {}
  };

  DATABASE.liveMatches.push(match);
  saveData();
  res.json({ message: 'Match started', match });
});

// Update Live Player Stats
app.put('/api/admin/matches/:matchId/player-stats', authMiddleware, (req, res) => {
  const { matchId } = req.params;
  const { playerId, stats } = req.body;
  
  const match = DATABASE.liveMatches.find(m => m.id === matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  if (!match.playerStats[playerId]) {
    match.playerStats[playerId] = {};
  }

  match.playerStats[playerId] = { ...match.playerStats[playerId], ...stats };
  saveData();
  res.json({ message: 'Player stats updated', stats: match.playerStats[playerId] });
});

// End Live Match
app.post('/api/admin/matches/:matchId/end', authMiddleware, (req, res) => {
  const { matchId } = req.params;
  
  const match = DATABASE.liveMatches.find(m => m.id === matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  match.status = 'FINISHED';
  match.endedAt = new Date();

  // Update player season stats with match stats
  for (const [playerId, stats] of Object.entries(match.playerStats)) {
    const player = DATABASE.players.find(p => p.id === playerId);
    if (player) {
      player.seasonStats = {
        handballs: (player.seasonStats?.handballs || 0) + (stats.handballs || 0),
        kicks: (player.seasonStats?.kicks || 0) + (stats.kicks || 0),
        marks: (player.seasonStats?.marks || 0) + (stats.marks || 0),
        tackles: (player.seasonStats?.tackles || 0) + (stats.tackles || 0),
        goals: (player.seasonStats?.goals || 0) + (stats.goals || 0),
        behinds: (player.seasonStats?.behinds || 0) + (stats.behinds || 0),
        hitOuts: (player.seasonStats?.hitOuts || 0) + (stats.hitOuts || 0),
        clearances: (player.seasonStats?.clearances || 0) + (stats.clearances || 0),
        inside50s: (player.seasonStats?.inside50s || 0) + (stats.inside50s || 0),
        goalAssists: (player.seasonStats?.goalAssists || 0) + (stats.goalAssists || 0)
      };
    }
  }

  saveData();
  res.json({ message: 'Match ended', match });
});

// Get Live Matches
app.get('/api/admin/matches', authMiddleware, (req, res) => {
  res.json({ matches: DATABASE.liveMatches });
});

// ============================================
// SQUAD MANAGEMENT (Team Name Updates)
// ============================================

// Update Squad Name
app.put('/api/squads/:squadId/name', (req, res) => {
  const { squadId } = req.params;
  const { teamName } = req.body;

  const squad = DATABASE.squads.find(s => s.id === squadId);
  if (!squad) {
    return res.status(404).json({ error: 'Squad not found' });
  }

  squad.teamName = teamName;
  squad.updatedAt = new Date();
  saveData();
  res.json({ message: 'Squad name updated', squad });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    storage: 'File-Based (No Database)',
    players: DATABASE.players.length,
    squads: DATABASE.squads.length,
    timestamp: new Date()
  });
});

// ============================================
// STARTUP
// ============================================

loadData();
initializeAdmin();

// Auto-save every 1 minute
setInterval(saveData, 60 * 1000);

const PORT = process.env.PORT || 3000;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 God Mode AFL running on port ${PORT}`);
    console.log(`💾 Using FILE-BASED storage (no database!)`);
    console.log(`✅ ${DATABASE.players.length} players loaded`);
    console.log(`📁 Data file: ${DATA_FILE}`);
  });
}

export default app;
