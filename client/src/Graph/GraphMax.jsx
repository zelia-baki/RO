// src/Graph/GraphAppMaximale.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import cytoscape from 'cytoscape';
import NavBar from '../Home/NavBar';
import DantzigStepByStep from '../components/DantzigStepByStep';

export default function GraphAppMaximale() {
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

  const cyRef = useRef(null);
  const containerRef = useRef();

  // ===== Helpers =====
  const parseArcString = (s) => {
    // "(u, v)" -> ["u","v"]
    if (!s || typeof s !== 'string') return null;
    const m = s.match(/\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
    return m ? [m[1].trim(), m[2].trim()] : null;
  };

  const getStepsArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data.steps)) return data.steps;
    if (Array.isArray(data.detailed_steps)) return data.detailed_steps;
    return [];
  };

  const getLambdaFromStep = (step) => step?.lambda ?? step?.lambda_values ?? {};

  const getHighlightFromStep = (step) => {
    let edgesPairs = [];
    // 1) selected_arcs: ["(u, v)", ...]
    if (Array.isArray(step?.selected_arcs)) {
      edgesPairs = step.selected_arcs
        .map(parseArcString)
        .filter(Boolean);
    }
    // 2) selected: {from_node, to_node}
    else if (step?.selected?.from_node && step?.selected?.to_node) {
      edgesPairs = [[step.selected.from_node, step.selected.to_node]];
    }
    // 3) highlight_edges: [[u,v], ...]
    else if (Array.isArray(step?.highlight_edges)) {
      edgesPairs = step.highlight_edges
        .filter(e => Array.isArray(e) && e.length === 2);
    }

    // Déduire les nœuds à surligner à partir des arêtes + highlight_nodes éventuels
    const nodeSet = new Set();
    edgesPairs.forEach(([u, v]) => { nodeSet.add(u); nodeSet.add(v); });
    if (Array.isArray(step?.highlight_nodes)) {
      step.highlight_nodes.forEach(n => nodeSet.add(n));
    }

    return {
      highlightEdges: edgesPairs,
      highlightNodes: Array.from(nodeSet),
    };
  };

  // ===== Gestion des sommets =====
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

  // ===== Gestion des arcs =====
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

  // ===== Calcul MAX (rapide) =====
  const saveAndRunDantzigMax = async () => {
    if (nodes.length === 0 || edges.length === 0) {
      alert('Ajoute des sommets et arcs avant.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/save-graph', { nodes, edges });
      const start = nodes[0].id;

      const lambdaRes = await axios.get(`http://localhost:5000/dantzig-max/${start}`);

      // Trouver le nœud avec la meilleure lambda (hors start)
      const lambdaValues = lambdaRes.data.lambda || {};
      let bestNode = null;
      let maxLambda = -Infinity;

      for (const node of nodes) {
        if (node.id !== start && lambdaValues[node.id] !== "-∞" && lambdaValues[node.id] !== undefined) {
          const lambdaValue = parseFloat(lambdaValues[node.id]);
          if (!Number.isNaN(lambdaValue) && lambdaValue > maxLambda) {
            maxLambda = lambdaValue;
            bestNode = node.id;
          }
        }
      }

      if (bestNode) {
        const pathRes = await axios.get(`http://localhost:5000/longest-path/${start}/${bestNode}`);
        setLambdaData(lambdaRes.data);
        setPath(pathRes.data.chemin || []);
        setError('');
        drawGraph(pathRes.data.chemin || []);
      } else {
        setLambdaData(lambdaRes.data);
        setPath([start]);
        setError('');
        drawGraph([start]);
      }
    } catch (err) {
      console.error(err);
      setLambdaData(null);
      setPath([]);
      setError("Erreur dans l'algorithme ou le backend.");
    }
  };

  // ===== Calcul MAX Step-by-Step =====
  const runStepByStepCalculationMax = async () => {
    if (nodes.length === 0 || edges.length === 0) {
      alert('Ajoute des sommets et arcs avant.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/save-graph', { nodes, edges });
      const start = nodes[0].id;

      const stepsRes = await axios.get(`http://localhost:5000/dantzig-max-detailed/${start}`);
      const steps = getStepsArray(stepsRes.data);

      if (!steps.length) {
        throw new Error("Aucune étape reçue du backend (ni 'steps' ni 'detailed_steps').");
      }

      const normalized = { ...stepsRes.data, steps };
      setStepsData(normalized);
      setCurrentStepData(steps[0]);
      setShowStepByStep(true);
      setError('');

      drawGraphWithStepData(steps[0]);
    } catch (err) {
      console.error(err);
      setError("Erreur dans l'algorithme détaillé ou le backend (Step-by-Step).");
    }
  };

  // ===== Dessin du graphe =====
  const drawGraph = (highlightPath = []) => {
    const elements = [
      ...nodes.map(n => ({
        data: { id: n.id, label: n.id },
        classes: highlightPath.includes(n.id) ? 'highlight-node' : ''
      })),
      ...edges.map(e => {
        const inPath =
          highlightPath.includes(e.source) &&
          highlightPath.includes(e.target) &&
          highlightPath.indexOf(e.source) + 1 === highlightPath.indexOf(e.target);

        return {
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label
          },
          classes: inPath ? 'highlight-edge' : ''
        };
      })
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#ffffff',
            'border-width': 1,
            'border-color': '#cbd5e1',
            'label': 'data(label)',
            'font-size': '14px',
            'text-valign': 'center',
            'color': '#334155',
            'width': 28,
            'height': 28
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#94a3b8',
            'line-color': '#94a3b8',
            'width': 1.5,
            'label': 'data(label)',
            'font-size': '12px',
            'color': '#475569',
            'text-background-color': '#ffffff',
            'text-background-opacity': 1,
            'text-background-padding': 2
          }
        },
        {
          selector: '.highlight-node',
          style: {
            'background-color': '#fffbeb',
            'border-color': '#d97706',
            'border-width': 3,
            'color': '#78350f'
          }
        },
        {
          selector: '.highlight-edge',
          style: {
            'line-color': '#d97706',
            'target-arrow-color': '#b45309',
            'width': 3,
            'color': '#d97706'
          }
        }
      ],
      layout: { name: 'cose', animate: true }
    });
  };

  // ===== Dessin du graphe avec données d'étape =====
  const drawGraphWithStepData = (stepData) => {
    if (!stepData) return;

    const lambdaObj = getLambdaFromStep(stepData);
    const { highlightEdges, highlightNodes } = getHighlightFromStep(stepData);

    const elements = [
      ...nodes.map(n => {
        const lambdaValue = lambdaObj[n.id];
        const displayLabel = lambdaValue !== undefined ? `${n.id}\n(${lambdaValue})` : n.id;
        const isHighlighted = highlightNodes.includes(n.id);
        return {
          data: { id: n.id, label: displayLabel },
          classes: isHighlighted ? 'highlight-node' : ''
        };
      }),
      ...edges.map(e => {
        // Vérifie si l'arête est dans les arêtes à surligner
        const isSelected = highlightEdges.some(([u, v]) => u === e.source && v === e.target);
        return {
          data: { id: e.id, source: e.source, target: e.target, label: e.label },
          classes: isSelected ? 'highlight-edge' : ''
        };
      })
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#ffffff',
            'border-width': 1,
            'border-color': '#cbd5e1',
            'label': 'data(label)',
            'font-size': '12px',
            'text-valign': 'center',
            'color': '#334155',
            'width': 40,
            'height': 40,
            'text-wrap': 'wrap',
            'text-max-width': 50
          }
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#94a3b8',
            'line-color': '#94a3b8',
            'width': 1.5,
            'label': 'data(label)',
            'font-size': '12px',
            'color': '#475569',
            'text-background-color': '#ffffff',
            'text-background-opacity': 1,
            'text-background-padding': 2
          }
        },
        {
          selector: '.highlight-node',
          style: {
            'background-color': '#fffbeb',
            'border-color': '#d97706',
            'border-width': 3,
            'color': '#78350f'
          }
        },
        {
          selector: '.highlight-edge',
          style: {
            'line-color': '#d97706',
            'target-arrow-color': '#b45309',
            'width': 3,
            'color': '#d97706'
          }
        }
      ],
      layout: { name: 'cose', animate: true }
    });
  };

  // ===== Changement d'étape =====
  const handleStepChangeMax = (stepIndex) => {
    const steps = getStepsArray(stepsData);
    if (!steps || stepIndex < 0 || stepIndex >= steps.length) return;
    const s = steps[stepIndex];
    setCurrentStepData(s);
    drawGraphWithStepData(s);
  };

  // 🔹 Mise à jour auto du graphe dès qu'un sommet ou un arc change
  useEffect(() => {
    drawGraph(path);
  }, [nodes, edges]);

  useEffect(() => {
    return () => {
      if (cyRef.current) cyRef.current.destroy();
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

      {/* Boutons principaux */}
      <div className="flex justify-center flex-wrap gap-4">
        <button
          onClick={saveAndRunDantzigMax}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg px-8 py-3"
        >
          Calcul rapide (Max)
        </button>
        <button
          onClick={runStepByStepCalculationMax}
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg px-8 py-3"
        >
          Calcul étape par étape (Max)
        </button>
        <button
          onClick={() => cyRef.current?.fit(50)}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg px-8 py-3"
        >
          📍 Centrer & Zoomer
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

      {/* Composant Step-by-Step */}
      {showStepByStep && stepsData && (
        <div className="relative">
          <button
            onClick={() => {
              setShowStepByStep(false);
              setStepsData(null);
              drawGraph();
            }}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow"
          >
            ✖ Fermer
          </button>
          <DantzigStepByStep
            stepsData={stepsData}
            onStepChange={(step) => {
              // step est déjà normalisé
              drawGraphWithStepData(step._norm);
            }}
          />
        </div>
      )}

      {/* Résultats */}
      {lambdaData && !showStepByStep && (
        <section className="mt-8 space-y-6">
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-3">λ(x)</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(lambdaData.lambda || {}).map(([k, v]) => (
                <li key={k} className="bg-amber-50 rounded-lg px-4 py-3 border border-gray-200">
                  <span className="font-medium">{k}</span> : {v}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Étapes Ek</h2>
            <ul className="list-disc list-inside">
              {Object.entries(lambdaData.E || {}).map(([step, list]) => (
                <li key={step}>
                  <strong>{step}</strong> : {Array.isArray(list) ? list.join(', ') : String(list)}
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
