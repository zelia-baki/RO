// src/Graph/GraphAppMinimale.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import cytoscape from 'cytoscape';
import NavBar from '../Home/NavBar';
import DantzigStepByStep from '../components/DantzigStepByStep';

export default function GraphAppMinimale() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeId, setNodeId] = useState('');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [weight, setWeight] = useState('');
  const [lambdaData, setLambdaData] = useState(null);
  const [stepsData, setStepsData] = useState(null);
  const [path, setPath] = useState([]);
  const [error, setError] = useState('');
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [currentStepData, setCurrentStepData] = useState(null);

  const containerRef = useRef();
  const cyRef = useRef(null);

  // Création initiale du graphe
  useEffect(() => {
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            width: 50,
            height: 50,
            'font-size': 12,
            'border-width': 2,
            'border-color': '#111',
            'background-color': '#94a3b8',
            color: '#111'
          }
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            width: 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'font-size': 11,
            color: '#475569'
          }
        }
      ],
      layout: { name: 'cose', animate: true }
    });

    return () => {
      if (cyRef.current) cyRef.current.destroy();
    };
  }, []);

  // Mise à jour du graphe avec chemin minimal et surlignage étape par étape
  // Mise à jour du graphe pour l'affichage étape par étape
  // Mise à jour du graphe pour l'affichage étape par étape
  const updateGraph = (highlightNodes = [], highlightEdges = [], lambdaValues = {}, showPath = false) => {
    const cy = cyRef.current;
    if (!cy) return;

    // Nœuds
    nodes.forEach(n => {
      let node = cy.getElementById(n.id);
      if (node.length === 0) {
        node = cy.add({ data: { id: n.id, label: n.id } });
      }
      node.data('label', `${n.id}${lambdaValues[n.id] !== undefined ? `\nλ(${n.id})=${lambdaValues[n.id]}` : ''}`);
      node.style('background-color', highlightNodes.includes(n.id) ? '#2563eb' : '#94a3b8');
      node.style('color', highlightNodes.includes(n.id) ? '#fff' : '#111');
    });

    // Suppression des anciens nœuds
    cy.nodes().forEach(node => {
      if (!nodes.some(n => n.id === node.id())) cy.remove(node);
    });

    // Arêtes
    edges.forEach(e => {
      let edge = cy.getElementById(e.id);
      if (edge.length === 0) {
        edge = cy.add({ data: { id: e.id, source: e.source, target: e.target, label: e.label } });
      } else {
        edge.data('source', e.source);
        edge.data('target', e.target);
        edge.data('label', e.label);
      }
      const isHighlighted = highlightEdges.some(([from, to]) => from === e.source && to === e.target);
      edge.style({
        'line-color': highlightEdges.some(([from, to]) => from === e.source && to === e.target) ? '#2563eb' : '#94a3b8',
        'target-arrow-color': highlightEdges.some(([from, to]) => from === e.source && to === e.target) ? '#2563eb' : '#94a3b8'
      });

    });

    cy.edges().forEach(edge => {
      if (!edges.some(e => e.id === edge.id())) cy.remove(edge);
    });

    // Centrer & zoomer si demandé
    if (showPath) cy.fit(50);
  };

  // Changement d'étape
  // Changement d'étape
  const handleStepChange = (stepData) => {
    setCurrentStepData(stepData);
    const cy = cyRef.current;
    if (!cy) return;

    const isLastStep = stepsData && stepData.step === stepsData.total_steps - 1;

    let highlightNodes = [];
    let highlightEdges = [];

    if (isLastStep && stepsData.main_path) {
      // Dernière étape : tous les nœuds et arcs du chemin minimal
      highlightNodes = [...stepsData.main_path];
      highlightEdges = stepsData.main_path
        .map((v, i, arr) => arr.slice(i, i + 2))
        .filter(p => p.length === 2); // arcs du chemin
    } else {
      // Étapes intermédiaires : seulement le nœud et l'arc courant
      if (stepData.selected) {
        highlightNodes = [stepData.selected.from_node, stepData.selected.to_node];
        highlightEdges = [[stepData.selected.from_node, stepData.selected.to_node]];
      } else {
        highlightNodes = stepData.highlight_nodes || [];
        highlightEdges = stepData.highlight_edges || [];
      }
    }

    updateGraph(highlightNodes, highlightEdges, stepData.lambda_values, isLastStep);
  };



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
      setShowStepByStep(false);
      updateGraph([], pathRes.data.chemin.map((v, i, arr) => arr.slice(i, i + 2)).filter(p => p.length === 2), lambdaRes.data.lambda, pathRes.data.chemin);
    } catch (err) {
      console.error(err);
      setError("Erreur dans l'algorithme ou le backend.");
    }
  };

  // Calcul étape par étape
  const runStepByStepCalculation = async () => {
    if (nodes.length === 0 || edges.length === 0) {
      alert('Ajoute des sommets et arcs avant.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/save-graph', { nodes, edges });
      const start = nodes[0].id;
      const stepsRes = await axios.get(`http://localhost:5000/dantzig-min-detailed/${start}`);
      setStepsData(stepsRes.data);
      setShowStepByStep(true);
      setError('');
      if (stepsRes.data.detailed_steps && stepsRes.data.detailed_steps.length > 0) {
        handleStepChange(stepsRes.data.detailed_steps[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur dans l'algorithme étape par étape.");
    }
  };


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg">
      <NavBar />
      <h1 className="text-4xl font-extrabold text-center">Algorithme de Dantzig — Minimale</h1>

      {/* Formulaire ajout sommet et arc */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

        <section className="bg-white rounded-xl border p-6">
          <h2 className="mb-4 font-semibold">Ajouter un arc</h2>
          <div className="flex gap-2 mb-4">
            <select value={source} onChange={e => setSource(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1">
              <option value="">Sélectionnez le départ</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.id}</option>
              ))}
            </select>

            <select value={target} onChange={e => setTarget(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1">
              <option value="">Sélectionnez la cible</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.id}</option>
              ))}
            </select>

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

      {/* Boutons calcul */}
      <div className="flex justify-center gap-4">
        <div className="flex justify-center gap-4">
          <button onClick={saveAndRunDantzigMin} className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-8 py-3 transition-colors">
            Calcul Rapide
          </button>
          <button onClick={runStepByStepCalculation} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-3 transition-colors">
            🎯 Calcul Étape par Étape
          </button>
          <button
            onClick={() => cyRef.current?.fit(50)}
            className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-8 py-3 transition-colors"
          >
            📍 Centrer & Zoomer
          </button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      <div ref={containerRef} style={{ width: '100%', height: '500px' }} />

      {!showStepByStep && lambdaData && (
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">Résultats</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">λ(x)</h3>
              <ul className="space-y-1">
                {lambdaData?.lambda && Object.entries(lambdaData.lambda).map(([k, v]) => (
                  <li key={k} className="flex justify-between"><span>{k}:</span> <span className="font-medium">{v}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Étapes Ek</h3>
              <ul className="space-y-1">
                {lambdaData?.E && Object.entries(lambdaData.E).map(([step, list]) => (
                  <li key={step}>{step}: {Array.isArray(list) ? list.join(', ') : ''}</li>
                ))}
              </ul>
            </div>
          </div>
          {path?.length > 0 && <div>Chemin minimal: {path.join(' → ')}</div>}
        </div>
      )}

      {showStepByStep && stepsData && (
        <DantzigStepByStep stepsData={stepsData} onStepChange={handleStepChange} />
      )}
    </div>
  );
}
