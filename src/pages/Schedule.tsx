import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Calendar, Trash2, Loader, Clock, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Schedule = () => {
  const { matches, generateSchedule, clearSchedule, teams, loading } = useTournament();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleGenerateSchedule = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);
      await generateSchedule();
      setSuccess('Jadwal berhasil dibuat!');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat jadwal');
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
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
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
            onClick={handleGenerateSchedule}
            disabled={isGenerating || loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Membuat Jadwal...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Generate Jadwal
              </>
            )}
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
    </div>
  );
};

export default Schedule; 