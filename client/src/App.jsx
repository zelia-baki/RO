import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import HomePage from './Home/HomePage';
import GraphApp from './Graph/GraphApp';
import GraphAppMaximale from './Graph/GraphMax';
import GraphAppMinimale from './Graph/GraphMin';
import TestTailwind from './TestTailwind';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Pages spécifiques */}
        {/* <Route path="/minimale" element={<GraphApp />} /> */}
        <Route path="/minimale" element={<GraphAppMinimale />} />
        <Route path="/maximale" element={<GraphAppMaximale />} />
        <Route path="/test" element={<TestTailwind />} />



      </Routes>
    </Router>
  );
}

export default App;
