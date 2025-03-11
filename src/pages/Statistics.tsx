import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { Award, ChartBar, ChevronRight, Filter, TrendingUp, Trophy, UserCheck } from 'lucide-react';
import { formatDateIndonesia } from '../utils/dateUtils';

const Statistics = () => {
  const { teams, matches, topScorers } = useTournament();
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  
  // Calculate card statistics
  const cardStats = teams.map(team => {
    const teamCards = matches.flatMap(match => 
      match.cards.filter(card => card.teamId === team.id)
    );
    
    const yellowCards = teamCards.filter(card => card.type === 'yellow').length;
    const redCards = teamCards.filter(card => card.type === 'red').length;
    
    return {
      teamId: team.id,
      teamName: team.name,
      group: team.group,
      yellowCards,
      redCards,
      totalCards: yellowCards + redCards
    };
  }).filter(stat => filterGroup === null || stat.group === filterGroup)
    .sort((a, b) => b.totalCards - a.totalCards);
  
  // Get filtered top scorers
  const filteredTopScorers = topScorers
    .filter(scorer => {
      if (filterGroup === null) return true;
      const team = teams.find(t => t.id === scorer.teamId);
      return team?.group === filterGroup;
    })
    .slice(0, 10);
  
  // Calculate overall statistics
  const completedMatches = matches.filter(m => m.status === 'completed');
  const totalGoals = completedMatches.flatMap(m => m.goals).length;
  
  const stats = {
    matches: completedMatches.length,
    goals: totalGoals,
    yellowCards: matches.flatMap(m => m.cards).filter(c => c.type === 'yellow').length,
    redCards: matches.flatMap(m => m.cards).filter(c => c.type === 'red').length,
    avgGoalsPerMatch: completedMatches.length > 0 
      ? (totalGoals / completedMatches.length).toFixed(2) 
      : '0.00'
  };

  // Format tanggal untuk tampilan
  const formatDate = (dateString: string) => {
    return formatDateIndonesia(dateString);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800 flex items-center">
            <ChartBar className="w-8 h-8 mr-2" />
            Statistik Turnamen
          </h1>
          <p className="text-gray-600">Data statistik turnamen Karta Cup V</p>
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
            Semua Grup
          </button>
          {['A', 'B', 'C', 'D'].map(group => (
            <button
              key={group}
              onClick={() => setFilterGroup(group)}
              className={`px-3 py-1 rounded-md ${
                filterGroup === group
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Grup {group}
            </button>
          ))}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-600 font-medium">Pertandingan</p>
              <p className="text-3xl font-bold">{stats.matches}</p>
            </div>
            <Trophy className="h-10 w-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
          </div>
        </div>
        
        <div className="bg-white border border-green-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-600 font-medium">Total Gol</p>
              <p className="text-3xl font-bold">{stats.goals}</p>
            </div>
            <Award className="h-10 w-10 text-green-500 bg-green-50 p-2 rounded-lg" />
          </div>
        </div>
        
        <div className="bg-white border border-amber-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-amber-600 font-medium">Rata-rata Gol</p>
              <p className="text-3xl font-bold">{stats.avgGoalsPerMatch}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-amber-500 bg-amber-50 p-2 rounded-lg" />
          </div>
        </div>
        
        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-600 font-medium">Kartu</p>
              <p className="text-3xl font-bold">
                <span className="text-amber-500">{stats.yellowCards}</span> / 
                <span className="text-red-500">{stats.redCards}</span>
              </p>
            </div>
            <div className="flex gap-1">
              <div className="h-8 w-4 bg-yellow-400 rounded-sm"></div>
              <div className="h-8 w-4 bg-red-500 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Scorers */}
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <Award className="h-5 w-5 mr-2 text-amber-500" />
              Top Pencetak Gol
            </h2>
          </div>
          
          {filteredTopScorers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredTopScorers.map((scorer, index) => {
                const player = teams
                  .find(team => team.id === scorer.teamId)?.players
                  .find(player => player.id === scorer.playerId);
                
                if (!player) return null;
                
                const team = teams.find(team => team.id === scorer.teamId);
                
                return (
                  <div key={scorer.playerId} className="p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${
                        index < 3 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      } flex items-center justify-center font-bold`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-500">{team?.name}</div>
                      </div>
                    </div>
                    
                    <div className="bg-green-100 text-green-800 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full">
                      {scorer.goals}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada data pencetak gol</p>
            </div>
          )}
        </div>
        
        {/* Card Stats */}
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-red-500" />
              Statistik Kartu
            </h2>
          </div>
          
          {cardStats.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {cardStats.slice(0, 10).map((stat, index) => (
                <div key={stat.teamId} className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="text-gray-600 font-medium w-8 text-center">
                      {index + 1}.
                    </div>
                    <div className="ml-2">
                      <div className="font-medium">{stat.teamName}</div>
                      <div className="text-xs text-gray-500">Grup {stat.group}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <div className="w-3 h-4 bg-yellow-400 rounded-sm mr-1"></div>
                      <span>{stat.yellowCards}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-4 bg-red-500 rounded-sm mr-1"></div>
                      <span>{stat.redCards}</span>
                    </div>
                    <div className="font-bold text-gray-700">
                      {stat.totalCards}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada data kartu</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Match Stats */}
      {completedMatches.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold flex items-center">
              <ChartBar className="h-5 w-5 mr-2 text-green-600" />
              Statistik Pertandingan Terakhir
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {completedMatches
              .filter(match => filterGroup === null || match.group === filterGroup)
              .sort((a, b) => b.goals.length - a.goals.length)
              .slice(0, 5)
              .map(match => {
                const homeTeam = teams.find(t => t.id === match.homeTeamId);
                const awayTeam = teams.find(t => t.id === match.awayTeamId);
                const goals = match.goals.length;
                const cards = match.cards.length;
                
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
                        {match.date && (
                          <span className="text-gray-500 text-sm">{formatDate(match.date)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{homeTeam?.name}</div>
                      <div className="text-xl font-bold px-3">
                        {match.homeScore} - {match.awayScore}
                      </div>
                      <div className="font-medium">{awayTeam?.name}</div>
                    </div>
                    
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <div>
                        <span className="text-green-600 font-medium">{goals} gol</span> ·
                        <span className="text-amber-600 ml-1 font-medium">{cards} kartu</span>
                      </div>
                      <div className="flex items-center">
                        Lihat Detail
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
