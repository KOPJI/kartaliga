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

// Fungsi untuk menghasilkan jadwal round-robin untuk satu grup
const generateRoundRobinSchedule = (teams: Team[], group: string): [string, string][] => {
  const n = teams.length;
  const matches: [string, string][] = [];
  
  // Jika jumlah tim ganjil, tambahkan tim dummy
  const teamIds = teams.map(team => team.id);
  if (n % 2 === 1) {
    teamIds.push('dummy');
  }
  
  const numTeams = teamIds.length;
  const rounds = numTeams - 1;
  const halfSize = numTeams / 2;
  
  // Buat array untuk rotasi
  const teamIdsCopy = [...teamIds];
  const firstTeam = teamIdsCopy.shift()!;
  
  // Untuk setiap ronde
  for (let round = 0; round < rounds; round++) {
    // Pertandingan untuk ronde ini
    const roundMatches: [string, string][] = [];
    
    // Pertandingan pertama adalah tim pertama vs tim terakhir
    const firstMatch: [string, string] = [firstTeam, teamIdsCopy[round % (numTeams - 1)]];
    if (firstMatch[0] !== 'dummy' && firstMatch[1] !== 'dummy') {
      roundMatches.push(firstMatch);
    }
    
    // Pertandingan lainnya
    for (let i = 0; i < halfSize - 1; i++) {
      const team1Index = (round + i) % (numTeams - 1);
      const team2Index = (round + numTeams - 1 - i) % (numTeams - 1);
      
      const match: [string, string] = [teamIdsCopy[team1Index], teamIdsCopy[team2Index]];
      if (match[0] !== 'dummy' && match[1] !== 'dummy') {
        roundMatches.push(match);
      }
    }
    
    // Tambahkan pertandingan ke daftar
    matches.push(...roundMatches);
  }
  
  // Tambahkan putaran kedua (home dan away dibalik)
  const secondRoundMatches = matches.map(([home, away]) => [away, home] as [string, string]);
  matches.push(...secondRoundMatches);
  
  // Acak urutan pertandingan untuk distribusi yang lebih baik
  return shuffleArray(matches);
};

// Fungsi untuk mengacak array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
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
      setLoading(true);
      
      // Gunakan tanggal yang diberikan atau default ke hari ini
      let startDate = startDateStr ? new Date(startDateStr) : new Date();
      
      // Pastikan startDate valid
      if (isNaN(startDate.getTime())) {
        startDate = new Date();
      }
      
      // Hapus jadwal yang ada terlebih dahulu
      await clearSchedule();
      
      // Grup tim berdasarkan grup
      const teamsByGroup: Record<string, Team[]> = {};
      teams.forEach(team => {
        if (!teamsByGroup[team.group]) {
          teamsByGroup[team.group] = [];
        }
        teamsByGroup[team.group].push(team);
      });

      const matchesToCreate: Omit<Match, 'id' | 'goals' | 'cards'>[] = [];
      let currentDate = startDate.toISOString().split('T')[0];
      
      // Buat jadwal untuk setiap grup
      const allGroups = Object.keys(teamsByGroup).sort();
      
      // Buat jadwal round-robin untuk setiap grup
      const matchesByGroup: Record<string, [string, string][]> = {};
      for (const group of allGroups) {
        matchesByGroup[group] = generateRoundRobinSchedule(teamsByGroup[group], group);
      }
      
      // Distribusikan pertandingan ke dalam slot harian
      let currentSlotIndex = 0;
      let currentGroup = 0;
      
      // Terus jadwalkan sampai semua pertandingan terjadwal
      while (Object.values(matchesByGroup).some(matches => matches.length > 0)) {
        // Pilih grup berikutnya yang masih memiliki pertandingan
        while (matchesByGroup[allGroups[currentGroup]].length === 0) {
          currentGroup = (currentGroup + 1) % allGroups.length;
        }
        
        const group = allGroups[currentGroup];
        
        // Ambil pertandingan berikutnya dari grup ini
        const [homeTeamId, awayTeamId] = matchesByGroup[group].shift()!;
        const homeTeam = teamsByGroup[group].find(t => t.id === homeTeamId)!;
        const awayTeam = teamsByGroup[group].find(t => t.id === awayTeamId)!;
        
        // Cek apakah tim dapat bermain pada tanggal ini
        let canSchedule = canScheduleMatch(
          homeTeam,
          awayTeam,
          currentDate,
          MATCH_SLOTS[currentSlotIndex].time,
          matchesToCreate
        );
        
        // Jika tidak bisa dijadwalkan, coba tanggal berikutnya
        let attempts = 0;
        const maxAttempts = 30; // Batasi jumlah percobaan
        
        while (!canSchedule && attempts < maxAttempts) {
          // Coba slot berikutnya
          currentSlotIndex = (currentSlotIndex + 1) % MATCH_SLOTS.length;
          
          // Jika kembali ke slot pertama, pindah ke hari berikutnya
          if (currentSlotIndex === 0) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            currentDate = nextDate.toISOString().split('T')[0];
          }
          
          canSchedule = canScheduleMatch(
            homeTeam,
            awayTeam,
            currentDate,
            MATCH_SLOTS[currentSlotIndex].time,
            matchesToCreate
          );
          
          attempts++;
        }
        
        if (!canSchedule) {
          // Jika masih tidak bisa dijadwalkan setelah banyak percobaan, 
          // kembalikan pertandingan ke daftar dan lanjutkan ke grup berikutnya
          matchesByGroup[group].push([homeTeamId, awayTeamId]);
          currentGroup = (currentGroup + 1) % allGroups.length;
          continue;
        }
        
        // Buat pertandingan
        const match: Omit<Match, 'id'> = {
          homeTeamId,
          awayTeamId,
          date: currentDate,
          time: MATCH_SLOTS[currentSlotIndex].time,
          venue: 'Lapangan Utama',
          group,
          round: 1, // Semua pertandingan dianggap ronde 1 untuk sederhananya
          status: 'scheduled',
          goals: [],
          cards: []
        };
        
        matchesToCreate.push(match);
        
        // Pindah ke slot berikutnya
        currentSlotIndex = (currentSlotIndex + 1) % MATCH_SLOTS.length;
        
        // Jika kembali ke slot pertama, pindah ke hari berikutnya
        if (currentSlotIndex === 0) {
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          currentDate = nextDate.toISOString().split('T')[0];
        }
        
        // Pindah ke grup berikutnya untuk distribusi yang merata
        currentGroup = (currentGroup + 1) % allGroups.length;
      }
      
      // Simpan semua pertandingan ke Firestore
      for (const match of matchesToCreate) {
        await addMatchToFirestore(match);
      }
      
      // Muat ulang pertandingan
      const updatedMatches = await fetchMatches();
      setMatches(updatedMatches);
      
      console.log(`Berhasil membuat ${matchesToCreate.length} pertandingan`);
    } catch (error) {
      console.error('Error generating match schedule:', error);
      throw error;
    } finally {
      setLoading(false);
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

  // Fungsi untuk memeriksa apakah tim dapat dijadwalkan pada tanggal dan waktu tertentu
  const canScheduleMatch = (
    homeTeam: Team,
    awayTeam: Team,
    date: string,
    time: string,
    existingMatches: Omit<Match, 'id' | 'goals' | 'cards'>[]
  ): boolean => {
    // Cek apakah salah satu tim sudah bermain pada tanggal yang sama
    const isHomeTeamPlayingOnDate = isTeamPlayingOnDate(homeTeam, date, existingMatches);
    const isAwayTeamPlayingOnDate = isTeamPlayingOnDate(awayTeam, date, existingMatches);
    
    if (isHomeTeamPlayingOnDate || isAwayTeamPlayingOnDate) {
      return false;
    }
    
    // Cek apakah salah satu tim bermain pada hari sebelumnya atau hari berikutnya
    const isHomeTeamPlayingConsecutive = isTeamPlayingConsecutiveDays(homeTeam, date, existingMatches);
    const isAwayTeamPlayingConsecutive = isTeamPlayingConsecutiveDays(awayTeam, date, existingMatches);
    
    if (isHomeTeamPlayingConsecutive || isAwayTeamPlayingConsecutive) {
      return false;
    }
    
    // Cek keseimbangan istirahat
    const homeTeamRestDays = getTeamRestDays(homeTeam, existingMatches);
    const awayTeamRestDays = getTeamRestDays(awayTeam, existingMatches);
    
    // Jika tim belum memiliki pertandingan, mereka dapat dijadwalkan
    if (homeTeamRestDays.length === 0 || awayTeamRestDays.length === 0) {
      return true;
    }
    
    // Hitung rata-rata hari istirahat
    const avgHomeRestDays = homeTeamRestDays.reduce((sum, days) => sum + days, 0) / homeTeamRestDays.length;
    const avgAwayRestDays = awayTeamRestDays.reduce((sum, days) => sum + days, 0) / awayTeamRestDays.length;
    
    // Pastikan perbedaan rata-rata hari istirahat tidak terlalu besar
    const restDaysDiff = Math.abs(avgHomeRestDays - avgAwayRestDays);
    if (restDaysDiff > 5) { // Toleransi perbedaan 5 hari
      return false;
    }
    
    return true;
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
