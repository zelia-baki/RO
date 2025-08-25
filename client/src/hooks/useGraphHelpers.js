// src/hooks/useGraphHelpers.js
export const parseArcString = (s) => {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
  return m ? [m[1].trim(), m[2].trim()] : null;
};

export const getStepsArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data.steps)) return data.steps;
  if (Array.isArray(data.detailed_steps)) return data.detailed_steps;
  return [];
};

export const getLambdaFromStep = (step) =>
  step?.lambda ?? step?.lambda_values ?? {};

export const getHighlightFromStep = (step) => {
  let edgesPairs = [];
  if (Array.isArray(step?.selected_arcs)) {
    edgesPairs = step.selected_arcs.map(parseArcString).filter(Boolean);
  } else if (step?.selected?.from_node && step?.selected?.to_node) {
    edgesPairs = [[step.selected.from_node, step.selected.to_node]];
  } else if (Array.isArray(step?.highlight_edges)) {
    edgesPairs = step.highlight_edges.filter(
      (e) => Array.isArray(e) && e.length === 2
    );
  }

  const nodeSet = new Set();
  edgesPairs.forEach(([u, v]) => {
    nodeSet.add(u);
    nodeSet.add(v);
  });
  if (Array.isArray(step?.highlight_nodes)) {
    step.highlight_nodes.forEach((n) => nodeSet.add(n));
  }

  return { highlightEdges: edgesPairs, highlightNodes: Array.from(nodeSet) };
};
