import type { DiagramScene } from '../src/index.js';
export const samples: Record<string, DiagramScene> = {
  flow: {
    width: 960, height: 480,
    nodes: [
      { id: 'input', x: 60, y: 170, width: 190, height: 90, label: 'Scene JSON\n结构化输入', shape: 'rounded-rectangle', fill: '#e5efdf' },
      { id: 'convert', x: 385, y: 170, width: 190, height: 90, label: 'Validate & export', shape: 'rounded-rectangle', fill: '#1b5544', fontColor: '#ffffff', bold: true },
      { id: 'output', x: 710, y: 170, width: 190, height: 90, label: 'Editable Draw.io', shape: 'cylinder', fill: '#e5efdf' },
    ],
    edges: [{ id: 'first', source: 'input', target: 'convert' }, { id: 'second', source: 'convert', target: 'output' }],
    texts: [{ id: 'title', x: 60, y: 50, width: 800, height: 50, text: 'From data to a diagram you can edit', fontSize: 26, bold: true }, { id: 'note', x: 60, y: 350, width: 820, height: 45, text: 'Move a node in Draw.io. Its connectors stay attached.', fontSize: 16 }],
  },
  decision: {
    width: 800, height: 600,
    nodes: [
      { id: 'start', x: 295, y: 45, width: 210, height: 70, label: 'Incoming scene', shape: 'rounded-rectangle', fill: '#e5efdf' },
      { id: 'valid', x: 300, y: 200, width: 200, height: 130, label: 'Valid schema?', shape: 'diamond', fill: '#fff1cd' },
      { id: 'export', x: 80, y: 440, width: 210, height: 80, label: 'Export XML', shape: 'rounded-rectangle', fill: '#1b5544', fontColor: '#ffffff' },
      { id: 'fix', x: 510, y: 440, width: 210, height: 80, label: 'Show validation error', shape: 'rounded-rectangle', fill: '#fbe5df' },
    ],
    edges: [{ id: 'check', source: 'start', target: 'valid' }, { id: 'yes', source: 'valid', target: 'export', label: 'Yes' }, { id: 'no', source: 'valid', target: 'fix', label: 'No' }],
  },
  waypoints: {
    width: 900, height: 500,
    nodes: [{ id: 'client', x: 75, y: 180, width: 200, height: 90, label: 'Browser client', fill: '#e5efdf' }, { id: 'file', x: 625, y: 180, width: 200, height: 90, label: 'Local diagram file', shape: 'cylinder', fill: '#e5efdf' }],
    edges: [{ id: 'route', source: 'client', target: 'file', label: 'No API required', points: [{ x: 275, y: 225 }, { x: 350, y: 225 }, { x: 350, y: 90 }, { x: 550, y: 90 }, { x: 550, y: 225 }, { x: 625, y: 225 }], routing: 'orthogonal' }],
    texts: [{ id: 'note', x: 75, y: 370, width: 750, height: 45, text: 'Explicit waypoints travel with the exported connector.', fontSize: 18 }],
  },
  floating: {
    width: 800, height: 450,
    nodes: [{ id: 'node', x: 285, y: 160, width: 230, height: 100, label: 'Optional node binding', shape: 'ellipse', fill: '#e5efdf' }],
    edges: [{ id: 'incoming', target: 'node', label: 'Floating start', points: [{ x: 65, y: 210 }, { x: 285, y: 210 }], routing: 'straight' }, { id: 'outgoing', source: 'node', label: 'Floating end', points: [{ x: 515, y: 210 }, { x: 735, y: 210 }], routing: 'straight' }],
    texts: [{ id: 'title', x: 65, y: 55, width: 670, height: 45, text: 'Connect nodes, points, or both', fontSize: 26, bold: true }],
  },
};
