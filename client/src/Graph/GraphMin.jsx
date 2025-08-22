// src/Graph/GraphAppMinimale.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';
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
      setShowStepByStep(false); // Reset step-by-step mode
      drawGraph(pathRes.data.chemin);
    } catch (err) {
      console.error(err);
      setError("Erreur dans l'algorithme ou le backend.");
    }
  };

  // Calcul MIN étape par étape
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
      
      // Initialize with first step
      if (stepsRes.data.detailed_steps && stepsRes.data.detailed_steps.length > 0) {
        handleStepChange(stepsRes.data.detailed_steps[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur dans l'algorithme étape par étape.");
    }
  };

  // Gestion des changements d'étapes
  const handleStepChange = (stepData) => {
    setCurrentStepData(stepData);
    
    // Highlight nodes from current E set
    const highlightNodes = stepData.highlight_nodes || stepData.E_current || [];
    
    // If there's a selected arc, highlight the path
    let highlightEdges = stepData.highlight_edges || [];
    if (stepData.selected) {
      highlightEdges = [[stepData.selected.from_node, stepData.selected.to_node]];
    }
    
    // Si c'est la dernière étape et qu'on a un chemin principal, l'afficher
    const isLastStep = stepsData && stepData.step === stepsData.total_steps - 1;
    if (isLastStep && stepsData.main_path) {
      // Afficher le chemin minimal principal à la fin
      drawGraphWithLambda(stepsData.main_path, [], stepData.lambda_values, stepsData.main_path);
    } else {
      // Draw graph with lambda values and highlighting
      drawGraphWithLambda(highlightNodes, highlightEdges, stepData.lambda_values);
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

  // Dessin avec valeurs lambda (pour mode step-by-step)
  const drawGraphWithLambda = (highlightNodes = [], highlightEdges = [], lambdaValues = {}, pathToHighlight = null) => {
    const data = {
      nodes: nodes.map(n => {
        const lambdaValue = lambdaValues[n.id];
        const lambdaText = lambdaValue !== undefined ? `\nλ(${n.id}) = ${lambdaValue}` : '';
        const isHighlighted = highlightNodes.includes(n.id);
        
        return {
          id: n.id,
          label: n.id + lambdaText,
          color: {
            background: isHighlighted ? '#dcfce7' : '#ffffff',
            border: isHighlighted ? '#16a34a' : '#cbd5e1',
            highlight: {
              background: '#bbf7d0',
              border: '#059669'
            }
          },
          font: { 
            color: isHighlighted ? '#15803d' : '#334155',
            size: 12,
            multi: true
          },
          borderWidth: isHighlighted ? 3 : 1,
          size: 35
        };
      }),
      edges: edges.map(e => {
        const isHighlighted = highlightEdges.some(([from, to]) => 
          (e.source === from && e.target === to) || 
          (e.source === to && e.target === from)
        );
        
        return {
          from: e.source, 
          to: e.target, 
          label: e.label, 
          arrows: 'to',
          color: isHighlighted 
            ? { color: '#dc2626', highlight: '#b91c1c' }
            : '#94a3b8',
          font: { 
            color: isHighlighted ? '#dc2626' : '#475569',
            size: 11
          },
          width: isHighlighted ? 4 : 1.5,
          smooth: { enabled: true, type: 'cubicBezier' },
        };
      })
    };
    
    const options = { 
      nodes: { 
        shape: 'circle', 
        size: 35,
        font: {
          size: 12,
          face: 'Arial'
        }
      }, 
      edges: { 
        smooth: true, 
        arrows: 'to',
        font: {
          size: 11,
          face: 'Arial'
        }
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 100 }
      }
    };
    
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

      {/* Boutons de calcul */}
      <div className="flex justify-center gap-4">
        <button 
          onClick={saveAndRunDantzigMin} 
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-8 py-3 transition-colors"
        >
          Calcul Rapide
        </button>
        <button 
          onClick={runStepByStepCalculation} 
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-3 transition-colors"
        >
          🎯 Calcul Étape par Étape
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      <div ref={containerRef} style={{ width: '100%', height: '500px' }} />

      {/* Résultats du calcul rapide */}
      {!showStepByStep && lambdaData && (
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">Résultats</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">λ(x)</h3>
              <ul className="space-y-1">
                {Object.entries(lambdaData.lambda).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}:</span> <span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Étapes Ek</h3>
              <ul className="space-y-1">
                {Object.entries(lambdaData.E).map(([step, list]) => (
                  <li key={step}>{step}: {list.join(', ')}</li>
                ))}
              </ul>
            </div>
          </div>
          {path.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <strong>Chemin minimal:</strong> {path.join(' → ')}
            </div>
          )}
        </div>
      )}

      {/* Composant step-by-step */}
      {showStepByStep && stepsData && (
        <DantzigStepByStep 
          stepsData={stepsData} 
          onStepChange={handleStepChange}
        />
      )}
    </div>
  );
}
