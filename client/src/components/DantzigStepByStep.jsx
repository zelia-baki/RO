import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DantzigStepByStep = ({ stepsData, onStepChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    let interval;
    if (isPlaying && currentStep < stepsData.detailed_steps.length - 1) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= stepsData.detailed_steps.length - 1) {
            setIsPlaying(false);
          }
          return next;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, stepsData.detailed_steps.length]);

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange && stepsData.detailed_steps[currentStep]) {
      onStepChange(stepsData.detailed_steps[currentStep]);
    }
  }, [currentStep, onStepChange, stepsData.detailed_steps]);

  if (!stepsData || !stepsData.detailed_steps) {
    return null;
  }

  const step = stepsData.detailed_steps[currentStep];
  const totalSteps = stepsData.detailed_steps.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Algorithme de Dantzig - Étapes détaillées
        </h2>
        
        {/* Contrôles de navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            ← Précédent
          </button>
          
          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Jouer'}
          </button>
          
          <button
            onClick={nextStep}
            disabled={currentStep === totalSteps - 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Suivant →
          </button>
          
          <span className="text-sm text-gray-600 ml-2">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <motion.div
          className="bg-blue-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
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
          {/* En-tête de l'étape */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-800">
              {step.step_name || `Étape ${step.step}`}: {step.action}
            </h3>
            <p className="text-blue-700 mt-1">{step.description}</p>
          </div>

          {/* État actuel */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Ensemble E */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">
                Ensemble marqué E{step.step}
              </h4>
              <div className="flex flex-wrap gap-2">
                {step.E_current.map((node, index) => (
                  <motion.span
                    key={node}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium"
                  >
                    {node}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Valeurs λ */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">
                Valeurs λ(x)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(step.lambda_values).map(([node, value]) => (
                  <motion.div
                    key={node}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between text-sm"
                  >
                    <span className="font-medium">λ({node}):</span>
                    <span className={`font-bold ${
                      value === '∞' ? 'text-gray-500' : 'text-purple-700'
                    }`}>
                      {value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Candidats et calculs */}
          {step.candidates && step.candidates.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-3">
                Calculs des candidats
              </h4>
              <div className="space-y-3">
                {step.candidates.map((candidate, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      step.selected && 
                      candidate.from_node === step.selected.from_node && 
                      candidate.to_node === step.selected.to_node
                        ? 'bg-green-100 border-green-400 shadow-md'
                        : 'bg-white border-yellow-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        Arc ({candidate.from_node}, {candidate.to_node})
                      </span>
                      <span className="text-sm text-gray-600">
                        Coût: {candidate.edge_cost}
                      </span>
                    </div>
                    <div className="text-sm mt-1 text-gray-700">
                      {candidate.calculation}
                    </div>
                    <div className="text-lg font-bold text-right mt-1">
                      = {candidate.total_cost}
                    </div>
                  </motion.div>
                ))}
              </div>

              {step.reasoning && (
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    🎯 Sélection: {step.reasoning}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Arc sélectionné */}
          {step.selected && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg border-2 border-green-400"
            >
              <h4 className="font-semibold text-green-800 mb-2">
                ✅ Arc sélectionné
              </h4>
              <div className="text-green-700">
                <p><strong>De:</strong> {step.selected.from_node}</p>
                <p><strong>Vers:</strong> {step.selected.to_node}</p>
                <p><strong>Coût total:</strong> {step.selected.total_cost}</p>
                <p className="text-sm mt-2 font-mono bg-green-50 p-2 rounded">
                  λ({step.selected.to_node}) = {step.selected.calculation}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Résumé final */}
      {currentStep === totalSteps - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-300"
        >
          <h4 className="font-semibold text-indigo-800 mb-4">
            🏁 Algorithme terminé !
          </h4>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Distances finales */}
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
            
            {/* Chemin minimal principal */}
            <div>
              <h5 className="font-medium text-indigo-700 mb-2">Chemin minimal principal:</h5>
              {stepsData.main_path && (
                <div className="text-sm bg-green-50 p-3 rounded border border-green-200">
                  <strong>{stepsData.main_path.join(' → ')}</strong>
                  <br />
                  <span className="text-xs text-gray-600">Distance totale: {stepsData.main_path_length}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Chemin minimal affiché en permanence (comme dans le calcul rapide) */}
      {stepsData.main_path && (
        <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
          <strong className="text-green-800">Chemin minimal: </strong>
          <span className="font-medium">{stepsData.main_path.join(' → ')}</span>
          <span className="text-sm text-gray-600 ml-2">(Distance: {stepsData.main_path_length})</span>
        </div>
      )}
    </div>
  );
};

export default DantzigStepByStep;
