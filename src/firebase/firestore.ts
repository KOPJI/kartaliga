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

// Initialize data
export const initializeTeamsToFirestore = async (teams: Team[]): Promise<void> => {
  // Cek apakah sudah ada data tim di Firestore
  const teamsCollection = collection(db, COLLECTIONS.TEAMS);
  const teamsSnapshot = await getDocs(teamsCollection);
  const existingTeamNames = teamsSnapshot.docs.map(doc => doc.data().name);
  
  const batch = writeBatch(db);
  const newTeamRefs: { team: Team, ref: string }[] = [];
  
  // Proses tim
  for (const team of teams) {
    // Pastikan semua field memiliki nilai yang valid
    if (!team.name) {
      console.warn(`Skipping team with id ${team.id} because name is undefined`);
      continue; // Skip tim ini
    }
    
    // Cek apakah tim dengan nama yang sama sudah ada
    if (existingTeamNames.includes(team.name)) {
      console.warn(`Team with name "${team.name}" already exists in Firestore. Skipping to prevent duplication.`);
      continue; // Skip tim ini untuk mencegah duplikasi
    }
    
    const teamRef = doc(collection(db, COLLECTIONS.TEAMS));
    batch.set(teamRef, {
      name: team.name || '',
      group: team.group || '',
      logo: team.logo || null
    });
    
    // Simpan referensi tim baru untuk digunakan saat menyimpan pemain
    newTeamRefs.push({ team, ref: teamRef.id });
  }
  
  // Commit batch untuk tim
  await batch.commit();
  
  // Proses pemain dalam batch terpisah
  if (newTeamRefs.length > 0) {
    const playersBatch = writeBatch(db);
    
    for (const { team, ref } of newTeamRefs) {
      // Simpan pemain untuk tim ini
      if (team.players && team.players.length > 0) {
        for (const player of team.players) {
          if (!player.name) {
            console.warn(`Skipping player because name is undefined`);
            continue;
          }
          
          const playerRef = doc(collection(db, COLLECTIONS.PLAYERS));
          playersBatch.set(playerRef, {
            name: player.name || '',
            number: player.number || 0,
            position: player.position || '',
            teamId: ref, // Gunakan ID tim baru
            photo: player.photo || null
          });
        }
      }
    }
    
    // Commit batch untuk pemain
    await playersBatch.commit();
  }
};

export const initializePlayersToFirestore = async (players: Player[]): Promise<void> => {
  const batch = writeBatch(db);
  
  players.forEach(player => {
    // Pastikan semua field memiliki nilai yang valid
    if (!player.name || !player.teamId) {
      console.warn(`Skipping player with id ${player.id} because required fields are missing`);
      return; // Skip pemain ini
    }
    
    const playerRef = doc(collection(db, COLLECTIONS.PLAYERS));
    batch.set(playerRef, {
      name: player.name || '',
      number: player.number || 0,
      position: player.position || '',
      teamId: player.teamId || ''
    });
  });
  
  await batch.commit();
};

// Generate match schedule
export const generateMatchScheduleInFirestore = async (matches: Omit<Match, 'id' | 'goals' | 'cards'>[]): Promise<void> => {
  const batch = writeBatch(db);
  
  matches.forEach(match => {
    const matchRef = doc(collection(db, COLLECTIONS.MATCHES));
    batch.set(matchRef, {
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      date: match.date || '',
      time: match.time || '',
      venue: match.venue,
      group: match.group,
      round: match.round,
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      status: match.status
    });
  });
  
  await batch.commit();
};

// Clear all teams and related players from Firestore
export const clearTeamsFromFirestore = async (): Promise<void> => {
  // Get all teams
  const teamsCollection = collection(db, COLLECTIONS.TEAMS);
  const teamsSnapshot = await getDocs(teamsCollection);
  
  // Get all players
  const playersCollection = collection(db, COLLECTIONS.PLAYERS);
  const playersSnapshot = await getDocs(playersCollection);
  
  // Use batch to delete all teams and players
  const batch = writeBatch(db);
  
  // Delete all teams
  teamsSnapshot.docs.forEach(teamDoc => {
    batch.delete(doc(db, COLLECTIONS.TEAMS, teamDoc.id));
  });
  
  // Delete all players
  playersSnapshot.docs.forEach(playerDoc => {
    batch.delete(doc(db, COLLECTIONS.PLAYERS, playerDoc.id));
  });
  
  // Commit the batch
  await batch.commit();
  
  console.log(`Deleted ${teamsSnapshot.docs.length} teams and ${playersSnapshot.docs.length} players from Firestore`);
};
