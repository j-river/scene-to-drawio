---
title: Scene to Draw.io
emoji: 🧩
colorFrom: green
colorTo: blue
sdk: static
app_file: index.html
license: mit
short_description: Scene JSON to editable Draw.io diagrams, in your browser.
tags:
  - drawio
  - diagrams
  - typescript
---

# Scene to Draw.io

A browser playground for [scene-to-drawio](https://github.com/j-river/scene-to-drawio).
Edit structured scene JSON, inspect a schematic preview, and download a native,
editable Draw.io file. No model, API key, backend, or paid compute is required.

## What it does

- Exports native shapes, plain text, bound connectors and optional waypoints.
- Includes four synthetic examples: workflow, decisions, routing and floating endpoints.
- Produces a complete `.drawio` file or a bare `mxGraphModel` for the editor.
- Uses the serializer's validation and XML limits. The UI limits input to 2 MiB.
- Handles conversion in browser memory. The app has no analytics, scene uploads,
  local storage or remote scripts. The hosting platform may log page requests.

The SVG preview is schematic, not a Draw.io renderer. Routing, text wrapping and
fonts may differ. Preview labels are limited to four lines and 60 characters per
line; exported labels retain their full content. Scenes over 500 elements still
export, but skip the preview. The serializer supports up to 2,000 total elements.

## Try it

1. Choose an example and click **Load example** (replaces the current JSON).
2. Edit positions, labels or connections and click **Generate diagram**.
3. Download the `.drawio` file.
4. Open it via **File → Open From → Device** at [Draw.io](https://app.diagrams.net/).

Input edits invalidate the export so a stale file cannot be downloaded. Invalid
JSON, unsupported fields and broken node references produce visible errors.

No image recognition or automatic layout is included. If your input is an image,
[EditableImage](https://editableimage.com/image-to-drawio) provides a separate
image-to-editable-diagram workflow. This demo does not send scenes to that site.

## Source and reproduction

MIT licensed. Source, schema and issues:
[j-river/scene-to-drawio](https://github.com/j-river/scene-to-drawio).
From that checkout, run `npm ci --ignore-scripts` and `npm run build:space`.
Upload the contents of `.artifacts/hf-space/` to a **Static** Hugging Face Space.
Only prebuilt public assets are needed; no secrets or build environment variables
are used. `build-info.json` records the library version and source fingerprints.

This package is currently available from GitHub source; npm publication is pending.
