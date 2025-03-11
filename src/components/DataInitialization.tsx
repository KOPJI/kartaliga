import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { 
  fetchTeams as fetchTeamsFromFirestore, 
  initializeTeamsToFirestore, 
  fetchMatches, 
  clearTeamsFromFirestore 
} from '../firebase/firestore';
import { CircleAlert, Check, Loader, ChartBar } from 'lucide-react';

const DataInitialization = () => {
  const { teams, setTeams } = useTournament();
  const [initializing, setInitializing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInitializeTeams = async () => {
    setInitializing(true);
    setSuccess(null);
    setError(null);
    
    try {
      // Cek apakah sudah ada data tim di Firestore untuk mencegah duplikasi
      const existingTeams = await fetchTeamsFromFirestore();
      
      if (existingTeams.length > 0) {
        if (!window.confirm(`Sudah ada ${existingTeams.length} tim di Firestore. Apakah Anda ingin melanjutkan dan menambahkan tim baru? Ini mungkin menyebabkan duplikasi data.`)) {
          setInitializing(false);
          return;
        }
      }
      
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
      
      // Modifikasi fungsi initializeTeamsToFirestore untuk menyimpan pemain juga
      await initializeTeamsToFirestore(validTeams);
      
      // Inisialisasi pemain secara otomatis
      const allPlayers = validTeams.flatMap(team => team.players.map(player => ({
        ...player,
        teamId: team.id
      })));
      
      setSuccess(`${validTeams.length} data tim dan ${allPlayers.length} data pemain berhasil diinisialisasi ke Firestore`);
    } catch (err) {
      console.error('Error initializing teams:', err);
      setError('Gagal menginisialisasi data tim. Silakan coba lagi.');
    } finally {
      setInitializing(false);
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
    if (!window.confirm('PERINGATAN: Anda akan menghapus SEMUA data tim dan pemain dari Firestore. Tindakan ini tidak dapat dibatalkan dan hanya menghapus data di Firestore, bukan di aplikasi ini. Lanjutkan?')) {
      return;
    }
    
    setClearing(true);
    setSuccess(null);
    setError(null);
    
    try {
      await clearTeamsFromFirestore();
      setSuccess('Semua data tim dan pemain berhasil dihapus dari Firestore (data di aplikasi ini tidak berubah)');
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
            'Inisialisasi Data Tim & Pemain'
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
            'Kosongkan Data di Firestore'
          )}
        </button>
      </div>
    </div>
  );
};

export default DataInitialization;
