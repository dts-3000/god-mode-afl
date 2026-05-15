import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader } from 'lucide-react';

export default function LoadStats() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/matches');
      const matchList = response.data.matches || [];
      setMatches(matchList);
    } catch (err) {
      console.error('Error loading matches:', err);
      alert('Error loading matches from API');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = async (match) => {
    setSelectedMatch(match);
    setLoading(true);
    try {
      // Just fetch and display the raw data
      const response = await axios.get(`/api/player-stats/${match.id}/adelaide`);
      setMatchDetails(response.data);
    } catch (err) {
      console.error('Error loading match details:', err);
      setMatchDetails({ error: err.message });
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold mb-4">Load Live Stats - Debug View</h1>

        {/* Matches List */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Available Matches (2026)</h2>
          
          {loading && !selectedMatch ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader size={18} className="animate-spin" />
              Loading matches...
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded text-yellow-800">
              No matches found in API response
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3 bg-gray-50">
              {matches.map(match => (
                <button
                  key={match.id}
                  onClick={() => handleSelectMatch(match)}
                  className={`w-full text-left p-3 rounded transition border-2 ${
                    selectedMatch?.id === match.id
                      ? 'bg-blue-100 border-blue-600'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-bold">Round {match.round}: {match.homeTeam} vs {match.awayTeam}</p>
                  <p className="text-xs text-gray-600">Match ID: {match.id} | Status: {match.status}</p>
                  <p className="text-xs text-gray-600">Date: {match.date}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Match Details - Raw JSON Display */}
        {selectedMatch && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-3">Match Details & Player Stats</h2>
            
            {loading ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader size={18} className="animate-spin" />
                Loading stats...
              </div>
            ) : (
              <>
                <div className="bg-gray-900 p-4 rounded text-white font-mono text-xs max-h-96 overflow-y-auto border-2 border-gray-700">
                  <pre>{JSON.stringify(matchDetails, null, 2)}</pre>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200 text-sm text-blue-800">
                  <p><strong>Selected Match:</strong> Round {selectedMatch.round}: {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</p>
                  <p className="mt-2 text-xs">
                    This is the raw JSON response from the API. Use this to understand the data structure before we build the squad integration.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm font-bold mb-2">📊 Debug Info:</p>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>✓ Total matches loaded: <strong>{matches.length}</strong></li>
            <li>✓ Currently viewing: <strong>{selectedMatch ? `Round ${selectedMatch.round}` : 'None selected'}</strong></li>
            <li>✓ Data source: Squiggle API (2026 season)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
