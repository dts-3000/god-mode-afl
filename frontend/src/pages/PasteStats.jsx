import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ClipboardPaste, CheckCircle } from 'lucide-react';

export default function PasteStats() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [pastedData, setPastedData] = useState('');
  const [squads, setSquads] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedSquad, setSelectedSquad] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [parsedPlayers, setParsedPlayers] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSquads();
    loadMatches();
  }, []);

  const loadSquads = async () => {
    try {
      const response = await axios.get('/api/squads', { params: { userId } });
      setSquads(response.data || []);
    } catch (err) {
      console.error('Error loading squads:', err);
    }
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/matches');
      // Get finished games only
      const finishedGames = (response.data.matches || []).filter(m => m.is_final);
      setMatches(finishedGames.sort((a, b) => b.round - a.round));
    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamNameOrId) => {
    if (typeof teamNameOrId === 'string') return teamNameOrId;
    const teams = { 1: 'Adelaide', 2: 'Brisbane', 3: 'Carlton', 4: 'Collingwood', 5: 'Essendon', 6: 'Fremantle', 7: 'Geelong', 8: 'Gold Coast', 9: 'GWS', 10: 'Hawthorn', 11: 'Melbourne', 12: 'North Melbourne', 13: 'Port Adelaide', 14: 'Richmond', 15: 'St Kilda', 16: 'Sydney', 17: 'West Coast', 18: 'Western Bulldogs' };
    return teams[teamNameOrId] || `Team ${teamNameOrId}`;
  };

  const calculateFantasyPoints = (stats) => {
    let points = 0;
    // DFS shows Disposals (D) which is Kicks + Handballs combined
    // We'll estimate: 60% kicks, 40% handballs
    const disposals = stats.disposals || 0;
    const kicks = Math.round(disposals * 0.6);
    const handballs = Math.round(disposals * 0.4);
    
    points += handballs * 2;
    points += kicks * 3;
    points += (stats.marks || 0) * 3;
    points += (stats.tackles || 0) * 4;
    points += (stats.goals || 0) * 6;
    points += (stats.behinds || 0) * 1;
    points += (stats.hitouts || 0) * 1;
    // Note: DFS doesn't show clearances, inside50s, goalAssists separately
    
    return Math.round(points);
  };

  const handleParse = () => {
    if (!pastedData.trim()) {
      setMessage('❌ Please paste some data first!');
      return;
    }

    try {
      const lines = pastedData.trim().split('\n');
      const players = [];

      for (const line of lines) {
        // Skip empty lines or header lines
        if (!line.trim() || line.includes('PLAYER') || line.includes('D\tM\tT')) {
          continue;
        }

        // Split by tabs
        const cols = line.split('\t');
        
        // Expected format:
        // [0]=Number, [1]=Name, [2]=D, [3]=M, [4]=T, [5]=HO, [6]=FF, [7]=FA, [8]=G.B, ...
        if (cols.length < 9) continue;

        const jumperNumber = parseInt(cols[0]) || 0;
        const playerName = cols[1]?.trim() || '';
        const disposals = parseInt(cols[2]) || 0;
        const marks = parseInt(cols[3]) || 0;
        const tackles = parseInt(cols[4]) || 0;
        const hitouts = parseInt(cols[5]) || 0;
        const goalBehinds = cols[8]?.trim() || '0.0';
        
        // Parse goals.behinds (e.g., "2.1" = 2 goals, 1 behind)
        const [goalsStr, behindsStr] = goalBehinds.split('.');
        const goals = parseInt(goalsStr) || 0;
        const behinds = parseInt(behindsStr) || 0;

        if (playerName) {
          const stats = {
            disposals,
            marks,
            tackles,
            hitouts,
            goals,
            behinds
          };

          players.push({
            jumperNumber,
            playerName,
            ...stats,
            fantasyPoints: calculateFantasyPoints(stats)
          });
        }
      }

      setParsedPlayers(players);
      setMessage(`✅ Parsed ${players.length} players!`);
    } catch (err) {
      console.error('Parse error:', err);
      setMessage('❌ Error parsing data. Make sure you copied from DFS Australia!');
    }
  };

  const handleSaveToSquad = async () => {
    if (!selectedSquad) {
      setMessage('❌ Select a squad first!');
      return;
    }

    if (!selectedMatch) {
      setMessage('❌ Select a match first!');
      return;
    }

    if (parsedPlayers.length === 0) {
      setMessage('❌ Parse data first!');
      return;
    }

    try {
      // Save stats to match stats storage
      await axios.post(`/api/match-stats/${selectedMatch.id}`, {
        stats: parsedPlayers.map(p => ({
          jumperNumber: p.jumperNumber,
          playerName: p.playerName,
          disposals: p.disposals,
          kicks: Math.round(p.disposals * 0.6),
          handballs: Math.round(p.disposals * 0.4),
          marks: p.marks,
          tackles: p.tackles,
          goals: p.goals,
          behinds: p.behinds,
          hitOuts: p.hitouts,
          clearances: 0,
          inside50s: 0,
          goalAssists: 0
        }))
      });

      // Match parsed players to squad players by jumper number
      const updatedPlayers = selectedSquad.players.map(squadPlayer => {
        const match = parsedPlayers.find(p => 
          p.jumperNumber === squadPlayer.jumperNumber ||
          p.jumperNumber === parseInt(squadPlayer.jumperNumber)
        );

        if (match) {
          const kicks = Math.round(match.disposals * 0.6);
          const handballs = Math.round(match.disposals * 0.4);

          return {
            ...squadPlayer,
            matchStats: {
              kicks,
              handballs,
              marks: match.marks,
              tackles: match.tackles,
              goals: match.goals,
              behinds: match.behinds,
              hitOuts: match.hitouts,
              clearances: 0,
              inside50s: 0,
              goalAssists: 0
            },
            playerScore: squadPlayer.isCaptain 
              ? match.fantasyPoints * 2 
              : match.fantasyPoints
          };
        }
        return squadPlayer;
      });

      await axios.put(`/api/squads/${selectedSquad.id}/players`, { players: updatedPlayers });
      
      const matchedCount = updatedPlayers.filter(p => p.matchStats).length;
      alert(`✅ Saved stats!\n\n• Stored to Match ID ${selectedMatch.id}\n• Matched ${matchedCount}/18 players to squad`);
      navigate('/');
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  const totalPoints = parsedPlayers.reduce((sum, p) => sum + p.fantasyPoints, 0);

  return (
    <div className="space-y-4 pb-20">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardPaste className="text-purple-500" size={24} />
          <h1 className="text-2xl font-bold">📋 Paste DFS Stats</h1>
        </div>

        <div className="bg-purple-50 p-3 rounded border border-purple-200 mb-4">
          <p className="text-sm text-purple-900">
            <strong>Copy stats from DFS Australia!</strong> Just select the stats table, copy (Ctrl+C), 
            and paste here. We'll auto-parse it!
          </p>
        </div>

        {/* Paste Area */}
        <div className="space-y-4">
          {/* Match Selection */}
          <div>
            <label className="block text-sm font-bold mb-2">1. Select Match:</label>
            {loading ? (
              <div className="text-sm text-gray-600">Loading matches...</div>
            ) : matches.length === 0 ? (
              <div className="bg-yellow-50 p-3 rounded text-yellow-800 text-sm">No finished matches found</div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto border rounded p-2">
                {matches.map(match => (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={`w-full text-left p-2 rounded text-sm transition ${
                      selectedMatch?.id === match.id
                        ? 'bg-purple-100 border-2 border-purple-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-semibold">
                      Round {match.round}: {getTeamName(match.homeTeam)} vs {getTeamName(match.awayTeam)}
                    </p>
                    <p className="text-xs text-gray-600">Match ID: {match.id}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">2. Paste DFS Stats Here:</label>
            <textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder="Paste your copied DFS stats here (Ctrl+V)..."
              rows={10}
              className="w-full px-3 py-2 border rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <button
            onClick={handleParse}
            disabled={!pastedData.trim()}
            className={`w-full px-4 py-3 rounded font-bold text-white flex items-center justify-center gap-2 ${
              pastedData.trim()
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <ClipboardPaste size={20} />
            3. Parse Stats
          </button>

          {message && (
            <div className={`p-3 rounded text-sm font-bold ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Parsed Results */}
          {parsedPlayers.length > 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-lg font-bold text-green-800">
                  Found {parsedPlayers.length} players • {totalPoints} total points
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Player</th>
                      <th className="px-3 py-2 text-center">D</th>
                      <th className="px-3 py-2 text-center">M</th>
                      <th className="px-3 py-2 text-center">T</th>
                      <th className="px-3 py-2 text-center">G</th>
                      <th className="px-3 py-2 text-center">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPlayers.map((player, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-semibold">{player.jumperNumber}</td>
                        <td className="px-3 py-2">{player.playerName}</td>
                        <td className="px-3 py-2 text-center">{player.disposals}</td>
                        <td className="px-3 py-2 text-center">{player.marks}</td>
                        <td className="px-3 py-2 text-center">{player.tackles}</td>
                        <td className="px-3 py-2 text-center">{player.goals}</td>
                        <td className="px-3 py-2 text-center font-bold text-green-600">
                          {player.fantasyPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">4. Select Your Squad:</label>
                <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                  {squads.map(squad => (
                    <button
                      key={squad.id}
                      onClick={() => setSelectedSquad(squad)}
                      className={`w-full text-left p-2 rounded text-sm transition ${
                        selectedSquad?.id === squad.id
                          ? 'bg-purple-100 border-2 border-purple-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-semibold">{squad.teamName}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveToSquad}
                disabled={!selectedSquad || !selectedMatch}
                className={`w-full px-4 py-3 rounded font-bold text-white flex items-center justify-center gap-2 ${
                  selectedSquad && selectedMatch
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle size={20} />
                5. Save to Squad & Match
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded text-sm">
            <p className="font-bold mb-2">💡 How to use:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Go to DFS Australia live scoring page</li>
              <li>Select the stats table for your team</li>
              <li>Copy (Ctrl+C or Cmd+C)</li>
              <li>Paste here (Ctrl+V or Cmd+V)</li>
              <li>Click "Parse Stats"</li>
              <li>Select your squad</li>
              <li>Click "Save to Squad"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
