// src/Graph/GraphAppMaximale.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';
import NavBar from '../Home/NavBar';

export default function GraphAppMaximale() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeId, setNodeId] = useState('');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [weight, setWeight] = useState('');
  const [lambdaData, setLambdaData] = useState(null);
  const [path, setPath] = useState([]);
  const [error, setError] = useState('');

  const networkRef = useRef(null);
  const containerRef = useRef();

  // ====== Gestion des sommets ======
  const addNode = () => {
    const trimmed = nodeId.trim();
    if (!trimmed) return;
    if (nodes.some(n => n.id === trimmed)) {
      alert('Ce sommet existe déjà !');
      return;
    }
    setNodes([...nodes, { id: trimmed }]);
    setNodeId('');
  };

  const handleNodeLabelChange = (id, newLabel) => {
    setNodes(nodes.map(n => (n.id === id ? { ...n, id: newLabel } : n)));
    setEdges(edges.map(e => ({
      ...e,
      source: e.source === id ? newLabel : e.source,
      target: e.target === id ? newLabel : e.target,
    })));
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.source !== id && e.target !== id));
  };

  // ====== Gestion des arcs ======
  const addEdge = () => {
    if (!source || !target) return;
    if (edges.some(e => e.source === source && e.target === target)) {
      alert('Cet arc existe déjà !');
      return;
    }
    setEdges([
      ...edges,
      {
        id: `e${edges.length + 1}`,
        source,
        target,
        label: weight || '1',
      },
    ]);
    setSource('');
    setTarget('');
    setWeight('');
  };

  const deleteEdge = (eid) => {
    setEdges(edges.filter(e => e.id !== eid));
  };

  // ====== Calcul MAX ======
  const saveAndRunDantzigMax = async () => {
    if (nodes.length === 0 || edges.length === 0) {
      alert('Ajoute des sommets et arcs avant.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/save-graph', { nodes, edges });
      const start = nodes[0].id;
      const end = nodes[nodes.length - 1].id;

      const lambdaRes = await axios.get(`http://localhost:5000/dantzig-max/${start}`);
      const pathRes = await axios.get(`http://localhost:5000/longest-path/${start}/${end}`);

      setLambdaData(lambdaRes.data);
      setPath(pathRes.data.chemin || []);
      setError('');
      drawGraph(pathRes.data.chemin || []);
    } catch (err) {
      console.error(err);
      setLambdaData(null);
      setPath([]);
      setError("Erreur dans l'algorithme ou le backend.");
    }
  };

  // ====== Dessin du graphe ======
  const drawGraph = (highlightPath = []) => {
    const data = {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.id,
        color: highlightPath.includes(n.id) ? '#fffbeb' : '#ffffff',
        font: { color: highlightPath.includes(n.id) ? '#78350f' : '#334155' },
        borderWidth: highlightPath.includes(n.id) ? 3 : 1,
      })),
      edges: edges.map(e => {
        const inPath =
          highlightPath.includes(e.source) &&
          highlightPath.includes(e.target) &&
          highlightPath.indexOf(e.source) + 1 === highlightPath.indexOf(e.target);

        return {
          from: e.source,
          to: e.target,
          label: e.label,
          arrows: 'to',
          color: inPath ? { color: '#d97706', highlight: '#b45309' } : '#94a3b8',
          font: { color: inPath ? '#d97706' : '#475569' },
          width: inPath ? 3 : 1.5,
          smooth: { enabled: true, type: 'cubicBezier' },
        };
      }),
    };

    const options = {
      nodes: {
        shape: 'circle',
        size: 28,
        font: { size: 14, face: 'Inter, sans-serif' },
        borderWidth: 1,
        color: {
          border: '#cbd5e1',
          background: '#ffffff',
          highlight: { border: '#d97706', background: '#fffbeb' },
        },
      },
      edges: {
        font: { align: 'middle' },
        smooth: true,
        arrows: { to: { enabled: true, scaleFactor: 1 } },
      },
      physics: { enabled: true, stabilization: { iterations: 200 } },
      interaction: { hover: true, tooltipDelay: 200 },
    };

    if (networkRef.current) networkRef.current.destroy();
    networkRef.current = new Network(containerRef.current, data, options);
  };

  // 🔹 Mise à jour auto du graphe dès qu'un sommet ou un arc change
  useEffect(() => {
    drawGraph(path);
  }, [nodes, edges]);

  useEffect(() => {
    return () => {
      if (networkRef.current) networkRef.current.destroy();
    };
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans text-gray-800 bg-gradient-to-b from-yellow-50 to-white rounded-xl shadow-lg">
      <NavBar />
      <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">
        Algorithme de Dantzig — <span className="text-amber-700">Maximale</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ===== Formulaire sommets ===== */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Ajouter un sommet</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nom du sommet"
              value={nodeId}
              onChange={e => setNodeId(e.target.value)}
              className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300"
            />
            <button
              onClick={addNode}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg px-4 py-2"
            >
              Ajouter
            </button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2">ID</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map(n => (
                <tr key={n.id}>
                  <td className="border px-3 py-2">
                    <input
                      value={n.id}
                      onChange={e => handleNodeLabelChange(n.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1"
                    />
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <button
                      onClick={() => deleteNode(n.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {nodes.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center py-4 text-gray-400 italic">
                    Aucun sommet ajouté
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* ===== Formulaire arcs ===== */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Ajouter un arc</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Départ</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.id}</option>
              ))}
            </select>
            <select
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Cible</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.id}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Poids"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2"
              min="0"
              step="any"
            />
          </div>
          <button
            onClick={addEdge}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg px-6 py-2 mb-4"
          >
            Ajouter
          </button>
          {/* Table des arcs */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2">Source</th>
                <th className="border px-3 py-2">Cible</th>
                <th className="border px-3 py-2">Poids</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {edges.map(e => (
                <tr key={e.id}>
                  <td className="border px-3 py-2">{e.source}</td>
                  <td className="border px-3 py-2">{e.target}</td>
                  <td className="border px-3 py-2">{e.label}</td>
                  <td className="border px-3 py-2 text-center">
                    <button
                      onClick={() => deleteEdge(e.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {edges.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400 italic">
                    Aucun arc ajouté
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* Bouton principal */}
      <div className="flex justify-center">
        <button
          onClick={saveAndRunDantzigMax}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg px-8 py-3"
        >
          Générer graphe & Calculer (Max)
        </button>
      </div>

      {error && (
        <div className="mt-4 text-center text-red-600 font-semibold">{error}</div>
      )}

      <div
        ref={containerRef}
        className="mt-6 rounded-xl border border-gray-200 shadow"
        style={{ width: '100%', height: '500px', backgroundColor: '#ffffff' }}
      />

      {/* Résultats */}
      {lambdaData && (
        <section className="mt-8 space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-3">λ(x)</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(lambdaData.lambda).map(([k, v]) => (
                <li key={k} className="bg-amber-50 rounded-lg px-4 py-3 border border-gray-200">
                  <span className="font-medium">{k}</span> : {v}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Étapes Ek</h2>
            <ul className="list-disc list-inside">
              {Object.entries(lambdaData.E).map(([step, list]) => (
                <li key={step}>
                  <strong>{step}</strong> : {list.join(', ')}
                </li>
              ))}
            </ul>
          </div>
          {path.length > 0 && (
            <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Chemin maximal</h2>
              <p className="font-medium">{path.join(' → ')}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
