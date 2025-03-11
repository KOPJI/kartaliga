import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament, Player } from '../context/TournamentContext';
import { ArrowLeft, Pencil, Plus, Save, Trash2, User, UserPlus, Users } from 'lucide-react';

const TeamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTeamById, updateTeam, deleteTeam, addPlayer, deletePlayer } = useTournament();
  
  const team = getTeamById(id || '');
  const [editMode, setEditMode] = useState(false);
  const [teamData, setTeamData] = useState({
    name: team?.name || '',
    group: team?.group || 'A',
  });
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: 1,
    position: 'Penyerang',
    teamId: id || '',
  });

  useEffect(() => {
    if (!team) {
      navigate('/teams');
    }
  }, [team, navigate]);

  const handleTeamUpdate = () => {
    if (!team) return;
    
    if (teamData.name.trim() === '') {
      alert('Nama tim tidak boleh kosong');
      return;
    }
    
    updateTeam({
      ...team,
      name: teamData.name,
      group: teamData.group,
    });
    
    setEditMode(false);
  };

  const handleDeleteTeam = () => {
    if (!team) return;
    
    if (window.confirm(`Anda yakin ingin menghapus tim ${team.name}?`)) {
      deleteTeam(team.id);
      navigate('/teams');
    }
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPlayer.name.trim() === '') {
      alert('Nama pemain tidak boleh kosong');
      return;
    }
    
    addPlayer({
      name: newPlayer.name,
      number: Number(newPlayer.number),
      position: newPlayer.position,
      teamId: id || '',
    });
    
    setNewPlayer({
      name: '',
      number: 1,
      position: 'Penyerang',
      teamId: id || '',
    });
    setIsAddingPlayer(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    if (window.confirm('Anda yakin ingin menghapus pemain ini?')) {
      deletePlayer(playerId);
    }
  };

  if (!team) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/teams')}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div>
          <h1 className="text-3xl font-bold text-green-800">
            {editMode ? (
              <input
                type="text"
                value={teamData.name}
                onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                className="border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-3xl font-bold text-green-800 w-full"
              />
            ) : (
              team.name
            )}
          </h1>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-600">
              Grup {editMode ? (
                <select
                  value={teamData.group}
                  onChange={(e) => setTeamData({ ...teamData, group: e.target.value })}
                  className="border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              ) : (
                team.group
              )}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">{team.players.length} Pemain</span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        {editMode ? (
          <>
            <button
              onClick={handleTeamUpdate}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <Save className="w-5 h-5 mr-1" />
              Simpan
            </button>
            <button
              onClick={() => {
                setEditMode(false);
                setTeamData({
                  name: team.name,
                  group: team.group,
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Pencil className="w-5 h-5 mr-1" />
              Pencil Tim
            </button>
            <button
              onClick={() => setIsAddingPlayer(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <UserPlus className="w-5 h-5 mr-1" />
              Tambah Pemain
            </button>
            <button
              onClick={handleDeleteTeam}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 className="w-5 h-5 mr-1" />
              Hapus Tim
            </button>
          </>
        )}
      </div>
      
      {/* Players list */}
      <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Daftar Pemain
          </h2>
          <button
            onClick={() => setIsAddingPlayer(true)}
            className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        {team.players.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {team.players.map((player) => (
              <div
                key={player.id}
                className="p-4 flex justify-between items-center hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">
                    {player.number}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-500">{player.position}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePlayer(player.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada pemain yang terdaftar</p>
            <button
              onClick={() => setIsAddingPlayer(true)}
              className="mt-2 text-green-600 hover:underline"
            >
              Tambahkan Pemain Sekarang
            </button>
          </div>
        )}
      </div>
      
      {/* Add player modal */}
      {isAddingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tambah Pemain Baru</h2>
              <button onClick={() => setIsAddingPlayer(false)}>
                <Trash2 className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleAddPlayer}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="player-name">
                  Nama Pemain
                </label>
                <input
                  id="player-name"
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="Masukkan nama pemain"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="player-number">
                  Nomor Punggung
                </label>
                <input
                  id="player-number"
                  type="number"
                  min="1"
                  max="99"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                  value={newPlayer.number}
                  onChange={(e) => setNewPlayer({ ...newPlayer, number: parseInt(e.target.value) })}
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="player-position">
                  Posisi
                </label>
                <select
                  id="player-position"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                  value={newPlayer.position}
                  onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                >
                  <option value="Penyerang">Penyerang</option>
                  <option value="Gelandang">Gelandang</option>
                  <option value="Bertahan">Bertahan</option>
                  <option value="Kiper">Kiper</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPlayer(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
