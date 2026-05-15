import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Download, Loader } from 'lucide-react';

export default function LoadStats() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [squads, setSquads] = useState([]);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadMatches();
    loadSquads();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      // Use our backend API which can access Squiggle
      const response = await axios.get('/api/matches');
      const matches = response.data.matches || [];
      
      if (matches.length > 0) {
        setMatches(matches);
      } else {
        alert('No matches found for 2026 season');
      }
    } catch (err) {
      console.error('Error loading matches:', err);
      alert('Error loading matches. Make sure backend is running.');
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

  const handleLoadStats = async () => {
    if (!selectedMatch || !selectedSquad) {
      alert('Select both a match and squad');
      return;
    }

    setLoadingStats(true);
    try {
      // Get team ID from squad's first player
      const firstPlayer = selectedSquad.players?.[0];
      if (!firstPlayer) {
        alert('Squad has no players');
        return;
      }

      const teamId = firstPlayer.teamId;

      // Fetch stats from our backend API (which proxies Squiggle)
      const response = await axios.get(`/api/player-stats/${selectedMatch.id}/${teamId}`);
      const stats = response.data.stats || [];

      // Match stats to squad players by jumper number
      const matchedStats = selectedSquad.players.map(squadPlayer => {
        const apiStat = stats.find(s => s.jumperNumber === squadPlayer.jumperNumber);
        return {
          ...squadPlayer,
          matchStats: apiStat || {
            handballs: 0,
            kicks: 0,
            marks: 0,
            tackles: 0,
            goals: 0,
            behinds: 0,
            hitOuts: 0,
            clearances: 0,
            inside50s: 0,
            goalAssists: 0
          },
          playerScore: calculatePoints(apiStat, squadPlayer.isCaptain)
        };
      });

      setPlayerStats(matchedStats);
      alert('✅ Stats loaded from Squiggle API!');
    } catch (err) {
      console.error('Error loading stats:', err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingStats(false);
    }
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
    points += (stats.hitOuts || 0) * 1;
    points += (stats.clearances || 0) * 3;
    points += (stats.inside50s || 0) * 2;
    points += (stats.goalAssists || 0) * 2;

    if (isCaptain) points *= 2;
    return Math.max(0, Math.round(points));
  };

  const handleSaveStats = async () => {
    if (playerStats.length === 0) {
      alert('Load stats first');
      return;
    }

    try {
      await axios.put(`/api/squads/${selectedSquad.id}/players`, {
        players: playerStats
      });
      alert('✅ Stats saved to squad!');
      navigate('/');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const totalPoints = playerStats.reduce((sum, p) => sum + (p.playerScore || 0), 0);

  return (
    <div className="space-y-4 pb-20">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Load Live Stats (Squiggle API)</h1>

        <div className="grid grid-cols-1 gap-4">
          {/* Match Selection */}
          <div>
            <h3 className="font-bold mb-2">1. Select Match</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader size={18} className="animate-spin" />
                Loading matches...
              </div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                {matches.length === 0 ? (
                  <p className="text-gray-500 text-sm">No matches available</p>
                ) : (
                  matches.map(match => (
                    <button
                      key={match.id}
                      onClick={() => setSelectedMatch(match)}
                      className={`w-full text-left p-2 rounded transition ${
                        selectedMatch?.id === match.id
                          ? 'bg-blue-100 border-2 border-blue-600'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-semibold text-sm">
                        Round {match.round}: {match.homeTeam} vs {match.awayTeam}
                      </p>
                      <p className="text-xs text-gray-600">{match.status}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Squad Selection */}
          <div>
            <h3 className="font-bold mb-2">2. Select Your Squad</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
              {squads.length === 0 ? (
                <p className="text-gray-500 text-sm">No squads found</p>
              ) : (
                squads.map(squad => (
                  <button
                    key={squad.id}
                    onClick={() => setSelectedSquad(squad)}
                    className={`w-full text-left p-2 rounded transition ${
                      selectedSquad?.id === squad.id
                        ? 'bg-blue-100 border-2 border-blue-600'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-semibold text-sm">{squad.teamName}</p>
                    <p className="text-xs text-gray-600">{squad.players?.length} players</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Load Button */}
          <button
            onClick={handleLoadStats}
            disabled={!selectedMatch || !selectedSquad || loadingStats}
            className={`flex items-center justify-center gap-2 py-2 rounded font-bold transition ${
              selectedMatch && selectedSquad && !loadingStats
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
          >
            {loadingStats ? (
              <>
                <Loader size={18} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download size={18} />
                Load Stats from API
              </>
            )}
          </button>

          {/* Stats Display */}
          {playerStats.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                <h3 className="font-bold">Match Stats Loaded</h3>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{totalPoints}</p>
                  <p className="text-xs text-gray-600">Total Points</p>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {playerStats.map(p => (
                  <div key={p.playerId} className="p-2 bg-gray-50 rounded border flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold">{p.playerName}</p>
                      <p className="text-xs text-gray-600">
                        {p.matchStats.handballs}HB, {p.matchStats.kicks}K, {p.matchStats.marks}M, {p.matchStats.goals}G
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{p.playerScore}</p>
                      <p className="text-xs text-gray-600">pts</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveStats}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold transition"
              >
                Save Stats to Squad
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded text-sm text-blue-800">
          <p className="font-bold mb-1">📊 How it works:</p>
          <ul className="text-xs space-y-1">
            <li>✅ Select a round/match from Squiggle API</li>
            <li>✅ Pick your squad</li>
            <li>✅ Click "Load Stats" - automatically fetches player data</li>
            <li>✅ Points calculate in real-time (2x for captain)</li>
            <li>✅ Save to your squad</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
