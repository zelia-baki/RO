// src/Home/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-white">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Bienvenue</h1>

      <div className="flex gap-6">
        <button
          onClick={() => navigate('/minimale')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg shadow-md transition"
        >
          Minimale
        </button>

        <button
          onClick={() => navigate('/maximale')}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg shadow-md transition"
        >
          Maximale
        </button>
      </div>
    </div>
  );
}
