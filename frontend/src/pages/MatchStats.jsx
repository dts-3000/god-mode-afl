import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save } from 'lucide-react';

export default function MatchStats() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [squads, setSquads] = useState([]);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [matchInfo, setMatchInfo] = useState({
    round: '1',
    homeTeam: '',
    awayTeam: ''
  });

  useEffect(() => {
    loadSquads();
  }, []);

  const loadSquads = async () => {
    try {
      const response = await axios.get('/api/squads', { params: { userId } });
      setSquads(response.data || []);
    } catch (err) {
      console.error('Error loading squads:', err);
    }
  };

  const handleSelectSquad = async (squad) => {
    setSelectedSquad(squad);
    setPlayers(squad.players || []);
    
    // Initialize playerStats
    const stats = {};
    squad.players?.forEach(p => {
      stats[p.playerId] = {
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
      };
    });
    setPlayerStats(stats);
  };

  const handleStatChange = (playerId, stat, value) => {
    setPlayerStats({
      ...playerStats,
      [playerId]: {
        ...playerStats[playerId],
        [stat]: parseInt(value) || 0
      }
    });
  };

  const calculatePlayerPoints = (playerId) => {
    const stats = playerStats[playerId];
    const isCaptain = selectedSquad?.players?.find(p => p.playerId === playerId)?.isCaptain;
    
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
    if (!selectedSquad) {
      alert('Select a squad first');
      return;
    }

    try {
      // Update each player with their stats
      const updatedPlayers = selectedSquad.players.map(p => ({
        ...p,
        playerScore: calculatePlayerPoints(p.playerId),
        matchStats: playerStats[p.playerId]
      }));

      await axios.put(`/api/squads/${selectedSquad.id}/players`, {
        players: updatedPlayers
      });

      alert('✅ Match stats saved!');
      navigate('/');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Match Stats Entry</h1>

        {!selectedSquad ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">Select your squad to enter stats:</p>
            {squads.length === 0 ? (
              <p className="text-gray-500">No squads found. Create one first!</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {squads.map(squad => (
                  <button
                    key={squad.id}
                    onClick={() => handleSelectSquad(squad)}
                    className="p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 text-left transition"
                  >
                    <p className="font-bold">{squad.teamName || 'Untitled Squad'}</p>
                    <p className="text-xs text-gray-600">{squad.players?.length || 0} players</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Match Info */}
            <div className="bg-gray-50 p-3 rounded border">
              <h3 className="font-bold mb-2">Match Information</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold">Round</label>
                  <input
                    type="number"
                    value={matchInfo.round}
                    onChange={(e) => setMatchInfo({ ...matchInfo, round: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min="1"
                    max="23"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Home Team</label>
                  <input
                    type="text"
                    value={matchInfo.homeTeam}
                    onChange={(e) => setMatchInfo({ ...matchInfo, homeTeam: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="e.g., Adelaide"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Away Team</label>
                  <input
                    type="text"
                    value={matchInfo.awayTeam}
                    onChange={(e) => setMatchInfo({ ...matchInfo, awayTeam: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="e.g., Brisbane"
                  />
                </div>
              </div>
            </div>

            {/* Squad Selection Display */}
            <div className="bg-blue-50 p-2 rounded flex justify-between items-center">
              <p className="text-sm"><strong>{selectedSquad.teamName}</strong> - {selectedSquad.players?.length} players</p>
              <button
                onClick={() => setSelectedSquad(null)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Change Squad
              </button>
            </div>

            {/* Player Stats Entry */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {players.map(player => (
                <div key={player.playerId} className="border rounded p-2 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{player.playerName}</p>
                      <p className="text-xs text-gray-600">{player.teamName} - {player.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{calculatePlayerPoints(player.playerId)}</p>
                      <p className="text-xs text-gray-600">points</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { key: 'handballs', label: 'HB' },
                      { key: 'kicks', label: 'K' },
                      { key: 'marks', label: 'M' },
                      { key: 'tackles', label: 'T' },
                      { key: 'goals', label: 'G' },
                      { key: 'behinds', label: 'B' },
                      { key: 'hitOuts', label: 'HO' },
                      { key: 'clearances', label: 'C' },
                      { key: 'inside50s', label: 'I50' },
                      { key: 'goalAssists', label: 'GA' }
                    ].map(stat => (
                      <input
                        key={stat.key}
                        type="number"
                        min="0"
                        value={playerStats[player.playerId]?.[stat.key] || 0}
                        onChange={(e) => handleStatChange(player.playerId, stat.key, e.target.value)}
                        className="w-full px-1 py-1 border rounded text-xs text-center"
                        placeholder={stat.label}
                        title={stat.label}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 bg-white p-3 border-t rounded flex gap-2">
              <button
                onClick={handleSaveStats}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold flex items-center justify-center gap-2 transition"
              >
                <Save size={18} />
                Save Match Stats
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
