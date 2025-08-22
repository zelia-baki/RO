import React from "react";

export default function GraphResults({ lambdaData, path }) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4">Résultats</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">λ(x)</h3>
          <ul className="space-y-1">
            {lambdaData?.lambda && Object.entries(lambdaData.lambda).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}:</span> <span className="font-medium">{v}</span>
              </li>
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
      {path?.length > 0 && <div className="mt-4 font-semibold">Chemin minimal: {path.join(' → ')}</div>}
    </div>
  );
}
