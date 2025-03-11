import { db } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { Team, Player, Match, Goal, Card } from '../context/TournamentContext';

// Collections
const COLLECTIONS = {
  TEAMS: 'teams',
  GROUPS: 'groups',
  MATCHES: 'matches',
  PLAYERS: 'players',
  GOALS: 'goals',
  CARD_RED: 'card_red',
  CARD_YELLOW: 'card_yellows',
  CARD_ACCUMULATION: 'card_accumulation'
};

// Team operations
export const fetchTeams = async (): Promise<Team[]> => {
  const teamsCollection = collection(db, COLLECTIONS.TEAMS);
  const teamsSnapshot = await getDocs(teamsCollection);
  const teams: Team[] = [];
  
  for (const teamDoc of teamsSnapshot.docs) {
    const teamData = teamDoc.data() as Omit<Team, 'players'>;
    
    // Fetch players for this team
    const playersQuery = query(
      collection(db, COLLECTIONS.PLAYERS),
      where('teamId', '==', teamDoc.id)
    );
    const playersSnapshot = await getDocs(playersQuery);
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Player[];
    
    teams.push({
      id: teamDoc.id,
      ...teamData,
      players
    });
  }
  
  return teams;
};

export const addTeamToFirestore = async (team: Omit<Team, 'id' | 'players'>): Promise<string> => {
  try {
    console.log('Menambahkan tim ke Firestore:', team.name);
    const teamDocRef = await addDoc(collection(db, COLLECTIONS.TEAMS), {
      name: team.name,
      group: team.group,
      logo: team.logo || null
    });
    console.log('Tim berhasil ditambahkan dengan ID:', teamDocRef.id);
    return teamDocRef.id;
  } catch (error) {
    console.error('Error saat menambahkan tim ke Firestore:', error);
    throw error;
  }
};

export const updateTeamInFirestore = async (team: Team): Promise<void> => {
  const { id, players, ...teamData } = team;
  await updateDoc(doc(db, COLLECTIONS.TEAMS, id), teamData);
};

export const deleteTeamFromFirestore = async (teamId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Delete team document
  batch.delete(doc(db, COLLECTIONS.TEAMS, teamId));
  
  // Find and delete associated players
  const playersQuery = query(
    collection(db, COLLECTIONS.PLAYERS),
    where('teamId', '==', teamId)
  );
  const playersSnapshot = await getDocs(playersQuery);
  playersSnapshot.docs.forEach(playerDoc => {
    batch.delete(doc(db, COLLECTIONS.PLAYERS, playerDoc.id));
  });
  
  await batch.commit();
};

// Player operations
export const addPlayerToFirestore = async (player: Omit<Player, 'id'>): Promise<string> => {
  const playerDocRef = await addDoc(collection(db, COLLECTIONS.PLAYERS), player);
  return playerDocRef.id;
};

export const updatePlayerInFirestore = async (player: Player): Promise<void> => {
  const { id, ...playerData } = player;
  await updateDoc(doc(db, COLLECTIONS.PLAYERS, id), playerData);
};

export const deletePlayerFromFirestore = async (playerId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.PLAYERS, playerId));
};

// Match operations
export const fetchMatches = async (): Promise<Match[]> => {
  const matchesCollection = collection(db, COLLECTIONS.MATCHES);
  const matchesSnapshot = await getDocs(matchesCollection);
  const matches: Match[] = [];
  
  for (const matchDoc of matchesSnapshot.docs) {
    const matchData = matchDoc.data() as Omit<Match, 'id' | 'goals' | 'cards'>;
    
    // Fetch goals for this match
    const goalsQuery = query(
      collection(db, COLLECTIONS.GOALS),
      where('matchId', '==', matchDoc.id)
    );
    const goalsSnapshot = await getDocs(goalsQuery);
    const goals = goalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
    
    // Fetch yellow cards for this match
    const yellowCardsQuery = query(
      collection(db, COLLECTIONS.CARD_YELLOW),
      where('matchId', '==', matchDoc.id)
    );
    const yellowCardsSnapshot = await getDocs(yellowCardsQuery);
    const yellowCards = yellowCardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'yellow'
    })) as Card[];
    
    // Fetch red cards for this match
    const redCardsQuery = query(
      collection(db, COLLECTIONS.CARD_RED),
      where('matchId', '==', matchDoc.id)
    );
    const redCardsSnapshot = await getDocs(redCardsQuery);
    const redCards = redCardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'red'
    })) as Card[];
    
    matches.push({
      id: matchDoc.id,
      ...matchData,
      goals,
      cards: [...yellowCards, ...redCards]
    });
  }
  
  return matches;
};

export const updateMatchInFirestore = async (match: Match): Promise<void> => {
  const { id, goals, cards, ...matchData } = match;
  await updateDoc(doc(db, COLLECTIONS.MATCHES, id), matchData);
};

export const addMatchToFirestore = async (match: Omit<Match, 'id' | 'goals' | 'cards'>): Promise<string> => {
  const matchDocRef = await addDoc(collection(db, COLLECTIONS.MATCHES), {
    ...match,
    homeScore: match.homeScore || 0,
    awayScore: match.awayScore || 0
  });
  return matchDocRef.id;
};

export const deleteMatchFromFirestore = async (matchId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'matches', matchId));
  } catch (error) {
    console.error('Error deleting match:', error);
    throw error;
  }
};

// Goal operations
export const addGoalToFirestore = async (goal: Omit<Goal, 'id'>): Promise<string> => {
  const goalDocRef = await addDoc(collection(db, COLLECTIONS.GOALS), goal);
  return goalDocRef.id;
};

// Card operations
export const addCardToFirestore = async (card: Omit<Card, 'id'>): Promise<string> => {
  if (card.type === 'yellow') {
    const cardDocRef = await addDoc(collection(db, COLLECTIONS.CARD_YELLOW), {
      matchId: card.matchId,
      playerId: card.playerId,
      teamId: card.teamId,
      minute: card.minute
    });
    return cardDocRef.id;
  } else {
    const cardDocRef = await addDoc(collection(db, COLLECTIONS.CARD_RED), {
      matchId: card.matchId,
      playerId: card.playerId,
      teamId: card.teamId,
      minute: card.minute
    });
    return cardDocRef.id;
  }
};
