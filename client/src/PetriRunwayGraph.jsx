import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function PetriRunwayGraph({ net, marking, lastFired }) {
  const cyRef = useRef(null);

  useEffect(() => {
    if (!net || !marking) return;

    const elements = [];

    // --- Ajouter les places ---
    net.places.forEach(p => {
      elements.push({
        data: { id: p, label: `${p} (${marking[p] ?? 0})` },
        classes: "place"
      });
    });

    // --- Ajouter les transitions ---
    net.transitions.forEach(t => {
      elements.push({
        data: { id: t, label: t },
        classes: "transition"
      });
    });

    // --- Ajouter les arcs PRE ---
    Object.entries(net.pre).forEach(([t, places]) => {
      Object.keys(places).forEach(p => {
        elements.push({ data: { source: p, target: t } });
      });
    });

    // --- Ajouter les arcs POST ---
    Object.entries(net.post).forEach(([t, places]) => {
      Object.keys(places).forEach(p => {
        elements.push({ data: { source: t, target: p } });
      });
    });

    // --- Initialiser Cytoscape ---
    cyRef.current = cytoscape({
      container: document.getElementById("cy"),
      elements,
      style: [
        {
          selector: ".place",
          style: {
            shape: "ellipse",
            "background-color": "#3490dc",
            "text-valign": "center",
            color: "#fff",
            label: "data(label)",
            "font-size": "10px"
          }
        },
        {
          selector: ".transition",
          style: {
            shape: "rectangle",
            "background-color": "#38c172",
            "text-valign": "center",
            color: "#fff",
            label: "data(label)",
            "font-size": "10px"
          }
        },
        {
          selector: "edge",
          style: {
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 1
          }
        }
      ],
      layout: { name: "grid" }
    });

    // --- Animation de surbrillance ---
    if (lastFired) {
      const node = cyRef.current.$(`#${lastFired}`);
      node.animate({ style: { "background-color": "red" } }, { duration: 300 })
          .animate({ style: { "background-color": "#38c172" } }, { duration: 300 });
    }

  }, [net, marking, lastFired]);

  return <div id="cy" style={{ width: "100%", height: "500px" }} />;
}
