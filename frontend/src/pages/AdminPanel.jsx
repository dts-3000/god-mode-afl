import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import axios from 'axios';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('csv');
  const [csvData, setCsvData] = useState('');
  const [matchId, setMatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvData(event.target?.result || '');
        setMessage('✅ CSV loaded! Click "Upload Stats" to process.');
      };
      reader.readAsText(file);
    }
  };

  const handleUploadStats = async () => {
    if (!matchId || !csvData) {
      setMessage('❌ Enter Match ID and upload CSV');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/admin/upload-match-stats', { matchId, csvData });
      setMessage(`✅ ${response.data.message}`);
      setCsvData('');
      setMatchId('');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-3xl font-bold">⚙️ Admin Panel</h1>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 font-bold transition ${activeTab === 'csv' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          📤 CSV Upload
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 font-bold transition ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          ℹ️ Guide
        </button>
      </div>

      {activeTab === 'csv' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-bold">Upload Match Stats (CSV)</h2>

          <div>
            <label className="block text-sm font-bold mb-2">Match ID</label>
            <input type="text" value={matchId} onChange={(e) => setMatchId(e.target.value)} placeholder="e.g., 8706 (from Live Scores)" className="w-full px-3 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">CSV File</label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="w-full" />
            </div>
          </div>

          {csvData && (
            <div>
              <label className="block text-sm font-bold mb-2">Preview</label>
              <textarea value={csvData} onChange={(e) => setCsvData(e.target.value)} rows={5} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" />
            </div>
          )}

          <button onClick={handleUploadStats} disabled={loading || !matchId || !csvData} className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white ${loading || !matchId || !csvData ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            <Upload size={20} />
            {loading ? 'Processing...' : 'Upload Stats'}
          </button>

          {message && <div className={`p-3 rounded-lg text-sm font-bold ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</div>}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-bold">CSV Format Guide</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded text-sm font-mono overflow-x-auto">
              <p className="font-bold mb-2">Required Columns:</p>
              <pre>PlayerName,JumperNumber,Team,Handballs,Kicks,Marks,Tackles,Goals,Behinds,HitOuts,Clearances,Inside50s,GoalAssists</pre>
            </div>

            <div className="bg-gray-50 p-4 rounded text-sm font-mono overflow-x-auto">
              <p className="font-bold mb-2">Example:</p>
              <pre>{`PlayerName,JumperNumber,Team,Handballs,Kicks,Marks,Tackles,Goals,Behinds,HitOuts,Clearances,Inside50s,GoalAssists
Marcus Bontempelli,15,Western Bulldogs,22,14,8,6,2,0,0,3,4,1
Dustin Martin,17,Richmond,18,12,5,7,1,1,0,2,3,0`}</pre>
            </div>

            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="font-bold text-blue-900 mb-2">📋 How It Works:</p>
              <ol className="text-sm text-blue-900 space-y-1 list-decimal list-inside">
                <li>Create CSV with player stats</li>
                <li>Get Match ID from Live Scores (Round 10: Team A vs Team B = ID 8706)</li>
                <li>Upload CSV here with that Match ID</li>
                <li>Click "Final Stats" → Stats auto-load!</li>
                <li>Save to squad → Points calculated</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
