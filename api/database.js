import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
export const db = {
  // Squads
  async createSquad(userId, teamName, season) {
    const { data, error } = await supabase
      .from('squads')
      .insert([{ user_id: userId, team_name: teamName, season }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSquadsByUser(userId) {
    const { data, error } = await supabase
      .from('squads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getSquad(squadId) {
    const { data, error } = await supabase
      .from('squads')
      .select('*')
      .eq('id', squadId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSquad(squadId) {
    const { error } = await supabase
      .from('squads')
      .delete()
      .eq('id', squadId);
    
    if (error) throw error;
  },

  async updateSquadName(squadId, teamName) {
    const { data, error } = await supabase
      .from('squads')
      .update({ team_name: teamName, updated_at: new Date() })
      .eq('id', squadId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Squad Players
  async addPlayersToSquad(squadId, players) {
    // Delete existing players first
    await supabase
      .from('squad_players')
      .delete()
      .eq('squad_id', squadId);
    
    // Insert new players
    const playersData = players.map((player, index) => ({
      squad_id: squadId,
      player_id: player.playerId || '',
      player_name: player.playerName,
      jumper_number: player.jumperNumber,
      position: player.position || '',
      team_id: typeof player.teamId === 'number' ? player.teamId : null,
      team_name: player.teamName || player.team || '',
      is_captain: player.isCaptain || false,
      player_order: index
    }));

    const { error } = await supabase
      .from('squad_players')
      .insert(playersData);
    
    if (error) throw error;
  },

  async getSquadPlayers(squadId) {
    const { data, error } = await supabase
      .from('squad_players')
      .select('*')
      .eq('squad_id', squadId)
      .order('player_order');
    
    if (error) throw error;
    return data || [];
  },

  async setCaptain(squadId, playerId) {
    // Remove captain from all players in squad
    await supabase
      .from('squad_players')
      .update({ is_captain: false })
      .eq('squad_id', squadId);
    
    // Set new captain
    const { error } = await supabase
      .from('squad_players')
      .update({ is_captain: true })
      .eq('squad_id', squadId)
      .eq('id', playerId);
    
    if (error) throw error;
  },

  // Match Stats
  async saveMatchStats(matchId, round, homeTeam, awayTeam, playerStats) {
    // Check if match stats already exist
    const { data: existing } = await supabase
      .from('match_stats')
      .select('id')
      .eq('match_id', matchId)
      .single();

    let matchStatsId;
    if (existing) {
      matchStatsId = existing.id;
      // Delete old player stats
      await supabase
        .from('player_stats')
        .delete()
        .eq('match_stats_id', matchStatsId);
    } else {
      // Create new match stats record
      const { data: newMatch, error } = await supabase
        .from('match_stats')
        .insert([{ match_id: matchId, round, home_team: homeTeam, away_team: awayTeam }])
        .select()
        .single();
      
      if (error) throw error;
      matchStatsId = newMatch.id;
    }

    // Insert player stats
    const playerStatsData = playerStats.map(player => ({
      match_stats_id: matchStatsId,
      jumper_number: player.jumperNumber,
      player_name: player.playerName,
      disposals: player.disposals || 0,
      kicks: player.kicks || 0,
      handballs: player.handballs || 0,
      marks: player.marks || 0,
      tackles: player.tackles || 0,
      goals: player.goals || 0,
      behinds: player.behinds || 0,
      hit_outs: player.hitOuts || player.hitouts || 0,
      clearances: player.clearances || 0,
      inside_50s: player.inside50s || 0,
      goal_assists: player.goalAssists || player.goalassists || 0,
      fantasy_points: player.fantasyPoints || 0
    }));

    const { error } = await supabase
      .from('player_stats')
      .insert(playerStatsData);
    
    if (error) throw error;
    return matchStatsId;
  },

  async getMatchStats(matchId) {
    const { data: match, error: matchError } = await supabase
      .from('match_stats')
      .select('*')
      .eq('match_id', matchId)
      .single();
    
    if (matchError || !match) return null;

    const { data: players, error: playersError } = await supabase
      .from('player_stats')
      .select('*')
      .eq('match_stats_id', match.id);
    
    if (playersError) throw playersError;

    return {
      matchId: match.match_id,
      round: match.round,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      players: players || []
    };
  },

  // Squad Player Stats (for saving stats to a specific squad)
  async saveSquadPlayerStats(squadId, matchId, playerStats) {
    // Delete existing stats for this squad/match combo
    await supabase
      .from('squad_player_stats')
      .delete()
      .eq('squad_id', squadId)
      .eq('match_id', matchId);

    // Get squad players
    const { data: squadPlayers } = await supabase
      .from('squad_players')
      .select('id, jumper_number')
      .eq('squad_id', squadId);

    if (!squadPlayers) return;

    // Insert stats for matched players
    const statsToInsert = [];
    for (const stat of playerStats) {
      const squadPlayer = squadPlayers.find(
        sp => sp.jumper_number === stat.jumperNumber
      );

      if (squadPlayer && stat.matchStats) {
        statsToInsert.push({
          squad_id: squadId,
          squad_player_id: squadPlayer.id,
          match_id: matchId,
          kicks: stat.matchStats.kicks || 0,
          handballs: stat.matchStats.handballs || 0,
          marks: stat.matchStats.marks || 0,
          tackles: stat.matchStats.tackles || 0,
          goals: stat.matchStats.goals || 0,
          behinds: stat.matchStats.behinds || 0,
          hit_outs: stat.matchStats.hitOuts || 0,
          clearances: stat.matchStats.clearances || 0,
          inside_50s: stat.matchStats.inside50s || 0,
          goal_assists: stat.matchStats.goalAssists || 0,
          player_score: stat.playerScore || 0
        });
      }
    }

    if (statsToInsert.length > 0) {
      const { error } = await supabase
        .from('squad_player_stats')
        .insert(statsToInsert);
      
      if (error) throw error;
    }
  },

  async getSquadPlayerStats(squadId, matchId) {
    const { data, error } = await supabase
      .from('squad_player_stats')
      .select('*')
      .eq('squad_id', squadId)
      .eq('match_id', matchId);
    
    if (error) throw error;
    return data || [];
  }
};

