import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament, Player } from '../context/TournamentContext';
import { ArrowLeft, Pencil, Plus, Save, Trash2, User, UserPlus, Users, Loader, X } from 'lucide-react';

const TeamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTeamById, updateTeam, deleteTeam, addPlayer, deletePlayer } = useTournament();
  
  const team = getTeamById(id || '');
  const [editMode, setEditMode] = useState(false);
  const [teamData, setTeamData] = useState({
    name: team?.name || '',
    group: team?.group || 'A',
    logo: team?.logo || ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: 1,
    position: 'Penyerang',
    photo: ''
  });
  const [playerPhotoFile, setPlayerPhotoFile] = useState<File | null>(null);
  const [uploadingPlayerPhoto, setUploadingPlayerPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setTeamData({
        name: team.name,
        group: team.group,
        logo: team.logo || ''
      });
    }
  }, [team]);

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    setUploadingLogo(true);
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result as string;
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Ukuran maksimum yang lebih kecil (200px)
            const MAX_SIZE = 200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round(height * (MAX_SIZE / width));
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round(width * (MAX_SIZE / height));
                height = MAX_SIZE;
              }
            }
            
            // Pastikan ukuran minimum
            const MIN_SIZE = 50;
            if (width < MIN_SIZE) {
              height = Math.round(height * (MIN_SIZE / width));
              width = MIN_SIZE;
            }
            if (height < MIN_SIZE) {
              width = Math.round(width * (MIN_SIZE / height));
              height = MIN_SIZE;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Tambahkan background putih untuk gambar PNG transparan
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
            }
            
            // Kompresi yang lebih agresif (60%)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            
            setUploadingLogo(false);
            resolve(compressedBase64);
          };
          
          img.onerror = () => {
            console.error('Error loading image for compression');
            setErrorMessage('Gagal memproses logo. Silakan coba lagi.');
            setUploadingLogo(false);
            reject(null);
          };
        };
        
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          setErrorMessage('Gagal membaca file logo. Silakan coba lagi.');
          setUploadingLogo(false);
          reject(null);
        };
      });
    } catch (error) {
      console.error('Error in logo upload:', error);
      setErrorMessage('Terjadi kesalahan saat mengunggah logo.');
      setUploadingLogo(false);
      return null;
    }
  };

  const handleTeamUpdate = async () => {
    if (!team) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      let logoBase64 = teamData.logo;
      
      if (logoFile) {
        logoBase64 = await handleLogoUpload(logoFile);
        if (!logoBase64) {
          setErrorMessage('Gagal memproses logo. Silakan coba lagi.');
          setIsSubmitting(false);
          return;
        }
      }
      
      await updateTeam({
        ...team,
        name: teamData.name,
        group: teamData.group,
        logo: logoBase64
      });
      
      setEditMode(false);
      setLogoFile(null);
    } catch (error) {
      console.error('Error updating team:', error);
      setErrorMessage('Gagal mengupdate tim. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus tim ${team?.name}?`)) {
      deleteTeam(team?.id || '');
      navigate('/teams');
    }
  };

  const handlePlayerPhotoUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    setUploadingPlayerPhoto(true);
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result as string;
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Ukuran maksimum yang lebih kecil (300px)
            const MAX_SIZE = 300;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round(height * (MAX_SIZE / width));
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round(width * (MAX_SIZE / height));
                height = MAX_SIZE;
              }
            }
            
            // Pastikan ukuran minimum
            const MIN_SIZE = 50;
            if (width < MIN_SIZE) {
              height = Math.round(height * (MIN_SIZE / width));
              width = MIN_SIZE;
            }
            if (height < MIN_SIZE) {
              width = Math.round(width * (MIN_SIZE / height));
              height = MIN_SIZE;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Tambahkan background putih untuk gambar PNG transparan
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
            }
            
            // Kompresi yang lebih agresif (65%)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
            
            setUploadingPlayerPhoto(false);
            resolve(compressedBase64);
          };
          
          img.onerror = () => {
            console.error('Error loading image for compression');
            setErrorMessage('Gagal memproses foto pemain. Silakan coba lagi.');
            setUploadingPlayerPhoto(false);
            reject(null);
          };
        };
        
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          setErrorMessage('Gagal membaca file foto. Silakan coba lagi.');
          setUploadingPlayerPhoto(false);
          reject(null);
        };
      });
    } catch (error) {
      console.error('Error in player photo upload:', error);
      setErrorMessage('Terjadi kesalahan saat mengunggah foto pemain.');
      setUploadingPlayerPhoto(false);
      return null;
    }
  };

  const handleAddPlayer = async (e: any) => {
    e.preventDefault();
    
    if (newPlayer.name.trim() === '') {
      setErrorMessage('Nama pemain tidak boleh kosong');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      let photoBase64 = newPlayer.photo;
      
      // Jika ada file foto yang diunggah, proses terlebih dahulu
      if (playerPhotoFile) {
        photoBase64 = await handlePlayerPhotoUpload(playerPhotoFile);
        if (!photoBase64) {
          // Jika gagal memproses foto, lanjutkan tanpa foto
          console.warn('Gagal memproses foto pemain, melanjutkan tanpa foto');
        }
      }
      
      // Tambahkan pemain dengan foto yang sudah diproses
      await addPlayer({
        name: newPlayer.name,
        number: newPlayer.number,
        position: newPlayer.position,
        teamId: team?.id || '',
        photo: photoBase64
      });
      
      // Reset form setelah berhasil
      setNewPlayer({
        name: '',
        number: 1,
        position: 'Penyerang',
        photo: ''
      });
      setPlayerPhotoFile(null);
      setIsAddingPlayer(false);
    } catch (error) {
      console.error('Error adding player:', error);
      setErrorMessage('Gagal menambahkan pemain. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlayer = (playerId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pemain ini?')) {
      deletePlayer(playerId);
    }
  };

  if (!team) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/teams')}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Kembali ke Daftar Tim
        </button>
        
        <div className="flex gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit Tim
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  setTeamData({
                    name: team?.name || '',
                    group: team?.group || 'A',
                    logo: team?.logo || ''
                  });
                  setLogoFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleTeamUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                disabled={isSubmitting || uploadingLogo}
              >
                {isSubmitting || uploadingLogo ? (
                  <>
                    <Loader className="w-4 h-4 mr-1 animate-spin" />
                    {uploadingLogo ? 'Mengunggah...' : 'Menyimpan...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Simpan
                  </>
                )}
              </button>
            </>
          )}
          
          <button
            onClick={handleDeleteTeam}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Hapus Tim
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Logo Tim */}
          <div className="flex items-start space-x-4">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
              {editMode ? (
                <label className="w-full h-full cursor-pointer flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        setTeamData({
                          ...teamData,
                          logo: URL.createObjectURL(file)
                        });
                      }
                    }}
                  />
                  {teamData.logo ? (
                    <img
                      src={logoFile ? URL.createObjectURL(logoFile) : teamData.logo}
                      alt="Logo Tim"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Plus className="w-8 h-8 mx-auto text-gray-400" />
                      <span className="text-sm text-gray-500">Upload Logo</span>
                    </div>
                  )}
                </label>
              ) : (
                teamData.logo ? (
                  <img
                    src={teamData.logo}
                    alt="Logo Tim"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <User className="w-8 h-8 mx-auto text-gray-400" />
                    <span className="text-sm text-gray-500">Tidak ada logo</span>
                  </div>
                )
              )}
            </div>
            
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Nama Tim
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={teamData.name}
                    onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Masukkan nama tim"
                  />
                ) : (
                  <p className="text-gray-900">{teamData.name || 'Tidak ada nama'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Grup
                </label>
                {editMode ? (
                  <select
                    value={teamData.group}
                    onChange={(e) => setTeamData({ ...teamData, group: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="A">Grup A</option>
                    <option value="B">Grup B</option>
                    <option value="C">Grup C</option>
                    <option value="D">Grup D</option>
                  </select>
                ) : (
                  <p className="text-gray-900">Grup {teamData.group || 'Tidak ada grup'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsAddingPlayer(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <UserPlus className="w-5 h-5 mr-1" />
          Tambah Pemain
        </button>
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
                  {player.photo ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img 
                        src={player.photo} 
                        alt={player.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">
                      {player.number}
                    </div>
                  )}
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
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleAddPlayer}>
              {errorMessage && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {errorMessage}
                </div>
              )}
              
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
              
              <div className="mb-4">
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
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="player-photo">
                  Foto Pemain (Opsional)
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
                            setPlayerPhotoFile(file);
                          }
                        }}
                      />
                      <Plus className="h-5 w-5 mr-2" />
                      {uploadingPlayerPhoto ? 'Mengunggah...' : 'Pilih Foto'}
                    </label>
                  </div>
                  {(playerPhotoFile || newPlayer.photo) && (
                    <div className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center overflow-hidden">
                      {playerPhotoFile ? (
                        <img 
                          src={URL.createObjectURL(playerPhotoFile)} 
                          alt="Preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        newPlayer.photo && (
                          <img 
                            src={newPlayer.photo} 
                            alt="Preview" 
                            className="max-w-full max-h-full object-contain" 
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPlayer(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  disabled={isSubmitting || uploadingPlayerPhoto}
                >
                  {isSubmitting || uploadingPlayerPhoto ? (
                    <>
                      <Loader className="w-4 h-4 mr-1 animate-spin" />
                      {uploadingPlayerPhoto ? 'Mengunggah...' : 'Menyimpan...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah Pemain
                    </>
                  )}
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
