// src/components/GraphEditor.jsx
import React from "react";

export default function GraphEditor({ nodes, setNodes, edges, setEdges }) {
  const [nodeId, setNodeId] = React.useState("");
  const [source, setSource] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [weight, setWeight] = React.useState("");

  // --- Nodes ---
  const addNode = () => {
    if (!nodeId.trim()) return;
    if (nodes.some((n) => n.id === nodeId.trim())) {
      alert("Ce sommet existe déjà !");
      return;
    }
    setNodes([...nodes, { id: nodeId.trim() }]);
    setNodeId("");
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.source !== id && e.target !== id));
  };

  const handleNodeLabelChange = (id, newLabel) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, id: newLabel } : n)));
    setEdges(
      edges.map((e) => ({
        ...e,
        source: e.source === id ? newLabel : e.source,
        target: e.target === id ? newLabel : e.target,
      }))
    );
  };

  // --- Edges ---
  const addEdge = () => {
    if (!source.trim() || !target.trim()) return;
    if (edges.some((e) => e.source === source && e.target === target)) {
      alert("Cet arc existe déjà !");
      return;
    }
    setEdges([
      ...edges,
      {
        id: `e${edges.length + 1}`,
        source,
        target,
        label: weight.trim() || "1",
      },
    ]);
    setSource("");
    setTarget("");
    setWeight("");
  };

  const deleteEdge = (eid) => {
    setEdges(edges.filter((e) => e.id !== eid));
  };

  const handleEdgeChange = (eid, field, value) => {
    setEdges(edges.map((e) => (e.id === eid ? { ...e, [field]: value } : e)));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* --- Node form --- */}
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
          <button
            onClick={addNode}
            className="bg-amber-600 text-white rounded-lg px-4 py-2"
          >
            Ajouter
          </button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th>ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => (
              <tr key={n.id}>
                <td>
                  <input
                    value={n.id}
                    onChange={(e) =>
                      handleNodeLabelChange(n.id, e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  />
                </td>
                <td>
                  <button
                    onClick={() => deleteNode(n.id)}
                    className="text-red-500"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {nodes.length === 0 && (
              <tr>
                <td
                  colSpan="2"
                  className="text-center py-4 text-gray-400 italic"
                >
                  Aucun sommet ajouté
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* --- Edge form --- */}
      <section className="bg-white rounded-xl border p-6">
        <h2 className="mb-4 font-semibold">Ajouter un arc</h2>
        <div className="flex gap-2 mb-4">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="border rounded-lg px-3 py-2 flex-1"
          >
            <option value="">Départ</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border rounded-lg px-3 py-2 flex-1"
          >
            <option value="">Cible</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
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
          className="bg-amber-600 text-white rounded-lg px-4 py-2"
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
                <td>
                  <input
                    value={e.source}
                    onChange={(ev) =>
                      handleEdgeChange(e.id, "source", ev.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    value={e.target}
                    onChange={(ev) =>
                      handleEdgeChange(e.id, "target", ev.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={e.label}
                    onChange={(ev) =>
                      handleEdgeChange(e.id, "label", ev.target.value)
                    }
                  />
                </td>
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
            {edges.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-4 text-gray-400 italic"
                >
                  Aucun arc ajouté
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
