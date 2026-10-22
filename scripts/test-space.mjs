import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { toDrawioXml, toDrawioModel } from '../dist/index.js';
import { DOMParser } from '@xmldom/xmldom';
const built = await build({ entryPoints: ['space/samples.ts'], bundle: true, format: 'esm', platform: 'node', write: false });
const { samples } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
for (const [name, scene] of Object.entries(samples)) {
  for (const [root, exportScene] of [['mxfile', toDrawioXml], ['mxGraphModel', toDrawioModel]]) {
    const xml = exportScene(scene);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    assert.equal(doc.documentElement.nodeName, root, name);
    for (const edge of scene.edges ?? []) {
      const cell = Array.from(doc.getElementsByTagName('mxCell')).find(el => el.getAttribute('id') === `cell_${edge.id}`);
      assert.ok(cell, name);
      if (edge.source) assert.equal(cell.getAttribute('source'), `cell_${edge.source}`);
      if (edge.target) assert.equal(cell.getAttribute('target'), `cell_${edge.target}`);
    }
  }
}
const root = new URL('../.artifacts/hf-space/', import.meta.url);
assert.deepEqual((await readdir(root)).sort(), ['LICENSE', 'README.md', 'assets', 'build-info.json', 'index.html']);
assert.deepEqual((await readdir(new URL('assets/', root))).sort(), ['app.js', 'style.css']);
const html = await readFile(new URL('index.html', root), 'utf8');
assert.match(html, /connect-src 'none'/);
assert.doesNotMatch(html, /<(?:script|link)\b[^>]*(?:src|href)=["']https?:/i);
const js = await readFile(new URL('assets/app.js', root), 'utf8');
assert.doesNotMatch(js, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB)\b/);
console.log('Static package: 4 examples × 2 XML formats; bound endpoints; 6-file allowlist; offline asset checks passed.');
