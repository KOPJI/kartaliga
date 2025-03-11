import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { Calendar, ChevronRight, Search, Filter, Check, Clock, X } from 'lucide-react';

const Matches = () => {
  const { teams, matches } = useTournament();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'scheduled'>('all');

  // Statistik pertandingan
  const totalMatches = matches.length;
  const completedMatches = matches.filter(match => match.status === 'completed').length;
  const scheduledMatches = matches.filter(match => match.status === 'scheduled').length;
  const cancelledMatches = matches.filter(match => match.status === 'cancelled').length;
  
  // Statistik grup
  const matchesByGroup = matches.reduce((acc, match) => {
    acc[match.group] = (acc[match.group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Statistik gol
  const totalGoals = matches.reduce((sum, match) => sum + (match.goals?.length || 0), 0);
  const averageGoalsPerMatch = totalMatches > 0 ? (totalGoals / completedMatches).toFixed(1) : '0';
  
  // Statistik kartu
  const totalCards = matches.reduce((sum, match) => sum + (match.cards?.length || 0), 0);
  const yellowCards = matches.reduce((sum, match) => 
    sum + match.cards.filter(card => card.type === 'yellow').length, 0);
  const redCards = matches.reduce((sum, match) => 
    sum + match.cards.filter(card => card.type === 'red').length, 0);

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

  // Mendapatkan semua grup yang unik
  const uniqueGroups = Array.from(new Set(matches.map(match => match.group))).sort();

  // Mendapatkan nama tim
  const getTeamName = (teamId: string) => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Tim tidak ditemukan';
  };

  // Format tanggal
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
      <h1 className="text-2xl font-bold mb-6">Pertandingan</h1>
      
      {/* Statistik Pertandingan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-medium">Total Pertandingan</h3>
          </div>
          <p className="text-2xl font-bold">{totalMatches}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-2">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-medium">Pertandingan Selesai</h3>
          </div>
          <p className="text-2xl font-bold">{completedMatches}</p>
          <p className="text-sm text-gray-500">
            {totalMatches > 0 ? `${Math.round((completedMatches / totalMatches) * 100)}%` : '0%'} dari total
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="font-medium">Pertandingan Dijadwalkan</h3>
          </div>
          <p className="text-2xl font-bold">{scheduledMatches}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center mb-2">
            <X className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="font-medium">Pertandingan Dibatalkan</h3>
          </div>
          <p className="text-2xl font-bold">{cancelledMatches}</p>
        </div>
      </div>
      
      {/* Statistik Tambahan */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Statistik Pertandingan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Gol</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-2">{totalGoals}</span>
              <span className="text-sm text-gray-500">Total Gol</span>
            </div>
            <p className="text-sm mt-1">Rata-rata {averageGoalsPerMatch} gol per pertandingan</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Kartu</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-2">{totalCards}</span>
              <span className="text-sm text-gray-500">Total Kartu</span>
            </div>
            <div className="flex mt-1">
              <span className="text-sm mr-3">
                <span className="inline-block w-3 h-3 bg-yellow-400 mr-1"></span> {yellowCards}
              </span>
              <span className="text-sm">
                <span className="inline-block w-3 h-3 bg-red-600 mr-1"></span> {redCards}
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pertandingan per Grup</h3>
            <div className="space-y-1">
              {Object.entries(matchesByGroup).sort(([a], [b]) => a.localeCompare(b)).map(([group, count]) => (
                <div key={group} className="flex justify-between">
                  <span className="text-sm">Grup {group}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter dan Pencarian */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari pertandingan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="scheduled">Dijadwalkan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
            
            <div>
              <select
                value={filterGroup || ''}
                onChange={(e) => setFilterGroup(e.target.value || null)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Grup</option>
                {uniqueGroups.map(group => (
                  <option key={group} value={group}>Grup {group}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Pertandingan */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">Tidak ada pertandingan yang ditemukan</p>
          </div>
        ) : (
          filteredMatches.map(match => (
            <div key={match.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">{formatDate(match.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      match.status === 'completed' ? 'bg-green-100 text-green-800' :
                      match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {match.status === 'completed' ? 'Selesai' :
                       match.status === 'scheduled' ? 'Dijadwalkan' :
                       'Dibatalkan'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex-1 text-center md:text-right mb-4 md:mb-0">
                    <h3 className="font-semibold text-lg">{getTeamName(match.homeTeamId)}</h3>
                    {match.status === 'completed' && (
                      <span className="text-3xl font-bold">{match.homeScore}</span>
                    )}
                  </div>
                  
                  <div className="mx-8 text-center">
                    <div className="text-xs text-gray-500 mb-2">
                      {match.time} • Grup {match.group}
                    </div>
                    <div className="text-lg font-bold">VS</div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-semibold text-lg">{getTeamName(match.awayTeamId)}</h3>
                    {match.status === 'completed' && (
                      <span className="text-3xl font-bold">{match.awayScore}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {match.venue}
                </div>
                <Link to={`/matches/${match.id}`} className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                  Detail <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Matches;
