import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader, Zap } from 'lucide-react';

export default function AFLStats() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [games, setGames] = useState([]);
  const [squads, setSquads] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [apiStatus, setApiStatus] = useState('');

  useEffect(() => {
    loadFinishedGames();
    loadSquads();
  }, []);

  const loadFinishedGames = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/matches');
      const finishedGames = (response.data.matches || []).filter(m => m.is_final);
      setGames(finishedGames.sort((a, b) => b.round - a.round));
    } catch (err) {
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSquads = async () => {
    try {
      const response = await axios.get('/api/squads', { params: { userId } });
      setSquads(response.data || []);
    } catch (err) {
      console.error('Error loading squads:', err);
    }
  };

  const getTeamName = (teamNameOrId) => {
    // Squiggle returns team names directly (e.g., "Richmond", "Carlton")
    // If it's already a string name, return it
    if (typeof teamNameOrId === 'string') {
      return teamNameOrId;
    }
    
    // Otherwise map ID to name (fallback)
    const teams = { 1: 'Adelaide', 2: 'Brisbane', 3: 'Carlton', 4: 'Collingwood', 5: 'Essendon', 6: 'Fremantle', 7: 'Geelong', 8: 'Gold Coast', 9: 'GWS', 10: 'Hawthorn', 11: 'Melbourne', 12: 'North Melbourne', 13: 'Port Adelaide', 14: 'Richmond', 15: 'St Kilda', 16: 'Sydney', 17: 'West Coast', 18: 'Western Bulldogs' };
    return teams[teamNameOrId] || `Team ${teamNameOrId}`;
  };

  const calculatePoints = (stats, isCaptain) => {
    if (!stats) return 0;
    let points = 0;
    points += (stats.handballs || 0) * 2;
    points += (stats.kicks || 0) * 3;
    points += (stats.marks || 0) * 3;
    points += (stats.tackles || 0) * 4;
    points += (stats.goals || 0) * 6;
    points += (stats.behinds || 0) * 1;
    points += (stats.hitouts || stats.hitOuts || 0) * 1;
    points += (stats.clearances || 0) * 3;
    points += (stats.inside50s || 0) * 2;
    points += (stats.goalAssists || stats.goalassists || 0) * 2;
    if (isCaptain) points *= 2;
    return Math.max(0, Math.round(points));
  };

  const handleLoadStats = async () => {
    if (!selectedGame || !selectedSquad) {
      alert('Select both a game and squad');
      return;
    }

    setLoadingStats(true);
    setApiStatus('🔍 Fetching from DFS Australia...');
    
    try {
      // Call our AFL scraper API
      const response = await axios.get(`/api/afl-stats/${selectedGame.id}`);
      
      setApiStatus(`✅ Found ${response.data.playerCount} players from DFS Australia`);
      
      const aflPlayers = response.data.players || [];

      if (aflPlayers.length === 0) {
        alert('⚠️ No stats found from DFS Australia for this match.\n\nMake sure the game has started and stats are available.');
        setLoadingStats(false);
        return;
      }

      // Match AFL stats to squad players by jumper number
      const matchedStats = selectedSquad.players.map(squadPlayer => {
        const aflStat = aflPlayers.find(p => 
          p.jumperNumber === squadPlayer.jumperNumber || 
          p.jumperNumber === parseInt(squadPlayer.jumperNumber)
        );
        
        return {
          ...squadPlayer,
          matchStats: aflStat || { 
            handballs: 0, kicks: 0, marks: 0, tackles: 0, 
            goals: 0, behinds: 0, hitOuts: 0, clearances: 0, 
            inside50s: 0, goalAssists: 0 
          },
          playerScore: calculatePoints(aflStat, squadPlayer.isCaptain),
          aflMatched: !!aflStat
        };
      });

      setPlayerStats(matchedStats);
      
      const matchedCount = matchedStats.filter(p => p.aflMatched).length;
      alert(`✅ Loaded stats from DFS Australia!\n\nMatched ${matchedCount}/${selectedSquad.players.length} players`);
      
    } catch (err) {
      console.error('Error loading AFL stats:', err);
      setApiStatus('❌ Error loading stats');
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSaveStats = async () => {
    if (playerStats.length === 0) {
      alert('Load stats first');
      return;
    }
    try {
      await axios.put(`/api/squads/${selectedSquad.id}/players`, { players: playerStats });
      alert('✅ Stats saved to squad!');
      navigate('/');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const totalPoints = playerStats.reduce((sum, p) => sum + (p.playerScore || 0), 0);
  const matchedCount = playerStats.filter(p => p.aflMatched).length;

  return (
    <div className="space-y-4 pb-20">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-yellow-500" size={24} />
          <h1 className="text-2xl font-bold">⚡ DFS Australia Stats (LIVE)</h1>
        </div>

        <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
          <p className="text-sm text-blue-900">
            <strong>🚀 Direct from DFS Australia!</strong> This fetches live player stats 
            from the public DFS Australia JSON feed. Updated every 30 seconds during games!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <h3 className="font-bold mb-2">1. Select Finished Game</h3>
            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : games.length === 0 ? (
              <div className="bg-yellow-50 p-3 rounded text-yellow-800 text-sm">No finished games</div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                {games.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`w-full text-left p-2 rounded text-sm transition ${
                      selectedGame?.id === game.id
                        ? 'bg-blue-100 border-2 border-blue-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-semibold">
                      Round {game.round}: {getTeamName(game.homeTeam)} vs {getTeamName(game.awayTeam)}
                    </p>
                    <p className="text-xs text-gray-600">Match ID: {game.id}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold mb-2">2. Select Your Squad</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
              {squads.map(squad => (
                <button
                  key={squad.id}
                  onClick={() => setSelectedSquad(squad)}
                  className={`w-full text-left p-2 rounded text-sm transition ${
                    selectedSquad?.id === squad.id
                      ? 'bg-blue-100 border-2 border-blue-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-semibold">{squad.teamName}</p>
                  <p className="text-xs text-gray-600">{squad.players?.length || 0} players</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLoadStats}
            disabled={!selectedGame || !selectedSquad || loadingStats}
            className={`py-3 rounded font-bold text-white transition flex items-center justify-center gap-2 ${
              selectedGame && selectedSquad && !loadingStats
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loadingStats ? (
              <>
                <Loader className="animate-spin" size={20} />
                Fetching from DFS Australia...
              </>
            ) : (
              <>
                <Zap size={20} />
                Load DFS Stats (Auto)
              </>
            )}
          </button>

          {apiStatus && (
            <div className={`p-3 rounded text-sm font-bold ${
              apiStatus.includes('✅') ? 'bg-green-100 text-green-800' : 
              apiStatus.includes('❌') ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {apiStatus}
            </div>
          )}

          {playerStats.length > 0 && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 rounded border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-bold">Total Points</p>
                    <p className="text-4xl font-bold text-green-600">{totalPoints}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-700">Players Matched</p>
                    <p className="text-2xl font-bold text-green-600">{matchedCount}/18</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveStats}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded font-bold"
              >
                ✅ Save Stats to Squad
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
