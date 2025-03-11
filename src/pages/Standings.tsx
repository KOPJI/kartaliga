import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { ChevronDown, Filter, ListOrdered, Shield } from 'lucide-react';

const Standings = () => {
  const { teams, standings } = useTournament();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  
  // Get all available groups
  const groups = Object.keys(standings).sort();
  
  // Filter standings by active group if selected
  const filteredGroups = activeGroup ? [activeGroup] : groups;
  
  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Tim tidak ditemukan';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-800 flex items-center">
            <ListOrdered className="w-8 h-8 mr-2" />
            Klasemen
          </h1>
          <p className="text-gray-600">Klasemen terkini turnamen Karta Cup V</p>
        </div>
      </div>

      {/* Group filter tabs */}
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
        
        {groups.map(group => (
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

      {groups.length > 0 ? (
        <div className="space-y-8">
          {filteredGroups.map(group => (
            <div key={group} className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
              <div className="bg-green-50 p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Grup {group}
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tim
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Main
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        M
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        K
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GM
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GK
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SG
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {standings[group].map((standing, index) => {
                      const goalDifference = standing.goalsFor - standing.goalsAgainst;
                      return (
                        <tr key={standing.teamId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                              index < 2 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            {getTeamName(standing.teamId)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {standing.played}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-green-600 font-medium">
                            {standing.won}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600">
                            {standing.drawn}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-red-600">
                            {standing.lost}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {standing.goalsFor}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {standing.goalsAgainst}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center font-medium">
                            <span className={goalDifference > 0 ? 'text-green-600' : goalDifference < 0 ? 'text-red-600' : ''}>
                              {goalDifference > 0 ? '+' : ''}{goalDifference}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center font-bold">
                            {standing.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 border-t border-gray-200">
                <div className="flex items-center mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-800 mr-1">
                    1
                  </span>
                  <span>Kualifikasi ke semifinal</span>
                </div>
                <div className="text-center mt-2">
                  M = Menang, S = Seri, K = Kalah, GM = Gol Masuk, GK = Gol Kemasukan, SG = Selisih Gol
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow p-8 text-center">
          <ListOrdered className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Belum ada data klasemen</h3>
          <p className="text-gray-500 mb-4">
            Klasemen akan diperbarui setelah pertandingan selesai
          </p>
        </div>
      )}
    </div>
  );
};

export default Standings;
