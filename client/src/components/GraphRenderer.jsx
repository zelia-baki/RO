import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function GraphRenderer({
    nodes,
    edges,
    highlightNodes = [],
    highlightEdges = [],
    path = [],
    lambdaValues = {},
}) {
    const containerRef = useRef();
    const cyRef = useRef(null);

    // --- Créer le graphe uniquement quand nodes/edges changent ---
    useEffect(() => {
        if (cyRef.current) {
            cyRef.current.destroy();
        }

        const elements = [
            ...nodes.map((n) => ({
                data: { id: n.id, label: n.id },
            })),
            ...edges.map((e) => ({
                data: { id: e.id, source: e.source, target: e.target, label: e.label },
            })),
        ];

        cyRef.current = cytoscape({
            container: containerRef.current,
            elements,
            style: [
                {
                    selector: "node",
                    style: {
                        "background-color": "#fff",
                        "border-color": "#cbd5e1",
                        "border-width": 1,
                        label: "data(label)",
                        "text-valign": "center",
                        "font-size": "10px",
                    },
                },
                {
                    selector: "edge",
                    style: {
                        "curve-style": "bezier",
                        "target-arrow-shape": "triangle",
                        "line-color": "#94a3b8",
                        "target-arrow-color": "#94a3b8",
                        width: 1.5,
                        label: "data(label)",
                        "font-size": "12px",
                    },
                },
                {
                    selector: ".highlight-node",
                    style: {
                        "background-color": "#fffbeb",
                        "border-color": "#d97706",
                        "border-width": 3,
                    },
                },
                {
                    selector: ".highlight-edge",
                    style: {
                        "line-color": "#d97706",
                        "target-arrow-color": "#b45309",
                        width: 3,
                    },
                },
                {
                    selector: ".solution-node",
                    style: {
                        "background-color": "#dcfce7",
                        "border-color": "#16a34a",
                        "border-width": 3,
                    },
                },
                {
                    selector: ".solution-edge",
                    style: {
                        "line-color": "#16a34a",
                        "target-arrow-color": "#16a34a",
                        width: 3,
                    },
                },
            ],
        });

        cyRef.current.layout({ name: "cose", animate: true }).run();

        return () => {
            if (cyRef.current) cyRef.current.destroy();
        };
    }, [nodes, edges]);

    // --- Mettre à jour les labels, surlignages et chemin final ---
    useEffect(() => {
        if (!cyRef.current) return;

        // Réinitialiser toutes les classes à chaque changement
        cyRef.current.nodes().removeClass("highlight-node solution-node");
        cyRef.current.edges().removeClass("highlight-edge solution-edge");

        // Mettre à jour les labels λ(x)
        cyRef.current.nodes().forEach((n) => {
            const lambda = lambdaValues[n.id()];
            const baseLabel = n.id();
            n.data("label", lambda !== undefined ? `${baseLabel}\n(${lambda})` : baseLabel);
        });

        if (path && path.length > 1) {
            // ⚠️ Cas : chemin final présent → on ignore les surlignages d’étape
            for (let i = 0; i < path.length - 1; i++) {
                cyRef.current.edges()
                    .filter(e => e.data("source") === path[i] && e.data("target") === path[i + 1])
                    .addClass("solution-edge");
            }
            path.forEach((id) => {
                cyRef.current.getElementById(id)?.addClass("solution-node");
            });
        } else {
            // Sinon : on applique seulement les highlights d’étape
            highlightNodes.forEach((id) => {
                cyRef.current.getElementById(id)?.addClass("highlight-node");
            });
            highlightEdges.forEach(([u, v]) => {
                cyRef.current.edges()
                    .filter(e => e.data("source") === u && e.data("target") === v)
                    .addClass("highlight-edge");
            });
        }
    }, [highlightNodes, highlightEdges, lambdaValues, path]);

    return (
        <div
            ref={containerRef}
            style={{ width: "100%", height: "500px", backgroundColor: "#fff" }}
            className="rounded-xl border border-gray-200 shadow"
        />
    );
}
