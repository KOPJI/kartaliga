import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { Squircle, ArrowLeft, Calendar, Clock, MapPin, Pencil } from 'lucide-react';
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
  
  const [selectedTeam, setSelectedTeam] = useState<string>(match?.team1Id || '');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');
  
  const [matchData, setMatchData] = useState({
    team1Score: match?.team1Score || 0,
    team2Score: match?.team2Score || 0,
    status: match?.status || 'scheduled',
    date: match?.date || '',
    time: match?.time || '',
    venue: match?.venue || ''
  });

  const team1 = match ? getTeamById(match.team1Id) : null;
  const team2 = match ? getTeamById(match.team2Id) : null;

  const [newCard, setNewCard] = useState({
    teamId: match?.team1Id || '',
    playerId: '',
    type: 'yellow' as const,
    minute: 1
  });

  useEffect(() => {
    if (!match) {
      navigate('/matches');
      return;
    }
    
    setMatchData({
      team1Score: match.team1Score || 0,
      team2Score: match.team2Score || 0,
      status: match.status,
      date: match.date || '',
      time: match.time || '',
      venue: match.venue || ''
    });
    
    if (match.team1Id) {
      setSelectedTeam(match.team1Id);
    }
  }, [match, navigate]);

  if (!match || !team1 || !team2) {
    return <div>Sedang memuat...</div>;
  }

  // Filter goals and cards for each team
  const team1Goals = match.goals.filter(goal => goal.teamId === match.team1Id);
  const team2Goals = match.goals.filter(goal => goal.teamId === match.team2Id);
  const team1Cards = match.cards.filter(card => card.teamId === match.team1Id);
  const team2Cards = match.cards.filter(card => card.teamId === match.team2Id);

  const handleSaveMatch = () => {
    if (!match) return;
    
    updateMatch({
      ...match,
      team1Score: matchData.team1Score,
      team2Score: matchData.team2Score,
      status: matchData.status,
      date: matchData.date,
      time: matchData.time,
      venue: matchData.venue
    });
    
    setIsEditing(false);
  };

  const handleAddGoal = () => {
    if (!selectedPlayer || !selectedMinute) return;
    
    recordGoal({
      matchId: match.id,
      playerId: selectedPlayer,
      teamId: selectedTeam,
      minute: parseInt(selectedMinute)
    });
    
    setSelectedPlayer('');
    setSelectedMinute('');
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
      teamId: match.team1Id,
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
    <div className="container mx-auto px-4 py-8">
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
            <Link to={`/teams/${team1.id}`} className="font-bold text-xl mb-1 block hover:text-green-700">
              {team1.name}
            </Link>
            <div className="text-sm text-gray-500">{team1.players.length} Pemain</div>
          </div>
          
          <div className="col-span-1 text-center">
            {isEditing ? (
              <div className="py-2 px-4 bg-gray-100 rounded-md text-center">
                VS
              </div>
            ) : match.status === 'completed' ? (
              <div className="text-2xl font-bold">
                {match.team1Score} - {match.team2Score}
              </div>
            ) : (
              <div className="py-2 px-4 bg-gray-100 rounded-md text-center">
                VS
              </div>
            )}
          </div>
          
          <div className="col-span-3 text-center">
            <Link to={`/teams/${team2.id}`} className="font-bold text-xl mb-1 block hover:text-green-700">
              {team2.name}
            </Link>
            <div className="text-sm text-gray-500">{team2.players.length} Pemain</div>
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
      </div>
    </div>
  );
};

export default MatchDetail; 