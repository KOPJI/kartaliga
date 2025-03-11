import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';

import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Schedule from './pages/Schedule';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Standings from './pages/Standings';
import Statistics from './pages/Statistics';

import './index.css';

function App() {
  useEffect(() => {
    // Include required font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <TournamentProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 font-[Poppins]">
          <Header />
          
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:id" element={<TeamDetail />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/matches/:id" element={<MatchDetail />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>
          </main>
          
          <footer className="bg-green-800 text-white p-4 mt-8">
            <div className="container mx-auto text-center">
              <p>Karta Cup V © 2025 - Aplikasi Manajemen Turnamen Sepak Bola</p>
            </div>
          </footer>
        </div>
      </Router>
    </TournamentProvider>
  );
}

export default App;
