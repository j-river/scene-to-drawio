import http from 'node:http';
import { readFile } from 'node:fs/promises';
const root = new URL('../.artifacts/hf-space/', import.meta.url);
const allowed = new Map([['/', ['index.html', 'text/html']], ['/assets/app.js', ['assets/app.js', 'text/javascript']], ['/assets/style.css', ['assets/style.css', 'text/css']], ['/README.md', ['README.md', 'text/plain']], ['/LICENSE', ['LICENSE', 'text/plain']], ['/build-info.json', ['build-info.json', 'application/json']]]);
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = allowed.get(pathname);
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try { const body = await readFile(new URL(file[0], root)); res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(body); }
  catch { res.writeHead(404); res.end('Build the Space first.'); }
});
server.listen(4180, '127.0.0.1', () => console.log('Static Space: http://127.0.0.1:4180/'));
