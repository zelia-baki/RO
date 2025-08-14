// src/Graph/GraphAppMinimale.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';
import NavBar from '../Home/NavBar';


export default function GraphAppMinimale() {
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

  // Gestion sommets
  const handleNodeLabelChange = (id, newLabel) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, id: newLabel } : n));
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
    if (!nodeId.trim()) return;
    if (nodes.some(n => n.id === nodeId.trim())) {
      alert('Ce sommet existe déjà !');
      return;
    }
    setNodes([...nodes, { id: nodeId.trim() }]);
    setNodeId('');
  };

  // Gestion arcs
  const handleEdgeChange = (eid, field, value) => {
    setEdges(edges.map(e => e.id === eid ? { ...e, [field]: value } : e));
  };
  const deleteEdge = (eid) => {
    setEdges(edges.filter(e => e.id !== eid));
  };
  const addEdge = () => {
    if (!source.trim() || !target.trim()) return;
    if (edges.some(e => e.source === source.trim() && e.target === target.trim())) {
      alert('Cet arc existe déjà !');
      return;
    }
    setEdges([
      ...edges,
      { id: `e${edges.length + 1}`, source: source.trim(), target: target.trim(), label: weight.trim() || '1' }
    ]);
    setSource('');
    setTarget('');
    setWeight('');
  };

  // Calcul MIN
  const saveAndRunDantzigMin = async () => {
    if (nodes.length === 0 || edges.length === 0) {
      alert('Ajoute des sommets et arcs avant.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/save-graph', { nodes, edges });
      const start = nodes[0].id;
      const end = nodes[nodes.length - 1].id;
      const lambdaRes = await axios.get(`http://localhost:5000/dantzig-min/${start}`);
      const pathRes = await axios.get(`http://localhost:5000/shortest-path/${start}/${end}`);
      setLambdaData(lambdaRes.data);
      setPath(pathRes.data.chemin);
      setError('');
      drawGraph(pathRes.data.chemin);
    } catch (err) {
      console.error(err);
      setError("Erreur dans l'algorithme ou le backend.");
    }
  };

  // Dessin
  const drawGraph = (highlightPath = []) => {
    const data = {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.id,
        color: highlightPath.includes(n.id) ? '#e0f2fe' : '#ffffff',
        font: { color: highlightPath.includes(n.id) ? '#0f172a' : '#334155' },
        borderWidth: highlightPath.includes(n.id) ? 3 : 1,
      })),
      edges: edges.map(e => ({
        from: e.source, to: e.target, label: e.label, arrows: 'to',
        color: highlightPath.includes(e.source) && highlightPath.includes(e.target)
          && highlightPath.indexOf(e.source) + 1 === highlightPath.indexOf(e.target)
          ? { color: '#2563eb', highlight: '#1d4ed8' }
          : '#94a3b8',
        font: { color: highlightPath.includes(e.source) && highlightPath.includes(e.target) ? '#2563eb' : '#475569' },
        width: highlightPath.includes(e.source) && highlightPath.includes(e.target) ? 3 : 1.5,
        smooth: { enabled: true, type: 'cubicBezier' },
      }))
    };
    const options = { nodes: { shape: 'circle', size: 28 }, edges: { smooth: true, arrows: 'to' } };
    if (networkRef.current) networkRef.current.destroy();
    networkRef.current = new Network(containerRef.current, data, options);
  };

  useEffect(() => () => { if (networkRef.current) networkRef.current.destroy(); }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg">
         <NavBar />
      <h1 className="text-4xl font-extrabold text-center">Algorithme de Dantzig — Minimale</h1>

      {/* Formulaire ajout sommet et arc */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ajouter sommet */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="mb-4 font-semibold">Ajouter un sommet</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Nom" value={nodeId} onChange={e => setNodeId(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-grow" />
            <button onClick={addNode} className="bg-blue-600 text-white rounded-lg px-4 py-2">Ajouter</button>
          </div>
          <table className="w-full border-collapse">
            <thead><tr><th>ID</th><th>Actions</th></tr></thead>
            <tbody>
              {nodes.map(n => (
                <tr key={n.id}>
                  <td><input value={n.id} onChange={e => handleNodeLabelChange(n.id, e.target.value)} /></td>
                  <td><button onClick={() => deleteNode(n.id)} className="text-red-500">Supprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Ajouter arc */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="mb-4 font-semibold">Ajouter un arc</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Départ" value={source} onChange={e => setSource(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1" />
            <input type="text" placeholder="Cible" value={target} onChange={e => setTarget(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1" />
            <input type="number" placeholder="Poids" value={weight} onChange={e => setWeight(e.target.value)}
              className="border rounded-lg px-3 py-2 w-24" />
          </div>
          <button onClick={addEdge} className="bg-blue-600 text-white rounded-lg px-4 py-2">Ajouter</button>
          <table className="w-full border-collapse mt-4">
            <thead><tr><th>Source</th><th>Cible</th><th>Poids</th><th>Actions</th></tr></thead>
            <tbody>
              {edges.map(e => (
                <tr key={e.id}>
                  <td><input value={e.source} onChange={ev => handleEdgeChange(e.id, 'source', ev.target.value)} /></td>
                  <td><input value={e.target} onChange={ev => handleEdgeChange(e.id, 'target', ev.target.value)} /></td>
                  <td><input type="number" value={e.label} onChange={ev => handleEdgeChange(e.id, 'label', ev.target.value)} /></td>
                  <td><button onClick={() => deleteEdge(e.id)} className="text-red-500">Supprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="flex justify-center">
        <button onClick={saveAndRunDantzigMin} className="bg-green-600 text-white rounded-lg px-8 py-3">
          Calculer Chemin Minimal
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      <div ref={containerRef} style={{ width: '100%', height: '500px' }} />

      {lambdaData && (
        <div>
          <h2>λ(x)</h2>
          <ul>{Object.entries(lambdaData.lambda).map(([k, v]) => <li key={k}>{k} : {v}</li>)}</ul>
          <h2>Étapes Ek</h2>
          <ul>{Object.entries(lambdaData.E).map(([step, list]) => <li key={step}>{step} : {list.join(', ')}</li>)}</ul>
          {path.length > 0 && <p>Chemin minimal : {path.join(' → ')}</p>}
        </div>
      )}
    </div>
  );
}
