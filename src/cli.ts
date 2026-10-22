import { createReadStream } from 'node:fs';
import { SceneExportError, toDrawioModel, toDrawioXml } from './index.js';

const HELP = `scene-to-drawio 0.1.0 — structured JSON to editable Draw.io XML

Usage: scene-to-drawio [file.json|-] [--model] [--page-name name]
No file or - reads stdin. XML goes to stdout; diagnostics go to stderr.
  --model           Output bare mxGraphModel for Extras > Edit Diagram
  --page-name name  Page name in a full .drawio document
  --help            Show help
  --version         Show version
Input is limited to 2 MiB; files are never overwritten. Exit 0 success, 2 error.
`;
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0]!)) { process.stdout.write(HELP); return; }
  if (args.length === 1 && args[0] === '--version') { process.stdout.write('0.1.0\n'); return; }
  let file: string | undefined, pageName = 'Page-1', model = false, positional = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (!positional && arg === '--') { positional = true; continue; }
    if (!positional && arg === '--model') { model = true; continue; }
    if (!positional && arg === '--page-name') {
      const name = args[++i];
      if (name === undefined) throw new SceneExportError('INVALID_OPTIONS', 'Missing page name.');
      pageName = name; continue;
    }
    if (!positional && arg.startsWith('-') && arg !== '-') throw new SceneExportError('INVALID_OPTIONS', 'Unsupported CLI option.');
    if (file !== undefined) throw new SceneExportError('INVALID_OPTIONS', 'Provide one JSON file or stdin.');
    file = arg;
  }
  const input = file === undefined || file === '-' ? process.stdin : createReadStream(file);
  const chunks: Buffer[] = []; let bytes = 0;
  try {
    for await (const chunk of input) {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += b.length;
      if (bytes > 2_097_152) throw new SceneExportError('INPUT_TOO_LARGE', 'JSON input exceeds 2 MiB.');
      chunks.push(b);
    }
  } catch (error) {
    if (error instanceof SceneExportError) throw error;
    throw new SceneExportError('INVALID_INPUT', 'Could not read JSON input.');
  }
  let scene: unknown;
  try { scene = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, bytes))); }
  catch { throw new SceneExportError('INVALID_JSON', 'Input must be valid UTF-8 JSON.'); }
  process.stdout.write((model ? toDrawioModel : toDrawioXml)(scene, { pageName }) + '\n');
}
main().catch((error: unknown) => {
  process.stderr.write(error instanceof SceneExportError ? `${error.code}: ${error.message}\n` : 'UNEXPECTED_ERROR: Export failed.\n');
  process.exitCode = 2;
});
