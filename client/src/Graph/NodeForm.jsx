import React from "react";

export default function NodeForm({ nodes, nodeId, setNodeId, addNode, deleteNode }) {
  return (
    <section className="bg-white rounded-xl border p-6">
      <h2 className="mb-4 font-semibold">Ajouter un sommet</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nom"
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-grow"
        />
        <button onClick={addNode} className="bg-blue-600 text-white rounded-lg px-4 py-2">
          Ajouter
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead><tr><th>ID</th><th>Actions</th></tr></thead>
        <tbody>
          {nodes.map((n) => (
            <tr key={n.id}>
              <td>{n.id}</td>
              <td>
                <button onClick={() => deleteNode(n.id)} className="text-red-500">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
