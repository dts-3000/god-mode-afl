import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data.json');

app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY DATABASE (NO MongoDB NEEDED!)
// ============================================

let DATABASE = {
  players: [],
  squads: [],
  scores: {},
  matchStats: {} // NEW: Store uploaded CSV stats
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

app.get('/api/squads', async (req, res) => {
  try {
    const { userId } = req.query;
    const squads = await db.getSquadsByUser(userId);
    
    // Get players for each squad
    const squadsWithPlayers = await Promise.all(
      squads.map(async (squad) => {
        const players = await db.getSquadPlayers(squad.id);
        return {
          id: squad.id,
          userId: squad.user_id,
          teamName: squad.team_name,
          season: squad.season,
          players: players.map(p => ({
            playerId: p.player_id,
            playerName: p.player_name,
            jumperNumber: p.jumper_number,
            position: p.position,
            teamId: p.team_id,
            teamName: p.team_name,
            isCaptain: p.is_captain,
            order: p.player_order
          })),
          createdAt: squad.created_at,
          updatedAt: squad.updated_at
        };
      })
    );
    
    res.json(squadsWithPlayers);
  } catch (err) {
    console.error('Error getting squads:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/squads/:squadId', async (req, res) => {
  try {
    const squad = await db.getSquad(req.params.squadId);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }
    
    const players = await db.getSquadPlayers(squad.id);
    
    res.json({
      id: squad.id,
      userId: squad.user_id,
      teamName: squad.team_name,
      season: squad.season,
      players: players.map(p => ({
        playerId: p.player_id,
        playerName: p.player_name,
        jumperNumber: p.jumper_number,
        position: p.position,
        teamId: p.team_id,
        teamName: p.team_name,
        isCaptain: p.is_captain,
        order: p.player_order
      })),
      createdAt: squad.created_at,
      updatedAt: squad.updated_at
    });
  } catch (err) {
    console.error('Error getting squad:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/squads', async (req, res) => {
  try {
    const { userId, teamName, season } = req.body;
    
    const squad = await db.createSquad(
      userId,
      teamName,
      season || new Date().getFullYear()
    );
    
    res.status(201).json({
      id: squad.id,
      userId: squad.user_id,
      teamName: squad.team_name,
      season: squad.season,
      players: [],
      createdAt: squad.created_at
    });
  } catch (err) {
    console.error('Error creating squad:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/squads/:squadId/players', async (req, res) => {
  try {
    const { players } = req.body;
    const { squadId } = req.params;

    console.log('Updating squad:', squadId, 'with', players?.length, 'players');

    if (!Array.isArray(players) || players.length !== 18) {
      return res.status(400).json({ error: 'Must have exactly 18 players (6 Def, 5 Mid, 1 Ruck, 6 Fwd)' });
    }

    const captainCount = players.filter(p => p.isCaptain).length;
    if (captainCount !== 1) {
      return res.status(400).json({ error: 'Must have exactly 1 captain' });
    }

    // Check squad exists
    const squad = await db.getSquad(squadId);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }

    // Save players to database
    await db.addPlayersToSquad(squadId, players);
    
    // If there are match stats, save those too
    const playersWithStats = players.filter(p => p.matchStats);
    if (playersWithStats.length > 0 && playersWithStats[0].matchId) {
      await db.saveSquadPlayerStats(squadId, playersWithStats[0].matchId, players);
    }

    res.json({ message: 'Squad updated', squad: { id: squadId, players } });
  } catch (err) {
    console.error('Error updating squad players:', err);
    res.status(500).json({ error: err.message });
  }
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
// SQUIGGLE API INTEGRATION (WITH PROPER HEADERS)
// ============================================

const SQUIGGLE_USER_AGENT = 'God Mode AFL Fantasy - contact: support@godmodeafl.com';

app.get('/api/matches', async (req, res) => {
  try {
    const response = await fetch('https://api.squiggle.com.au/?q=games;year=2026', {
      headers: {
        'User-Agent': SQUIGGLE_USER_AGENT,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    
    if (!data.games) {
      return res.json({ matches: [] });
    }

    // Format matches for display
    const matches = data.games.map(game => ({
      id: game.id,
      round: game.round,
      homeTeam: game.hteam,
      awayTeam: game.ateam,
      date: game.date,
      is_final: game.is_final,
      status: game.is_final ? 'FINISHED' : 'LIVE'
    }));

    res.json({ matches });
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.get('/api/player-stats/:matchId/:teamId', async (req, res) => {
  try {
    const { matchId, teamId } = req.params;
    
    console.log(`Fetching player stats for match ${matchId}, team ${teamId}`);
    
    const response = await fetch(`https://api.squiggle.com.au/?q=playerStats;gameId=${matchId};team=${teamId}`, {
      headers: {
        'User-Agent': SQUIGGLE_USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Squiggle API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: `Squiggle API returned ${response.status}`, stats: [] });
    }

    const data = await response.json();
    
    if (!data.playerStats) {
      console.log('No player stats in response');
      return res.json({ stats: [] });
    }

    // Format player stats - note: Squiggle uses 'number' for jumper number
    const stats = data.playerStats.map(ps => ({
      playerName: ps.player,
      jumperNumber: ps.number,
      handballs: ps.handballs || 0,
      kicks: ps.kicks || 0,
      marks: ps.marks || 0,
      tackles: ps.tackles || 0,
      goals: ps.goals || 0,
      behinds: ps.behinds || 0,
      hitOuts: ps.hitouts || 0,
      clearances: ps.clearances || 0,
      inside50s: ps.inside50s || 0,
      goalAssists: ps.goalassists || 0
    }));

    res.json({ stats });
  } catch (err) {
    console.error('Error fetching player stats:', err);
    res.status(500).json({ error: `Failed to fetch player stats: ${err.message}`, stats: [] });
  }
});

// ============================================
// EVENT API PROXY (For Live Scores)
// ============================================

app.get('/api/live-games', async (req, res) => {
  // Set up SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Fetch from Squiggle Event API with proper User-Agent
    const response = await fetch('https://sse.squiggle.com.au/games', {
      headers: {
        'User-Agent': SQUIGGLE_USER_AGENT,
        'Accept': 'text/event-stream'
      }
    });

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to connect to Squiggle' });
      return;
    }

    // Read the stream from Squiggle and forward to client
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      res.write(chunk);
    }

    res.end();
  } catch (err) {
    console.error('Error connecting to Squiggle Event API:', err);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ============================================
// CSV UPLOAD - CUSTOM MATCH STATS
// ============================================

app.get('/api/match-stats/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const matchData = await db.getMatchStats(matchId);
    
    if (!matchData) {
      return res.json({ stats: [] });
    }
    
    res.json({ stats: matchData.players || [] });
  } catch (err) {
    console.error('Error getting match stats:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/match-stats/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { stats } = req.body;

    if (!Array.isArray(stats)) {
      return res.status(400).json({ error: 'Stats must be an array' });
    }

    // Extract round and teams from matchId (format: R10_Richmond_Geelong)
    const parts = matchId.split('_');
    const round = parts[0] ? parseInt(parts[0].replace('R', '')) : 0;
    const homeTeam = parts[1] || '';
    const awayTeam = parts[2] || '';

    await db.saveMatchStats(matchId, round, homeTeam, awayTeam, stats);
    
    res.json({ message: 'Match stats saved', stats });
  } catch (err) {
    console.error('Error saving match stats:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/upload-match-stats', (req, res) => {
  const { matchId, csvData } = req.body;

  if (!matchId || !csvData) {
    return res.status(400).json({ error: 'matchId and csvData required' });
  }

  try {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const stats = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      
      headers.forEach((header, idx) => {
        const value = values[idx];
        if (['jumpernumber', 'handballs', 'kicks', 'marks', 'tackles', 'goals', 'behinds', 'hitouts', 'clearances', 'inside50s', 'goalassists'].includes(header.replace(/\s/g, ''))) {
          obj[header.replace(/\s/g, '')] = parseInt(value) || 0;
        } else {
          obj[header] = value;
        }
      });
      
      return obj;
    }).filter(obj => Object.keys(obj).length > 0);

    DATABASE.matchStats[matchId] = stats;
    saveData();
    
    res.json({ message: `Loaded ${stats.length} player stats`, stats });
  } catch (err) {
    console.error('Error parsing CSV:', err);
    res.status(400).json({ error: `CSV parsing error: ${err.message}` });
  }
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
