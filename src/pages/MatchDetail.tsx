import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTournament, Player, Card as CardType } from '../context/TournamentContext';
import { Squircle, ArrowLeft, Calendar, Clock, MapPin, Pencil, Plus, Save, UserPlus, X } from 'lucide-react';
import { formatDateIndonesiaFull } from '../utils/dateUtils';

const MatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    teams, 
    matches, 
    updateMatch, 
    recordGoal, 
    recordCard, 
    getTeamById, 
    getPlayerById 
  } = useTournament();
  
  const match = matches.find(m => m.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [showCardAccumulation, setShowCardAccumulation] = useState(false);
  
  const [matchData, setMatchData] = useState({
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    date: '',
    time: '',
    venue: ''
  });
  
  const [newGoal, setNewGoal] = useState({
    teamId: '',
    playerId: '',
    minute: 1,
    isOwnGoal: false
  });
  
  const [newCard, setNewCard] = useState({
    teamId: '',
    playerId: '',
    type: 'yellow' as 'yellow' | 'red',
    minute: 1
  });

  useEffect(() => {
    if (!match) {
      navigate('/matches');
      return;
    }
    
    setMatchData({
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      status: match.status,
      date: match.date,
      time: match.time,
      venue: match.venue
    });
    
    // Initialize new goal and card with the home team selected by default
    if (match && match.homeTeamId) {
      setNewGoal(prev => ({ ...prev, teamId: match.homeTeamId }));
      setNewCard(prev => ({ ...prev, teamId: match.homeTeamId }));
    }
  }, [match, navigate]);

  if (!match) {
    return <div>Sedang memuat...</div>;
  }

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  
  if (!homeTeam || !awayTeam) {
    return <div>Error: Tim tidak ditemukan</div>;
  }

  const homeGoals = match.goals.filter(g => g.teamId === match.homeTeamId);
  const awayGoals = match.goals.filter(g => g.teamId === match.awayTeamId);
  const homeCards = match.cards.filter(c => c.teamId === match.homeTeamId);
  const awayCards = match.cards.filter(c => c.teamId === match.awayTeamId);

  // Check card accumulation for each player
  const calculateCardAccumulation = () => {
    const accumulation = [];
    const playerCardCounts: Record<string, { yellow: number, red: number, teamId: string }> = {};
    
    // Count cards for all players across all matches
    matches.forEach(m => {
      m.cards.forEach(card => {
        if (!playerCardCounts[card.playerId]) {
          playerCardCounts[card.playerId] = { yellow: 0, red: 0, teamId: card.teamId };
        }
        
        if (card.type === 'yellow') {
          playerCardCounts[card.playerId].yellow += 1;
        } else if (card.type === 'red') {
          playerCardCounts[card.playerId].red += 1;
        }
      });
    });
    
    // Check which players have card accumulations
    Object.entries(playerCardCounts).forEach(([playerId, counts]) => {
      const player = getPlayerById(playerId);
      if (player) {
        const team = getTeamById(player.teamId);
        
        // Accumulation rules: 2 yellows = 1 match ban, 1 red = 1 match ban
        const yellowBan = Math.floor(counts.yellow / 2);
        const redBan = counts.red;
        const totalBan = yellowBan + redBan;
        
        if (totalBan > 0) {
          accumulation.push({
            player,
            team: team?.name || 'Tim tidak diketahui',
            yellowCards: counts.yellow,
            redCards: counts.red,
            banMatches: totalBan
          });
        }
      }
    });
    
    return accumulation;
  };

  const cardAccumulation = calculateCardAccumulation();

  const handleSaveMatch = () => {
    updateMatch({
      ...match,
      homeScore: matchData.homeScore,
      awayScore: matchData.awayScore,
      status: matchData.status,
      date: matchData.date,
      time: matchData.time,
      venue: matchData.venue
    });
    setIsEditing(false);
  };

  const handleAddGoal = () => {
    if (!newGoal.playerId) {
      alert('Pilih pemain pencetak gol');
      return;
    }
    
    recordGoal({
      matchId: match.id,
      teamId: newGoal.teamId,
      playerId: newGoal.playerId,
      minute: newGoal.minute,
      isOwnGoal: newGoal.isOwnGoal
    });
    
    setNewGoal({
      teamId: match.homeTeamId,
      playerId: '',
      minute: 1,
      isOwnGoal: false
    });
    
    setIsAddingGoal(false);
  };

  const handleAddCard = () => {
    if (!newCard.playerId) {
      alert('Pilih pemain yang mendapat kartu');
      return;
    }
    
    recordCard({
      matchId: match.id,
      teamId: newCard.teamId,
      playerId: newCard.playerId,
      type: newCard.type,
      minute: newCard.minute
    });
    
    setNewCard({
      teamId: match.homeTeamId,
      playerId: '',
      type: 'yellow',
      minute: 1
    });
    
    setIsAddingCard(false);
  };

  const teamPlayersOptions = (teamId: string) => {
    const team = getTeamById(teamId);
    if (!team) return [];
    
    return team.players.map(player => (
      <option key={player.id} value={player.id}>
        {player.name} ({player.number})
      </option>
    ));
  };

  // Format tanggal
  const formatDate = (dateString: string) => {
    return formatDateIndonesiaFull(dateString);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/matches')}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-green-800">Detail Pertandingan</h1>
      </div>

      {/* Match header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div className="text-sm text-gray-500 flex items-center mb-4 md:mb-0">
            <Squircle className="h-4 w-4 mr-1" />
            <span>Grup {match.group} · Ronde {match.round}</span>
            
            {match.status === 'completed' && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Selesai
              </span>
            )}
            
            {match.status === 'scheduled' && (
              <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Dijadwalkan
              </span>
            )}
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit Pertandingan
            </button>
          )}
        </div>

        {/* Match info */}
        <div className="grid grid-cols-7 gap-4 items-center">
          <div className="col-span-3 text-center">
            <Link to={`/teams/${homeTeam.id}`} className="font-bold text-xl mb-1 block hover:text-green-700">
              {homeTeam.name}
            </Link>
            <div className="text-sm text-gray-500">{homeTeam.players.length} Pemain</div>
          </div>
          
          <div className="col-span-1 text-center">
            {isEditing ? (
              <div className="py-2 px-4 bg-gray-100 rounded-md text-center">
                VS
              </div>
            ) : match.status === 'completed' ? (
              <div className="text-2xl font-bold">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="py-2 px-4 bg-gray-100 rounded-md text-center">
                VS
              </div>
            )}
          </div>
          
          <div className="col-span-3 text-center">
            <Link to={`/teams/${awayTeam.id}`} className="font-bold text-xl mb-1 block hover:text-green-700">
              {awayTeam.name}
            </Link>
            <div className="text-sm text-gray-500">{awayTeam.players.length} Pemain</div>
          </div>
        </div>
        
        {/* Match details */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm text-gray-600">
          {match.date && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(match.date)}
            </div>
          )}
          
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
        
        {/* Edit form */}
        {isEditing && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={matchData.date}
                  onChange={(e) => setMatchData({ ...matchData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu
                </label>
                <input
                  type="time"
                  value={matchData.time}
                  onChange={(e) => setMatchData({ ...matchData, time: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={matchData.venue}
                  onChange={(e) => setMatchData({ ...matchData, venue: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2"
                  placeholder="Masukkan lokasi pertandingan"
                />
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="text-lg font-medium mb-3">Hasil Pertandingan</h3>
              
              <div className="grid grid-cols-7 gap-4 items-center">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skor {homeTeam.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchData.homeScore}
                    onChange={(e) => setMatchData({ ...matchData, homeScore: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                
                <div className="col-span-1 flex items-end justify-center">
                  <span className="text-xl">-</span>
                </div>
                
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skor {awayTeam.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchData.awayScore}
                    onChange={(e) => setMatchData({ ...matchData, awayScore: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Pertandingan
              </label>
              <select
                value={matchData.status}
                onChange={(e) => setMatchData({ ...matchData, status: e.target.value as 'scheduled' | 'completed' | 'cancelled' })}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="scheduled">Dijadwalkan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMatch}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                Simpan
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Match events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Gol
            </h2>
            <button
              onClick={() => setIsAddingGoal(true)}
              className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
              disabled={match.status !== 'completed'}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {match.goals.length > 0 ? (
            <div>
              <div className="mb-2">
                <h3 className="font-medium text-gray-700">{homeTeam.name}</h3>
                {homeGoals.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {homeGoals.map(goal => {
                      const player = getPlayerById(goal.playerId);
                      return (
                        <li key={goal.id} className="flex items-center text-sm">
                          <span className="bg-green-100 text-green-800 w-6 h-6 flex items-center justify-center rounded-full mr-2">
                            {goal.minute}'
                          </span>
                          <span>
                            {player ? player.name : 'Pemain tidak ditemukan'}
                            {goal.isOwnGoal && <span className="text-red-500 ml-1">(OG)</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Belum ada gol</p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-700">{awayTeam.name}</h3>
                {awayGoals.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {awayGoals.map(goal => {
                      const player = getPlayerById(goal.playerId);
                      return (
                        <li key={goal.id} className="flex items-center text-sm">
                          <span className="bg-green-100 text-green-800 w-6 h-6 flex items-center justify-center rounded-full mr-2">
                            {goal.minute}'
                          </span>
                          <span>
                            {player ? player.name : 'Pemain tidak ditemukan'}
                            {goal.isOwnGoal && <span className="text-red-500 ml-1">(OG)</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Belum ada gol</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada gol yang tercatat</p>
              {match.status === 'completed' && (
                <button
                  onClick={() => setIsAddingGoal(true)}
                  className="mt-2 text-green-600 hover:underline"
                >
                  Tambahkan Gol
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Cards section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Kartu
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCardAccumulation(!showCardAccumulation)}
                className="p-2 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                title="Lihat Akumulasi Kartu"
              >
                <Squircle className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsAddingCard(true)}
                className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                disabled={match.status !== 'completed'}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {match.cards.length > 0 ? (
            <div>
              <div className="mb-2">
                <h3 className="font-medium text-gray-700">{homeTeam.name}</h3>
                {homeCards.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {homeCards.map(card => {
                      const player = getPlayerById(card.playerId);
                      return (
                        <li key={card.id} className="flex items-center text-sm">
                          <span 
                            className={`w-4 h-5 rounded-sm mr-2 ${
                              card.type === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                            }`}
                          />
                          <span className="bg-gray-100 text-gray-800 w-6 h-6 flex items-center justify-center rounded-full mr-2">
                            {card.minute}'
                          </span>
                          <span>
                            {player ? player.name : 'Pemain tidak ditemukan'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Belum ada kartu</p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-700">{awayTeam.name}</h3>
                {awayCards.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {awayCards.map(card => {
                      const player = getPlayerById(card.playerId);
                      return (
                        <li key={card.id} className="flex items-center text-sm">
                          <span 
                            className={`w-4 h-5 rounded-sm mr-2 ${
                              card.type === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                            }`}
                          />
                          <span className="bg-gray-100 text-gray-800 w-6 h-6 flex items-center justify-center rounded-full mr-2">
                            {card.minute}'
                          </span>
                          <span>
                            {player ? player.name : 'Pemain tidak ditemukan'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Belum ada kartu</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada kartu yang tercatat</p>
              {match.status === 'completed' && (
                <button
                  onClick={() => setIsAddingCard(true)}
                  className="mt-2 text-green-600 hover:underline"
                >
                  Tambahkan Kartu
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Card Accumulation Section */}
      {showCardAccumulation && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Squircle className="h-5 w-5 mr-2 text-amber-500" />
              Akumulasi Kartu & Larangan Bermain
            </h2>
            <button 
              onClick={() => setShowCardAccumulation(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {cardAccumulation.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemain</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tim</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Kartu Kuning</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Kartu Merah</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Larangan Bermain</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cardAccumulation.map((item) => (
                    <tr key={item.player.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.player.name}</div>
                        <div className="text-sm text-gray-500">No. {item.player.number}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.team}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {item.yellowCards}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {item.redCards}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {item.banMatches} Pertandingan
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>Tidak ada pemain yang terkena akumulasi kartu</p>
            </div>
          )}
          
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
            <p className="font-medium mb-1">Peraturan Akumulasi Kartu:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>2 Kartu Kuning = Larangan bermain 1 pertandingan</li>
              <li>1 Kartu Merah = Larangan bermain 1 pertandingan</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Add goal modal */}
      {isAddingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tambah Gol</h2>
              <button onClick={() => setIsAddingGoal(false)}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Tim
                </label>
                <select
                  value={newGoal.teamId}
                  onChange={(e) => setNewGoal({ ...newGoal, teamId: e.target.value, playerId: '' })}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value={homeTeam.id}>{homeTeam.name}</option>
                  <option value={awayTeam.id}>{awayTeam.name}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  Pemain
                </label>
                <select
                  value={newGoal.playerId}
                  onChange={(e) => setNewGoal({ ...newGoal, playerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">-- Pilih Pemain --</option>
                  {teamPlayersOptions(newGoal.teamId)}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  Menit
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={newGoal.minute}
                  onChange={(e) => setNewGoal({ ...newGoal, minute: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="own-goal"
                  checked={newGoal.isOwnGoal}
                  onChange={(e) => setNewGoal({ ...newGoal, isOwnGoal: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="own-goal" className="ml-2 block text-gray-700">
                  Gol Bunuh Diri
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsAddingGoal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add card modal */}
      {isAddingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tambah Kartu</h2>
              <button onClick={() => setIsAddingCard(false)}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Tim
                </label>
                <select
                  value={newCard.teamId}
                  onChange={(e) => setNewCard({ ...newCard, teamId: e.target.value, playerId: '' })}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value={homeTeam.id}>{homeTeam.name}</option>
                  <option value={awayTeam.id}>{awayTeam.name}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  Pemain
                </label>
                <select
                  value={newCard.playerId}
                  onChange={(e) => setNewCard({ ...newCard, playerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">-- Pilih Pemain --</option>
                  {teamPlayersOptions(newCard.teamId)}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  Jenis Kartu
                </label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="yellow-card"
                      name="card-type"
                      checked={newCard.type === 'yellow'}
                      onChange={() => setNewCard({ ...newCard, type: 'yellow' })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="yellow-card" className="ml-2 flex items-center">
                      <div className="w-4 h-5 bg-yellow-400 rounded-sm mr-1"></div>
                      Kuning
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="red-card"
                      name="card-type"
                      checked={newCard.type === 'red'}
                      onChange={() => setNewCard({ ...newCard, type: 'red' })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="red-card" className="ml-2 flex items-center">
                      <div className="w-4 h-5 bg-red-500 rounded-sm mr-1"></div>
                      Merah
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">
                  Menit
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={newCard.minute}
                  onChange={(e) => setNewCard({ ...newCard, minute: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsAddingCard(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleAddCard}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetail;
