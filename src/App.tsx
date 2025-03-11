import React from 'react';
import { BrowserRouter as Router, Routes, Route, RouteProps } from 'react-router-dom';
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
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="teams">
              <Route index element={<Teams />} />
              <Route path=":id" element={<TeamDetail />} />
            </Route>
            <Route path="matches">
              <Route index element={<Matches />} />
              <Route path=":id" element={<MatchDetail />} />
            </Route>
            <Route path="standings" element={<Standings />} />
            <Route path="statistics" element={<Statistics />} />
          </Route>
        </Routes>
      </Router>
    </TournamentProvider>
  );
}

export default App;
