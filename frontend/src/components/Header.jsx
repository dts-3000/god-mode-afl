import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Home, BarChart3, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-blue-600">
          <Trophy size={28} />
          God Mode
        </Link>

        <div className="flex items-center gap-8 text-sm">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
            <Home size={20} />
            Dashboard
          </Link>
          <Link to="/live-scores" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
            <span className="text-red-600 font-bold text-lg">🔴</span>
            Live
          </Link>
          <Link to="/final-stats" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
            <BarChart3 size={20} />
            Final Stats
          </Link>
          <Link to="/leaderboard" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
            <BarChart3 size={20} />
            Leaderboard
          </Link>
          <Link to="/admin" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition">
            <Settings size={20} />
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}
