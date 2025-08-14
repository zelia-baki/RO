// src/components/NavBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-100 border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 py-3 flex gap-4">
        <button
          onClick={() => navigate('/minimale')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Minimale
        </button>
        <button
          onClick={() => navigate('/maximale')}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Maximale
        </button>
      </div>
    </nav>
  );
}
