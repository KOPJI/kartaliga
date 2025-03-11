import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { Calendar, ChevronRight, Filter, Search, Shield, Squircle, X } from 'lucide-react';

const Matches = () => {
  const { teams, matches } = useTournament();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'scheduled'>('all');

  // Filter matches based on criteria
  const filteredMatches = matches.filter(match => {
    // Filter by search term (match team names)
    const homeTeam = teams.find(team => team.id === match.homeTeamId);
    const awayTeam = teams.find(team => team.id === match.awayTeamId);
    const matchesSearch = 
      homeTeam?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      awayTeam?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by group
    const matchesGroup = filterGroup === null || match.group === filterGroup;
    
    // Filter by status
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'completed' && match.status === 'completed') ||
      (filterStatus === 'scheduled' && match.status === 'scheduled');
    
    return matchesSearch && matchesGroup && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800 flex items-center">
            <Squircle className="w-8 h-8 mr-2" />
            Pertandingan
          </h1>
          <p className="text-gray-600">Lihat dan kelola hasil pertandingan turnamen</p>
        </div>
      </div>
      
      {/* Filters */}
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
          
          <div className="flex flex-wrap gap-2">
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-2 ${
                  filterStatus === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-2 ${
                  filterStatus === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Selesai
              </button>
              <button
                onClick={() => setFilterStatus('scheduled')}
                className={`px-3 py-2 ${
                  filterStatus === 'scheduled'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dijadwalkan
              </button>
            </div>
            
            <select
              value={filterGroup || ''}
              onChange={(e) => setFilterGroup(e.target.value || null)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Semua Grup</option>
              <option value="A">Grup A</option>
              <option value="B">Grup B</option>
              <option value="C">Grup C</option>
              <option value="D">Grup D</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Matches list */}
      {filteredMatches.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredMatches.map(match => {
              const homeTeam = teams.find(t => t.id === match.homeTeamId);
              const awayTeam = teams.find(t => t.id === match.awayTeamId);
              const isCompleted = match.status === 'completed';
              
              return (
                <Link 
                  key={match.id}
                  to={`/matches/${match.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Grup {match.group}
                      </span>
                      <span className="text-xs text-gray-500">
                        Ronde {match.round}
                      </span>
                      {isCompleted ? (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Selesai
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Dijadwalkan
                        </span>
                      )}
                    </div>
                    
                    {match.date && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {match.date}
                        {match.time && ` · ${match.time}`}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{homeTeam?.name || 'Tim tidak ditemukan'}</div>
                      {match.homeScore !== undefined && (
                        <div className="text-sm text-gray-500">
                          {match.goals.filter(g => g.teamId === match.homeTeamId).length} gol
                        </div>
                      )}
                    </div>
                    
                    <div className="px-4">
                      {isCompleted ? (
                        <div className="text-xl font-bold">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded bg-gray-100 text-gray-800">
                          VS
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-right">
                      <div className="font-medium">{awayTeam?.name || 'Tim tidak ditemukan'}</div>
                      {match.awayScore !== undefined && (
                        <div className="text-sm text-gray-500">
                          {match.goals.filter(g => g.teamId === match.awayTeamId).length} gol
                        </div>
                      )}
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                  </div>
                  
                  {/* Cards summary */}
                  {match.cards.length > 0 && (
                    <div className="mt-3 flex gap-3">
                      <div className="flex items-center text-sm">
                        <div className="w-3 h-4 bg-yellow-400 rounded-sm mr-1"></div>
                        <span className="text-gray-600">
                          {match.cards.filter(c => c.type === 'yellow').length}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-3 h-4 bg-red-500 rounded-sm mr-1"></div>
                        <span className="text-gray-600">
                          {match.cards.filter(c => c.type === 'red').length}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {match.venue && (
                    <div className="mt-2 text-sm text-gray-500">
                      {match.venue}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-8 text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Tidak ada pertandingan ditemukan</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `Tidak ada pertandingan yang cocok dengan "${searchTerm}"`
              : filterGroup || filterStatus !== 'all'
              ? 'Tidak ada pertandingan yang sesuai dengan filter'
              : 'Belum ada pertandingan yang dijadwalkan'}
          </p>
          <Link
            to="/schedule"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Calendar className="w-5 h-5 mr-1" />
            Lihat Jadwal
          </Link>
        </div>
      )}
    </div>
  );
};

export default Matches;
