import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTournament, Team } from '../context/TournamentContext';
import { Pencil, Plus, Search, UserPlus, Users, X, Trash2, Loader, Check, CircleAlert } from 'lucide-react';

const Teams = () => {
  const navigate = useNavigate();
  const { teams, addTeam, addPlayer, deleteTeam, loading } = useTournament();
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', group: 'A', logo: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: 1,
    position: 'Penyerang'
  });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menampilkan pesan sukses ketika data berhasil diambil
  useEffect(() => {
    if (!loading && teams.length > 0) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, teams]);

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    setUploadingLogo(true);
    try {
      // Konversi file gambar ke base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = () => {
          const base64Logo = reader.result as string;
          setUploadingLogo(false);
          resolve(base64Logo);
        };
        
        reader.onerror = (error) => {
          console.error('Error converting logo to base64:', error);
          alert('Gagal memproses logo. Silakan coba lagi.');
          setUploadingLogo(false);
          reject(null);
        };
      });
    } catch (error) {
      console.error('Error handling logo:', error);
      alert('Gagal memproses logo. Silakan coba lagi.');
      setUploadingLogo(false);
      return null;
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error message
    setErrorMessage(null);
    
    if (newTeam.name.trim() === '') {
      setErrorMessage('Nama tim tidak boleh kosong');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let logoBase64 = newTeam.logo;
      
      // Jika ada file logo yang diunggah, proses terlebih dahulu
      if (logoFile) {
        logoBase64 = await handleLogoUpload(logoFile);
        if (!logoBase64) {
          // Jika gagal memproses logo, hentikan proses
          setErrorMessage('Gagal memproses logo. Silakan coba lagi.');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Tambahkan tim dengan logo yang sudah diproses
      await addTeam({
        name: newTeam.name,
        group: newTeam.group,
        logo: logoBase64
      });
      
      // Reset form setelah berhasil
      setNewTeam({ name: '', group: 'A', logo: '' });
      setLogoFile(null);
      setIsAddingTeam(false);
      
      // Tampilkan pesan sukses
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error adding team:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menambahkan tim. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeamId) return;
    
    if (newPlayer.name.trim() === '') {
      alert('Nama pemain tidak boleh kosong');
      return;
    }
    
    addPlayer({
      name: newPlayer.name,
      number: newPlayer.number,
      position: newPlayer.position,
      teamId: selectedTeamId
    });
    
    setNewPlayer({
      name: '',
      number: 1,
      position: 'Penyerang'
    });
    setIsAddingPlayer(false);
    setSelectedTeamId(null);
  };

  const openAddPlayerModal = (teamId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTeamId(teamId);
    setIsAddingPlayer(true);
  };

  const openDeleteConfirmation = (team: Team, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTeamToDelete(team);
    setIsConfirmingDelete(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteTeam(teamToDelete.id);
      setIsConfirmingDelete(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Gagal menghapus tim. Silakan coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter teams based on search term and group filter
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name ? team.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesGroup = filterGroup === null || team.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  // Count teams per group
  const groupCounts = teams.reduce((counts, team) => {
    if (team.group) {
      counts[team.group] = (counts[team.group] || 0) + 1;
    }
    return counts;
  }, {} as Record<string, number>);

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
      
      {/* Loading indicator */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center">
          <Loader className="w-5 h-5 mr-2 animate-spin" />
          <span>Memuat data tim dari database...</span>
        </div>
      )}

      {/* Success message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
          <Check className="w-5 h-5 mr-2" />
          <span>Data tim berhasil dimuat dari Firestore!</span>
        </div>
      )}
      
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
              {errorMessage && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
                  <CircleAlert className="w-5 h-5 mr-2" />
                  <span>{errorMessage}</span>
                </div>
              )}
              
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
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="team-logo">
                  Logo Tim
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLogoFile(file);
                          }
                        }}
                      />
                      <Plus className="h-5 w-5 mr-2" />
                      {uploadingLogo ? 'Mengunggah...' : 'Pilih Logo'}
                    </label>
                  </div>
                  {(logoFile || newTeam.logo) && (
                    <div className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center overflow-hidden">
                      {logoFile ? (
                        <img 
                          src={URL.createObjectURL(logoFile)} 
                          alt="Preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        newTeam.logo && (
                          <img 
                            src={newTeam.logo} 
                            alt="Preview" 
                            className="max-w-full max-h-full object-contain" 
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
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
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  disabled={isSubmitting || uploadingLogo}
                >
                  {isSubmitting || uploadingLogo ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      {uploadingLogo ? 'Mengunggah...' : 'Menyimpan...'}
                    </>
                  ) : (
                    'Simpan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add player form */}
      {isAddingPlayer && selectedTeamId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tambah Pemain Baru</h2>
              <button onClick={() => {
                setIsAddingPlayer(false);
                setSelectedTeamId(null);
              }}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
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
                  onClick={() => {
                    setIsAddingPlayer(false);
                    setSelectedTeamId(null);
                  }}
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
      
      {/* Delete confirmation modal */}
      {isConfirmingDelete && teamToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-600">Konfirmasi Hapus Tim</h2>
              <button onClick={() => {
                setIsConfirmingDelete(false);
                setTeamToDelete(null);
              }}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Apakah Anda yakin ingin menghapus tim <strong>{teamToDelete.name || 'Tim Tanpa Nama'}</strong>?
              </p>
              <p className="text-gray-700 mb-4">
                Tindakan ini akan menghapus tim beserta {teamToDelete.players ? teamToDelete.players.length : 0} pemain yang terdaftar. Data pertandingan yang terkait dengan tim ini juga akan terpengaruh.
              </p>
              <p className="text-red-600 font-medium">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingDelete(false);
                  setTeamToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 mr-2" />
                    Hapus Tim
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Team list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow p-4 relative"
          >
            <Link
              to={`/teams/${team.id}`}
              className="block"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-block px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs font-medium mb-2">
                    Grup {team.group || 'N/A'}
                  </div>
                  {team.logo && (
                    <div className="w-10 h-10 mb-2 overflow-hidden">
                      <img src={team.logo} alt={team.name || 'Tim'} className="w-full h-full object-contain" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{team.name || 'Tim Tanpa Nama'}</h3>
                  <div className="flex items-center mt-2 text-gray-500 text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{team.players ? team.players.length : 0} Pemain</span>
                  </div>
                </div>
              </div>
            </Link>
            
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={(e) => openAddPlayerModal(team.id, e)}
                className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                title="Tambah Pemain"
              >
                <UserPlus className="h-4 w-4" />
              </button>
              <Link
                to={`/teams/${team.id}`}
                className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                aria-label="Edit Tim"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={(e) => openDeleteConfirmation(team, e)}
                className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                title="Hapus Tim"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {loading && filteredTeams.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-8 text-center">
          <Loader className="h-12 w-12 text-green-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Memuat Data Tim</h3>
          <p className="text-gray-500 mb-4">
            Sedang mengambil data tim dari Firestore...
          </p>
        </div>
      )}
      
      {!loading && filteredTeams.length === 0 && (
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
