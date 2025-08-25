// src/components/DantzigStepByStep.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function parseArcString(s) {
  // "(A, B)" => { from_node: "A", to_node: "B" }
  const m = typeof s === 'string' ? s.match(/\(\s*([^,\s]+)\s*,\s*([^)\s]+)\s*\)/) : null;
  return m ? { from_node: m[1], to_node: m[2] } : null;
}

function normalizeStep(rawStep = {}) {
  const lambda = rawStep.lambda_values ?? rawStep.lambda ?? {};
  const E = rawStep.E_current ?? rawStep.E ?? [];
  // candidats (min = objets, max = strings "(u, v)")
  let candidates = rawStep.candidates ?? [];
  if (candidates.length && typeof candidates[0] === 'string') {
    candidates = candidates.map(s => {
      const arc = parseArcString(s);
      return arc ? { from_node: arc.from_node, to_node: arc.to_node, edge_cost: undefined, calculation: undefined, total_cost: undefined } : s;
    });
  }
  // sélection
  let selected = rawStep.selected ?? null;
  if (!selected && Array.isArray(rawStep.selected_arcs) && rawStep.selected_arcs.length) {
    const arc = parseArcString(rawStep.selected_arcs[0]);
    if (arc) selected = { from_node: arc.from_node, to_node: arc.to_node, total_cost: undefined, calculation: undefined };
  }

  const highlight_edges = rawStep.highlight_edges ?? rawStep.selected_arcs ?? [];
  const title = rawStep.step_name ?? rawStep.title ?? `Étape ${rawStep.step ?? ''}`;
  const description = rawStep.description ?? '';
  const action = rawStep.action ?? '';

  return {
    title, description, action,
    lambda, E,
    candidates, selected,
    highlight_edges,
    // garder les originaux aussi
    _raw: rawStep
  };
}

const DantzigStepByStep = ({ stepsData, onStepChange }) => {
  // steps peut être stepsData.steps (max) ou stepsData.detailed_steps (min)
  const steps = useMemo(
    () => (stepsData?.steps ?? stepsData?.detailed_steps ?? []),
    [stepsData]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // reset quand on change de dataset
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [stepsData]);

  // autoplay
  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    const last = steps.length - 1;
    const id = setInterval(() => {
      setCurrentStep(prev => {
        const next = Math.min(prev + 1, last);
        if (next === last) {
          // stop en fin
          setIsPlaying(false);
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [isPlaying, steps.length]);

  // notify parent
useEffect(() => {
  if (!steps.length) return;
  const raw = steps[currentStep];
  if (!raw) return;
  const norm = normalizeStep(raw);

  const payload = { ...raw, _norm: norm };

  // 🔹 Si on est à la dernière étape et qu'il y a un chemin final
  if (currentStep === steps.length - 1 && stepsData?.main_path) {
    payload._finalPath = stepsData.main_path;
  }

  onStepChange?.(payload);
}, [currentStep, steps, onStepChange, stepsData]);


  if (!stepsData || steps.length === 0) {
    return null;
  }

  const raw = steps[currentStep];
  const step = normalizeStep(raw);
  const totalSteps = steps.length;

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 0));
  const togglePlay = () => setIsPlaying(p => !p);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Algorithme de Dantzig - Étapes détaillées
        </h2>

        <div className="flex items-center gap-3">
          <button onClick={prevStep} disabled={currentStep === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors">
            ← Précédent
          </button>
          <button onClick={togglePlay}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            {isPlaying ? '⏸️ Pause' : '▶️ Jouer'}
          </button>
          <button onClick={nextStep} disabled={currentStep === totalSteps - 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors">
            Suivant →
          </button>
          <span className="text-sm text-gray-600 ml-2">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <motion.div
          className="h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ backgroundColor: '#3b82f6' }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-800">
              {step.title}{step.action ? `: ${step.action}` : ''}
            </h3>
            {step.description && <p className="text-blue-700 mt-1">{step.description}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* E (si dispo) */}
            {Array.isArray(step.E) && step.E.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Ensemble marqué</h4>
                <div className="flex flex-wrap gap-2">
                  {step.E.map((node, index) => (
                    <motion.span key={node} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.05 }}
                      className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                      {node}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Lambda */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Valeurs λ(x)</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(step.lambda).map(([node, value]) => (
                  <motion.div key={node} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between text-sm">
                    <span className="font-medium">λ({node}):</span>
                    <span className={`font-bold ${value === '∞' || value === '-∞' ? 'text-gray-500' : 'text-purple-700'}`}>
                      {value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Candidats (si dispo) */}
          {step.candidates && step.candidates.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-3">Calculs des candidats</h4>
              <div className="space-y-3">
                {step.candidates.map((c, index) => (
                  <motion.div
                    key={`${c.from_node}-${c.to_node}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      step.selected &&
                      c.from_node === step.selected.from_node &&
                      c.to_node === step.selected.to_node
                        ? 'bg-green-100 border-green-400 shadow-md'
                        : 'bg-white border-yellow-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Arc ({c.from_node}, {c.to_node})</span>
                      {'edge_cost' in c && c.edge_cost !== undefined && (
                        <span className="text-sm text-gray-600">Coût: {c.edge_cost}</span>
                      )}
                    </div>
                    {c.calculation && <div className="text-sm mt-1 text-gray-700">{c.calculation}</div>}
                    {'total_cost' in c && c.total_cost !== undefined && (
                      <div className="text-lg font-bold text-right mt-1">= {c.total_cost}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Arc sélectionné (si dispo) */}
          {step.selected && (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg border-2 border-green-400">
              <h4 className="font-semibold text-green-800 mb-2">✅ Arc sélectionné</h4>
              <div className="text-green-700">
                <p><strong>De:</strong> {step.selected.from_node}</p>
                <p><strong>Vers:</strong> {step.selected.to_node}</p>
                {'total_cost' in step.selected && step.selected.total_cost !== undefined && (
                  <p><strong>Coût total:</strong> {step.selected.total_cost}</p>
                )}
                {'calculation' in step.selected && step.selected.calculation && (
                  <p className="text-sm mt-2 font-mono bg-green-50 p-2 rounded">
                    λ({step.selected.to_node}) = {step.selected.calculation}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Résumé final */}
      {currentStep === totalSteps - 1 && stepsData?.final_lambda && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-300">
          <h4 className="font-semibold text-indigo-800 mb-4">🏁 Algorithme terminé !</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-indigo-700 mb-2">Distances finales (λ):</h5>
              <div className="space-y-1">
                {Object.entries(stepsData.final_lambda).map(([node, value]) => (
                  <div key={node} className="text-sm bg-white p-2 rounded border">
                    <strong>λ({node}) = {value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="font-medium text-indigo-700 mb-2">
                {stepsData.main_path ? 'Chemin principal:' : 'Chemin:'}
              </h5>
              {stepsData.main_path && (
                <div className="text-sm bg-green-50 p-3 rounded border border-green-200">
                  <strong>{stepsData.main_path.join(' → ')}</strong>
                  <br />
                  <span className="text-xs text-gray-600">
                    Distance totale: {stepsData.main_path_length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {stepsData?.main_path && (
        <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
          <strong className="text-green-800">Chemin: </strong>
          <span className="font-medium">{stepsData.main_path.join(' → ')}</span>
          <span className="text-sm text-gray-600 ml-2">(Valeur: {stepsData.main_path_length})</span>
        </div>
      )}
    </div>
  );
};

export default DantzigStepByStep;
