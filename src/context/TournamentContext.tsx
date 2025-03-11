import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchTeams, 
  fetchMatches, 
  addTeamToFirestore, 
  updateTeamInFirestore, 
  deleteTeamFromFirestore,
  addPlayerToFirestore,
  updatePlayerInFirestore,
  deletePlayerFromFirestore,
  updateMatchInFirestore,
  addMatchToFirestore,
  addGoalToFirestore,
  addCardToFirestore,
  deleteMatchFromFirestore
} from '../firebase/firestore';

// Types
export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  teamId: string;
  photo?: string;
}

export interface Team {
  id: string;
  name: string;
  group: string;
  logo?: string;
  players: Player[];
}

export interface Goal {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  minute: number;
  isOwnGoal: boolean;
}

export interface Card {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  type: 'yellow' | 'red';
  minute: number;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  venue: string;
  group: string;
  round: number;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  goals: Goal[];
  cards: Card[];
}

export interface Standing {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface MatchSlot {
  time: string;
  startTime: string;
  endTime: string;
}

const MATCH_SLOTS: MatchSlot[] = [
  { time: "13:30", startTime: "13:30", endTime: "14:35" },
  { time: "14:45", startTime: "14:45", endTime: "15:50" },
  { time: "16:00", startTime: "16:00", endTime: "17:05" }
];

interface ScheduleDay {
  date: string;
  matches: Match[];
}

// Helper functions for schedule generation
const addDays = (date: string, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

interface TeamStats {
  totalMatches: number;
  totalRestDays: number;
  averageRestDays: number;
  minRestDays: number;
  maxRestDays: number;
  restDaysDistribution: { [key: number]: number };
}

const calculateTeamStats = (
  team: Team,
  matches: Omit<Match, 'id' | 'goals' | 'cards'>[]
): TeamStats => {
  const teamMatches = matches.filter(match =>
    match.homeTeamId === team.id || match.awayTeamId === team.id
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalMatches = teamMatches.length;
  const restDays = getTeamRestDays(team, matches);
  
  const stats: TeamStats = {
    totalMatches,
    totalRestDays: restDays.reduce((sum, days) => sum + days, 0),
    averageRestDays: restDays.length > 0 ? restDays.reduce((sum, days) => sum + days, 0) / restDays.length : 0,
    minRestDays: restDays.length > 0 ? Math.min(...restDays) : 0,
    maxRestDays: restDays.length > 0 ? Math.max(...restDays) : 0,
    restDaysDistribution: {}
  };

  // Hitung distribusi hari istirahat
  restDays.forEach(days => {
    stats.restDaysDistribution[days] = (stats.restDaysDistribution[days] || 0) + 1;
  });

  return stats;
};

const isTeamPlayingOnDate = (
  team: Team, 
  date: string, 
  matches: Omit<Match, 'id' | 'goals' | 'cards'>[]
): boolean => {
  return matches.some(match => 
    match.date === date && 
    (match.homeTeamId === team.id || match.awayTeamId === team.id)
  );
};

const isTeamPlayingConsecutiveDays = (
  team: Team, 
  date: string, 
  matches: Omit<Match, 'id' | 'goals' | 'cards'>[]
): boolean => {
  // Periksa 2 hari sebelum dan 2 hari setelah untuk memberikan jarak yang lebih aman
  const previousDays = [
    addDays(date, -2),
    addDays(date, -1)
  ];
  const nextDays = [
    addDays(date, 1),
    addDays(date, 2)
  ];
  
  return (
    previousDays.some(day => isTeamPlayingOnDate(team, day, matches)) ||
    isTeamPlayingOnDate(team, date, matches) ||
    nextDays.some(day => isTeamPlayingOnDate(team, day, matches))
  );
};

const getTeamRestDays = (
  team: Team, 
  matches: Omit<Match, 'id' | 'goals' | 'cards'>[]
): number[] => {
  const teamMatches = matches.filter(match => 
    match.homeTeamId === team.id || match.awayTeamId === team.id
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const restDays: number[] = [];
  for (let i = 1; i < teamMatches.length; i++) {
    const daysBetween = Math.floor(
      (new Date(teamMatches[i].date).getTime() - new Date(teamMatches[i-1].date).getTime()) 
      / (1000 * 60 * 60 * 24)
    );
    restDays.push(daysBetween - 1);
  }
  
  return restDays;
};

const isScheduleBalanced = (matches: Omit<Match, 'id' | 'goals' | 'cards'>[], teamsData: Team[]): boolean => {
  const teamMatches: { [key: string]: number } = {};
  const teamRestDays: { [key: string]: number[] } = {};
  
  // Hitung jumlah pertandingan per tim
  matches.forEach(match => {
    [match.homeTeamId, match.awayTeamId].forEach(teamId => {
      teamMatches[teamId] = (teamMatches[teamId] || 0) + 1;
      
      if (!teamRestDays[teamId]) {
        const team = { id: teamId } as Team;
        teamRestDays[teamId] = getTeamRestDays(team, matches);
      }
    });
  });
  
  // Cek apakah setiap tim memiliki jumlah pertandingan yang seimbang dalam grupnya
  const matchCountsByGroup: { [group: string]: number[] } = {};
  Object.entries(teamMatches).forEach(([teamId, count]) => {
    const team = teamsData.find(t => t.id === teamId);
    if (team) {
      if (!matchCountsByGroup[team.group]) {
        matchCountsByGroup[team.group] = [];
      }
      matchCountsByGroup[team.group].push(count);
    }
  });
  
  // Periksa keseimbangan dalam setiap grup
  for (const counts of Object.values(matchCountsByGroup)) {
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    // Izinkan perbedaan maksimal 1 pertandingan
    if (maxCount - minCount > 1) {
      return false;
    }
  }
  
  // Periksa hari istirahat
  const restDaysVariance = Object.values(teamRestDays).map(days => {
    if (days.length === 0) return 0;
    const mean = days.reduce((a, b) => a + b, 0) / days.length;
    const variance = days.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / days.length;
    return variance;
  });
  
  // Tingkatkan toleransi variance menjadi 3
  return Math.max(...restDaysVariance) < 3;
};

const validateSchedule = (
  matches: Omit<Match, 'id' | 'goals' | 'cards'>[],
  teams: Team[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Cek pertandingan ganda dalam sehari
  const matchesByDate = matches.reduce((acc, match) => {
    if (!acc[match.date]) acc[match.date] = [];
    acc[match.date].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  Object.entries(matchesByDate).forEach(([date, dateMatches]) => {
    const teamsPlayingToday = new Set<string>();
    dateMatches.forEach(match => {
      if (teamsPlayingToday.has(match.homeTeamId)) {
        errors.push(`Tim ${teams.find(t => t.id === match.homeTeamId)?.name} dijadwalkan bermain lebih dari sekali pada tanggal ${date}`);
      }
      if (teamsPlayingToday.has(match.awayTeamId)) {
        errors.push(`Tim ${teams.find(t => t.id === match.awayTeamId)?.name} dijadwalkan bermain lebih dari sekali pada tanggal ${date}`);
      }
      teamsPlayingToday.add(match.homeTeamId);
      teamsPlayingToday.add(match.awayTeamId);
    });
  });

  // Cek pertandingan berturut-turut
  matches.forEach(match => {
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);
    
    if (homeTeam && isTeamPlayingConsecutiveDays(homeTeam, match.date, matches)) {
      errors.push(`Tim ${homeTeam.name} dijadwalkan bermain pada hari berturut-turut sekitar tanggal ${match.date}`);
    }
    if (awayTeam && isTeamPlayingConsecutiveDays(awayTeam, match.date, matches)) {
      errors.push(`Tim ${awayTeam.name} dijadwalkan bermain pada hari berturut-turut sekitar tanggal ${match.date}`);
    }
  });

  // Cek distribusi istirahat
  teams.forEach(team => {
    const stats = calculateTeamStats(team, matches);
    if (stats.minRestDays < 2) {
      errors.push(`Tim ${team.name} memiliki waktu istirahat yang terlalu singkat (${stats.minRestDays} hari)`);
    }
    if (stats.maxRestDays > 5) {
      errors.push(`Tim ${team.name} memiliki waktu istirahat yang terlalu lama (${stats.maxRestDays} hari)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

const canScheduleMatch = (
  homeTeam: Team,
  awayTeam: Team,
  date: string,
  time: string,
  existingMatches: Omit<Match, 'id' | 'goals' | 'cards'>[]
): boolean => {
  // Cek apakah ada tim yang bermain di hari yang sama
  if (isTeamPlayingOnDate(homeTeam, date, existingMatches) ||
      isTeamPlayingOnDate(awayTeam, date, existingMatches)) {
    return false;
  }
  
  // Cek apakah ada tim yang bermain di hari berturut-turut
  if (isTeamPlayingConsecutiveDays(homeTeam, date, existingMatches) ||
      isTeamPlayingConsecutiveDays(awayTeam, date, existingMatches)) {
    return false;
  }
  
  // Cek ketersediaan slot waktu
  const isTimeSlotTaken = existingMatches.some(match => 
    match.date === date && match.time === time
  );
  
  // Cek distribusi istirahat yang proporsional
  const homeTeamStats = calculateTeamStats(homeTeam, existingMatches);
  const awayTeamStats = calculateTeamStats(awayTeam, existingMatches);
  
  // Tingkatkan toleransi perbedaan hari istirahat menjadi 5
  if (Math.abs(homeTeamStats.averageRestDays - awayTeamStats.averageRestDays) > 5) {
    return false;
  }
  
  return !isTimeSlotTaken;
};

interface TournamentContextType {
  teams: Team[];
  matches: Match[];
  standings: Record<string, Standing[]>; // group -> standings
  topScorers: {playerId: string; teamId: string; goals: number}[];
  loading: boolean;
  
  // Team functions
  addTeam: (team: Omit<Team, 'id' | 'players'>) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  getTeamById: (teamId: string) => Team | undefined;
  setTeams: (teams: Team[]) => void;
  
  // Player functions
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
  updatePlayer: (player: Player) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  getPlayerById: (playerId: string) => Player | undefined;
  
  // Match functions
  generateSchedule: () => Promise<void>;
  clearSchedule: () => Promise<void>;
  updateMatch: (match: Match) => Promise<void>;
  recordGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  recordCard: (card: Omit<Card, 'id'>) => Promise<void>;
  
  // Standings
  calculateStandings: () => void;
  calculateTopScorers: () => void;
}

// Initial Teams
const initialTeams: Team[] = [];

const initialContext: TournamentContextType = {
  teams: [],
  matches: [],
  standings: {},
  topScorers: [],
  loading: true,
  
  addTeam: async () => {},
  updateTeam: async () => {},
  deleteTeam: async () => {},
  getTeamById: () => undefined,
  setTeams: () => {},
  
  addPlayer: async () => {},
  updatePlayer: async () => {},
  deletePlayer: async () => {},
  getPlayerById: () => undefined,
  
  generateSchedule: async () => {},
  clearSchedule: async () => {},
  updateMatch: async () => {},
  recordGoal: async () => {},
  recordCard: async () => {},
  
  calculateStandings: () => {},
  calculateTopScorers: () => {},
};

const TournamentContext = createContext<TournamentContextType>(initialContext);

export const useTournament = () => useContext(TournamentContext);

export const TournamentProvider = ({ children }: { children: any }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Record<string, Standing[]>>({});
  const [topScorers, setTopScorers] = useState<{playerId: string; teamId: string; goals: number}[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Firestore on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("Memulai pengambilan data dari Firestore...");
        
        // First try to load from Firestore
        const teamsData = await fetchTeams();
        const matchesData = await fetchMatches();
        
        if (teamsData.length > 0) {
          console.log(`Berhasil mengambil ${teamsData.length} tim dari Firestore`);
          setTeams(teamsData);
        } else {
          console.log("Tidak ada data tim di Firestore, menggunakan data awal");
          // Use initial teams data if no Firestore data
          setTeams(initialTeams);
        }
        
        if (matchesData.length > 0) {
          console.log(`Berhasil mengambil ${matchesData.length} pertandingan dari Firestore`);
          setMatches(matchesData);
        } else {
          console.log("Tidak ada data pertandingan di Firestore");
        }
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
        // Fallback to initial data
        setTeams(initialTeams);
      } finally {
        console.log("Selesai memuat data dari Firestore");
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate standings whenever matches or teams change
  useEffect(() => {
    calculateStandings();
    calculateTopScorers();
  }, [matches, teams]);

  // Team functions
  const addTeam = async (team: Omit<Team, 'id' | 'players'>) => {
    try {
      console.log('Memulai proses penambahan tim:', team.name);
      
      // Validasi data tim
      if (!team.name || team.name.trim() === '') {
        throw new Error('Nama tim tidak boleh kosong');
      }
      
      // Tambahkan tim ke Firestore
      const newTeamId = await addTeamToFirestore(team);
      console.log('Tim berhasil ditambahkan ke Firestore dengan ID:', newTeamId);
      
      // Buat objek tim baru
      const newTeam: Team = {
        ...team,
        id: newTeamId,
        players: []
      };
      
      // Perbarui state teams
      setTeams(prev => [...prev, newTeam]);
      console.log('State teams berhasil diperbarui');
      
      // Tidak perlu return nilai
    } catch (error) {
      console.error("Error adding team:", error);
      throw error;
    }
  };

  const updateTeam = async (team: Team) => {
    try {
      await updateTeamInFirestore(team);
      setTeams(prev => prev.map(t => t.id === team.id ? team : t));
    } catch (error) {
      console.error("Error updating team:", error);
      throw error;
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      await deleteTeamFromFirestore(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (error) {
      console.error("Error deleting team:", error);
      throw error;
    }
  };

  const getTeamById = (teamId: string) => {
    return teams.find(team => team.id === teamId);
  };

  // Player functions
  const addPlayer = async (player: Omit<Player, 'id'>) => {
    try {
      const newPlayerId = await addPlayerToFirestore(player);
      
      const newPlayer: Player = {
        ...player,
        id: newPlayerId
      };
      
      setTeams(prev => prev.map(team => {
        if (team.id === player.teamId) {
          return {
            ...team,
            players: [...team.players, newPlayer]
          };
        }
        return team;
      }));
    } catch (error) {
      console.error("Error adding player:", error);
      throw error;
    }
  };

  const updatePlayer = async (player: Player) => {
    try {
      await updatePlayerInFirestore(player);
      
      setTeams(prev => prev.map(team => {
        if (team.id === player.teamId) {
          return {
            ...team,
            players: team.players.map(p => p.id === player.id ? player : p)
          };
        }
        return team;
      }));
    } catch (error) {
      console.error("Error updating player:", error);
      throw error;
    }
  };

  const deletePlayer = async (playerId: string) => {
    try {
      await deletePlayerFromFirestore(playerId);
      
      setTeams(prev => prev.map(team => {
        return {
          ...team,
          players: team.players.filter(p => p.id !== playerId)
        };
      }));
    } catch (error) {
      console.error("Error deleting player:", error);
      throw error;
    }
  };

  const getPlayerById = (playerId: string) => {
    for (const team of teams) {
      const player = team.players.find(p => p.id === playerId);
      if (player) return player;
    }
    return undefined;
  };

  // Match functions
  const generateSchedule = async () => {
    try {
      const teamsByGroup = teams.reduce((acc, team) => {
        if (!acc[team.group]) acc[team.group] = [];
        acc[team.group].push(team);
        return acc;
      }, {} as Record<string, Team[]>);
      
      const matchesToCreate: Omit<Match, 'id' | 'goals' | 'cards'>[] = [];
      let currentDate = new Date().toISOString().split('T')[0];
      let currentSlotIndex = 0;
      let maxAttempts = 150; // Tingkatkan maksimum percobaan
      
      for (const [group, groupTeams] of Object.entries(teamsByGroup)) {
        console.log(`Membuat jadwal untuk Grup ${group} dengan ${groupTeams.length} tim`);
        
        for (let round = 1; round <= 2; round++) {
          const teamsForRound = [...groupTeams];
          
          if (teamsForRound.length % 2 !== 0) {
            teamsForRound.push({ id: 'bye', name: 'BYE', group } as Team);
          }
          
          const n = teamsForRound.length;
          const rounds = n - 1;
          const matchesPerRound = n / 2;
          
          for (let i = 0; i < rounds; i++) {
            for (let j = 0; j < matchesPerRound; j++) {
              const home = teamsForRound[j];
              const away = teamsForRound[n - 1 - j];
              
              if (home.id === 'bye' || away.id === 'bye') continue;
              
              const [homeTeam, awayTeam] = round === 1 ? [home, away] : [away, home];
              
              let attempts = 0;
              let matchScheduled = false;
              let tempDate = currentDate;
              let tempSlotIndex = currentSlotIndex;
              
              while (!matchScheduled && attempts < maxAttempts) {
                const match: Omit<Match, 'id' | 'goals' | 'cards'> = {
                  homeTeamId: homeTeam.id,
                  awayTeamId: awayTeam.id,
                  date: tempDate,
                  time: MATCH_SLOTS[tempSlotIndex].time,
                  venue: 'Lapangan KARTA',
                  group,
                  round,
                  homeScore: 0,
                  awayScore: 0,
                  status: 'scheduled' as const
                };
                
                const tempMatches = [...matchesToCreate, match];
                
                if (canScheduleMatch(homeTeam, awayTeam, tempDate, MATCH_SLOTS[tempSlotIndex].time, matchesToCreate)) {
                  matchesToCreate.push(match);
                  matchScheduled = true;
                  currentDate = tempDate;
                  currentSlotIndex = (tempSlotIndex + 1) % MATCH_SLOTS.length;
                  
                  if (currentSlotIndex === 0) {
                    currentDate = addDays(currentDate, 1);
                  }
                } else {
                  attempts++;
                  if (tempSlotIndex < MATCH_SLOTS.length - 1) {
                    tempSlotIndex++;
                  } else {
                    tempSlotIndex = 0;
                    tempDate = addDays(tempDate, 1);
                  }
                }
              }
              
              if (!matchScheduled) {
                throw new Error(`Tidak dapat menjadwalkan pertandingan antara ${homeTeam.name} dan ${awayTeam.name} setelah ${maxAttempts} percobaan. Silakan coba dengan pengaturan yang berbeda atau hubungi administrator.`);
              }
            }
            
            // Rotasi tim dengan metode yang lebih efektif
            const lastTeam = teamsForRound[teamsForRound.length - 1];
            const secondTeam = teamsForRound[1];
            for (let k = teamsForRound.length - 1; k > 1; k--) {
              teamsForRound[k] = teamsForRound[k - 1];
            }
            teamsForRound[1] = lastTeam;
          }
          
          // Tambah jeda antara putaran
          currentDate = addDays(currentDate, 1);
          currentSlotIndex = 0;
        }
        
        // Tambah jeda antara grup
        currentDate = addDays(currentDate, 1);
        currentSlotIndex = 0;
      }
      
      // Hapus jadwal yang ada
      await Promise.all(matches.map(match => deleteMatchFromFirestore(match.id)));
      
      // Tambahkan pertandingan baru
      const newMatches: Match[] = [];
      for (const match of matchesToCreate) {
        const matchId = await addMatchToFirestore(match);
        newMatches.push({
          ...match,
          id: matchId,
          goals: [],
          cards: []
        });
      }
      
      setMatches(newMatches);
      console.log('Berhasil membuat jadwal baru');
      
    } catch (error) {
      console.error('Error generating match schedule:', error);
      throw error;
    }
  };

  const clearSchedule = async () => {
    try {
      // Hapus semua pertandingan dari Firestore
      for (const match of matches) {
        await deleteMatchFromFirestore(match.id);
      }
      
      // Reset state matches
      setMatches([]);
      
      // Recalculate standings
      calculateStandings();
      calculateTopScorers();
    } catch (error) {
      console.error('Error clearing schedule:', error);
      throw error;
    }
  };

  const updateMatch = async (match: Match) => {
    try {
      await updateMatchInFirestore(match);
      setMatches(prev => prev.map(m => m.id === match.id ? match : m));
    } catch (error) {
      console.error("Error updating match:", error);
      throw error;
    }
  };

  const recordGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      const newGoalId = await addGoalToFirestore(goal);
      
      const newGoal: Goal = {
        ...goal,
        id: newGoalId
      };
      
      setMatches(prev => prev.map(match => {
        if (match.id === goal.matchId) {
          return {
            ...match,
            goals: [...match.goals, newGoal]
          };
        }
        return match;
      }));
    } catch (error) {
      console.error("Error recording goal:", error);
      throw error;
    }
  };

  const recordCard = async (card: Omit<Card, 'id'>) => {
    try {
      const newCardId = await addCardToFirestore(card);
      
      const newCard: Card = {
        ...card,
        id: newCardId
      };
      
      setMatches(prev => prev.map(match => {
        if (match.id === card.matchId) {
          return {
            ...match,
            cards: [...match.cards, newCard]
          };
        }
        return match;
      }));
    } catch (error) {
      console.error("Error recording card:", error);
      throw error;
    }
  };

  // Standings calculations
  const calculateStandings = () => {
    const groups = [...new Set(teams.map(team => team.group))];
    const newStandings: Record<string, Standing[]> = {};

    groups.forEach(group => {
      const groupTeams = teams.filter(team => team.group === group);
      const groupStandings: Standing[] = groupTeams.map(team => ({
        teamId: team.id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      }));

      // Calculate stats from completed matches
      matches
        .filter(match => match.status === 'completed' && 
                (match.group === group || 
                 (getTeamById(match.homeTeamId)?.group === group && 
                  getTeamById(match.awayTeamId)?.group === group)))
        .forEach(match => {
          const homeTeamStanding = groupStandings.find(s => s.teamId === match.homeTeamId);
          const awayTeamStanding = groupStandings.find(s => s.teamId === match.awayTeamId);

          if (homeTeamStanding && awayTeamStanding && 
              typeof match.homeScore === 'number' && 
              typeof match.awayScore === 'number') {
            
            // Update played games
            homeTeamStanding.played += 1;
            awayTeamStanding.played += 1;

            // Update goals
            homeTeamStanding.goalsFor += match.homeScore;
            homeTeamStanding.goalsAgainst += match.awayScore;
            awayTeamStanding.goalsFor += match.awayScore;
            awayTeamStanding.goalsAgainst += match.homeScore;

            // Update results (win/draw/loss)
            if (match.homeScore > match.awayScore) {
              homeTeamStanding.won += 1;
              homeTeamStanding.points += 3;
              awayTeamStanding.lost += 1;
            } else if (match.homeScore < match.awayScore) {
              awayTeamStanding.won += 1;
              awayTeamStanding.points += 3;
              homeTeamStanding.lost += 1;
            } else {
              homeTeamStanding.drawn += 1;
              homeTeamStanding.points += 1;
              awayTeamStanding.drawn += 1;
              awayTeamStanding.points += 1;
            }
          }
        });

      // Sort standings
      groupStandings.sort((a, b) => {
        // First by points
        if (b.points !== a.points) return b.points - a.points;
        
        // Then by goal difference
        const aGoalDiff = a.goalsFor - a.goalsAgainst;
        const bGoalDiff = b.goalsFor - b.goalsAgainst;
        if (bGoalDiff !== aGoalDiff) return bGoalDiff - aGoalDiff;
        
        // Then by goals scored
        return b.goalsFor - a.goalsFor;
      });

      newStandings[group] = groupStandings;
    });

    setStandings(newStandings);
  };

  // Calculate top scorers
  const calculateTopScorers = () => {
    const scorers: Record<string, {playerId: string; teamId: string; goals: number}> = {};
    
    matches.forEach(match => {
      match.goals.forEach(goal => {
        if (!goal.isOwnGoal) {
          if (!scorers[goal.playerId]) {
            scorers[goal.playerId] = {
              playerId: goal.playerId,
              teamId: goal.teamId,
              goals: 0
            };
          }
          scorers[goal.playerId].goals += 1;
        }
      });
    });
    
    const topScorersList = Object.values(scorers).sort((a, b) => b.goals - a.goals);
    setTopScorers(topScorersList);
  };

  const value = {
    teams,
    matches,
    standings,
    topScorers,
    loading,
    
    addTeam,
    updateTeam,
    deleteTeam,
    getTeamById,
    setTeams,
    
    addPlayer,
    updatePlayer,
    deletePlayer,
    getPlayerById,
    
    generateSchedule,
    clearSchedule,
    updateMatch,
    recordGoal,
    recordCard,
    
    calculateStandings,
    calculateTopScorers,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};
