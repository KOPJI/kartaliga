import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { Calendar, ChartBar, ListOrdered, Loader, Squircle, Trophy, Users, User } from 'lucide-react';

const Dashboard = () => {
  const { teams, matches, standings, topScorers, loading } = useTournament();
  
  const completedMatches = matches.filter(match => match.status === 'completed');
  const scheduledMatches = matches.filter(match => match.status === 'scheduled');
  
  const quickStats = [
    { 
      title: 'Total Tim', 
      value: teams.length,
      icon: <Users className="h-8 w-8 text-blue-600" />,
      color: 'bg-blue-100 border-blue-200',
      link: '/teams'
    },
    { 
      title: 'Pertandingan Selesai', 
      value: completedMatches.length,
      icon: <Squircle className="h-8 w-8 text-orange-600" />,
      color: 'bg-orange-100 border-orange-200',
      link: '/matches'
    },
    { 
      title: 'Jadwal Mendatang', 
      value: scheduledMatches.length,
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      color: 'bg-purple-100 border-purple-200',
      link: '/schedule'
    },
    { 
      title: 'Pencetak Gol Terbanyak', 
      value: topScorers.length > 0 ? topScorers[0].goals || 0 : 0,
      icon: <ChartBar className="h-8 w-8 text-green-600" />,
      color: 'bg-green-100 border-green-200',
      link: '/statistics'
    },
  ];

  // Get upcoming matches (next 3)
  const upcomingMatches = scheduledMatches.slice(0, 3);

  // Get teams with most players for showcase
  const teamsWithPlayers = teams
    .filter(team => team.players && team.players.length > 0)
    .sort((a, b) => b.players.length - a.players.length)
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-green-600 mb-4" />
          <p className="text-gray-600">Memuat data turnamen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Dashboard Turnamen</h1>
          <p className="text-gray-600">Manajemen Turnamen Karta Cup V</p>
        </div>
        
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Link
            to="/teams"
            className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
          >
            Kelola Tim
          </Link>
          <Link
            to="/schedule"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Lihat Jadwal
          </Link>
        </div>
      </div>

      {/* Firestore Integration Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <Trophy className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Aplikasi telah terintegrasi dengan Firebase Firestore. Data akan tersimpan secara cloud dan dapat diakses dari berbagai perangkat.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Link 
            key={index}
            to={stat.link}
            className={`${stat.color} p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Group Summary */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-amber-500" />
              Grup Turnamen
            </h2>
            <Link to="/standings" className="text-sm text-blue-600 hover:underline">
              Lihat Klasemen
            </Link>
          </div>
          
          <div className="space-y-4">
            {['A', 'B', 'C', 'D'].map(group => (
              <div key={group} className="border-b pb-2 last:border-0 last:pb-0">
                <h3 className="font-medium text-gray-800 mb-1">
                  Grup {group}
                </h3>
                <div className="text-sm text-gray-600">
                  {teams
                    .filter(team => team.group === group)
                    .map(team => team.name)
                    .join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Pertandingan Mendatang
            </h2>
            <Link to="/schedule" className="text-sm text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          
          {upcomingMatches.length > 0 ? (
            <div className="space-y-4">
              {upcomingMatches.map((match) => {
                const homeTeam = teams.find(t => t.id === match.homeTeamId);
                const awayTeam = teams.find(t => t.id === match.awayTeamId);
                
                return (
                  <div key={match.id} className="border rounded-md p-3 hover:bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1">
                      Grup {match.group} · {match.date || 'Jadwal belum diatur'}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{homeTeam?.name || 'Tim tidak ditemukan'}</div>
                      <div className="text-sm bg-gray-100 px-2 py-1 rounded">VS</div>
                      <div className="font-medium text-right">{awayTeam?.name || 'Tim tidak ditemukan'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada jadwal pertandingan</p>
              <Link
                to="/schedule"
                className="mt-2 inline-block text-sm text-blue-600 hover:underline"
              >
                Buat Jadwal Sekarang
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Team Players Showcase */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <User className="h-5 w-5 mr-2 text-green-600" />
            Pemain Tim
          </h2>
          <Link to="/teams" className="text-sm text-blue-600 hover:underline">
            Lihat Semua Tim
          </Link>
        </div>

        {teamsWithPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamsWithPlayers.map(team => (
              <div key={team.id} className="border rounded-lg overflow-hidden">
                <div className="bg-green-700 text-white p-3 flex items-center">
                  {team.logo ? (
                    <img 
                      src={team.logo} 
                      alt={`Logo ${team.name}`} 
                      className="w-8 h-8 mr-2 rounded-full object-cover bg-white"
                    />
                  ) : (
                    <div className="w-8 h-8 mr-2 rounded-full bg-white flex items-center justify-center text-green-700 font-bold">
                      {team.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-xs text-green-100">Grup {team.group}</p>
                  </div>
                </div>
                
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Pemain ({team.players.length})</h4>
                  <div className="space-y-3">
                    {team.players.slice(0, 3).map(player => (
                      <div key={player.id} className="flex items-center">
                        {player.photo ? (
                          <img 
                            src={player.photo} 
                            alt={player.name} 
                            className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{player.name}</p>
                          <p className="text-xs text-gray-500">
                            #{player.number} · {player.position}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {team.players.length > 3 && (
                      <Link 
                        to={`/teams/${team.id}`} 
                        className="text-xs text-blue-600 hover:underline block text-center mt-2"
                      >
                        Lihat {team.players.length - 3} pemain lainnya
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 border-t">
                  <Link 
                    to={`/teams/${team.id}`} 
                    className="text-sm text-blue-600 hover:underline flex justify-center items-center"
                  >
                    Detail Tim
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 border rounded-lg">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Belum ada data pemain</p>
            <Link
              to="/teams"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Tambahkan Pemain Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
