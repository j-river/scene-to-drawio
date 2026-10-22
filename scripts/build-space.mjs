import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const out = new URL('../.artifacts/hf-space/', import.meta.url);
await mkdir(new URL('assets/', out), { recursive: true });
// Explicit inputs and outputs: never copy a working tree or environment files.
const copies = [['space/index.html', 'index.html'], ['space/style.css', 'assets/style.css'], ['space/README.md', 'README.md'], ['LICENSE', 'LICENSE']];
for (const [source, target] of copies) await writeFile(new URL(target, out), await readFile(new URL(`../${source}`, import.meta.url)));
await build({ entryPoints: [fileURLToPath(new URL('../space/app.ts', import.meta.url))], outfile: fileURLToPath(new URL('assets/app.js', out)), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none' });
const sources = ['src/index.ts', 'space/app.ts', 'space/preview.ts', 'space/samples.ts', 'space/index.html', 'space/style.css', 'space/README.md', 'scripts/build-space.mjs'];
const fingerprints = {};
for (const source of sources) fingerprints[source] = createHash('sha256').update(await readFile(new URL(`../${source}`, import.meta.url))).digest('hex');
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
await writeFile(new URL('build-info.json', out), JSON.stringify({ library: 'scene-to-drawio', version, source: 'https://github.com/j-river/scene-to-drawio', sha256: fingerprints }, null, 2) + '\n');
console.log('Static Space built: .artifacts/hf-space/ (6 public files)');
