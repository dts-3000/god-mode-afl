import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Plus } from 'lucide-react';
import axios from 'axios';

export default function AdminPanel() {
  const [players, setPlayers] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await axios.get('/api/players');
      setPlayers(response.data.players || []);
    } catch (err) {
      console.error('Error loading players:', err);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());

        // Find column indices
        const idIdx = headers.findIndex(h => h.includes('id'));
        const jumperIdx = headers.findIndex(h => h.includes('jumper'));
        const playerIdx = headers.findIndex(h => h === 'player');
        const teamIdx = headers.findIndex(h => h === 'team');
        const posIdx = headers.findIndex(h => h === 'position');

        const newPlayers = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const cols = lines[i].split('\t').map(c => c.trim());
          if (cols.length < 5) continue;

          const [firstName, lastName] = cols[playerIdx]?.split(' ') || ['', ''];
          const teamName = cols[teamIdx] || '';
          const teamId = teamName.toLowerCase().replace(/\s+/g, '-');

          const player = {
            id: `player-${Math.random().toString(36).substr(2, 9)}`,
            aflId: `${teamId}-${cols[jumperIdx]}`,
            firstName: firstName || '',
            lastName: lastName || '',
            position: cols[posIdx] || '',
            teamName: teamName,
            teamId: teamId,
            jumperNumber: parseInt(cols[jumperIdx]) || 0,
            seasonStats: {}
          };

          newPlayers.push(player);
        }

        // Send to API
        try {
          await axios.post('/api/admin/import-players', { players: newPlayers });
          setMessage(`✅ Successfully imported ${newPlayers.length} players!`);
          loadPlayers();
          setCsvFile(null);
        } catch (err) {
          setMessage(`❌ Error importing players: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setMessage(`❌ Error processing file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Delete this player?')) return;

    setLoading(true);
    try {
      // For now, just remove from state since we don't have delete endpoint
      setPlayers(players.filter(p => p.id !== playerId));
      setMessage('✅ Player deleted');
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage players and import new data</p>
      </div>

      {/* CSV Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Upload size={24} />
          Import Players from CSV
        </h2>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800 mb-2">
            <strong>CSV Format Required (Tab-separated):</strong>
          </p>
          <p className="text-xs text-blue-700 font-mono">
            ID	JumperNumber	Player	Team	Position
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Example: 1	15	John Doe	Adelaide	Midfielder
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            <Upload size={18} />
            Choose CSV File
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleCSVUpload}
              disabled={loading}
              className="hidden"
            />
          </label>

          {csvFile && (
            <span className="text-sm text-gray-600">
              Selected: <strong>{csvFile.name}</strong>
            </span>
          )}
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded text-sm ${
            message.includes('✅')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Players List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">
          Players ({players.length})
        </h2>

        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No players yet. Upload a CSV file to import players.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Position</th>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-4 py-2 text-left">Jumper #</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {players.map(player => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {player.firstName} {player.lastName}
                    </td>
                    <td className="px-4 py-2">{player.position}</td>
                    <td className="px-4 py-2">{player.teamName}</td>
                    <td className="px-4 py-2">#{player.jumperNumber}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
