-- God Mode AFL Database Schema
-- For Vercel Postgres

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Squads table
CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    season INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Squad players table
CREATE TABLE IF NOT EXISTS squad_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    jumper_number INTEGER,
    position VARCHAR(50),
    team_id INTEGER,
    team_name VARCHAR(255),
    is_captain BOOLEAN DEFAULT FALSE,
    player_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match stats table
CREATE TABLE IF NOT EXISTS match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(255) NOT NULL,
    round INTEGER,
    home_team VARCHAR(255),
    away_team VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_stats_id UUID REFERENCES match_stats(id) ON DELETE CASCADE,
    jumper_number INTEGER,
    player_name VARCHAR(255),
    disposals INTEGER DEFAULT 0,
    kicks INTEGER DEFAULT 0,
    handballs INTEGER DEFAULT 0,
    marks INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    behinds INTEGER DEFAULT 0,
    hit_outs INTEGER DEFAULT 0,
    clearances INTEGER DEFAULT 0,
    inside_50s INTEGER DEFAULT 0,
    goal_assists INTEGER DEFAULT 0,
    fantasy_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Squad player stats (links squad players to their match stats)
CREATE TABLE IF NOT EXISTS squad_player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    squad_player_id UUID REFERENCES squad_players(id) ON DELETE CASCADE,
    match_id VARCHAR(255),
    kicks INTEGER DEFAULT 0,
    handballs INTEGER DEFAULT 0,
    marks INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    behinds INTEGER DEFAULT 0,
    hit_outs INTEGER DEFAULT 0,
    clearances INTEGER DEFAULT 0,
    inside_50s INTEGER DEFAULT 0,
    goal_assists INTEGER DEFAULT 0,
    player_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_squads_user_id ON squads(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_players_squad_id ON squad_players(squad_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_match_id ON match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_match_stats_id ON player_stats(match_stats_id);
CREATE INDEX IF NOT EXISTS idx_squad_player_stats_squad_id ON squad_player_stats(squad_id);
