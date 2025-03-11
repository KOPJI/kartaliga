import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { initializeTeamsToFirestore, initializePlayersToFirestore, fetchTeams, fetchMatches, clearTeamsFromFirestore } from '../firebase/firestore';
import { CircleAlert, Check, Loader, ChartBar } from 'lucide-react';

const DataInitialization = () => {
  const { teams, setTeams } = useTournament();
  const [initializing, setInitializing] = useState(false);
  const [initializingPlayers, setInitializingPlayers] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [clearing, setClearing] = useState(false);
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

  const handleClearTeams = async () => {
    if (!window.confirm('PERINGATAN: Anda akan menghapus SEMUA data tim dari Firestore. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) {
      return;
    }
    
    setClearing(true);
    setSuccess(null);
    setError(null);
    
    try {
      await clearTeamsFromFirestore();
      setTeams([]);
      setSuccess('Semua data tim berhasil dihapus dari Firestore');
    } catch (err) {
      console.error('Error clearing teams:', err);
      setError('Gagal menghapus data tim. Silakan coba lagi.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow p-6">
      <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
        <div className="flex items-start">
          <CircleAlert className="h-6 w-6 text-red-600 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-red-600 mb-2">PERINGATAN !!</h3>
            <p className="text-red-700">
              Jangan Melakukan Tindakan Ini Kecuali Dengan Seizin Gema Pratama Yang Membuat Aplikasi ini.
            </p>
            <p className="text-red-700 font-semibold mt-2">
              Konsultasikan Dahulu Dengan Gema Pratama Sebelum Anda Melakukan Tindakan Ini !!
            </p>
          </div>
        </div>
      </div>

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
            'Ambil Data dari Firestore'
          )}
        </button>
        
        <button
          onClick={handleClearTeams}
          disabled={clearing}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300 flex items-center justify-center"
        >
          {clearing ? (
            <>
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              Menghapus...
            </>
          ) : (
            'Kosongkan Total Tim'
          )}
        </button>
      </div>
    </div>
  );
};

export default DataInitialization;
