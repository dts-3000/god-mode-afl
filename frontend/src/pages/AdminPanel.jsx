import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import axios from 'axios';

export default function AdminPanel() {
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
        setMessage('✅ CSV loaded!');
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
      <h1 className="text-3xl font-bold">⚙️ Admin - CSV Upload</h1>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-2xl font-bold">Upload Match Stats (CSV)</h2>

        <div>
          <label className="block text-sm font-bold mb-2">Match ID</label>
          <input type="text" value={matchId} onChange={(e) => setMatchId(e.target.value)} placeholder="Get from Live Scores (e.g., 8706)" className="w-full px-3 py-2 border rounded-lg" />
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

        <button onClick={handleUploadStats} disabled={loading || !matchId || !csvData} className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white ${loading || !matchId || !csvData ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
          <Upload size={20} />
          {loading ? 'Processing...' : 'Upload Stats'}
        </button>

        {message && <div className={`p-3 rounded-lg text-sm font-bold ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message}</div>}

        <div className="bg-gray-50 p-4 rounded text-sm">
          <p className="font-bold mb-2">CSV Format:</p>
          <pre className="font-mono text-xs">PlayerName,JumperNumber,Team,Handballs,Kicks,Marks,Tackles,Goals,Behinds,HitOuts,Clearances,Inside50s,GoalAssists</pre>
        </div>
      </div>
    </div>
  );
}
