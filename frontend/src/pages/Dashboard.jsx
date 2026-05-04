import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../store/appStore';
import { Plus, Trophy, Users } from 'lucide-react';

export default function Dashboard() {
  const [squads, setSquads] = useState([]);
  const [newSquadName, setNewSquadName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchSquads();
  }, []);

  const fetchSquads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/squads?userId=${userId}`);
      setSquads(response.data);
    } catch (err) {
      console.error('Error fetching squads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSquad = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/squads', {
        userId,
        teamName: newSquadName,
        season: new Date().getFullYear()
      });
      setSquads([response.data, ...squads]);
      setNewSquadName('');
      setShowCreateForm(false);
      alert('✅ Squad created!');
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-2">Welcome to God Mode</h1>
        <p className="text-blue-100">Unlimited AFL Fantasy - No salary cap. Pick your best 22 players.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Squads</p>
              <p className="text-3xl font-bold">{squads.length}</p>
            </div>
            <Users size={32} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Current Round</p>
              <p className="text-3xl font-bold">1</p>
            </div>
            <Trophy size={32} className="text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Season</p>
              <p className="text-3xl font-bold">2025</p>
            </div>
            <Trophy size={32} className="text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Squads</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Plus size={20} /> New Squad
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSquad} className="mb-6 p-4 bg-gray-50 rounded">
            <input
              type="text"
              placeholder="Squad name (e.g., My Legends)"
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded mb-4"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Loading squads...</p>
        ) : squads.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No squads yet. Create one to get started!</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {squads.map(squad => (
              <div key={squad.id} className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2">{squad.teamName}</h3>
                <p className="text-sm text-blue-700 mb-3">Season {squad.season}</p>
                <Link
                  to={`/squad/${squad.id}`}
                  className="block bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 font-semibold"
                >
                  Edit Squad
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
