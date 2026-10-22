# scene-to-drawio

Turn structured scene JSON into **editable Draw.io nodes, text and bound connectors**.
Use it in browsers, Node.js or a command-line pipeline without loading an editor,
a rendering engine or an image-recognition model. No runtime dependencies.

Try the [ready-made synthetic diagram](examples/scene.drawio) or inspect its
[scene JSON](examples/scene.json).

## Browser playground

Try the [live Hugging Face demo](https://huggingface.co/spaces/j-river/scene-to-drawio).

The [static playground source](space/) includes four examples, a schematic SVG
preview, XML inspection and file downloads. Conversion stays in browser memory;
the app has no scene uploads, analytics, storage or remote runtime scripts.

```sh
npm ci --ignore-scripts
npm run build:space
npm run demo:space
```

Open the printed localhost URL. For a Hugging Face Static Space, upload only the
six public files inside `.artifacts/hf-space/`, preserving the `assets/` folder.
See the [Space card](space/README.md) for the deployment steps and preview limits.
The preview is schematic; inspect the exported file in Draw.io for final rendering.

Need to recover a scene from an image first? [EditableImage](https://editableimage.com/)
provides image-to-editable-file workflows, including
[image to Draw.io](https://editableimage.com/image-to-drawio).
This library was prepared for that export workflow; website integration is pending.

## Run from source

**npm publication is pending.** Start with the GitHub source or a locally built
tarball. Node.js 22+ is required for the CLI and development scripts.

```sh
git clone https://github.com/j-river/scene-to-drawio.git
cd scene-to-drawio
npm ci --ignore-scripts
npm run check
node dist/cli.js examples/scene.json > example.drawio
```

Open `example.drawio` in Draw.io / diagrams.net. Nodes and labels are native
cells. Edges reference their source/target node IDs, so the editor can keep
them connected when a node moves.

`npm pack` creates `scene-to-drawio-0.1.0.tgz`. Install that local tarball in
another project with `npm install /path/to/scene-to-drawio-0.1.0.tgz`.
The package includes ESM, CommonJS, type declarations and a standalone browser module.

## API

```js
import { toDrawioXml } from 'scene-to-drawio';

const scene = {
  width: 800,
  height: 500,
  nodes: [
    { id: 'start', x: 80, y: 180, width: 160, height: 80, label: 'Input', shape: 'rounded-rectangle' },
    { id: 'result', x: 480, y: 180, width: 160, height: 80, label: 'Editable output' },
  ],
  edges: [{ id: 'flow', source: 'start', target: 'result', label: 'Convert' }],
};

const xml = toDrawioXml(scene, { pageName: 'Workflow' });
```

In the source checkout, import from `./dist/index.js` after building.
CommonJS: `const { toDrawioXml } = require('scene-to-drawio')`.

| Function | Result |
| --- | --- |
| `validateScene(unknown)` | A fresh, validated scene with `edges` and `texts` arrays; throws on invalid data. |
| `toDrawioXml(scene, options?)` | A deterministic, single-page, uncompressed `<mxfile>` document. |
| `toDrawioModel(scene, options?)` | The same bare `<mxGraphModel>`, for the editor's Edit Diagram dialog. |

The serializer validates every call, does not change the input, and writes no
timestamps, tracking links, embedded website URLs or user-account metadata.

## Scene format

All coordinates and sizes are **pixels**, with the origin at the page's top-left.
No automatic layout or normalization is performed. Geometry is rounded to three
decimal places. Arrays preserve their order within each category; output order
is nodes, standalone texts, then edges.

```ts
interface DiagramScene {
  width: number;
  height: number;
  nodes: SceneNode[];
  edges?: SceneEdge[];
  texts?: SceneText[];
}
```

Use `label` on a node for text that belongs to that node. Use `texts` for separate
positioned text boxes. The library does not guess text ownership from overlap.

| Element | Required | Optional |
| --- | --- | --- |
| Node | `id, x, y, width, height` | `label, shape, fill, stroke, strokeWidth, opacity`, font properties |
| Edge | `id`; endpoints as described below | `source, target, points, label, routing, stroke, strokeWidth, startArrow, endArrow`, font properties |
| Text | `id, x, y, width, height, text` | Font properties |

Shapes: `rectangle` (default), `rounded-rectangle`, `ellipse`, `diamond`, `cylinder`.
Font properties: `fontSize`, `fontFamily`, `fontColor`, `bold`, `align` (`left`,
`center`, `right`). Defaults are Arial 16px, dark text, centered node/edge labels
and left-aligned standalone text. Unspecified label color becomes white on dark
node fills. Node opacity is 0–1 and defaults to 1.

IDs are 1–80 ASCII letters, digits or `_.:-`, unique across all categories. Output
cell IDs are prefixed with `cell_`; reserved Draw.io IDs `0` and `1` are preserved.
Colors accept `#rgb` or `#rrggbb`; fill/stroke additionally accept `none`. Fonts
accept ASCII letters, digits, spaces and `_,.-`. Arbitrary CSS/style strings,
HTML labels, URLs and raster/image elements are outside this schema.

### Connected and floating edges

`source` and `target` must refer to **nodes**, not text boxes or other edges.
If either end is unbound, `points` is required and must include both endpoint
positions. With both ends bound, omitted points default to the node centers.

```js
const edges = [
  { id: 'bound', source: 'a', target: 'b' },
  {
    id: 'routed', source: 'a', target: 'b',
    points: [{ x: 200, y: 100 }, { x: 300, y: 100 }, { x: 300, y: 250 }, { x: 400, y: 250 }],
  },
  { id: 'floating', points: [{ x: 10, y: 20 }, { x: 80, y: 60 }], routing: 'straight' },
];
```

The first/last points describe endpoints; intermediate points become editable
waypoints in their original order. Bound ends use inferred border ports based
on the neighboring route point, clamped away from corners. Center-to-center
self-loops leave port choice to the editor. `routing` defaults to `orthogonal`;
`straight` disables the edge router. The end arrow defaults to on; the start
arrow defaults to off.

Waypoints and ports are routing hints. The editor may reroute around moved
nodes; pixel-identical rendering of a source screenshot is not promised.

### Text and escaping

Labels are **plain text**. The serializer escapes text for the editor's HTML
label layer, inserts its own line breaks, then escapes the XML attribute layer.
Chinese, emoji, ampersands and angle brackets survive without becoming executable
markup. LF, CRLF and CR are displayed as line breaks. All lines in one label use
the same font settings. Actual font rendering depends on the target machine.

This is a restricted serializer, not a sanitizer or importer for arbitrary
Draw.io XML, SVG or HTML. Unknown properties are rejected instead of silently
passing business metadata into a generated document.

## Errors and limits

```js
import { SceneExportError, toDrawioXml } from 'scene-to-drawio';

try {
  toDrawioXml(scene, { maxElements: 500, maxOutputBytes: 1_000_000 });
} catch (error) {
  if (error instanceof SceneExportError) console.error(error.code, error.message);
  else throw error;
}
```

| Bound | Maximum |
| --- | --- |
| Total nodes + edges + texts | 2,000 |
| Points per edge, including endpoints | 128 |
| Each label/text | 8,192 UTF-16 code units |
| Page width/height | 1–100,000 pixels |
| Box width/height | 0.001–100,000 pixels |
| Position / route coordinate | −100,000–100,000 pixels |
| Font size / stroke width | 1–512 / 0–100 pixels |
| Page name | 256 UTF-16 code units |
| Generated XML | 4 MiB UTF-8, including wrappers |
| CLI JSON input | 2 MiB, enforced during stream reading |

`maxElements` and `maxOutputBytes` may lower their hard ceilings. Invalid/nonfinite
geometry, duplicate IDs, unknown references, sparse arrays, accessors, unsupported
fields and invalid XML characters are rejected. The API accepts data objects;
it is not a sandbox for hostile JavaScript proxies or arbitrary executable objects.

Error codes: `INVALID_SCENE`, `INVALID_OPTIONS`, `DUPLICATE_ID`,
`UNKNOWN_REFERENCE`, `INPUT_TOO_LARGE`, `OUTPUT_TOO_LARGE`, `INVALID_INPUT`,
`INVALID_JSON`. The final two also cover CLI file/JSON failures.

## CLI

After local tarball installation, the command is `scene-to-drawio`.

```sh
scene-to-drawio scene.json > diagram.drawio
scene-to-drawio scene.json --page-name Workflow > diagram.drawio
scene-to-drawio scene.json --model > model.xml
```

Omit the file or use `-` to read stdin. Use `--` before a filename beginning with
`-`. XML goes to stdout; diagnostics go to stderr. Exit codes: 0 success, 2 error.
The CLI does not fetch URLs, open editors or overwrite input files. A shell
redirection like `>` writes the destination chosen by the caller.

For manual import into the editor, open its **Edit Diagram** command (under
Extras or Insert → Advanced depending on the UI), paste the bare model from
`--model`, and Apply. Or open the complete `.drawio` file normally.

## Browser example

```sh
npm run build
npm run demo
```

Open `http://127.0.0.1:4179/`, edit JSON, generate XML and download the file.
The example converts locally. Browser checks are at `/tests/browser.html`.
The server exposes only the listed example/test/build files on loopback.

For an application bundler, import from `scene-to-drawio`. For native browser ES
modules, copy `dist/browser.js` to your own assets and import its functions.
The ESM browser subpath is also available as `scene-to-drawio/browser`.
Modern browsers need TextEncoder and ES2022 built-ins.

## Development and scope

```sh
npm ci --ignore-scripts
npm run check
npm run test:package
```

Tests use synthetic JSON scenes and an independent XML parser. They check
topology, geometry, Unicode, plain-text labels, invalid input, injection attempts,
byte limits and the CLI. The package test installs the actual tarball in a
temporary project and checks ESM, CommonJS, browser exports, declarations and CLI.
CI is configured for Node 22/24 on Linux and Windows; refer to its actual runs
for evidence of a passing platform.

This library exports an already structured scene. It does **not** recover an
image, run OCR, infer graph topology, generate a layout, import existing XML,
render a screenshot, export PPTX/PSD, or preserve arbitrary Draw.io extensions.
It performs no network requests, uploads, telemetry or DOM operations.

See [format decisions and verification](docs/format.md),
[contribution guidance](CONTRIBUTING.md) and [the changelog](CHANGELOG.md).

## License

MIT © j-river. Independent project; not an official draw.io / diagrams.net
library and no endorsement is implied. Draw.io editor code is not bundled.
