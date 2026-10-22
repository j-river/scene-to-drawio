import { SceneExportError, toDrawioModel, toDrawioXml, validateScene } from '../src/index.js';
import { samples } from './samples.js';
import { renderPreview } from './preview.js';
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = byId<HTMLTextAreaElement>('input'), output = byId<HTMLTextAreaElement>('output');
const mode = byId<HTMLSelectElement>('mode'), sample = byId<HTMLSelectElement>('sample');
const download = byId<HTMLButtonElement>('download'), copy = byId<HTMLButtonElement>('copy');
const status = byId('status'), badge = byId('badge'), stats = byId('stats'), preview = byId('preview');
const encoder = new TextEncoder();
let generated = '';
function message(text: string, error = false) { status.textContent = text; status.dataset.error = String(error); }
function clearOutput(state: 'dirty' | 'error') {
  generated = ''; output.value = ''; stats.textContent = ''; download.disabled = copy.disabled = true;
  badge.textContent = state === 'dirty' ? 'Needs generation' : 'Check input'; badge.dataset.state = state;
  const note = document.createElement('p'); note.textContent = state === 'dirty' ? 'Generate a diagram to preview your current scene.' : 'Fix the input, then generate again.'; preview.replaceChildren(note);
}
function parseInput(): unknown {
  if (encoder.encode(input.value).byteLength > 2 * 1024 * 1024) throw new SceneExportError('INPUT_TOO_LARGE', 'Scene JSON exceeds the 2 MiB input limit.');
  try { return JSON.parse(input.value); } catch { throw new SceneExportError('INVALID_JSON', 'Enter valid JSON. Check quotes, commas and brackets.'); }
}
function generate() {
  clearOutput('dirty');
  try {
    const scene = validateScene(parseInput());
    const xml = mode.value === 'model' ? toDrawioModel(scene) : toDrawioXml(scene);
    renderPreview(preview, scene); generated = xml; output.value = xml;
    stats.textContent = `${scene.nodes.length} nodes · ${scene.edges.length} connectors · ${scene.texts.length} text boxes · ${encoder.encode(xml).byteLength.toLocaleString('en')} XML bytes`;
    badge.textContent = 'Generated'; badge.dataset.state = 'ready'; download.disabled = copy.disabled = false;
    download.textContent = mode.value === 'model' ? 'Download .xml' : 'Download .drawio';
    message(mode.value === 'model' ? 'Graph model ready. Paste it into Extras → Edit Diagram in Draw.io.' : 'Your editable file is ready. Download and open it in Draw.io.');
  } catch (error) {
    clearOutput('error'); message(error instanceof SceneExportError ? `${error.code}: ${error.message}` : 'Could not generate the diagram. Check your input and try again.', true);
  }
}
function loadExample() { input.value = JSON.stringify(samples[sample.value] ?? samples.flow, null, 2); generate(); }
input.addEventListener('input', () => { clearOutput('dirty'); message('Input changed. Generate again to update your export.'); });
mode.addEventListener('change', () => { clearOutput('dirty'); message('Format changed. Generate again to update your export.'); });
byId('generate').addEventListener('click', generate);
byId('load').addEventListener('click', loadExample);
byId('format').addEventListener('click', () => {
  try { const value = parseInput(); input.value = JSON.stringify(value, null, 2); clearOutput('dirty'); message('JSON formatted. Generate again to update your export.'); }
  catch (error) { clearOutput('error'); message(error instanceof Error ? error.message : 'Could not format JSON.', true); }
});
copy.addEventListener('click', async () => {
  if (!generated) return;
  const current = generated;
  try { await navigator.clipboard.writeText(current); if (generated === current) message('XML copied to your clipboard.'); }
  catch { if (generated === current) { (output.closest('details') as HTMLDetailsElement).open = true; output.focus(); output.select(); message('Clipboard access is unavailable. The XML is selected; use your keyboard to copy it.'); } }
});
download.addEventListener('click', () => {
  if (!generated) return;
  const blob = new Blob([generated], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url;
  link.download = mode.value === 'model' ? 'scene-model.xml' : 'scene.drawio'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000); message('Download requested. Open the file in Draw.io to continue editing.');
});
loadExample();
