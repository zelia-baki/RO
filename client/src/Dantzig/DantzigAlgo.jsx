import React, { useState } from 'react';
import ReactFlow, { Controls, Background } from 'react-flow-renderer';

const nodeStyle = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  textAlign: 'center',
  paddingTop: '10px',
  fontWeight: 'bold',
  background: '#fff8dc',
};

const baseNodes = [
  { id: 'x1', position: { x: 50, y: 180 } },
  { id: 'x2', position: { x: 150, y: 180 } },
  { id: 'x3', position: { x: 250, y: 240 } },
  { id: 'x4', position: { x: 250, y: 120 } },
  { id: 'x5', position: { x: 350, y: 80 } },
  { id: 'x6', position: { x: 350, y: 180 } },
  { id: 'x7', position: { x: 450, y: 180 } },
  { id: 'x8', position: { x: 550, y: 180 } },
  { id: 'x9', position: { x: 550, y: 100 } },
  { id: 'x10', position: { x: 650, y: 100 } },
  { id: 'x11', position: { x: 350, y: 280 } },
  { id: 'x12', position: { x: 650, y: 180 } },
  { id: 'x13', position: { x: 450, y: 280 } },
  { id: 'x14', position: { x: 550, y: 280 } },
  { id: 'x15', position: { x: 650, y: 280 } },
  { id: 'x16', position: { x: 750, y: 280 } },
];

const baseEdges = [
  { id: 'e1', source: 'x1', target: 'x2', label: '10' },
  { id: 'e2', source: 'x2', target: 'x3', label: '15' },
  { id: 'e3', source: 'x2', target: 'x4', label: '8' },
  { id: 'e4', source: 'x3', target: 'x6', label: '1' },
  { id: 'e5', source: 'x4', target: 'x5', label: '6' },
  { id: 'e6', source: 'x4', target: 'x6', label: '5' },
  { id: 'e7', source: 'x5', target: 'x6', label: '3' },
  { id: 'e8', source: 'x6', target: 'x7', label: '7' },
  { id: 'e9', source: 'x7', target: 'x8', label: '4' },
  { id: 'e10', source: 'x8', target: 'x9', label: '6' },
  { id: 'e11', source: 'x9', target: 'x10', label: '5' },
  { id: 'e12', source: 'x8', target: 'x12', label: '2' },
  { id: 'e13', source: 'x6', target: 'x11', label: '8' },
  { id: 'e14', source: 'x11', target: 'x13', label: '3' },
  { id: 'e15', source: 'x13', target: 'x14', label: '4' },
  { id: 'e16', source: 'x14', target: 'x15', label: '2' },
  { id: 'e17', source: 'x15', target: 'x16', label: '1' },
];

const DantzigAlgo = () => {
  const [start, setStart] = useState('x1');
  const [end, setEnd] = useState('x16');
  const [lambdaData, setLambdaData] = useState(null);
  const [shortestPath, setShortestPath] = useState([]);
  const [error, setError] = useState('');

  const fetchLambdaAndPath = async () => {
    try {
      const lambdaRes = await fetch(`http://127.0.0.1:5000/lambda/${start}`);
      const lambdaJson = await lambdaRes.json();

      if (lambdaJson.error) {
        setError(lambdaJson.error);
        setLambdaData(null);
        setShortestPath([]);
        return;
      }

      const pathRes = await fetch(`http://127.0.0.1:5000/shortest-path/${start}/${end}`);
      const pathJson = await pathRes.json();

      if (pathJson.message) {
        setError(pathJson.message);
        setShortestPath([]);
      } else {
        setError('');
        setShortestPath(pathJson.chemin); // ex: ['x1', 'x2', 'x4', 'x6', 'x7', ...]
      }

      setLambdaData(lambdaJson);
    } catch (err) {
      setError("Erreur lors de la récupération.");
    }
  };

  const buildGraphElements = () => {
    const elements = [];

    for (const n of baseNodes) {
      const isInPath = shortestPath.includes(n.id);
      elements.push({
        id: n.id,
        data: { label: isInPath ? `✅ ${n.id}` : n.id },
        position: n.position,
        style: {
          ...nodeStyle,
          background: isInPath ? '#fecaca' : '#fff8dc',
          border: isInPath ? '3px solid red' : '2px solid #d97706',
          color: isInPath ? '#7f1d1d' : '#000',
        },
      });
    }

    for (const e of baseEdges) {
      const sourceIndex = shortestPath.indexOf(e.source);
      const targetIndex = shortestPath.indexOf(e.target);
      const isPartOfPath = sourceIndex !== -1 && targetIndex === sourceIndex + 1;

      elements.push({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: isPartOfPath,
        style: {
          stroke: isPartOfPath ? 'red' : '#999',
          strokeWidth: isPartOfPath ? 4 : 1,
        },
        labelStyle: {
          fill: isPartOfPath ? 'red' : 'black',
          fontWeight: isPartOfPath ? 'bold' : 'normal',
        },
      });
    }

    return elements;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Algorithme de Dantzig</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border border-gray-400 rounded px-3 py-2"
          placeholder="Début ex: x1"
        />
        <input
          type="text"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border border-gray-400 rounded px-3 py-2"
          placeholder="Fin ex: x16"
        />
        <button
          onClick={fetchLambdaAndPath}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Lancer
        </button>
      </div>

      {error && <div className="text-red-600 font-semibold mb-4">{error}</div>}

      <div className="h-[500px] border mb-8 rounded">
        <ReactFlow elements={buildGraphElements()}>
          <Background color="#aaa" gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      {lambdaData && (
        <>
          <div>
            <h2 className="text-xl font-semibold mb-2 text-green-800">Valeurs de λ(x)</h2>
            <ul className="grid grid-cols-4 gap-2">
              {Object.entries(lambdaData.lambda).map(([node, val]) => (
                <li
                  key={node}
                  className={`p-2 rounded text-white text-center ${
                    shortestPath.includes(node)
                      ? 'bg-green-600 font-bold'
                      : 'bg-gray-500'
                  }`}
                >
                  {node} : {val}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 text-purple-800">Étapes E<sub>k</sub></h2>
            <div className="space-y-2">
              {Object.entries(lambdaData.E).map(([step, nodes]) => (
                <div key={step}>
                  <strong>{step}:</strong> {nodes.join(', ')}
                </div>
              ))}
            </div>
          </div>

          {shortestPath.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-red-700">Chemin minimal</h2>
              <p className="text-lg">🔗 {shortestPath.join(' → ')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DantzigAlgo;
