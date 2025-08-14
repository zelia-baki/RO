import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  SaveIcon, 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  MapIcon
} from '@heroicons/react/24/solid';
import DynamicGraphViewer from './DynamicGraphViewer';
import ResultsPanel from './ResultsPanel';

const DantzigApp = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [startNode, setStartNode] = useState('');
  const [endNode, setEndNode] = useState('');
  const [results, setResults] = useState(null);
  const [shortestPath, setShortestPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('graph');

  // Charger les données au démarrage
  useEffect(() => {
    loadGraphData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadGraphData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/load-graph');
      if (response.ok) {
        const data = await response.json();
        setGraphData(data);
        showNotification('Graphe chargé avec succès');
      }
    } catch (error) {
      showNotification('Erreur lors du chargement', 'error');
    }
  };

  const saveGraphData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:5000/save-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graphData)
      });
      
      if (response.ok) {
        showNotification('Graphe sauvegardé avec succès');
      } else {
        throw new Error('Erreur de sauvegarde');
      }
    } catch (error) {
      showNotification('Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addNode = () => {
    const nodeId = prompt('ID du nouveau nœud :');
    if (nodeId && !graphData.nodes.find(n => n.id === nodeId)) {
      const newNode = { id: nodeId };
      setGraphData(prev => ({
        ...prev,
        nodes: [...prev.nodes, newNode]
      }));
      showNotification(`Nœud ${nodeId} ajouté`);
    }
  };

  const addEdge = () => {
    const source = prompt('Nœud source :');
    const target = prompt('Nœud cible :');
    const weight = prompt('Poids de l\'arête :');
    
    if (source && target && weight) {
      const edgeId = `e${graphData.edges.length + 1}`;
      const newEdge = {
        id: edgeId,
        source,
        target,
        label: weight
      };
      
      setGraphData(prev => ({
        ...prev,
        edges: [...prev.edges, newEdge]
      }));
      showNotification(`Arête ${source} → ${target} ajoutée`);
    }
  };

  const runDantzig = async () => {
    if (!startNode) {
      showNotification('Veuillez sélectionner un nœud de départ', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Calculer les valeurs lambda
      const lambdaResponse = await fetch(`http://127.0.0.1:5000/dantzig/${startNode}`);
      const lambdaData = await lambdaResponse.json();
      
      if (!lambdaResponse.ok) {
        throw new Error(lambdaData.error);
      }

      let pathData = null;
      if (endNode) {
        // Calculer le plus court chemin
        const pathResponse = await fetch(`http://127.0.0.1:5000/shortest-path/${startNode}/${endNode}`);
        if (pathResponse.ok) {
          pathData = await pathResponse.json();
          setShortestPath(pathData.chemin || []);
        }
      }

      setResults({ ...lambdaData, pathData });
      setActiveTab('results');
      showNotification('Algorithme de Dantzig exécuté avec succès');
      
    } catch (error) {
      showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetGraph = () => {
    setGraphData({ nodes: [], edges: [] });
    setResults(null);
    setShortestPath([]);
    setStartNode('');
    setEndNode('');
    showNotification('Graphe réinitialisé');
  };

  const availableNodes = graphData.nodes.map(n => n.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Algorithme de Dantzig
                </h1>
                <p className="text-sm text-gray-500">
                  Plus courts chemins dans un graphe orienté
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveGraphData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Sauvegarder
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGraph}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reset
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
              notification.type === 'error' 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Add Node */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addNode}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter Nœud
            </motion.button>

            {/* Add Edge */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addEdge}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter Arête
            </motion.button>

            {/* Start Node Selector */}
            <select
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Nœud de départ</option>
              {availableNodes.map(nodeId => (
                <option key={nodeId} value={nodeId}>{nodeId}</option>
              ))}
            </select>

            {/* End Node Selector */}
            <select
              value={endNode}
              onChange={(e) => setEndNode(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Nœud d'arrivée (opt.)</option>
              {availableNodes.map(nodeId => (
                <option key={nodeId} value={nodeId}>{nodeId}</option>
              ))}
            </select>
          </div>

          {/* Run Algorithm Button */}
          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={runDantzig}
              disabled={loading || !startNode}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Lancer l'Algorithme de Dantzig
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('graph')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'graph'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MapIcon className="h-5 w-5 inline mr-2" />
                Visualisation du Graphe
              </button>
              
              {results && (
                <button
                  onClick={() => setActiveTab('results')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'results'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ChartBarIcon className="h-5 w-5 inline mr-2" />
                  Résultats
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {activeTab === 'graph' && (
            <div className="p-6">
              <DynamicGraphViewer 
                graphData={graphData}
                shortestPath={shortestPath}
                onGraphChange={setGraphData}
              />
            </div>
          )}
          
          {activeTab === 'results' && results && (
            <div className="p-6">
              <ResultsPanel 
                results={results}
                shortestPath={shortestPath}
                startNode={startNode}
                endNode={endNode}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DantzigApp;
