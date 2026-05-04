import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function AdminPanel() {
  const [players, setPlayers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    aflId: '',
    firstName: '',
    lastName: '',
    position: '',
    teamId: '',
    teamName: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/players');
      setPlayers(response.data.players || []);
    } catch (err) {
      console.error('Error fetching players:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/players', formData);
      alert('✅ Player added!');
      setFormData({
        aflId: '',
        firstName: '',
        lastName: '',
        position: '',
        teamId: '',
        teamName: ''
      });
      setShowAddForm(false);
      fetchPlayers();
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeletePlayer = async (aflId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axios.delete(`/api/players/${aflId}`);
        alert('✅ Player deleted!');
        fetchPlayers();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleStatusChange = async (aflId, newStatus) => {
    try {
      await axios.put(`/api/players/${aflId}`, { status: newStatus });
      fetchPlayers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-purple-100">Manage players and league settings</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Players ({players.length})</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Plus size={20} /> Add Player
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddPlayer} className="mb-6 p-4 bg-gray-50 rounded grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="AFL ID (e.g., john-doe)"
              value={formData.aflId}
              onChange={(e) => setFormData({ ...formData, aflId: e.target.value })}
              required
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Position (e.g., Midfielder)"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Team ID (e.g., rich)"
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              required
              className="px-4 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Team Name (e.g., Richmond)"
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              required
              className="px-4 py-2 border rounded"
            />
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Loading players...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Position</th>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold">
                      {player.firstName} {player.lastName}
                    </td>
                    <td className="px-4 py-2">{player.position}</td>
                    <td className="px-4 py-2">{player.teamName}</td>
                    <td className="px-4 py-2">
                      <select
                        value={player.status}
                        onChange={(e) => handleStatusChange(player.aflId, e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option>ACTIVE</option>
                        <option>INJURED</option>
                        <option>SUSPENDED</option>
                        <option>DELISTED</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDeletePlayer(player.aflId)}
                        className="text-red-600 hover:text-red-800"
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
