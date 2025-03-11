import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { initializeTeamsToFirestore, initializePlayersToFirestore, fetchTeams, fetchMatches } from '../firebase/firestore';
import { CircleAlert, Check, Loader, ChartBar } from 'lucide-react';

const DataInitialization = () => {
  const { teams } = useTournament();
  const [initializing, setInitializing] = useState(false);
  const [initializingPlayers, setInitializingPlayers] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInitializeTeams = async () => {
    setInitializing(true);
    setSuccess(null);
    setError(null);
    
    try {
      // Validasi data tim sebelum mengirimkannya ke Firestore
      const validTeams = teams.filter(team => {
        if (!team.name || !team.group) {
          console.warn(`Skipping invalid team: ${JSON.stringify(team)}`);
          return false;
        }
        return true;
      });
      
      if (validTeams.length === 0) {
        throw new Error('Tidak ada data tim yang valid untuk diinisialisasi');
      }
      
      await initializeTeamsToFirestore(validTeams);
      setSuccess(`${validTeams.length} data tim berhasil diinisialisasi ke Firestore`);
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
      const allPlayers = teams.flatMap(team => team.players);
      
      // Validasi data pemain sebelum mengirimkannya ke Firestore
      const validPlayers = allPlayers.filter(player => {
        if (!player.name || !player.teamId) {
          console.warn(`Skipping invalid player: ${JSON.stringify(player)}`);
          return false;
        }
        return true;
      });
      
      if (validPlayers.length === 0) {
        throw new Error('Tidak ada data pemain yang valid untuk diinisialisasi');
      }
      
      await initializePlayersToFirestore(validPlayers);
      setSuccess(`${validPlayers.length} data pemain berhasil diinisialisasi ke Firestore`);
    } catch (err) {
      console.error('Error initializing players:', err);
      setError('Gagal menginisialisasi data pemain. Silakan coba lagi.');
    } finally {
      setInitializingPlayers(false);
    }
  };

  const handleFetchData = async () => {
    setFetching(true);
    setSuccess(null);
    setError(null);
    
    try {
      // Memuat ulang halaman untuk memicu useEffect di TournamentContext
      // yang akan mengambil data dari Firestore
      window.location.reload();
      
      setSuccess('Memuat ulang halaman untuk mengambil data terbaru dari Firestore');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal mengambil data dari Firestore. Silakan coba lagi.');
    } finally {
      setFetching(false);
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
      
      <div className="flex flex-col md:flex-row gap-3 mb-4">
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

      <div className="border-t pt-4 mt-4">
        <h3 className="font-medium mb-3">Ambil Data dari Firestore</h3>
        <p className="mb-4 text-gray-700">
          Ambil data tim, pemain, dan pertandingan dari database Firestore. Gunakan ini untuk memuat data yang telah tersimpan sebelumnya.
        </p>
        
        <button
          onClick={handleFetchData}
          disabled={fetching}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-300 flex items-center justify-center"
        >
          {fetching ? (
            <>
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              Mengambil Data...
            </>
          ) : (
            <>
              <ChartBar className="h-5 w-5 mr-2" />
              Ambil Data dari Firestore
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DataInitialization;
