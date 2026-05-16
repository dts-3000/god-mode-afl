import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader } from 'lucide-react';

export default function CSVStats() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [games, setGames] = useState([]);
  const [squads, setSquads] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

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

  const getTeamName = (teamId) => {
    const teams = { 1: 'Adelaide', 2: 'Brisbane', 3: 'Carlton', 4: 'Collingwood', 5: 'Essendon', 6: 'Fremantle', 7: 'Geelong', 8: 'Gold Coast', 9: 'GWS', 10: 'Hawthorn', 11: 'Melbourne', 12: 'North Melbourne', 13: 'Port Adelaide', 14: 'Richmond', 15: 'St Kilda', 16: 'Sydney', 17: 'West Coast', 18: 'Western Bulldogs' };
    return teams[teamId] || `Team ${teamId}`;
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
    points += (stats.goalassists || stats.goalAssists || 0) * 2;
    if (isCaptain) points *= 2;
    return Math.max(0, Math.round(points));
  };

  const handleLoadStats = async () => {
    if (!selectedGame || !selectedSquad) {
      alert('Select both a game and squad');
      return;
    }

    setLoadingStats(true);
    try {
      const response = await axios.get(`/api/match-stats/${selectedGame.id}`);
      const stats = response.data.stats || [];

      if (stats.length === 0) {
        alert('⚠️ No CSV stats uploaded for this match.\n\nGo to Admin → Upload CSV first!');
        setLoadingStats(false);
        return;
      }

      const matchedStats = selectedSquad.players.map(squadPlayer => {
        const apiStat = stats.find(s => {
          const statNumber = s.jumpernumber || s.number;
          return statNumber === squadPlayer.jumperNumber || statNumber === parseInt(squadPlayer.jumperNumber);
        });
        return {
          ...squadPlayer,
          matchStats: apiStat || { handballs: 0, kicks: 0, marks: 0, tackles: 0, goals: 0, behinds: 0, hitOuts: 0, clearances: 0, inside50s: 0, goalAssists: 0 },
          playerScore: calculatePoints(apiStat, squadPlayer.isCaptain)
        };
      });

      setPlayerStats(matchedStats);
      alert('✅ Stats loaded from CSV!');
    } catch (err) {
      alert(`Error: ${err.message}`);
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

  return (
    <div className="space-y-4 pb-20">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">📊 Load CSV Stats</h1>
        <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
          <p className="text-sm text-blue-900"><strong>Note:</strong> This loads stats from CSV uploads. For live Squiggle data, use "Final Stats".</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h3 className="font-bold mb-2">1. Select Game</h3>
            {loading ? <div className="text-sm text-gray-600">Loading...</div> : games.length === 0 ? <div className="bg-yellow-50 p-3 rounded text-yellow-800 text-sm">No games</div> : <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">{games.map(game => (<button key={game.id} onClick={() => setSelectedGame(game)} className={`w-full text-left p-2 rounded text-sm ${selectedGame?.id === game.id ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-50'}`}><p className="font-semibold">Round {game.round}: {getTeamName(game.homeTeam)} vs {getTeamName(game.awayTeam)}</p></button>))}</div>}
          </div>
          <div>
            <h3 className="font-bold mb-2">2. Select Squad</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">{squads.map(squad => (<button key={squad.id} onClick={() => setSelectedSquad(squad)} className={`w-full text-left p-2 rounded text-sm ${selectedSquad?.id === squad.id ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-50'}`}><p className="font-semibold">{squad.teamName}</p></button>))}</div>
          </div>
          <button onClick={handleLoadStats} disabled={!selectedGame || !selectedSquad || loadingStats} className={`py-2 rounded font-bold text-white ${selectedGame && selectedSquad && !loadingStats ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>{loadingStats ? 'Loading...' : 'Load CSV Stats'}</button>
          {playerStats.length > 0 && (
            <div>
              <div className="p-3 bg-green-50 rounded border border-green-200 mb-3">
                <p className="text-3xl font-bold text-green-600">{totalPoints} pts</p>
              </div>
              <button onClick={handleSaveStats} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold">✅ Save to Squad</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
