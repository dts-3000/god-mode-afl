import React, { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import axios from 'axios';

export default function Leaderboard() {
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSquads();
  }, []);

  const fetchSquads = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/squads');
      const sorted = response.data.sort((a, b) => (b.seasonTotal || 0) - (a.seasonTotal || 0));
      setSquads(sorted);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position) => {
    if (position === 0) return <Trophy size={24} className="text-yellow-500" />;
    if (position === 1) return <Medal size={24} className="text-gray-400" />;
    if (position === 2) return <Medal size={24} className="text-orange-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-yellow-100">Season 2025 Rankings</p>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading leaderboard...</div>
      ) : squads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No squads yet. Create one to start competing!
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Rank</th>
                <th className="px-6 py-3 text-left">Squad Name</th>
                <th className="px-6 py-3 text-right">Points</th>
                <th className="px-6 py-3 text-center">Players</th>
              </tr>
            </thead>
            <tbody>
              {squads.map((squad, index) => (
                <tr
                  key={squad.id}
                  className={index < 3 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getMedalIcon(index)}
                      <span className="font-bold">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold">{squad.teamName}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    {squad.seasonTotal || 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {squad.players?.length || 0}/22
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
