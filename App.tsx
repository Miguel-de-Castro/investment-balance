import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Simulator from './pages/Simulator';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulate/:ticker" element={<Simulator />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;