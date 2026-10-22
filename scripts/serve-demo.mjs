import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const allowed = new Set(['/', '/examples/browser/index.html', '/examples/scene.json', '/dist/browser.js', '/tests/browser.html']);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!allowed.has(pathname)) { res.writeHead(404); res.end('Not found'); return; }
  const target = pathname === '/' ? '/examples/browser/index.html' : pathname;
  try {
    const data = await readFile(path.join(root, target));
    res.writeHead(200, { 'Content-Type': `${types[path.extname(target)] ?? 'text/plain'}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4179, '127.0.0.1', () => console.log('Demo: http://127.0.0.1:4179/ | Browser checks: /tests/browser.html'));
