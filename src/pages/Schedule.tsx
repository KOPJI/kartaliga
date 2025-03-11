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
      // Tetap tampilkan modal meskipun ada error
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDateChange = (e: any) => {
    try {
      const indonesiaDate = e.target.value;
      setStartDateDisplay(indonesiaDate);
      
      // Konversi ke format ISO untuk backend
      const isoDate = convertToISODate(indonesiaDate);
      
      // Hanya update startDate jika konversi berhasil
      if (isoDate) {
        setStartDate(isoDate);
      } else {
        // Jika konversi gagal, kosongkan startDate
        setStartDate('');
      }
    } catch (error) {
      console.error('Error saat mengubah tanggal:', error);
      setStartDate('');
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);
      
      if (!startDate) {
        throw new Error('Silakan pilih tanggal mulai turnamen');
      }
      
      // Tambahkan timeout untuk mencegah operasi yang terlalu lama
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Waktu pembuatan jadwal habis. Silakan coba lagi dengan tanggal yang berbeda.'));
        }, 15000); // 15 detik timeout
      });
      
      // Race antara operasi asli dan timeout
      await Promise.race([
        generateSchedule(startDate),
        timeoutPromise
      ]);
      
      setSuccess('Jadwal berhasil dibuat!');
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saat membuat jadwal:', err);
      setError(err.message || 'Terjadi kesalahan saat membuat jadwal');
      // Pastikan modal tetap terbuka jika terjadi error
      setShowModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearSchedule = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);
      await clearSchedule();
      setSuccess('Jadwal berhasil dihapus!');
    } catch (err: any) {
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
        >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Jadwal
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
                            <Link to={`/teams/${match.homeTeamId}`} className="font-medium hover:text-blue-600">
                              {getTeamName(match.homeTeamId)}
                            </Link>
                          </div>
                          <div className="mx-4 my-2 md:my-0 text-center">
                            <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                              VS
                            </span>
                          </div>
                          <div className="md:w-1/3">
                            <Link to={`/teams/${match.awayTeamId}`} className="font-medium hover:text-blue-600">
                              {getTeamName(match.awayTeamId)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
            
            {isGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center rounded-lg z-10">
                <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-blue-600 font-medium">Membuat Jadwal...</p>
                <p className="text-gray-500 text-sm mt-2">Mohon tunggu, ini mungkin memerlukan waktu beberapa saat</p>
              </div>
            )}
            
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
                Format: DD/MM/YYYY (contoh: 01/01/2023)
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
                    Membuat Jadwal...
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