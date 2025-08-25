// src/Graph/GraphAppBase.jsx
import React, { useState } from "react";
import axios from "axios";
import NavBar from "../Home/NavBar";
import GraphEditor from "../components/GraphEditor";
import GraphRenderer from "../components/GraphRenderer";
import DantzigStepByStep from "../components/DantzigStepByStep";
import {
    getStepsArray,
    getLambdaFromStep,
    getHighlightFromStep,
} from "../hooks/useGraphHelpers";

export default function GraphAppBase({ mode }) {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [lambdaData, setLambdaData] = useState(null);
    const [stepsData, setStepsData] = useState(null);
    const [path, setPath] = useState([]);
    const [error, setError] = useState("");
    const [showStepByStep, setShowStepByStep] = useState(false);

    // --- Nouveaux états pour la vue "étape par étape"
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [highlightNodes, setHighlightNodes] = useState([]);
    const [highlightEdges, setHighlightEdges] = useState([]);
    const [stepLambda, setStepLambda] = useState({});

    const isMax = mode === "max";
    const apiBase = isMax ? "dantzig-max" : "dantzig-min";
    const pathEndpoint = isMax ? "longest-path" : "shortest-path";

    const resetStepState = () => {
        setShowStepByStep(false);
        setStepsData(null);
        setCurrentStepIndex(0);
        setHighlightNodes([]);
        setHighlightEdges([]);
        setStepLambda({});
    };

    // --- Calcul rapide ---
    const runQuickCalculation = async () => {
        if (nodes.length === 0 || edges.length === 0) {
            alert("Ajoute des sommets et arcs avant.");
            return;
        }
        try {
            await axios.post("http://localhost:5000/save-graph", { nodes, edges });
            const start = nodes[0].id;
            const end = isMax ? null : nodes[nodes.length - 1].id;

            const lambdaRes = await axios.get(
                `http://localhost:5000/${apiBase}/${start}`
            );
            let pathRes;
            if (isMax) {
                // choisir le meilleur noeud
                const lambdaValues = lambdaRes.data.lambda || {};
                let bestNode = null;
                let maxLambda = -Infinity;
                for (const node of nodes) {
                    if (
                        node.id !== start &&
                        lambdaValues[node.id] !== "-∞" &&
                        lambdaValues[node.id] !== undefined
                    ) {
                        const val = parseFloat(lambdaValues[node.id]);
                        if (!Number.isNaN(val) && val > maxLambda) {
                            maxLambda = val;
                            bestNode = node.id;
                        }
                    }
                }
                if (bestNode) {
                    pathRes = await axios.get(
                        `http://localhost:5000/${pathEndpoint}/${start}/${bestNode}`
                    );
                }
            } else {
                pathRes = await axios.get(
                    `http://localhost:5000/${pathEndpoint}/${start}/${end}`
                );
            }

            setLambdaData(lambdaRes.data);
            setPath(pathRes?.data?.chemin || []);
            setError("");
            resetStepState();
        } catch (err) {
            console.error(err);
            setError("Erreur dans l'algorithme ou le backend.");
        }
    };

    // --- Appliquer une étape au graphe ---
    const applyStep = (step, index = 0) => {
        const lam = getLambdaFromStep(step);
        const { highlightEdges: he, highlightNodes: hn } = getHighlightFromStep(step);
        setStepLambda(lam || {});
        setHighlightEdges(he || []);
        setHighlightNodes(hn || []);
        setCurrentStepIndex(index);
    };

    // --- Step by step ---
    const runStepByStep = async () => {
        if (nodes.length === 0 || edges.length === 0) {
            alert("Ajoute des sommets et arcs avant.");
            return;
        }
        try {
            await axios.post("http://localhost:5000/save-graph", { nodes, edges });
            const start = nodes[0].id;

            const stepsRes = await axios.get(
                `http://localhost:5000/${apiBase}-detailed/${start}`
            );
            const steps = getStepsArray(stepsRes.data);
            if (!steps.length) {
                throw new Error("Aucune étape reçue du backend.");
            }

            const sd = { ...stepsRes.data, steps };
            setStepsData(sd);
            setShowStepByStep(true);
            setError("");

            // appliquer l'étape 0 au graphe et masquer le path
            applyStep(steps[0], 0);
            setPath([]);
        } catch (err) {
            console.error(err);
            setError("Erreur dans l'algorithme détaillé ou le backend.");
        }
    };

    // --- Réception des changements d'étape depuis DantzigStepByStep ---
    const handleStepChange = (step) => {
        if (!stepsData?.steps) return;

        const idx = stepsData.steps.indexOf(step);
        applyStep(step, idx >= 0 ? idx : currentStepIndex);

        if (step._finalPath) {
            // 🔹 Nettoyer les anciens highlights
            setHighlightEdges([]);
            setHighlightNodes([]);

            // 🔹 Tracer uniquement la solution
            setPath(step._finalPath);
        } else {
            setPath([]);
        }
    };


    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 font-sans text-gray-800 bg-gradient-to-b from-yellow-50 to-white rounded-xl shadow-lg">
            <NavBar />
            <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">
                Algorithme de Dantzig —{" "}
                <span className="text-amber-700">
                    {isMax ? "Maximale" : "Minimale"}
                </span>
            </h1>

            <GraphEditor nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />

            {/* Boutons */}
            <div className="flex justify-center flex-wrap gap-4">
                <button
                    onClick={runQuickCalculation}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg px-8 py-3"
                >
                    Calcul rapide ({isMax ? "Max" : "Min"})
                </button>
                <button
                    onClick={runStepByStep}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg px-8 py-3"
                >
                    Calcul étape par étape
                </button>
            </div>

            {error && (
                <div className="mt-4 text-center text-red-600 font-semibold">{error}</div>
            )}

            <GraphRenderer
                nodes={nodes}
                edges={edges}
                // afficher chemin uniquement si fourni (final ou rapide)
                path={path}
                // lambdas et highlights pilotés par l’étape
                lambdaValues={showStepByStep ? stepLambda : (lambdaData?.lambda || {})}
                highlightNodes={highlightNodes}
                highlightEdges={highlightEdges}
            />

            {/* Résultats agrégés (uniquement hors mode étapes) */}
            {!showStepByStep && lambdaData && (
                <section className="mt-8 space-y-6">
                    <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold mb-3">λ(x)</h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {Object.entries(lambdaData.lambda || {}).map(([k, v]) => (
                                <li
                                    key={k}
                                    className="bg-amber-50 rounded-lg px-4 py-3 border border-gray-200"
                                >
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
                                    <strong>{step}</strong> :{" "}
                                    {Array.isArray(list) ? list.join(", ") : String(list)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {path.length > 0 && (
                        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                            <h2 className="text-lg font-semibold mb-2">
                                Chemin {isMax ? "maximal" : "minimal"}
                            </h2>
                            <p className="font-medium">{path.join(" → ")}</p>
                        </div>
                    )}
                </section>
            )}

            {/* UI pas-à-pas qui notifie handleStepChange */}
            {showStepByStep && stepsData && (
                <DantzigStepByStep
                    stepsData={stepsData}
                    onStepChange={handleStepChange}
                    currentStepIndex={currentStepIndex}
                />
            )}
        </div>
    );
}
