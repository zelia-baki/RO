import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import HomePage from './Home/HomePage';
import GraphApp from './Graph/GraphApp';
import GraphAppMaximale from './Graph/GraphMax';
import GraphAppMinimale from './Graph/GraphMin';
import TestTailwind from './TestTailwind';
import PetriRunway from './PetriRunway'; // 🔹 ajout
import "./index.css"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/minimale" element={<GraphAppMinimale />} />
        <Route path="/maximale" element={<GraphAppMaximale />} />
        <Route path="/test" element={<TestTailwind />} />
        <Route path="/rdp-runway" element={<PetriRunway />} /> {/* 🔹 nouvelle route */}
      </Routes>
    </Router>
  );
}

export default App;
