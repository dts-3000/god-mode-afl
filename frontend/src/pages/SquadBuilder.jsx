import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, X } from 'lucide-react';

export default function SquadBuilder() {
  const { squadId } = useParams();
  const navigate = useNavigate();
  const [squad, setSquad] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [captain, setCaptain] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [squadName, setSquadName] = useState('');

  const DEFENDERS = 6;
  const MIDFIELDERS = 5;
  const RUCKS = 1;
  const FORWARDS = 6;
  const TOTAL = DEFENDERS + MIDFIELDERS + RUCKS + FORWARDS;

  useEffect(() => {
    fetchData();
  }, [squadId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [squadRes, playersRes] = await Promise.all([
        axios.get(`/api/squads/${squadId}`),
        axios.get('/api/players')
      ]);
      
      setSquad(squadRes.data);
      setSquadName(squadRes.data.teamName || '');
      setAllPlayers(playersRes.data.players || []);
      setSelectedPlayers(squadRes.data.players || []);
      
      const uniqueTeams = [...new Set((playersRes.data.players || []).map(p => p.teamName))].sort();
      const uniquePositions = [...new Set((playersRes.data.players || []).map(p => p.position))].sort();
      setTeams(uniqueTeams);
      setPositions(uniquePositions);
      
      const captainPlayer = (squadRes.data.players || []).find(p => p.isCaptain);
      if (captainPlayer) {
        setCaptain(captainPlayer.playerId);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Error loading squad');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = (player) => {
    if (selectedPlayers.find(p => p.playerId === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.playerId !== player.id));
      if (captain === player.id) setCaptain(null);
    } else if (selectedPlayers.length < TOTAL) {
      setSelectedPlayers([
        ...selectedPlayers,
        {
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          position: player.position,
          teamName: player.teamName,
          teamId: player.teamId,
          jumperNumber: player.jumperNumber,
          isCaptain: false
        }
      ]);
    }
  };

  const handleSetCaptain = (playerId) => {
    if (captain === playerId) {
      setCaptain(null);
      setSelectedPlayers(selectedPlayers.map(p => ({ ...p, isCaptain: false })));
    } else {
      setCaptain(playerId);
      setSelectedPlayers(selectedPlayers.map(p => ({
        ...p,
        isCaptain: p.playerId === playerId
      })));
    }
  };

  const handleRemovePlayer = (playerId) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.playerId !== playerId));
    if (captain === playerId) setCaptain(null);
  };

  const handleSetCaptain = (playerId) => {
    if (captain === playerId) {
      setCaptain(null);
      setSelectedPlayers(selectedPlayers.map(p => ({
        ...p,
        isCaptain: false
      })));
    } else {
      setCaptain(playerId);
      setSelectedPlayers(selectedPlayers.map(p => ({
        ...p,
        isCaptain: p.playerId === playerId
      })));
    }
  };

  const handleSaveSquad = async () => {
    if (selectedPlayers.length !== TOTAL) {
      alert(`You must select exactly ${TOTAL} players`);
      return;
    }
    if (!captain) {
      alert('You must select a captain');
      return;
    }

    try {
      await axios.put(`/api/squads/${squadId}/players`, {
        players: selectedPlayers
      });
      alert('✅ Squad saved!');
      navigate('/');
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleUpdateTeamName = async () => {
    try {
      await axios.put(`/api/squads/${squadId}/name`, {
        teamName: squadName
      });
      setSquad({ ...squad, teamName: squadName });
      setIsEditingName(false);
      alert('✅ Team name updated!');
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const filteredPlayers = allPlayers.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = !filterTeam || p.teamName === filterTeam;
    const matchesPosition = !filterPosition || p.position === filterPosition;
    return matchesSearch && matchesTeam && matchesPosition;
  });

  const defenderCount = selectedPlayers.filter(p => p.position.includes('Defender')).length;
  const midfielderCount = selectedPlayers.filter(p => p.position.includes('Midfielder')).length;
  const ruckCount = selectedPlayers.filter(p => p.position.includes('Ruck')).length;
  const forwardCount = selectedPlayers.filter(p => p.position.includes('Forward')).length;

  const getPositionPlayers = (positionFilter) => {
    return selectedPlayers.filter(p => p.position.includes(positionFilter));
  };

  const FieldPlayer = ({ player }) => {
    const isCap = captain === player.playerId;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Jumper number in circle */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg"
            style={{ backgroundColor: '#666' }}
            title={player.playerName}
          >
            {player.jumperNumber}
          </div>
          {isCap && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center border border-yellow-500">
              C
            </div>
          )}
        </div>
        <p className="text-xs font-semibold mt-1 text-center whitespace-nowrap text-gray-800">{player.playerName}</p>
      </div>
    );
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-3 pb-20">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-4 gap-3">
        {/* LEFT: Player Selector */}
        <div className="col-span-1 bg-white p-3 rounded-lg shadow">
          <h2 className="text-xs font-bold mb-2">Add Players</h2>
          
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-0.5 border rounded text-xs mb-1"
          />
          
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="w-full px-1 py-0.5 border rounded text-xs mb-1"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="w-full px-1 py-0.5 border rounded text-xs mb-2"
          >
            <option value="">All Positions</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          <div className="space-y-0.5 max-h-80 overflow-y-auto">
            {filteredPlayers.map(player => {
              const isSelected = selectedPlayers.find(p => p.playerId === player.id);
              
              return (
                <div
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  className={`p-1.5 rounded cursor-pointer transition text-xs border ${
                    isSelected
                      ? 'bg-blue-100 border-blue-600'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className="font-semibold">{player.firstName} {player.lastName}</p>
                  <p className="text-gray-600 text-xs">{player.position}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Field */}
        <div className="col-span-2 space-y-2">
          {/* Team Name Card */}
          <div className="bg-white p-2 rounded-lg shadow">
            {isEditingName ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  placeholder="Enter team name"
                />
                <button
                  onClick={handleUpdateTeamName}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">{squadName || 'Untitled Squad'}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Edit Name
                </button>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-white p-2 rounded-lg shadow">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold flex gap-3">
                <span>Players: {selectedPlayers.length}/{TOTAL}</span>
                <span>DEF {defenderCount}/6 | MID {midfielderCount}/5 | RUC {ruckCount}/1 | FWD {forwardCount}/6</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setSelectedPlayers([]);
                    setCaptain(null);
                  }}
                  className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                >
                  Clear
                </button>
                <button
                  onClick={handleSaveSquad}
                  disabled={selectedPlayers.length !== TOTAL || !captain}
                  className={`px-2 py-0.5 rounded text-xs font-bold text-white ${
                    selectedPlayers.length === TOTAL && captain
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Field Container */}
          <div className="bg-white p-2 rounded-lg shadow flex justify-center items-center min-h-96">
            <div className="relative w-full" style={{ maxWidth: '700px', aspectRatio: '9/10' }}>
              {/* Field Background Image */}
              <img 
                src={`${window.location.origin}/field.png`}
                alt="AFL Field"
                className="absolute inset-0 w-full h-full object-cover rounded"
                onError={(e) => {
                  console.error('Field image failed to load');
                }}
              />

              {/* Players Container - absolutely positioned */}
              <div className="absolute inset-0 flex flex-col justify-between p-8">
                
                {/* TOP DEFENDERS - 4 in top row */}
                <div className="flex justify-center gap-8">
                  {getPositionPlayers('Defender').slice(0, 4).map((p, i) => (
                    <FieldPlayer key={`def-top-${i}`} player={p} />
                  ))}
                </div>

                {/* DEFENDERS 5-6 - 2 below */}
                <div className="flex justify-center gap-32">
                  {getPositionPlayers('Defender').slice(4, 6).map((p, i) => (
                    <FieldPlayer key={`def-mid-${i}`} player={p} />
                  ))}
                </div>

                {/* MIDFIELDERS - 5 in center */}
                <div className="flex justify-center gap-6">
                  {getPositionPlayers('Midfielder').slice(0, 5).map((p, i) => (
                    <FieldPlayer key={`mid-${i}`} player={p} />
                  ))}
                </div>

                {/* RUCK - center */}
                <div className="flex justify-center">
                  {getPositionPlayers('Ruck').slice(0, 1).map((p, i) => (
                    <FieldPlayer key={`ruck-${i}`} player={p} />
                  ))}
                </div>

                {/* FORWARDS - 2 top */}
                <div className="flex justify-center gap-20">
                  {getPositionPlayers('Forward').slice(0, 2).map((p, i) => (
                    <FieldPlayer key={`fwd-top-${i}`} player={p} />
                  ))}
                </div>

                {/* FORWARDS - 4 bottom */}
                <div className="flex justify-center gap-6">
                  {getPositionPlayers('Forward').slice(2, 6).map((p, i) => (
                    <FieldPlayer key={`fwd-bot-${i}`} player={p} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Empty */}
        <div></div>
      </div>

      {/* BOTTOM: Selected Players */}
      <div className="bg-white p-2 rounded-lg shadow">
        <div className="grid grid-cols-4 gap-2">
          <div>
            <h3 className="font-bold text-xs mb-1">Def ({defenderCount}/6)</h3>
            <div className="space-y-0.5 text-xs max-h-32 overflow-y-auto">
              {getPositionPlayers('Defender').map(p => (
                <div key={p.playerId} className={`bg-gray-50 p-1 rounded flex justify-between items-start ${captain === p.playerId ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-xs">{p.playerName}</p>
                    <p className="text-gray-600 text-xs truncate">{p.teamName}</p>
                  </div>
                  <div className="flex gap-0.5 ml-1">
                    <button
                      onClick={() => handleSetCaptain(p.playerId)}
                      className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                        captain === p.playerId
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                      title="Set as captain"
                    >
                      C
                    </button>
                    <button
                      onClick={() => handleRemovePlayer(p.playerId)}
                      className="text-red-500 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xs mb-1">Mid ({midfielderCount}/5)</h3>
            <div className="space-y-0.5 text-xs max-h-32 overflow-y-auto">
              {getPositionPlayers('Midfielder').map(p => (
                <div key={p.playerId} className={`bg-gray-50 p-1 rounded flex justify-between items-start ${captain === p.playerId ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-xs">{p.playerName}</p>
                    <p className="text-gray-600 text-xs truncate">{p.teamName}</p>
                  </div>
                  <div className="flex gap-0.5 ml-1">
                    <button
                      onClick={() => handleSetCaptain(p.playerId)}
                      className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                        captain === p.playerId
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                      title="Set as captain"
                    >
                      C
                    </button>
                    <button
                      onClick={() => handleRemovePlayer(p.playerId)}
                      className="text-red-500 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xs mb-1">Ruc ({ruckCount}/1)</h3>
            <div className="space-y-0.5 text-xs max-h-32 overflow-y-auto">
              {getPositionPlayers('Ruck').map(p => (
                <div key={p.playerId} className={`bg-gray-50 p-1 rounded flex justify-between items-start ${captain === p.playerId ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-xs">{p.playerName}</p>
                    <p className="text-gray-600 text-xs truncate">{p.teamName}</p>
                  </div>
                  <div className="flex gap-0.5 ml-1">
                    <button
                      onClick={() => handleSetCaptain(p.playerId)}
                      className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                        captain === p.playerId
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                      title="Set as captain"
                    >
                      C
                    </button>
                    <button
                      onClick={() => handleRemovePlayer(p.playerId)}
                      className="text-red-500 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xs mb-1">Fwd ({forwardCount}/6)</h3>
            <div className="space-y-0.5 text-xs max-h-32 overflow-y-auto">
              {getPositionPlayers('Forward').map(p => (
                <div key={p.playerId} className={`bg-gray-50 p-1 rounded flex justify-between items-start ${captain === p.playerId ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-xs">{p.playerName}</p>
                    <p className="text-gray-600 text-xs truncate">{p.teamName}</p>
                  </div>
                  <div className="flex gap-0.5 ml-1">
                    <button
                      onClick={() => handleSetCaptain(p.playerId)}
                      className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                        captain === p.playerId
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                      title="Set as captain"
                    >
                      C
                    </button>
                    <button
                      onClick={() => handleRemovePlayer(p.playerId)}
                      className="text-red-500 flex-shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
