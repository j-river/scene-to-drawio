import type { FontStyle, Point, SceneNode, ValidatedScene } from '../src/index.js';
const ns = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) {
  const el = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}
function label(parent: SVGElement, value: string, x: number, y: number, width: number, height: number, font: FontStyle) {
  const size = font.fontSize ?? 16;
  const lines = value.split('\n').slice(0, 4);
  const align = font.align ?? 'center';
  const el = svg('text', { x: align === 'left' ? x + 8 : align === 'right' ? x + width - 8 : x + width / 2,
    y: y + height / 2 - ((lines.length - 1) * size * 1.3) / 2,
    'text-anchor': align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle', 'dominant-baseline': 'central',
    'font-size': size, 'font-family': 'Arial, sans-serif', 'font-weight': font.bold ? 700 : 400, fill: font.fontColor ?? '#1b302b' });
  lines.forEach((line, i) => { const span = svg('tspan', { x: el.getAttribute('x')!, dy: i ? size * 1.3 : 0 }); span.textContent = line.length > 60 ? line.slice(0, 59) + '…' : line; el.append(span); });
  parent.append(el);
}
function center(node: SceneNode): Point { return { x: node.x + node.width / 2, y: node.y + node.height / 2 }; }
function boundary(node: SceneNode, toward: Point): Point {
  const c = center(node); const dx = toward.x - c.x; const dy = toward.y - c.y;
  if (!dx && !dy) return c;
  const rx = node.width / 2, ry = node.height / 2;
  const factor = node.shape === 'ellipse' ? 1 / Math.hypot(dx / rx, dy / ry)
    : node.shape === 'diamond' ? 1 / (Math.abs(dx) / rx + Math.abs(dy) / ry)
    : Math.min(rx / Math.abs(dx), ry / Math.abs(dy));
  return { x: c.x + dx * factor, y: c.y + dy * factor };
}
export function renderPreview(container: HTMLElement, scene: ValidatedScene) {
  container.replaceChildren();
  if (scene.nodes.length + scene.edges.length + scene.texts.length > 500) {
    const note = document.createElement('p'); note.textContent = 'Preview is limited to 500 elements. Your complete export is ready to download.'; container.append(note); return;
  }
  const boxes = [...scene.nodes, ...scene.texts];
  const points = scene.edges.flatMap(edge => edge.points ?? []);
  const minX = Math.min(0, ...boxes.map(n => n.x), ...points.map(p => p.x));
  const minY = Math.min(0, ...boxes.map(n => n.y), ...points.map(p => p.y));
  const maxX = Math.max(scene.width, ...boxes.map(n => n.x + n.width), ...points.map(p => p.x));
  const maxY = Math.max(scene.height, ...boxes.map(n => n.y + n.height), ...points.map(p => p.y));
  const root = svg('svg', { viewBox: `${minX - 24} ${minY - 24} ${maxX - minX + 48} ${maxY - minY + 48}`, role: 'img', 'aria-label': 'Schematic scene layout; exported Draw.io rendering may differ' });
  const title = svg('title'); title.textContent = 'Scene layout preview'; root.append(title);
  const defs = svg('defs');
  for (const [i, edge] of scene.edges.entries()) {
    const marker = svg('marker', { id: `arrow-${i}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    marker.append(svg('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: edge.stroke ?? '#64748b' })); defs.append(marker);
  }
  root.append(defs);
  const nodes = new Map(scene.nodes.map(node => [node.id, node]));
  scene.edges.forEach((edge, i) => {
    const source = edge.source ? nodes.get(edge.source) : undefined, target = edge.target ? nodes.get(edge.target) : undefined;
    const supplied = edge.points;
    const start = source ? center(source) : supplied![0]!;
    const end = target ? center(target) : supplied![supplied!.length - 1]!;
    const bends = supplied ? supplied.slice(1, -1) : [];
    let route: Point[];
    if (source && target && source.id === target.id && !bends.length) {
      const n = source; route = [{ x: n.x + n.width, y: n.y + n.height / 2 }, { x: n.x + n.width + 45, y: n.y + n.height / 2 }, { x: n.x + n.width + 45, y: n.y - 30 }, { x: n.x + n.width / 2, y: n.y - 30 }, { x: n.x + n.width / 2, y: n.y }];
    } else {
      if (!bends.length && edge.routing !== 'straight' && start.x !== end.x && start.y !== end.y) bends.push({ x: (start.x + end.x) / 2, y: start.y }, { x: (start.x + end.x) / 2, y: end.y });
      route = [source ? boundary(source, bends[0] ?? end) : start, ...bends, target ? boundary(target, bends.at(-1) ?? start) : end];
    }
    const attrs: Record<string, string | number> = { points: route.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: edge.stroke ?? '#64748b', 'stroke-width': edge.strokeWidth ?? 2, 'stroke-linejoin': 'round' };
    if (edge.endArrow !== false) attrs['marker-end'] = `url(#arrow-${i})`;
    if (edge.startArrow) attrs['marker-start'] = `url(#arrow-${i})`;
    root.append(svg('polyline', attrs));
    if (edge.label) { const middle = route[Math.floor(route.length / 2)]!; const before = route[Math.max(0, Math.floor(route.length / 2) - 1)]!; label(root, edge.label, (middle.x + before.x) / 2 - 110, (middle.y + before.y) / 2 - 34, 220, 26, edge); }
  });
  for (const node of scene.nodes) {
    const group = svg('g', { opacity: node.opacity ?? 1 });
    const common = { fill: node.fill ?? '#ffffff', stroke: node.stroke ?? '#64748b', 'stroke-width': node.strokeWidth ?? 1 };
    if (node.shape === 'ellipse') group.append(svg('ellipse', { ...common, cx: node.x + node.width / 2, cy: node.y + node.height / 2, rx: node.width / 2, ry: node.height / 2 }));
    else if (node.shape === 'diamond') group.append(svg('polygon', { ...common, points: `${node.x + node.width / 2},${node.y} ${node.x + node.width},${node.y + node.height / 2} ${node.x + node.width / 2},${node.y + node.height} ${node.x},${node.y + node.height / 2}` }));
    else if (node.shape === 'cylinder') {
      const { x, y, width: w, height: h } = node; const r = Math.min(14, h / 6);
      group.append(svg('path', { ...common, d: `M ${x} ${y + r} C ${x} ${y - r / 3} ${x + w} ${y - r / 3} ${x + w} ${y + r} L ${x + w} ${y + h - r} C ${x + w} ${y + h + r / 3} ${x} ${y + h + r / 3} ${x} ${y + h - r} Z M ${x} ${y + r} C ${x} ${y + r * 2.3} ${x + w} ${y + r * 2.3} ${x + w} ${y + r}` }));
    } else group.append(svg('rect', { ...common, x: node.x, y: node.y, width: node.width, height: node.height, rx: node.shape === 'rounded-rectangle' ? Math.min(node.height / 5, 14) : 0 }));
    label(group, node.label ?? '', node.x, node.y, node.width, node.height, node); root.append(group);
  }
  for (const text of scene.texts) label(root, text.text, text.x, text.y, text.width, text.height, { ...text, align: text.align ?? 'left' });
  container.append(root);
}
