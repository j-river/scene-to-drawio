import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';
import { validateScene, toDrawioXml, toDrawioModel, SceneExportError } from '../dist/index.js';

const example = JSON.parse(readFileSync(new URL('../examples/scene.json', import.meta.url), 'utf8'));
const parse = source => new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(source, 'application/xml');
const cells = doc => Array.from(doc.getElementsByTagName('mxCell'));
const cell = (doc, id) => cells(doc).find(n => n.getAttribute('id') === `cell_${id}`);
const scene = () => structuredClone(example);
const code = expected => error => error instanceof SceneExportError && error.code === expected;

test('file has the structural cells and native bound edges', () => {
  const doc = parse(toDrawioXml(example));
  assert.equal(doc.documentElement.tagName, 'mxfile');
  assert.equal(doc.documentElement.getAttribute('compressed'), 'false');
  assert.equal(cells(doc)[0].getAttribute('id'), '0');
  assert.equal(cells(doc)[1].getAttribute('parent'), '0');
  const edge = cell(doc, 'first');
  assert.equal(edge.getAttribute('edge'), '1');
  assert.equal(edge.getAttribute('source'), 'cell_input');
  assert.equal(edge.getAttribute('target'), 'cell_process');
  assert.equal(edge.getElementsByTagName('mxGeometry')[0].getAttribute('relative'), '1');
  assert.equal(doc.getElementsByTagName('image').length, 0);
  assert.doesNotMatch(toDrawioXml(example), /shape=image|data:image|https?:/);
});

test('bare model and full document contain the same model', () => {
  const model = toDrawioModel(example);
  assert.equal(parse(model).documentElement.tagName, 'mxGraphModel');
  assert.ok(toDrawioXml(example).includes(model));
});

test('Unicode and multilevel escaping preserve labels as text, with generated line breaks', () => {
  const s = scene(); s.nodes[0].label = `中文 & <script>alert(1)</script> "quoted" 'single'\r\nnext 😀`;
  const doc = parse(toDrawioXml(s));
  const value = cell(doc, 'input').getAttribute('value');
  assert.match(value, /&lt;script&gt;/);
  assert.match(value, /<br>next 😀/);
  const html = new DOMParser().parseFromString(`<div>${value}</div>`, 'text/html');
  assert.equal(html.getElementsByTagName('script').length, 0);
  assert.match(html.documentElement.textContent, /中文 & <script>alert\(1\)<\/script>/);
});

test('page names are XML escaped and model dimensions remain numeric', () => {
  const doc = parse(toDrawioXml(example, { pageName: `A & "B" <C>` }));
  assert.equal(doc.getElementsByTagName('diagram')[0].getAttribute('name'), `A & "B" <C>`);
  const model = doc.getElementsByTagName('mxGraphModel')[0];
  assert.equal(model.getAttribute('pageWidth'), '960'); assert.equal(model.getAttribute('pageHeight'), '540');
});

test('the five shape styles and automatic dark-fill label contrast are explicit', () => {
  const s = { width: 1000, height: 500, nodes: ['rectangle', 'rounded-rectangle', 'ellipse', 'diamond', 'cylinder'].map((shape, i) => ({ id: String(i), shape, x: i * 150, y: 10, width: 120, height: 90, fill: '#123' })) };
  const doc = parse(toDrawioXml(s));
  for (const [id, pattern] of [['0', /rounded=0;/], ['1', /rounded=1;/], ['2', /ellipse;/], ['3', /rhombus;/], ['4', /shape=cylinder3;.*size=15;/]]) {
    assert.match(cell(doc, id).getAttribute('style'), pattern);
    assert.match(cell(doc, id).getAttribute('style'), /fillColor=#112233;.*fontColor=#ffffff;/);
  }
});

test('font and opacity settings serialize through the fixed vocabulary', () => {
  const s = scene(); Object.assign(s.nodes[0], { fontSize: 22, fontFamily: 'Noto Sans, Arial', fontColor: '#abc', bold: true, align: 'right', opacity: 0.5, stroke: 'none', strokeWidth: 0 });
  const style = cell(parse(toDrawioXml(s)), 'input').getAttribute('style');
  for (const value of ['fontSize=22;', 'fontFamily=Noto Sans, Arial;', 'fontColor=#aabbcc;', 'fontStyle=1;', 'align=right;', 'opacity=50;', 'strokeColor=none;', 'strokeWidth=0;']) assert.ok(style.includes(value));
});

test('automatic ports face the target without falling on node corners', () => {
  const doc = parse(toDrawioXml(example));
  const style = cell(doc, 'first').getAttribute('style');
  assert.match(style, /exitX=1;exitY=0.5;/); assert.match(style, /entryX=0;entryY=0.5;/);
});

test('downward bound edges leave at the bottom and enter at the top', () => {
  const doc = parse(toDrawioXml({ width: 1000, height: 500, nodes: [
    { id: 'a', x: 400, y: 20, width: 100, height: 60 }, { id: 'b', x: 400, y: 300, width: 100, height: 60 },
  ], edges: [{ id: 'edge', source: 'a', target: 'b' }] }));
  assert.match(cell(doc, 'edge').getAttribute('style'), /exitX=0.5;exitY=1;.*entryX=0.5;entryY=0;/);
});

test('polyline endpoints bind to nodes and interior waypoints retain their order', () => {
  const s = scene(); s.edges[0].points = [{ x: 250, y: 235 }, { x: 300, y: 235 }, { x: 300, y: 150 }, { x: 380, y: 200 }];
  const edge = cell(parse(toDrawioXml(s)), 'first');
  const points = Array.from(edge.getElementsByTagName('mxPoint'));
  assert.deepEqual(points.map(p => [p.getAttribute('x'), p.getAttribute('y')]), [['300', '235'], ['300', '150']]);
  assert.equal(edge.getAttribute('source'), 'cell_input'); assert.equal(edge.getAttribute('target'), 'cell_process');
});

test('floating and singly bound edges have explicit free endpoint positions', () => {
  const s = scene(); s.edges = [
    { id: 'floating', points: [{ x: 10, y: 20 }, { x: 40, y: 50 }], routing: 'straight', startArrow: true, endArrow: false },
    { id: 'partial', source: 'input', points: [{ x: 250, y: 235 }, { x: 300, y: 300 }] },
  ];
  const doc = parse(toDrawioXml(s));
  const edge = cell(doc, 'floating');
  assert.equal(edge.hasAttribute('source'), false); assert.equal(edge.hasAttribute('target'), false);
  assert.match(edge.getAttribute('style'), /edgeStyle=none;.*startArrow=classic;endArrow=none;/);
  assert.deepEqual(Array.from(edge.getElementsByTagName('mxPoint')).map(p => p.getAttribute('as')), ['sourcePoint', 'targetPoint']);
  assert.deepEqual(Array.from(cell(doc, 'partial').getElementsByTagName('mxPoint')).map(p => p.getAttribute('as')), ['targetPoint']);
});

test('self loops omit forced coincident ports so Draw.io can route the loop', () => {
  const s = scene(); s.edges = [{ id: 'loop', source: 'input', target: 'input' }];
  const style = cell(parse(toDrawioXml(s)), 'loop').getAttribute('style');
  assert.match(style, /orthogonalLoop=1/); assert.doesNotMatch(style, /exitX|entryX/);
});

test('standalone text is a separate native vertex and geometry uses three decimals', () => {
  const s = scene(); s.texts[0].x = -0.00001; s.texts[0].y = 12.34567;
  const t = cell(parse(toDrawioXml(s)), 'title');
  assert.equal(t.getAttribute('vertex'), '1'); assert.match(t.getAttribute('style'), /^text;/);
  assert.equal(t.getElementsByTagName('mxGeometry')[0].getAttribute('x'), '0');
  assert.equal(t.getElementsByTagName('mxGeometry')[0].getAttribute('y'), '12.346');
});

test('validation returns a deep copy and deterministic export does not mutate input', () => {
  const s = scene(), original = structuredClone(s);
  const validated = validateScene(s); validated.nodes[0].label = 'changed';
  assert.deepEqual(s, original);
  assert.equal(toDrawioXml(s), toDrawioXml(s)); assert.deepEqual(s, original);
});

test('empty scenes and numeric/prototype-like IDs do not collide with root IDs', () => {
  assert.equal(cells(parse(toDrawioXml({ width: 1, height: 1, nodes: [] }))).length, 2);
  const s = scene(); s.nodes[0].id = '__proto__'; s.edges[0].source = '__proto__';
  s.nodes[1].id = '0'; s.edges[0].target = '0'; s.edges[1].source = '0';
  const doc = parse(toDrawioXml(s));
  assert.equal(cell(doc, '__proto__').getAttribute('vertex'), '1');
  assert.equal(cell(doc, '0').getAttribute('vertex'), '1');
});

test('duplicate IDs and non-node references are rejected', () => {
  const s = scene(); s.edges[0].id = s.nodes[0].id;
  assert.throws(() => toDrawioXml(s), code('DUPLICATE_ID'));
  const other = scene(); other.edges[0].source = 'title';
  assert.throws(() => toDrawioXml(other), code('UNKNOWN_REFERENCE'));
  other.edges[0].source = 'missing';
  assert.throws(() => toDrawioXml(other), code('UNKNOWN_REFERENCE'));
});

test('unsupported fields, raster layers and raw style/HTML inputs are rejected', () => {
  for (const change of [s => { s.providerData = {}; }, s => { s.nodes[0].style = 'image=https://example.test/x'; }, s => { s.nodes[0].html = '<b>raw</b>'; }, s => { s.nodes[0].shape = 'image'; }]) {
    const s = scene(); change(s); assert.throws(() => toDrawioXml(s), code('INVALID_SCENE'));
  }
});

test('style delimiters and URLs cannot be injected through allowed strings', () => {
  for (const change of [s => { s.nodes[0].fill = '#fff;image=https://example.test/x'; }, s => { s.nodes[0].fontFamily = 'Arial;html=1'; },
    s => { s.nodes[0].stroke = 'url(https://example.test/x)'; }, s => { s.edges[0].source = 'input" target="other'; }]) {
    const s = scene(); change(s); assert.throws(() => toDrawioXml(s), e => ['INVALID_SCENE', 'INPUT_TOO_LARGE'].includes(e.code));
  }
});

test('invalid XML characters, lone surrogates and oversized labels are refused', () => {
  for (const value of ['a\0b', '\ud800', '\udc00', '\ufffe']) {
    const s = scene(); s.nodes[0].label = value;
    assert.throws(() => toDrawioXml(s), code('INVALID_SCENE'));
  }
  const s = scene(); s.nodes[0].label = 'x'.repeat(8193);
  assert.throws(() => toDrawioXml(s), code('INPUT_TOO_LARGE'));
});

test('non-finite geometry, empty boxes, invalid enums and booleans are refused', () => {
  for (const change of [s => { s.width = NaN; }, s => { s.nodes[0].x = Infinity; }, s => { s.nodes[0].width = 0; },
    s => { s.nodes[0].opacity = 2; }, s => { s.nodes[0].bold = 1; }, s => { s.edges[0].routing = 'curved'; }]) {
    const s = scene(); change(s); assert.throws(() => toDrawioXml(s), code('INVALID_SCENE'));
  }
});

test('unbound ends and malformed/sparse/oversized point arrays are refused', () => {
  for (const edge of [{ id: 'bad' }, { id: 'bad', source: 'input' }, { id: 'bad', points: [] },
    { id: 'bad', points: Array(2) }, { id: 'bad', points: [{ x: 0, y: NaN }, { x: 1, y: 1 }] }]) {
    const s = scene(); s.edges = [edge]; assert.throws(() => toDrawioXml(s), code('INVALID_SCENE'));
  }
  const s = scene(); s.edges[0].points = Array(129).fill({ x: 0, y: 0 });
  assert.throws(() => toDrawioXml(s), code('INPUT_TOO_LARGE'));
});

test('accessors and custom objects are rejected without executing getters', () => {
  let reads = 0;
  const s = scene(); Object.defineProperty(s.nodes[0], 'label', { get() { reads++; return 'bad'; } });
  assert.throws(() => validateScene(s), code('INVALID_SCENE')); assert.equal(reads, 0);
  const t = scene(); Object.defineProperty(t.nodes, '0', { get() { reads++; return {}; } });
  assert.throws(() => validateScene(t), code('INVALID_SCENE')); assert.equal(reads, 0);
  assert.throws(() => validateScene(new Date()), code('INVALID_SCENE'));
});

test('element limits count nodes, edges and text together', () => {
  assert.throws(() => toDrawioXml(example, { maxElements: 6 }), code('INPUT_TOO_LARGE'));
  const node = { id: 'a', x: 0, y: 0, width: 1, height: 1 };
  assert.throws(() => toDrawioXml({ width: 1, height: 1, nodes: Array(2001).fill(node) }), code('INPUT_TOO_LARGE'));
});

test('UTF-8 output limits include the wrapper and exactly accept their byte boundary', () => {
  const output = toDrawioXml(example), size = Buffer.byteLength(output);
  assert.equal(toDrawioXml(example, { maxOutputBytes: size }), output);
  assert.throws(() => toDrawioXml(example, { maxOutputBytes: size - 1 }), code('OUTPUT_TOO_LARGE'));
  assert.throws(() => toDrawioXml(example, { maxOutputBytes: 1 }), code('OUTPUT_TOO_LARGE'));
});

test('invalid export options cannot raise hard ceilings', () => {
  for (const options of [null, [], { unknown: true }, { maxElements: 2001 }, { maxElements: -1 }, { maxOutputBytes: 4_194_305 }, { maxOutputBytes: NaN }]) {
    assert.throws(() => toDrawioXml(example, options), code('INVALID_OPTIONS'));
  }
});
