import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Standings from './pages/Standings';
import Statistics from './pages/Statistics';

import './index.css';

function App() {
  return (
    <TournamentProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<TeamDetail />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/matches/:id" element={<MatchDetail />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </Layout>
      </Router>
    </TournamentProvider>
  );
}

export default App;
