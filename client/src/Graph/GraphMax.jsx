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

  // ====== Gestion des arcs ======
  const handleEdgeChange = (eid, field, value) => {
    setEdges(edges.map(e => (e.id === eid ? { ...e, [field]: value } : e)));
  };

  const deleteEdge = (eid) => {
    setEdges(edges.filter(e => e.id !== eid));
  };

  const addEdge = () => {
    const s = source.trim();
    const t = target.trim();
    const w = (weight ?? '').toString().trim();
    if (!s || !t) return;
    if (edges.some(e => e.source === s && e.target === t)) {
      alert('Cet arc existe déjà !');
      return;
    }
    setEdges([
      ...edges,
      {
        id: `e${edges.length + 1}`,
        source: s,
        target: t,
        label: w || '1',
      },
    ]);
    setSource('');
    setTarget('');
    setWeight('');
  };

  // ====== Calcul MAX (backend) ======
  const saveAndRunDantzigMax = async () => {
    if (nodes.length === 0 || edges.length === 0) {
      alert('Ajoute des sommets et arcs avant.');
      return;
    }

    try {
      // Sauvegarder le graphe
      await axios.post('http://localhost:5000/save-graph', { nodes, edges });

      // Définir start & end (ici: premier et dernier sommet saisis)
      const start = nodes[0].id;
      const end = nodes[nodes.length - 1].id;

      // LAMBDA & Etapes (mode MAX)
      const lambdaRes = await axios.get(`http://localhost:5000/dantzig-max/${start}`);

      // Chemin maximal
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

  // ====== Dessin du graphe (vis-network) ======
  const drawGraph = (highlightPath = []) => {
    const data = {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.id,
        color: highlightPath.includes(n.id) ? '#fffbeb' : '#ffffff', // jaune pâle si sur chemin
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

  useEffect(() => {
    return () => {
      if (networkRef.current) networkRef.current.destroy();
    };
  }, []);

  // ====== UI ======
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans text-gray-800 bg-gradient-to-b from-yellow-50 to-white rounded-xl shadow-lg">
         <NavBar />
      <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">
        Algorithme de Dantzig — <span className="text-amber-700">Maximale</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ====== Ajouter un sommet ====== */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Ajouter un sommet</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nom du sommet"
              value={nodeId}
              onChange={e => setNodeId(e.target.value)}
              className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button
              onClick={addNode}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg px-4 py-2 shadow transition"
            >
              Ajouter
            </button>
          </div>

          <h3 className="font-medium text-gray-700 mb-2">Liste des sommets</h3>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="border px-3 py-2">ID</th>
                  <th className="border px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map(n => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">
                      <input
                        value={n.id}
                        onChange={e => handleNodeLabelChange(n.id, e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-300"
                      />
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        onClick={() => deleteNode(n.id)}
                        className="text-red-500 hover:text-red-700 font-medium transition"
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
          </div>
        </section>

        {/* ====== Ajouter un arc ====== */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Ajouter un arc</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Départ"
              value={source}
              onChange={e => setSource(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              type="text"
              placeholder="Cible"
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <input
              type="number"
              placeholder="Poids"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
              min="0"
              step="any"
            />
          </div>
          <button
            onClick={addEdge}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg px-6 py-2 shadow transition mb-4"
          >
            Ajouter
          </button>

          <h3 className="font-medium text-gray-700 mb-2">Liste des arcs</h3>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="border px-3 py-2">Source</th>
                  <th className="border px-3 py-2">Cible</th>
                  <th className="border px-3 py-2">Poids</th>
                  <th className="border px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {edges.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">
                      <input
                        value={e.source}
                        onChange={ev => handleEdgeChange(e.id, 'source', ev.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-300"
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        value={e.target}
                        onChange={ev => handleEdgeChange(e.id, 'target', ev.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-300"
                      />
                    </td>
                    <td className="border px-3 py-2">
                      <input
                        type="number"
                        value={e.label}
                        onChange={ev => handleEdgeChange(e.id, 'label', ev.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        min="0"
                        step="any"
                      />
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        onClick={() => deleteEdge(e.id)}
                        className="text-red-500 hover:text-red-700 font-medium transition"
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
          </div>
        </section>
      </div>

      {/* ====== Bouton principal ====== */}
      <div className="flex justify-center">
        <button
          onClick={saveAndRunDantzigMax}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg px-8 py-3 shadow-md transition"
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

      {/* ====== Résultats ====== */}
      {lambdaData && (
        <section className="mt-8 space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">λ(x)</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-700">
              {Object.entries(lambdaData.lambda).map(([k, v]) => (
                <li
                  key={k}
                  className="bg-amber-50 rounded-lg px-4 py-3 border border-gray-200 shadow-sm"
                >
                  <span className="font-medium">{k}</span> : {v}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Étapes Ek</h2>
            <ul className="list-disc list-inside text-gray-700">
              {Object.entries(lambdaData.E).map(([step, list]) => (
                <li key={step} className="mb-1">
                  <strong>{step}</strong> : {list.join(', ')}
                </li>
              ))}
            </ul>
          </div>

          {path.length > 0 && (
            <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Chemin maximal</h2>
              <p className="text-gray-800 font-medium">
                {path.join(' → ')}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
