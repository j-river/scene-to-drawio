import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { DOMParser } from '@xmldom/xmldom';
const sample = readFileSync('examples/scene.json');
const run = (args, input) => spawnSync(process.execPath, ['dist/cli.js', ...args], { input, encoding: 'utf8', windowsHide: true, timeout: 15_000, maxBuffer: 8_388_608 });

test('CLI reads a JSON file and emits only parseable XML', () => {
  const result = run(['examples/scene.json']);
  assert.equal(result.status, 0); assert.equal(result.stderr, '');
  assert.equal(new DOMParser().parseFromString(result.stdout, 'application/xml').documentElement.tagName, 'mxfile');
});
test('CLI accepts stdin and a literal dash, preserving Unicode', () => {
  for (const args of [[], ['-']]) {
    const result = run(args, sample); assert.equal(result.status, 0); assert.match(result.stdout, /输入/);
  }
});
test('CLI bare model and page name switches work', () => {
  const model = run(['--model'], sample); assert.equal(model.status, 0); assert.ok(model.stdout.startsWith('<mxGraphModel'));
  const page = run(['--page-name', 'My & Page'], sample);
  assert.match(page.stdout, /name="My &amp; Page"/);
});
test('CLI help and version do not require input', () => {
  assert.equal(run(['--help']).status, 0); assert.equal(run(['--version']).stdout, '0.1.0\n');
});
test('CLI malformed JSON, invalid UTF-8 and invalid scenes use stderr/exit 2', () => {
  for (const input of ['{', Buffer.from([0xff]), '{"width":1}']) {
    const result = run([], input); assert.equal(result.status, 2); assert.equal(result.stdout, '');
    assert.match(result.stderr, /INVALID_JSON|INVALID_SCENE/);
  }
});
test('CLI unknown flags, missing values and extra positional files are errors', () => {
  for (const args of [['--unknown'], ['--page-name'], ['a.json', 'b.json'], ['missing.json']]) {
    const result = run(args); assert.equal(result.status, 2); assert.equal(result.stdout, '');
  }
});
test('CLI enforces input size during reading and never overwrites source files', () => {
  const directory = mkdtempSync(join(tmpdir(), 'scene-cli-'));
  try {
    const file = join(directory, '中文 scene & literal.json');
    writeFileSync(file, sample);
    const result = run([file]); assert.equal(result.status, 0); assert.deepEqual(readFileSync(file), sample);
    const huge = join(directory, 'large.json'); writeFileSync(huge, ' '.repeat(2_097_153));
    const failed = run([huge]); assert.equal(failed.status, 2); assert.match(failed.stderr, /INPUT_TOO_LARGE/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
