import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { initializeTeamsToFirestore, initializePlayersToFirestore } from '../firebase/firestore';
import { CircleAlert, Check, Loader } from 'lucide-react';

const DataInitialization = () => {
  const { teams } = useTournament();
  const [initializing, setInitializing] = useState(false);
  const [initializingPlayers, setInitializingPlayers] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInitializeTeams = async () => {
    setInitializing(true);
    setSuccess(null);
    setError(null);
    
    try {
      await initializeTeamsToFirestore(teams);
      setSuccess('Data tim berhasil diinisialisasi ke Firestore');
    } catch (err) {
      console.error('Error initializing teams:', err);
      setError('Gagal menginisialisasi data tim. Silakan coba lagi.');
    } finally {
      setInitializing(false);
    }
  };

  const handleInitializePlayers = async () => {
    setInitializingPlayers(true);
    setSuccess(null);
    setError(null);
    
    try {
      const players = teams.flatMap(team => team.players);
      await initializePlayersToFirestore(players);
      setSuccess('Data pemain berhasil diinisialisasi ke Firestore');
    } catch (err) {
      console.error('Error initializing players:', err);
      setError('Gagal menginisialisasi data pemain. Silakan coba lagi.');
    } finally {
      setInitializingPlayers(false);
    }
  };

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Inisialisasi Data ke Firestore</h2>
      
      <p className="mb-4 text-gray-700">
        Inisialisasi data tim dan pemain ke database Firestore. Proses ini hanya perlu dilakukan sekali pada awal turnamen.
      </p>
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md flex items-center">
          <CircleAlert className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-3">
        <button
          onClick={handleInitializeTeams}
          disabled={initializing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
        >
          {initializing ? (
            <>
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              Menginisialisasi...
            </>
          ) : (
            'Inisialisasi Data Tim'
          )}
        </button>
        
        <button
          onClick={handleInitializePlayers}
          disabled={initializingPlayers}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300 flex items-center justify-center"
        >
          {initializingPlayers ? (
            <>
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              Menginisialisasi...
            </>
          ) : (
            'Inisialisasi Data Pemain'
          )}
        </button>
      </div>
    </div>
  );
};

export default DataInitialization;
