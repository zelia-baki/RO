// src/Graph/EdgeForm.jsx
import React from "react";

export default function EdgeForm({
  edges,
  source,
  target,
  weight,
  setSource,
  setTarget,
  setWeight,
  addEdge,
  deleteEdge,
}) {
  return (
    <section className="bg-white rounded-xl border p-6">
      <h2 className="mb-4 font-semibold">Ajouter un arc</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Départ"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1"
        />
        <input
          type="text"
          placeholder="Cible"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1"
        />
        <input
          type="number"
          placeholder="Poids"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="border rounded-lg px-3 py-2 w-24"
        />
      </div>
      <button
        onClick={addEdge}
        className="bg-blue-600 text-white rounded-lg px-4 py-2"
      >
        Ajouter
      </button>
      <table className="w-full border-collapse mt-4">
        <thead>
          <tr>
            <th>Source</th>
            <th>Cible</th>
            <th>Poids</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((e) => (
            <tr key={e.id}>
              <td>{e.source}</td>
              <td>{e.target}</td>
              <td>{e.label}</td>
              <td>
                <button
                  onClick={() => deleteEdge(e.id)}
                  className="text-red-500"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
