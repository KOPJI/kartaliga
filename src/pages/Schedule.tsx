import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Squircle, Calendar, ChevronDown, Clock, MapPin, Play, Plus } from 'lucide-react';

const Schedule = () => {
  const { teams, matches, generateSchedule, updateMatch } = useTournament();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Group matches by group for display
  const groupedMatches: Record<string, typeof matches> = {};
  matches.forEach(match => {
    if (!groupedMatches[match.group]) {
      groupedMatches[match.group] = [];
    }
    groupedMatches[match.group].push(match);
  });

  const handleGenerateSchedule = () => {
    if (matches.length > 0) {
      setShowConfirm(true);
    } else {
      generateSchedule();
    }
  };

  const confirmGenerateSchedule = () => {
    generateSchedule();
    setShowConfirm(false);
  };

  const handleUpdateMatch = (matchId: string, field: string, value: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    updateMatch({
      ...match,
      [field]: value
    });
  };

  const toggleEditMatch = (matchId: string) => {
    if (editingMatch === matchId) {
      setEditingMatch(null);
    } else {
      setEditingMatch(matchId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800 flex items-center">
            <Calendar className="w-8 h-8 mr-2" />
            Jadwal Pertandingan
          </h1>
          <p className="text-gray-600">Kelola jadwal pertandingan turnamen Karta Cup V</p>
        </div>
        
        <button
          onClick={handleGenerateSchedule}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Play className="w-5 h-5 mr-1" />
          {matches.length > 0 ? 'Regenerasi Jadwal' : 'Buat Jadwal Otomatis'}
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4 text-amber-600">
              <Squircle className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-semibold">Konfirmasi</h2>
            </div>
            <p className="mb-4">
              Jadwal yang sudah ada akan dihapus dan dibuat ulang. Lanjutkan?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={confirmGenerateSchedule}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
              >
                Ya, Buat Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {matches.length > 0 ? (
        <div className="space-y-6">
          {/* Group tabs */}
          <div className="flex overflow-x-auto pb-2 space-x-2">
            <button
              onClick={() => setActiveGroup(null)}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                activeGroup === null
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Semua Grup
            </button>
            {Object.keys(groupedMatches).map(group => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  activeGroup === group
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Grup {group}
              </button>
            ))}
          </div>

          {/* Schedule list */}
          <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
            {Object.entries(groupedMatches)
              .filter(([group]) => activeGroup === null || group === activeGroup)
              .map(([group, groupMatches]) => (
                <div key={group} className="border-b border-gray-200 last:border-0">
                  <div className="bg-green-50 p-4 font-medium">
                    Grup {group}
                  </div>
                  <div className="divide-y divide-gray-200">
                    {groupMatches.map(match => {
                      const homeTeam = teams.find(t => t.id === match.homeTeamId);
                      const awayTeam = teams.find(t => t.id === match.awayTeamId);
                      const isEditing = editingMatch === match.id;

                      return (
                        <div key={match.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                Ronde {match.round}
                              </span>
                              {match.date ? (
                                <span className="text-gray-500 text-sm ml-2 flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {match.date}
                                </span>
                              ) : (
                                <span className="text-amber-500 text-sm ml-2 flex items-center">
                                  <Squircle className="h-4 w-4 mr-1" />
                                  Belum terjadwal
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => toggleEditMatch(match.id)}
                              className="text-blue-600 text-sm hover:underline"
                            >
                              {isEditing ? 'Selesai' : 'Edit'}
                            </button>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex-1 font-medium">{homeTeam?.name || 'Tim tidak ditemukan'}</div>
                            <div className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium">VS</div>
                            <div className="flex-1 font-medium text-right">{awayTeam?.name || 'Tim tidak ditemukan'}</div>
                          </div>

                          {isEditing ? (
                            <div className="mt-4 space-y-3 bg-blue-50 p-3 rounded-md">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tanggal
                                </label>
                                <input
                                  type="date"
                                  value={match.date}
                                  onChange={(e) => handleUpdateMatch(match.id, 'date', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Waktu
                                </label>
                                <input
                                  type="time"
                                  value={match.time}
                                  onChange={(e) => handleUpdateMatch(match.id, 'time', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Lokasi
                                </label>
                                <input
                                  type="text"
                                  value={match.venue}
                                  onChange={(e) => handleUpdateMatch(match.id, 'venue', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  placeholder="Masukkan lokasi pertandingan"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                              {match.time && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {match.time}
                                </div>
                              )}
                              {match.venue && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {match.venue}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-8 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Belum ada jadwal pertandingan</h3>
          <p className="text-gray-500 mb-4">
            Buat jadwal pertandingan otomatis untuk memulai turnamen
          </p>
          <button
            onClick={handleGenerateSchedule}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center mx-auto"
          >
            <Plus className="w-5 h-5 mr-1" />
            Buat Jadwal Sekarang
          </button>
        </div>
      )}
    </div>
  );
};

export default Schedule;
