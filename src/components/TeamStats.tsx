import React from 'react';
import { Team, Match } from '../context/TournamentContext';
import { Calendar, Clock } from 'lucide-react';
import { formatDateIndonesia } from '../utils/dateUtils';

interface TeamStatsProps {
  team: Team;
  matches: Match[];
}

interface TeamStats {
  totalMatches: number;
  totalRestDays: number;
  averageRestDays: number;
  minRestDays: number;
  maxRestDays: number;
  restDaysDistribution: { [key: number]: number };
}

const calculateTeamStats = (team: Team, matches: Match[]): TeamStats => {
  // Filter pertandingan untuk tim ini
  const teamMatches = matches.filter(
    match => match.homeTeamId === team.id || match.awayTeamId === team.id
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Jika tidak ada pertandingan, kembalikan nilai default
  if (teamMatches.length <= 1) {
    return {
      totalMatches: teamMatches.length,
      totalRestDays: 0,
      averageRestDays: 0,
      minRestDays: 0,
      maxRestDays: 0,
      restDaysDistribution: {}
    };
  }

  // Hitung hari istirahat antara pertandingan
  let totalRestDays = 0;
  let minRestDays = Number.MAX_SAFE_INTEGER;
  let maxRestDays = 0;
  const restDaysDistribution: { [key: number]: number } = {};

  for (let i = 1; i < teamMatches.length; i++) {
    const prevMatchDate = new Date(teamMatches[i - 1].date);
    const currentMatchDate = new Date(teamMatches[i].date);
    
    // Hitung selisih hari
    const diffTime = currentMatchDate.getTime() - prevMatchDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1; // -1 karena kita menghitung hari istirahat
    
    totalRestDays += diffDays;
    minRestDays = Math.min(minRestDays, diffDays);
    maxRestDays = Math.max(maxRestDays, diffDays);
    
    // Tambahkan ke distribusi
    restDaysDistribution[diffDays] = (restDaysDistribution[diffDays] || 0) + 1;
  }

  return {
    totalMatches: teamMatches.length,
    totalRestDays,
    averageRestDays: totalRestDays / (teamMatches.length - 1),
    minRestDays,
    maxRestDays,
    restDaysDistribution
  };
};

const TeamStats = ({ team, matches }: TeamStatsProps) => {
  const stats = calculateTeamStats(team, matches);
  
  // Buat array untuk distribusi hari istirahat
  const restDaysArray = Object.entries(stats.restDaysDistribution)
    .map(([days, count]) => ({ days: parseInt(days), count }))
    .sort((a, b) => a.days - b.days);
  
  // Cari nilai maksimum untuk normalisasi chart
  const maxCount = Math.max(...restDaysArray.map(item => item.count));
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">
        Statistik Jadwal Tim
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-medium">Total Pertandingan</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalMatches}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-medium">Total Hari Istirahat</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalRestDays}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-medium">Rata-rata Istirahat</h3>
          </div>
          <p className="text-2xl font-bold">{stats.averageRestDays.toFixed(1)} hari</p>
        </div>
      </div>
      
      {stats.totalMatches > 1 && (
        <>
          <h3 className="font-medium mb-3">Distribusi Hari Istirahat</h3>
          <div className="h-40 flex items-end space-x-2 mb-2">
            {restDaysArray.map(item => (
              <div key={item.days} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-blue-500 w-full rounded-t" 
                  style={{ 
                    height: `${(item.count / maxCount) * 100}%`,
                    minHeight: '20px'
                  }}
                ></div>
                <span className="text-xs mt-1">{item.days} hari</span>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium mb-1">Istirahat Minimum</h3>
              <p className="text-xl font-bold">{stats.minRestDays} hari</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium mb-1">Istirahat Maksimum</h3>
              <p className="text-xl font-bold">{stats.maxRestDays} hari</p>
            </div>
          </div>
        </>
      )}
      
      {stats.totalMatches <= 1 && (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-500">Belum cukup pertandingan untuk menampilkan statistik istirahat</p>
        </div>
      )}
    </div>
  );
};

export default TeamStats; 