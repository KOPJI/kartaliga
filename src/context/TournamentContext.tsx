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
  deleteMatchFromFirestore,
  writeBatch,
  doc,
  collection,
  getDocs
} from '../firebase/firestore';
import { db } from '../firebase/config';

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
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  date: string;
  time: string;
  venue: string;
  group: string;
  round: number;
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
  { 
    time: '13:30', 
    startTime: '13:30',
    endTime: '14:35'
  },
  { 
    time: '14:45', 
    startTime: '14:45',
    endTime: '15:50'
  },
  { 
    time: '16:00', 
    startTime: '16:00',
    endTime: '17:05'
  }
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
    match.team1Id === team.id || match.team2Id === team.id
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
    (match.team1Id === team.id || match.team2Id === team.id)
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
    match.team1Id === team.id || match.team2Id === team.id
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

const validateSchedule = (
  matches: Omit<Match, 'id' | 'goals' | 'cards'>[],
  teams: Team[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Kelompokkan pertandingan berdasarkan grup
  const matchesByGroup = matches.reduce((acc, match) => {
    if (!acc[match.group]) acc[match.group] = [];
    acc[match.group].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);
  
  // Validasi untuk setiap grup
  Object.entries(matchesByGroup).forEach(([group, groupMatches]) => {
    const teamsInGroup = teams.filter(t => t.group === group);
    const n = teamsInGroup.length;
    
    // Hitung jumlah pertandingan yang seharusnya ada dalam sistem round robin
    const expectedMatches = n % 2 === 0 ? (n * (n - 1)) / 2 : ((n - 1) * n) / 2;
    
    if (groupMatches.length !== expectedMatches) {
      errors.push(`Grup ${group}: Jumlah pertandingan (${groupMatches.length}) tidak sesuai dengan format round robin (seharusnya ${expectedMatches})`);
    }
    
    // Periksa bahwa setiap tim bermain melawan semua tim lainnya tepat satu kali
    teamsInGroup.forEach(team1 => {
      const teamMatches = groupMatches.filter(m => 
        m.team1Id === team1.id || m.team2Id === team1.id
      );
      
      if (teamMatches.length !== n - 1) {
        errors.push(`Grup ${group}: Tim ${team1.name} memiliki ${teamMatches.length} pertandingan (seharusnya ${n - 1})`);
      }
      
      // Periksa lawan yang unik
      const opponents = new Set();
      teamMatches.forEach(match => {
        const opponentId = match.team1Id === team1.id ? match.team2Id : match.team1Id;
        if (opponents.has(opponentId)) {
          errors.push(`Grup ${group}: Tim ${team1.name} bermain lebih dari satu kali melawan tim yang sama`);
        }
        opponents.add(opponentId);
      });
    });
  });
  
  // Validasi jadwal harian
  const matchesByDate = matches.reduce((acc, match) => {
    if (!acc[match.date]) acc[match.date] = [];
    acc[match.date].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);
  
  Object.entries(matchesByDate).forEach(([date, dateMatches]) => {
    if (dateMatches.length > 3) {
      errors.push(`Tanggal ${date}: Terlalu banyak pertandingan (${dateMatches.length} pertandingan, maksimal 3)`);
    }
    
    // Periksa waktu pertandingan
    dateMatches.forEach(match => {
      if (!MATCH_SLOTS.some(slot => slot.time === match.time)) {
        errors.push(`Tanggal ${date}: Waktu pertandingan ${match.time} tidak valid`);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fungsi untuk menghasilkan jadwal round-robin untuk satu grup
const generateRoundRobinSchedule = (teams: Team[], group: string): [string, string][] => {
  const matches: [string, string][] = [];
  const n = teams.length;
  
  // Jika jumlah tim ganjil, tambahkan 'bye' untuk menyeimbangkan
  const teamIds = teams.map(t => t.id);
  if (n % 2 === 1) {
    teamIds.push('bye');
  }
  
  const numTeams = teamIds.length;
  const rounds = numTeams - 1;
  const halfSize = numTeams / 2;
  
  // Buat array untuk rotasi
  const teamArray = [...teamIds];
  const firstTeam = teamArray[0];
  const restTeams = teamArray.slice(1);
  
  // Untuk setiap ronde
  for (let round = 0; round < rounds; round++) {
    // Buat pertandingan untuk ronde ini
    for (let i = 0; i < halfSize; i++) {
      const team1 = i === 0 ? firstTeam : restTeams[i - 1];
      const team2 = restTeams[restTeams.length - 1 - i];
      
      // Lewati jika salah satu tim adalah 'bye'
      if (team1 !== 'bye' && team2 !== 'bye') {
        matches.push([team1, team2]);
      }
    }
    
    // Rotasi tim (kecuali tim pertama)
    restTeams.unshift(restTeams.pop()!);
  }
  
  return matches;
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
  generateSchedule: (startDateStr?: string) => Promise<void>;
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
  const generateSchedule = async (startDateStr: string = '') => {
    try {
      const batch = writeBatch(db);
      const startDate = new Date(startDateStr || new Date());
      const allScheduledMatches: Omit<Match, 'id' | 'goals' | 'cards'>[] = [];
      
      // Buat jadwal untuk setiap grup
      const groups = ['A', 'B', 'C', 'D'];
      let currentDate = new Date(startDate);
      
      // Fungsi untuk mengacak array
      const shuffleArray = <T extends any>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Fungsi untuk memeriksa apakah tim dapat bermain pada tanggal tertentu
      const canTeamPlayOnDate = (team: Team, date: string, slot: MatchSlot): boolean => {
        // 1. Periksa apakah tim sudah bermain hari ini
        const hasMatchToday = allScheduledMatches.some(match => {
          const matchDate = match.date;
          return matchDate === date && 
            (match.team1Id === team.id || match.team2Id === team.id);
        });
        if (hasMatchToday) return false;

        // 2. Periksa apakah tim bermain kemarin atau besok
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const hasMatchAdjacentDays = allScheduledMatches.some(match => {
          const matchDate = new Date(match.date);
          const isAdjacent = 
            matchDate.getTime() === yesterday.getTime() || 
            matchDate.getTime() === tomorrow.getTime();
          return isAdjacent && 
            (match.team1Id === team.id || match.team2Id === team.id);
        });
        if (hasMatchAdjacentDays) return false;

        // 3. Periksa distribusi istirahat
        const teamMatches = allScheduledMatches.filter(match => 
          match.team1Id === team.id || match.team2Id === team.id
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (teamMatches.length > 0) {
          const lastMatch = teamMatches[teamMatches.length - 1];
          const lastMatchDate = new Date(lastMatch.date);
          const currentMatchDate = new Date(date);
          const daysBetween = Math.floor(
            (currentMatchDate.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Minimal harus ada 2 hari istirahat
          if (daysBetween < 2) return false;
        }

        return true;
      };

      // Generate semua pertandingan untuk semua grup
      const allGroupMatches: Array<{
        team1Id: string,
        team2Id: string,
        group: string
      }> = [];

      for (const group of groups) {
        const teamsInGroup = teams.filter(team => team.group === group);
        if (teamsInGroup.length < 2) continue;
        
        const groupMatches = generateRoundRobinSchedule(teamsInGroup, group);
        groupMatches.forEach(([team1Id, team2Id]) => {
          allGroupMatches.push({ team1Id, team2Id, group });
        });
      }

      // Jadwalkan pertandingan hari per hari
      while (allGroupMatches.length > 0) {
        // Acak urutan slot untuk setiap hari
        const dailySlots = shuffleArray([...MATCH_SLOTS]);
        let matchesScheduledToday = 0;
        let attempts = 0;
        const maxAttempts = 50; // Batasi jumlah percobaan per hari

        while (matchesScheduledToday < 3 && allGroupMatches.length > 0 && attempts < maxAttempts) {
          attempts++;
          
          // Coba jadwalkan pertandingan untuk setiap slot
          for (const slot of dailySlots) {
            if (matchesScheduledToday >= 3) break;

            // Acak dan coba setiap pertandingan yang tersisa
            const shuffledMatches = shuffleArray([...allGroupMatches]);
            let matchScheduled = false;

            for (const match of shuffledMatches) {
              const team1 = teams.find(t => t.id === match.team1Id)!;
              const team2 = teams.find(t => t.id === match.team2Id)!;
              const dateStr = currentDate.toISOString().split('T')[0];

              if (canTeamPlayOnDate(team1, dateStr, slot) && 
                  canTeamPlayOnDate(team2, dateStr, slot)) {
                // Jadwalkan pertandingan
                const newMatch: Omit<Match, 'id' | 'goals' | 'cards'> = {
                  team1Id: match.team1Id,
                  team2Id: match.team2Id,
                  team1Score: 0,
                  team2Score: 0,
                  date: dateStr,
                  time: slot.time,
                  venue: 'Lapangan Gelora Babakan Girihieum',
                  group: match.group,
                  round: 1,
                  status: 'scheduled'
                };

                allScheduledMatches.push(newMatch);
                matchesScheduledToday++;
                matchScheduled = true;

                // Hapus pertandingan dari daftar yang belum dijadwalkan
                const index = allGroupMatches.findIndex(m => 
                  m.team1Id === match.team1Id && 
                  m.team2Id === match.team2Id
                );
                if (index > -1) {
                  allGroupMatches.splice(index, 1);
                }

                break;
              }
            }

            if (!matchScheduled) {
              continue;
            }
          }
        }
      }

      // Validasi jadwal final
      const validation = validateSchedule(allScheduledMatches, teams);
      if (!validation.isValid) {
        throw new Error(`Jadwal tidak valid: ${validation.errors.join(', ')}`);
      }

      // Simpan semua pertandingan ke Firestore
      await clearSchedule();
      
      for (const match of allScheduledMatches) {
        const matchRef = doc(collection(db, 'matches'));
        batch.set(matchRef, {
          ...match,
          goals: [],
          cards: []
        });
      }

      await batch.commit();
      
      // Update state
      const matchesWithIds = await fetchMatches();
      setMatches(matchesWithIds);
      
    } catch (error) {
      console.error('Error generating schedule:', error);
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
        .filter(match => match.status === 'completed' && match.group === group)
        .forEach(match => {
          const team1Standing = groupStandings.find(s => s.teamId === match.team1Id);
          const team2Standing = groupStandings.find(s => s.teamId === match.team2Id);

          if (team1Standing && team2Standing && 
              typeof match.team1Score === 'number' && 
              typeof match.team2Score === 'number') {
            
            // Update played games
            team1Standing.played += 1;
            team2Standing.played += 1;

            // Update goals
            team1Standing.goalsFor += match.team1Score;
            team1Standing.goalsAgainst += match.team2Score;
            team2Standing.goalsFor += match.team2Score;
            team2Standing.goalsAgainst += match.team1Score;

            // Update results (win/draw/loss)
            if (match.team1Score > match.team2Score) {
              team1Standing.won += 1;
              team1Standing.points += 3;
              team2Standing.lost += 1;
            } else if (match.team1Score < match.team2Score) {
              team2Standing.won += 1;
              team2Standing.points += 3;
              team1Standing.lost += 1;
            } else {
              team1Standing.drawn += 1;
              team1Standing.points += 1;
              team2Standing.drawn += 1;
              team2Standing.points += 1;
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
        if (!scorers[goal.playerId]) {
          scorers[goal.playerId] = {
            playerId: goal.playerId,
            teamId: goal.teamId,
            goals: 0
          };
        }
        scorers[goal.playerId].goals += 1;
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
