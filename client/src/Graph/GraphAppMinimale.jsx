import React, { useState } from "react";
import NavBar from "../Home/NavBar";
import DantzigStepByStep from "../components/DantzigStepByStep";
import NodeForm from "./NodeForm";
import EdgeForm from "./EdgeForm";
import GraphResults from "./GraphResults";
import GraphViewer from "./GraphViewer";
import useGraphLogic from "../hooks/useGraphLogic";

export default function GraphAppMinimale() {
  const {
    nodes, edges, lambdaData, stepsData, path, error, showStepByStep,
    addNode, deleteNode, addEdge, deleteEdge, saveAndRunDantzigMin, runStepByStepCalculation, containerRef
  } = useGraphLogic();

  const [nodeId, setNodeId] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [weight, setWeight] = useState("");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg">
      <NavBar />
      <h1 className="text-4xl font-extrabold text-center">Algorithme de Dantzig — Minimale</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <NodeForm nodes={nodes} nodeId={nodeId} setNodeId={setNodeId} addNode={() => { addNode(nodeId); setNodeId(""); }} deleteNode={deleteNode} />
        <EdgeForm edges={edges} source={source} target={target} weight={weight} setSource={setSource} setTarget={setTarget} setWeight={setWeight} addEdge={() => { addEdge(source, target, weight); setSource(""); setTarget(""); setWeight(""); }} deleteEdge={deleteEdge} />
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={saveAndRunDantzigMin} className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-8 py-3 transition-colors">Calcul Rapide</button>
        <button onClick={runStepByStepCalculation} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-3 transition-colors">🎯 Calcul Étape par Étape</button>
      </div>

      {error && <div className="text-red-600 text-center">{error}</div>}

      <GraphViewer containerRef={containerRef} />

      {!showStepByStep && lambdaData && <GraphResults lambdaData={lambdaData} path={path} />}
      {showStepByStep && stepsData && <DantzigStepByStep stepsData={stepsData} />}
    </div>
  );
}
