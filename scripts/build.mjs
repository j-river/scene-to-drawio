import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await Promise.all([
  build({ entryPoints: ['src/index.ts'], outfile: 'dist/index.js', bundle: true, format: 'esm', platform: 'neutral', target: 'es2022' }),
  build({ entryPoints: ['src/index.ts'], outfile: 'dist/index.cjs', bundle: true, format: 'cjs', platform: 'node', target: 'node22' }),
  build({ entryPoints: ['src/index.ts'], outfile: 'dist/browser.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true }),
  build({ entryPoints: ['src/cli.ts'], outfile: 'dist/cli.js', bundle: true, format: 'esm', platform: 'node', target: 'node22', banner: { js: '#!/usr/bin/env node' } }),
]);
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--emitDeclarationOnly'], { stdio: 'inherit' });
await copyFile('dist/types/index.d.ts', 'dist/index.d.ts');
await copyFile('dist/types/index.d.ts', 'dist/index.d.cts');
