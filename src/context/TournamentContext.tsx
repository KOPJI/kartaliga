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
  addCardToFirestore
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
  const previousDay = addDays(date, -1);
  const nextDay = addDays(date, 1);
  
  return (
    isTeamPlayingOnDate(team, previousDay, matches) ||
    isTeamPlayingOnDate(team, nextDay, matches)
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

const isScheduleBalanced = (matches: Omit<Match, 'id' | 'goals' | 'cards'>[]): boolean => {
  const teamRestDays: { [key: string]: number[] } = {};
  
  // Calculate rest days for each team
  matches.forEach(match => {
    [match.homeTeamId, match.awayTeamId].forEach(teamId => {
      if (!teamRestDays[teamId]) {
        const team = { id: teamId } as Team;
        teamRestDays[teamId] = getTeamRestDays(team, matches as Match[]);
      }
    });
  });
  
  // Check if rest days are balanced
  const restDaysVariance = Object.values(teamRestDays).map(days => {
    if (days.length === 0) return 0;
    const mean = days.reduce((a, b) => a + b, 0) / days.length;
    const variance = days.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / days.length;
    return variance;
  });
  
  // Consider schedule balanced if variance is less than 1
  return Math.max(...restDaysVariance) < 1;
};

const canScheduleMatch = (
  homeTeam: Team,
  awayTeam: Team,
  date: string,
  time: string,
  existingMatches: Omit<Match, 'id' | 'goals' | 'cards'>[]
): boolean => {
  // Check if either team is playing on the same day
  if (isTeamPlayingOnDate(homeTeam, date, existingMatches as Match[])) {
    return false;
  }
  
  // Check if either team is playing on consecutive days
  if (isTeamPlayingConsecutiveDays(homeTeam, date, existingMatches as Match[])) {
    return false;
  }
  
  // Check if the time slot is available
  const isTimeSlotTaken = existingMatches.some(match => 
    match.date === date && match.time === time
  );
  
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
      // Group teams by their groups
      const teamsByGroup = teams.reduce((acc, team) => {
        if (!acc[team.group]) {
          acc[team.group] = [];
        }
        acc[team.group].push(team);
        return acc;
      }, {} as Record<string, Team[]>);
      
      const matchesToCreate: Omit<Match, 'id' | 'goals' | 'cards'>[] = [];
      
      // Generate schedule for each group
      for (const [group, groupTeams] of Object.entries(teamsByGroup)) {
        // Calculate number of rounds needed
        const numTeams = groupTeams.length;
        const numRounds = numTeams - 1;
        const matchesPerRound = Math.floor(numTeams / 2);
        
        // Start date for scheduling (you might want to make this configurable)
        let currentDate = new Date().toISOString().split('T')[0];
        
        // Generate matches for each round
        for (let round = 0; round < numRounds; round++) {
          const roundMatches: Array<[Team, Team]> = [];
          
          // Generate pairs for this round
          for (let i = 0; i < matchesPerRound; i++) {
            const home = groupTeams[i];
            const away = groupTeams[numTeams - 1 - i];
            roundMatches.push([home, away]);
          }
          
          // Rotate teams for next round (except first team)
          groupTeams.splice(1, 0, groupTeams.pop()!);
          
          // Schedule matches for this round
          let matchSlotIndex = 0;
          for (const [home, away] of roundMatches) {
            // Find next available date
            while (true) {
              const slot = MATCH_SLOTS[matchSlotIndex];
              
              if (canScheduleMatch(home, away, currentDate, slot.time, matchesToCreate)) {
                matchesToCreate.push({
                  homeTeamId: home.id,
                  awayTeamId: away.id,
                  date: currentDate,
                  time: slot.time,
                  venue: 'Lapangan KARTA',
                  group,
                  round: round + 1,
                  homeScore: 0,
                  awayScore: 0,
                  status: 'scheduled'
                });
                
                matchSlotIndex = (matchSlotIndex + 1) % MATCH_SLOTS.length;
                break;
              }
              
              // If we've tried all slots for this day, move to next day
              if (matchSlotIndex === MATCH_SLOTS.length - 1) {
                currentDate = addDays(currentDate, 1);
                matchSlotIndex = 0;
              } else {
                matchSlotIndex++;
              }
            }
          }
        }
      }
      
      // Verify schedule balance
      if (!isScheduleBalanced(matchesToCreate as Omit<Match, 'id' | 'goals' | 'cards'>[])) {
        throw new Error('Tidak dapat membuat jadwal yang seimbang');
      }
      
      // Add matches to Firestore
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
      
      // Update state
      setMatches(newMatches);
      
    } catch (error) {
      console.error('Error generating match schedule:', error);
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
