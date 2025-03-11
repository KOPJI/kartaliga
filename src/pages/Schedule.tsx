import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Calendar, Trash2, Loader, Clock, MapPin, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateIndonesiaFull, formatDateIndonesia, convertToISODate, getTodayIndonesiaFormat } from '../utils/dateUtils';

const Schedule = () => {
  const { matches, generateSchedule, clearSchedule, teams, loading } = useTournament();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [startDateDisplay, setStartDateDisplay] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('Mempersiapkan pembuatan jadwal...');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Mengelompokkan pertandingan berdasarkan tanggal
  const matchesByDate = matches.reduce((acc, match) => {
    if (!acc[match.date]) {
      acc[match.date] = [];
    }
    acc[match.date].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  // Mengurutkan tanggal
  const sortedDates = Object.keys(matchesByDate).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const handleOpenModal = () => {
    try {
      setShowModal(true);
      setError(null);
      
      // Set default tanggal ke hari ini
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setStartDate(formattedDate);
      
      // Set tampilan tanggal dalam format Indonesia
      const todayIndonesia = getTodayIndonesiaFormat();
      setStartDateDisplay(todayIndonesia);
    } catch (error) {
      console.error('Error saat membuka modal:', error);
      setError('Terjadi kesalahan saat membuka modal');
    }
  };

  const handleCloseModal = () => {
    if (!isGenerating) {
      setShowModal(false);
      setError(null);
      setLoadingMessage('Mempersiapkan pembuatan jadwal...');
      setLoadingProgress(0);
    }
  };

  const handleDateChange = (e: any) => {
    try {
      const indonesiaDate = e.target.value;
      setStartDateDisplay(indonesiaDate);
      
      // Konversi ke format ISO untuk backend
      const isoDate = convertToISODate(indonesiaDate);
      
      if (isoDate) {
        setStartDate(isoDate);
        setError(null);
      } else {
        setStartDate('');
        setError('Format tanggal tidak valid. Gunakan format DD/MM/YYYY');
      }
    } catch (error) {
      console.error('Error saat mengubah tanggal:', error);
      setError('Terjadi kesalahan saat mengubah tanggal');
      setStartDate('');
    }
  };

  const updateLoadingProgress = () => {
    setLoadingProgress(prev => {
      if (prev >= 90) return prev;
      return prev + 10;
    });
    
    const messages = [
      'Mempersiapkan pembuatan jadwal...',
      'Mengatur grup dan tim...',
      'Menghitung jarak antar pertandingan...',
      'Menyusun jadwal pertandingan...',
      'Memvalidasi jadwal...',
      'Menyimpan jadwal ke database...'
    ];
    
    setLoadingMessage(messages[Math.floor(loadingProgress / 20)] || messages[messages.length - 1]);
  };

  const handleGenerateSchedule = async () => {
    try {
      // Reset state
      setIsGenerating(true);
      setError(null);
      setSuccess(null);
      setLoadingProgress(0);
      setLoadingMessage('Mempersiapkan pembuatan jadwal...');
      
      // Validasi tanggal
      if (!startDate) {
        throw new Error('Silakan pilih tanggal mulai turnamen');
      }

      // Mulai interval untuk update progress dengan interval lebih cepat
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          // Tingkatkan progress lebih cepat
          return prev + 2;
        });
        
        const messages = [
          'Mempersiapkan pembuatan jadwal...',
          'Mengatur grup dan tim...',
          'Menghitung jarak antar pertandingan...',
          'Menyusun jadwal pertandingan...',
          'Memvalidasi jadwal...',
          'Menyimpan jadwal ke database...'
        ];
        
        setLoadingMessage(messages[Math.floor(loadingProgress / 20)] || messages[messages.length - 1]);
      }, 300); // Update setiap 300ms
      
      try {
        // Jalankan pembuatan jadwal
        await generateSchedule(startDate);
        
        // Jika berhasil, update progress ke 100%
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setLoadingMessage('Jadwal berhasil dibuat!');
        
        // Tambahkan delay sebelum menutup modal
        setTimeout(() => {
          setSuccess('Jadwal berhasil dibuat!');
          setShowModal(false);
          setIsGenerating(false);
          setLoadingProgress(0);
          setLoadingMessage('Mempersiapkan pembuatan jadwal...');
        }, 1000);
      } catch (error: any) {
        clearInterval(progressInterval);
        throw error;
      }
    } catch (err: any) {
      console.error('Error saat membuat jadwal:', err);
      setError(err.message || 'Terjadi kesalahan saat membuat jadwal');
      setIsGenerating(false);
      setLoadingProgress(0);
      setLoadingMessage('Mempersiapkan pembuatan jadwal...');
    }
  };

  const handleClearSchedule = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);
      setLoadingMessage('Menghapus jadwal...');
      
      // Tambahkan timeout untuk mencegah operasi yang terlalu lama
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Waktu penghapusan jadwal habis. Silakan coba lagi.'));
        }, 10000); // 10 detik timeout
      });
      
      // Race antara operasi asli dan timeout
      await Promise.race([
        clearSchedule(),
        timeoutPromise
      ]);
      
      setSuccess('Jadwal berhasil dihapus!');
    } catch (err: any) {
      console.error('Error saat menghapus jadwal:', err);
      setError(err.message || 'Terjadi kesalahan saat menghapus jadwal');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Tim tidak ditemukan';
  };

  const formatDate = (dateString: string) => {
    return formatDateIndonesiaFull(dateString);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Jadwal Pertandingan</h1>
          <p className="text-gray-600">Kelola jadwal pertandingan turnamen</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={handleOpenModal}
            disabled={isGenerating || loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Generate Jadwal
          </button>
          <button
            onClick={handleClearSchedule}
            disabled={isGenerating || loading || matches.length === 0}
            className={`px-4 py-2 text-white rounded-md transition-colors flex items-center ${
              isGenerating || loading || matches.length === 0 ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Jadwal
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">Belum Ada Jadwal</h3>
          <p className="text-gray-500 mb-6">Klik tombol "Generate Jadwal" untuk membuat jadwal pertandingan</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h3 className="text-lg font-medium">{formatDate(date)}</h3>
              </div>
              <div className="divide-y">
                {matchesByDate[date].map(match => (
                  <div key={match.id} className="p-6 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Users className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-600">Grup {match.group}</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center">
                          <div className="text-right md:w-1/3">
                            <Link to={`/teams/${match.team1Id}`} className="font-medium hover:text-blue-600">
                              {getTeamName(match.team1Id)}
                            </Link>
                          </div>
                          <div className="mx-4 my-2 md:my-0 text-center">
                            <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                              VS
                            </span>
                          </div>
                          <div className="md:w-1/3">
                            <Link to={`/teams/${match.team2Id}`} className="font-medium hover:text-blue-600">
                              {getTeamName(match.team2Id)}
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex flex-col items-end">
                        <div className="flex items-center mb-1">
                          <Clock className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-600">{match.time}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-600">{match.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Kalender */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            {/* Overlay loading */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-lg z-10">
                <div className="w-20 h-20 relative mb-4">
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-500">{loadingProgress}%</span>
                  </div>
                </div>
                <p className="text-blue-600 font-medium text-lg text-center">{loadingMessage}</p>
                <div className="w-64 h-2 bg-blue-100 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-gray-500 text-sm mt-4 text-center px-4">
                  Mohon tunggu, proses ini mungkin memerlukan waktu beberapa saat.<br />
                  Jangan tutup halaman ini.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Pilih Tanggal Mulai Turnamen</h3>
              <button 
                onClick={handleCloseModal}
                disabled={isGenerating}
                className={`text-gray-500 hover:text-gray-700 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Tanggal Mulai (DD/MM/YYYY)
              </label>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={startDateDisplay}
                onChange={handleDateChange}
                disabled={isGenerating}
                className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isGenerating ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-sm text-gray-500 mt-2">
                Jadwal pertandingan akan dimulai dari tanggal ini
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Format: DD/MM/YYYY (contoh: 01/01/2024)
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                disabled={isGenerating}
                className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 ${
                  isGenerating ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleGenerateSchedule}
                disabled={isGenerating || !startDate}
                className={`px-4 py-2 text-white rounded-md transition-colors flex items-center ${
                  !startDate || isGenerating ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Buat Jadwal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;