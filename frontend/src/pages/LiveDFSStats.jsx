import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, RefreshCw } from 'lucide-react';

export default function LiveDFSStats() {
  const navigate = useNavigate();
  const [allGames, setAllGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [homeStats, setHomeStats] = useState([]);
  const [awayStats, setAwayStats] = useState([]);
  const [gameInfo, setGameInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDFSData();
    
    // Auto-refresh every 30 seconds if enabled
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadDFSData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedGameId]);

  const loadDFSData = async () => {
    try {
      const response = await fetch('https://dfsaustralia-apps.com/shiny/afl-live-scoring/liveScoring2026.json');
      const data = await response.json();

      // Get all fixtures
      setAllGames(data.fixtures || []);

      // If a game is selected, load its stats
      if (selectedGameId) {
        const gameStats = data.playerStats.filter(stat => stat.id === selectedGameId);
        const home = gameStats.filter(stat => stat.homeAway === 'home');
        const away = gameStats.filter(stat => stat.homeAway === 'away');
        
        setHomeStats(home);
        setAwayStats(away);

        // Get game info
        const game = data.fixtures.find(f => f.id === selectedGameId);
        setGameInfo(game);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error loading DFS data:', err);
      setLoading(false);
    }
  };

  const handleGameSelect = (gameId) => {
    setSelectedGameId(gameId);
    setLoading(true);
    loadDFSData();
  };

  const calculateFantasyPoints = (player) => {
    let points = 0;
    points += (player.handballs || 0) * 2;
    points += (player.kicks || 0) * 3;
    points += (player.marks || 0) * 3;
    points += (player.tackles || 0) * 4;
    points += (player.goals || 0) * 6;
    points += (player.behinds || 0) * 1;
    points += (player.hitOuts || 0) * 1;
    points += (player.clearances || 0) * 3;
    points += (player.inside50s || 0) * 2;
    points += (player.goalAssists || 0) * 2;
    return Math.round(points);
  };

  const renderPlayerRow = (player) => {
    const fantasyPoints = player.fantasyPoints || calculateFantasyPoints(player);
    
    return (
      <tr key={player.playerId} className="border-b hover:bg-gray-50">
        <td className="px-3 py-2 font-semibold">{player.jumperNumber}</td>
        <td className="px-3 py-2 font-semibold">{player.player}</td>
        <td className="px-3 py-2 text-center">{player.kicks || 0}</td>
        <td className="px-3 py-2 text-center">{player.handballs || 0}</td>
        <td className="px-3 py-2 text-center">{player.marks || 0}</td>
        <td className="px-3 py-2 text-center">{player.tackles || 0}</td>
        <td className="px-3 py-2 text-center">{player.goals || 0}</td>
        <td className="px-3 py-2 text-center">{player.behinds || 0}</td>
        <td className="px-3 py-2 text-center font-bold text-green-600">{fantasyPoints}</td>
      </tr>
    );
  };

  return (
    <div className="space-y-4 pb-20">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-500" size={24} />
            <h1 className="text-2xl font-bold">🔴 Live DFS Stats</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              Auto-refresh (30s)
            </label>
            <button
              onClick={() => loadDFSData()}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              <RefreshCw size={16} />
              Refresh Now
            </button>
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded border border-green-200 mb-4">
          <p className="text-sm text-green-900">
            <strong>🚀 Live updating stats from DFS Australia!</strong> 
            {lastUpdate && ` Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>

        {/* Game Selector */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">Select Game:</h3>
          <div className="grid grid-cols-1 gap-2">
            {allGames.map(game => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className={`p-3 rounded text-left transition ${
                  selectedGameId === game.id
                    ? 'bg-blue-100 border-2 border-blue-600'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{game.homeTeam} vs {game.awayTeam}</p>
                    <p className="text-sm text-gray-600">Round {game.round} • Match ID: {game.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{game.homeScore} - {game.awayScore}</p>
                    <p className="text-xs text-gray-600">{game.status}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Tables */}
        {selectedGameId && gameInfo && (
          <div className="space-y-6">
            {/* Home Team */}
            <div>
              <h2 className="text-xl font-bold mb-3 bg-blue-100 p-2 rounded">
                {gameInfo.homeTeam} - {gameInfo.homeScore}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Player</th>
                      <th className="px-3 py-2 text-center">K</th>
                      <th className="px-3 py-2 text-center">H</th>
                      <th className="px-3 py-2 text-center">M</th>
                      <th className="px-3 py-2 text-center">T</th>
                      <th className="px-3 py-2 text-center">G</th>
                      <th className="px-3 py-2 text-center">B</th>
                      <th className="px-3 py-2 text-center">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeStats.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-3 py-4 text-center text-gray-500">
                          No stats available
                        </td>
                      </tr>
                    ) : (
                      homeStats.map(renderPlayerRow)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Away Team */}
            <div>
              <h2 className="text-xl font-bold mb-3 bg-red-100 p-2 rounded">
                {gameInfo.awayTeam} - {gameInfo.awayScore}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Player</th>
                      <th className="px-3 py-2 text-center">K</th>
                      <th className="px-3 py-2 text-center">H</th>
                      <th className="px-3 py-2 text-center">M</th>
                      <th className="px-3 py-2 text-center">T</th>
                      <th className="px-3 py-2 text-center">G</th>
                      <th className="px-3 py-2 text-center">B</th>
                      <th className="px-3 py-2 text-center">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {awayStats.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-3 py-4 text-center text-gray-500">
                          No stats available
                        </td>
                      </tr>
                    ) : (
                      awayStats.map(renderPlayerRow)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stats Legend */}
            <div className="bg-gray-50 p-3 rounded text-xs">
              <p className="font-bold mb-1">Legend:</p>
              <p>K=Kicks(3pts) • H=Handballs(2pts) • M=Marks(3pts) • T=Tackles(4pts) • G=Goals(6pts) • B=Behinds(1pt)</p>
            </div>
          </div>
        )}

        {!selectedGameId && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Zap className="mx-auto mb-2" size={48} />
            <p>Select a game to view live stats</p>
          </div>
        )}
      </div>
    </div>
  );
}
