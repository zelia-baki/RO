import React from 'react';

export default function TestTailwind() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Test Tailwind CSS</h1>
      <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
        This should have a red background
      </div>
      <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        Test Button
      </button>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-yellow-200 p-4 rounded">Box 1</div>
        <div className="bg-purple-200 p-4 rounded">Box 2</div>
        <div className="bg-pink-200 p-4 rounded">Box 3</div>
      </div>
    </div>
  );
}
