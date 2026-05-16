import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/appStore';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import SquadBuilder from './pages/SquadBuilder';
import Leaderboard from './pages/Leaderboard';
import MatchStats from './pages/MatchStats';
import LoadStats from './pages/LoadStats';
import LiveScores from './pages/LiveScores';
import LiveDFSStats from './pages/LiveDFSStats';
import FinalStats from './pages/FinalStats';
import CSVStats from './pages/CSVStats';
import AFLStats from './pages/AFLStats';
import AdminPanel from './pages/AdminPanel';

function App() {
  const setPlayers = useStore((state) => state.setPlayers);

  useEffect(() => {
    // Fetch players on load
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        const data = await response.json();
        setPlayers(data.players || []);
      } catch (err) {
        console.error('Error loading players:', err);
      }
    };

    fetchPlayers();

    // Set user ID if not exists
    const userId = localStorage.getItem('userId');
    if (!userId) {
      localStorage.setItem('userId', 'user-' + Math.random().toString(36).substr(2, 9));
    }
  }, [setPlayers]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/squad/:squadId" element={<SquadBuilder />} />
            <Route path="/match-stats" element={<MatchStats />} />
            <Route path="/load-stats" element={<LoadStats />} />
            <Route path="/live-scores" element={<LiveScores />} />
            <Route path="/live-dfs" element={<LiveDFSStats />} />
            <Route path="/final-stats" element={<FinalStats />} />
            <Route path="/csv-stats" element={<CSVStats />} />
            <Route path="/afl-stats" element={<AFLStats />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
