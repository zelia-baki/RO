// src/hooks/useGraphLogic.js
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import cytoscape from "cytoscape";

export default function useGraphLogic() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [lambdaData, setLambdaData] = useState(null);
  const [stepsData, setStepsData] = useState(null);
  const [path, setPath] = useState([]);
  const [error, setError] = useState("");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [currentStepData, setCurrentStepData] = useState(null);

  const cyRef = useRef(null);
  const containerRef = useRef();

  const addNode = (id) => {
    if (!id.trim()) return;
    if (nodes.some((n) => n.id === id.trim())) {
      alert("Ce sommet existe déjà !");
      return;
    }
    setNodes([...nodes, { id: id.trim() }]);
  };
  const deleteNode = (id) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.source !== id && e.target !== id));
  };

  const addEdge = (source, target, weight = "1") => {
    if (!source.trim() || !target.trim()) return;
    if (edges.some((e) => e.source === source && e.target === target)) {
      alert("Cet arc existe déjà !");
      return;
    }
    setEdges([
      ...edges,
      { id: `e${edges.length + 1}`, source, target, label: weight },
    ]);
  };
  const deleteEdge = (id) => setEdges(edges.filter((e) => e.id !== id));

  const saveAndRunDantzigMin = async () => {
    try {
      await axios.post("http://localhost:5000/save-graph", { nodes, edges });
      const start = nodes[0].id;
      const end = nodes[nodes.length - 1].id;

      const lambdaRes = await axios.get(
        `http://localhost:5000/dantzig-min/${start}`
      );
      const pathRes = await axios.get(
        `http://localhost:5000/shortest-path/${start}/${end}`
      );

      setLambdaData(lambdaRes.data);
      setPath(pathRes.data.chemin);
      setError("");
      setShowStepByStep(false);
      drawGraph(pathRes.data.chemin);
    } catch (err) {
      console.error(err);
      setError("Erreur dans l'algorithme ou le backend.");
    }
  };

  const runStepByStepCalculation = async () => {
    try {
      await axios.post("http://localhost:5000/save-graph", { nodes, edges });
      const start = nodes[0].id;
      const stepsRes = await axios.get(
        `http://localhost:5000/dantzig-min-detailed/${start}`
      );
      setStepsData(stepsRes.data);
      setShowStepByStep(true);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Erreur dans l'algorithme étape par étape.");
    }
  };

  const drawGraph = (highlightPath = []) => {
    if (cyRef.current) cyRef.current.destroy();
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((n) => ({ data: { id: n.id, label: n.id } })),
        ...edges.map((e) => ({
          data: { id: e.id, source: e.source, target: e.target, label: e.label },
        })),
      ],
      layout: { name: "cose", animate: true },
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#94a3b8",
            "text-valign": "center",
            "text-halign": "center",
            width: 40,
            height: 40,
          },
        },
        {
          selector: "edge",
          style: { label: "data(label)", "line-color": "#94a3b8", width: 2 },
        },
      ],
    });
  };

  useEffect(() => {
    return () => {
      if (cyRef.current) cyRef.current.destroy();
    };
  }, []);

  return {
    nodes,
    edges,
    lambdaData,
    stepsData,
    path,
    error,
    showStepByStep,
    currentStepData,
    addNode,
    deleteNode,
    addEdge,
    deleteEdge,
    saveAndRunDantzigMin,
    runStepByStepCalculation,
    containerRef,
  };
}
