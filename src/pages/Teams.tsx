import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournament, Team } from '../context/TournamentContext';
import { Pencil, Plus, Search, UserPlus, Users, X } from 'lucide-react';

const Teams = () => {
  const { teams, addTeam } = useTournament();
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', group: 'A' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newTeam.name.trim() === '') {
      alert('Nama tim tidak boleh kosong');
      return;
    }
    
    addTeam({
      name: newTeam.name,
      group: newTeam.group,
    });
    
    setNewTeam({ name: '', group: 'A' });
    setIsAddingTeam(false);
  };
  
  const filteredTeams = teams
    .filter(team => team.name && team.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(team => filterGroup === null || team.group === filterGroup);
  
  const groupCounts: Record<string, number> = {};
  teams.forEach(team => {
    if (!groupCounts[team.group]) groupCounts[team.group] = 0;
    groupCounts[team.group]++;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800 flex items-center">
            <Users className="w-8 h-8 mr-2" />
            Manajemen Tim
          </h1>
          <p className="text-gray-600">Kelola tim dan pemain yang berpartisipasi di turnamen</p>
        </div>
        
        <button
          onClick={() => setIsAddingTeam(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-1" />
          Tambah Tim
        </button>
      </div>
      
      {/* Search and filter */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari tim..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterGroup(null)}
              className={`px-3 py-1 rounded-md ${
                filterGroup === null
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            {['A', 'B', 'C', 'D'].map(group => (
              <button
                key={group}
                onClick={() => setFilterGroup(group)}
                className={`px-3 py-1 rounded-md flex items-center ${
                  filterGroup === group
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {group}
                <span className="ml-1 text-xs">({groupCounts[group] || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Add team form */}
      {isAddingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tambah Tim Baru</h2>
              <button onClick={() => setIsAddingTeam(false)}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleAddTeam}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="team-name">
                  Nama Tim
                </label>
                <input
                  id="team-name"
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Masukkan nama tim"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="team-group">
                  Grup
                </label>
                <select
                  id="team-group"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                  value={newTeam.group}
                  onChange={(e) => setNewTeam({ ...newTeam, group: e.target.value })}
                >
                  <option value="A">Grup A</option>
                  <option value="B">Grup B</option>
                  <option value="C">Grup C</option>
                  <option value="D">Grup D</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTeam(false)}
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
      
      {/* Team list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="inline-block px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs font-medium mb-2">
                  Grup {team.group}
                </div>
                <h3 className="text-lg font-semibold">{team.name}</h3>
                <div className="flex items-center mt-2 text-gray-500 text-sm">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{team.players.length} Pemain</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                  <Pencil className="h-4 w-4" />
                </span>
                <span className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100">
                  <UserPlus className="h-4 w-4" />
                </span>
              </div>
            </div>
            
            {team.players.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Pemain:</p>
                <div className="flex flex-wrap gap-1">
                  {team.players.slice(0, 5).map((player) => (
                    <span
                      key={player.id}
                      className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs"
                    >
                      {player.name} ({player.number})
                    </span>
                  ))}
                  {team.players.length > 5 && (
                    <span className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs">
                      +{team.players.length - 5} lainnya
                    </span>
                  )}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
      
      {filteredTeams.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-8 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Tidak ada tim ditemukan</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? `Tidak ada tim yang cocok dengan "${searchTerm}"`
              : filterGroup
              ? `Tidak ada tim di Grup ${filterGroup}`
              : 'Belum ada tim yang ditambahkan'}
          </p>
          <button
            onClick={() => {
              setIsAddingTeam(true);
              setSearchTerm('');
              setFilterGroup(null);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center mx-auto"
          >
            <Plus className="w-5 h-5 mr-1" />
            Tambah Tim Baru
          </button>
        </div>
      )}
    </div>
  );
};

export default Teams;
