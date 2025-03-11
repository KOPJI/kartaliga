import React from 'react';
import { Team, Match } from '../context/TournamentContext';
import { ChartBar, Calendar, Clock } from 'lucide-react';

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
  const teamMatches = matches
    .filter(match => match.homeTeamId === team.id || match.awayTeamId === team.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalMatches = teamMatches.length;
  const restDays: number[] = [];

  for (let i = 1; i < teamMatches.length; i++) {
    const daysBetween = Math.floor(
      (new Date(teamMatches[i].date).getTime() - new Date(teamMatches[i-1].date).getTime()) 
      / (1000 * 60 * 60 * 24)
    );
    restDays.push(daysBetween - 1);
  }

  const stats: TeamStats = {
    totalMatches,
    totalRestDays: restDays.reduce((sum, days) => sum + days, 0),
    averageRestDays: restDays.length > 0 ? restDays.reduce((sum, days) => sum + days, 0) / restDays.length : 0,
    minRestDays: restDays.length > 0 ? Math.min(...restDays) : 0,
    maxRestDays: restDays.length > 0 ? Math.max(...restDays) : 0,
    restDaysDistribution: {}
  };

  restDays.forEach(days => {
    stats.restDaysDistribution[days] = (stats.restDaysDistribution[days] || 0) + 1;
  });

  return stats;
};

const TeamStats = ({ team, matches }: TeamStatsProps) => {
  const stats = calculateTeamStats(team, matches);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
        <ChartBar className="w-6 h-6 mr-2 text-green-600" />
        Statistik Tim
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 mr-2 text-green-600" />
            <h3 className="font-medium text-gray-700">Total Pertandingan</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.totalMatches}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 mr-2 text-green-600" />
            <h3 className="font-medium text-gray-700">Total Hari Istirahat</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.totalRestDays}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 mr-2 text-green-600" />
            <h3 className="font-medium text-gray-700">Rata-rata Istirahat</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.averageRestDays.toFixed(1)} hari
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-3">Distribusi Hari Istirahat</h3>
        <div className="space-y-2">
          {Object.entries(stats.restDaysDistribution)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([days, count]) => (
              <div key={days} className="flex items-center">
                <div className="w-24 text-sm text-gray-600">{days} hari:</div>
                <div className="flex-1">
                  <div
                    className="bg-green-200 rounded h-6 flex items-center px-2"
                    style={{
                      width: `${(count / stats.totalMatches) * 100}%`,
                      minWidth: '2rem'
                    }}
                  >
                    <span className="text-sm font-medium text-green-800">
                      {count}x
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Istirahat Minimum:</span>{' '}
          {stats.minRestDays} hari
        </div>
        <div>
          <span className="font-medium">Istirahat Maksimum:</span>{' '}
          {stats.maxRestDays} hari
        </div>
      </div>
    </div>
  );
};

export default TeamStats; 