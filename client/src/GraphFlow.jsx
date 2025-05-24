import React from 'react';
import ReactFlow, { Controls, Background } from 'react-flow-renderer';

const nodeStyle = {
  width: 40,
  height: 40,
  border: '2px solid #d97706',
  borderRadius: '50%',
  textAlign: 'center',
  paddingTop: '10px',
  fontWeight: 'bold',
  background: '#fff8dc',
};

const nodes = [
  { id: 'x1', data: { label: 'x1' }, position: { x: 50, y: 180 }, style: nodeStyle },
  { id: 'x2', data: { label: 'x2' }, position: { x: 150, y: 180 }, style: nodeStyle },
  { id: 'x3', data: { label: 'x3' }, position: { x: 250, y: 240 }, style: nodeStyle },
  { id: 'x4', data: { label: 'x4' }, position: { x: 250, y: 120 }, style: nodeStyle },
  { id: 'x5', data: { label: 'x5' }, position: { x: 350, y: 80 }, style: nodeStyle },
  { id: 'x6', data: { label: 'x6' }, position: { x: 350, y: 180 }, style: nodeStyle },
  { id: 'x7', data: { label: 'x7' }, position: { x: 450, y: 180 }, style: nodeStyle },
  { id: 'x8', data: { label: 'x8' }, position: { x: 550, y: 180 }, style: nodeStyle },
  { id: 'x9', data: { label: 'x9' }, position: { x: 550, y: 100 }, style: nodeStyle },
  { id: 'x10', data: { label: 'x10' }, position: { x: 650, y: 100 }, style: nodeStyle },
  { id: 'x11', data: { label: 'x11' }, position: { x: 350, y: 280 }, style: nodeStyle },
  { id: 'x12', data: { label: 'x12' }, position: { x: 650, y: 180 }, style: nodeStyle },
  { id: 'x13', data: { label: 'x13' }, position: { x: 450, y: 280 }, style: nodeStyle },
  { id: 'x14', data: { label: 'x14' }, position: { x: 550, y: 280 }, style: nodeStyle },
  { id: 'x15', data: { label: 'x15' }, position: { x: 650, y: 280 }, style: nodeStyle },
  { id: 'x16', data: { label: 'x16' }, position: { x: 750, y: 280 }, style: nodeStyle },
];

const edges = [
  { id: 'e1', source: 'x1', target: 'x2', label: '10', markerEnd: { type: 'arrow' } },
  { id: 'e2', source: 'x2', target: 'x3', label: '15', markerEnd: { type: 'arrow' } },
  { id: 'e3', source: 'x2', target: 'x4', label: '8', markerEnd: { type: 'arrow' } },
  { id: 'e4', source: 'x3', target: 'x6', label: '1', markerEnd: { type: 'arrow' } },
  { id: 'e5', source: 'x4', target: 'x5', label: '6', markerEnd: { type: 'arrow' } },
  { id: 'e6', source: 'x4', target: 'x6', label: '5', markerEnd: { type: 'arrow' } },
  { id: 'e7', source: 'x5', target: 'x9', label: '1', markerEnd: { type: 'arrow' } },
  { id: 'e8', source: 'x6', target: 'x7', label: '4', markerEnd: { type: 'arrow' } },
  { id: 'e9', source: 'x7', target: 'x8', label: '1', markerEnd: { type: 'arrow' } },
  { id: 'e10', source: 'x8', target: 'x9', label: '3', markerEnd: { type: 'arrow' } },
  { id: 'e11', source: 'x8', target: 'x12', label: '7', markerEnd: { type: 'arrow' } },
  { id: 'e12', source: 'x9', target: 'x10', label: '6', markerEnd: { type: 'arrow' } },
  { id: 'e13', source: 'x10', target: 'x12', label: '7', markerEnd: { type: 'arrow' } },
  { id: 'e14', source: 'x7', target: 'x11', label: '8', markerEnd: { type: 'arrow' } },
  { id: 'e15', source: 'x11', target: 'x13', label: '2', markerEnd: { type: 'arrow' } },
  { id: 'e16', source: 'x12', target: 'x15', label: '9', markerEnd: { type: 'arrow' } },
  { id: 'e17', source: 'x13', target: 'x14', label: '4', markerEnd: { type: 'arrow' } },
  { id: 'e18', source: 'x14', target: 'x15', label: '5', markerEnd: { type: 'arrow' } },
  { id: 'e19', source: 'x15', target: 'x16', label: '6', markerEnd: { type: 'arrow' } },
];

const DantzigGraphExact = () => {
  return (
    <div style={{ height: '800px', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default DantzigGraphExact;
