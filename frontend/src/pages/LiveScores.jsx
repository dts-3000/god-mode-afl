import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader, Wifi, WifiOff } from 'lucide-react';

export default function LiveScores() {
  const navigate = useNavigate();
  const [liveGames, setLiveGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const eventSourceRef = useRef(null);

  useEffect(() => {
    connectToEventAPI();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const connectToEventAPI = () => {
    try {
      setConnectionStatus('Connecting to live feed...');
      
      // Connect to Squiggle Event API
      const eventSource = new EventSource('https://sse.squiggle.com.au/games');
      eventSourceRef.current = eventSource;

      // Handle initial games list
      eventSource.addEventListener('games', (event) => {
        try {
          const games = JSON.parse(event.data);
          setLiveGames(games);
          setConnected(true);
          setConnectionStatus(`Connected (${games.length} games)`);
        } catch (err) {
          console.error('Error parsing games:', err);
        }
      });

      // Handle new game added
      eventSource.addEventListener('addGame', (event) => {
        try {
          const game = JSON.parse(event.data);
          setLiveGames(prev => {
            // Check if game already exists
            const exists = prev.find(g => g.id === game.id);
            if (exists) {
              // Update existing game
              return prev.map(g => g.id === game.id ? game : g);
            } else {
              // Add new game
              return [...prev, game];
            }
          });
          setConnectionStatus(`Connected (${liveGames.length + 1} games)`);
        } catch (err) {
          console.error('Error parsing addGame:', err);
        }
      });

      // Handle game updates
      eventSource.addEventListener('updateGame', (event) => {
        try {
          const game = JSON.parse(event.data);
          setLiveGames(prev =>
            prev.map(g => g.id === game.id ? game : g)
          );
        } catch (err) {
          console.error('Error parsing updateGame:', err);
        }
      });

      // Handle game ended
      eventSource.addEventListener('removeGame', (event) => {
        try {
          const game = JSON.parse(event.data);
          setLiveGames(prev => prev.filter(g => g.id !== game.id));
          
          // If selected game ended, deselect it
          if (selectedGame?.id === game.id) {
            setSelectedGame(null);
          }
        } catch (err) {
          console.error('Error parsing removeGame:', err);
        }
      });

      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        setConnected(false);
        setConnectionStatus('Connection lost. Reconnecting...');
        eventSource.close();
        
        // Auto-reconnect after 3 seconds
        setTimeout(connectToEventAPI, 3000);
      };
    } catch (err) {
      console.error('Error connecting to Event API:', err);
      setConnectionStatus('Failed to connect');
    }
  };

  const getTeamName = (teamId) => {
    const teams = {
      1: 'Adelaide', 2: 'Brisbane', 3: 'Carlton', 4: 'Collingwood',
      5: 'Essendon', 6: 'Fremantle', 7: 'Geelong', 8: 'Gold Coast',
      9: 'GWS', 10: 'Hawthorn', 11: 'Melbourne', 12: 'North Melbourne',
      13: 'Port Adelaide', 14: 'Richmond', 15: 'St Kilda', 16: 'Sydney',
      17: 'West Coast', 18: 'Western Bulldogs'
    };
    return teams[teamId] || `Team ${teamId}`;
  };

  const formatTime = (timestr) => {
    return timestr || 'TBD';
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">🔴 Live Scores</h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="text-xs font-bold">{connectionStatus}</span>
          </div>
        </div>

        {/* Live Games List */}
        <div className="space-y-3">
          {liveGames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Loader size={32} className="mx-auto mb-2 animate-spin" />
              <p>Waiting for live games...</p>
              <p className="text-xs mt-2">Connected to Squiggle Event API</p>
            </div>
          ) : (
            liveGames.map(game => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  selectedGame?.id === game.id
                    ? 'bg-blue-100 border-blue-600'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold">Round {game.round}: {getTeamName(game.hteam)} vs {getTeamName(game.ateam)}</p>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${
                    game.is_final ? 'bg-gray-400 text-white' : 'bg-red-500 text-white animate-pulse'
                  }`}>
                    {game.is_final ? 'FINAL' : 'LIVE'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <p className="text-xs text-gray-600">{getTeamName(game.hteam)}</p>
                    <p className="text-2xl font-bold">{game.hscore}</p>
                    <p className="text-xs text-gray-600">{game.hgoals}G {game.hbehinds}B</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 font-bold">{formatTime(game.timestr)}</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">vs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{getTeamName(game.ateam)}</p>
                    <p className="text-2xl font-bold">{game.ascore}</p>
                    <p className="text-xs text-gray-600">{game.agoals}G {game.abehinds}B</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600">{game.venue} • Updated: {new Date(game.updated).toLocaleTimeString()}</p>
              </button>
            ))
          )}
        </div>

        {/* Selected Game Details */}
        {selectedGame && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
            <h2 className="text-lg font-bold mb-4">
              {getTeamName(selectedGame.hteam)} vs {getTeamName(selectedGame.ateam)}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded">
                <p className="font-bold mb-2">{getTeamName(selectedGame.hteam)}</p>
                <div className="space-y-1 text-sm">
                  <p>Score: <span className="font-bold">{selectedGame.hscore}</span></p>
                  <p>Goals: <span className="font-bold">{selectedGame.hgoals}</span></p>
                  <p>Behinds: <span className="font-bold">{selectedGame.hbehinds}</span></p>
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="font-bold mb-2">{getTeamName(selectedGame.ateam)}</p>
                <div className="space-y-1 text-sm">
                  <p>Score: <span className="font-bold">{selectedGame.ascore}</span></p>
                  <p>Goals: <span className="font-bold">{selectedGame.agoals}</span></p>
                  <p>Behinds: <span className="font-bold">{selectedGame.abehinds}</span></p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Time:</strong> {formatTime(selectedGame.timestr)}</p>
              <p><strong>Venue:</strong> {selectedGame.venue}</p>
              <p><strong>Progress:</strong> {selectedGame.complete}% complete</p>
              <p><strong>Last Updated:</strong> {new Date(selectedGame.updated).toLocaleTimeString()}</p>
              {selectedGame.winner && (
                <p><strong>Winner:</strong> {getTeamName(selectedGame.winner)}</p>
              )}
            </div>

            <button
              onClick={() => setSelectedGame(null)}
              className="mt-4 w-full bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-bold transition"
            >
              Close Details
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-bold mb-2">⚡ Real-Time Live Feed:</p>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>✓ Connected to Squiggle Event API (SSE)</li>
            <li>✓ Real-time score updates as they happen</li>
            <li>✓ Auto-reconnects if connection drops</li>
            <li>✓ Shows games in progress or starting soon</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
