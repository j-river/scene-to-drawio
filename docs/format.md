# Format decisions and verification

The output follows the uncompressed draw.io XML structure: an mxfile, a diagram,
and an mxGraphModel containing a root with mandatory cells 0 and 1. Nodes and
standalone texts are vertices; connectors are edges whose source/target refer
to the prefixed node IDs. Every edge has relative geometry. Free endpoints
use mxPoint with sourcePoint/targetPoint roles; interior bends are Array points.

Public inputs describe geometry in pixels. The small explicit schema avoids
depending on a site's entire recognition result and rejects additional fields.
Node labels establish ownership explicitly; there is no spatial text-merging
heuristic. All labels are plain text rendered through a generated HTML label
value, with separate escaping at the HTML and XML layers.

Serialization is deterministic, uses no clock/random IDs, preserves input array
order within each category, and rounds geometry to three decimals. Fixed style
vocabulary and validated hex colors/font values prevent arbitrary style fields
from introducing links, images or scripts. Output documents have no embedded
website promotion links. The repository README and homepage link to EditableImage.

## Automated evidence

- Parse generated XML using the independent @xmldom/xmldom development dependency.
- Assert actual source/target IDs and points, not just string occurrences of arrows.
- Check both XML and HTML decoding for hostile-looking text labels.
- Exercise floating ends, self loops, dark fills, multiline Unicode and route ports.
- Check malformed data and exact UTF-8 output-byte boundaries.
- Install the actual packed artifact and use its public exports and CLI.
- Run the standalone build under a real browser's DOMParser in tests/browser.html.

All examples and tests are authored synthetic data. No personal files,
production diagrams, model responses or user uploads are included.

## Relationship to EditableImage

[EditableImage](https://editableimage.com/) is an integration target. The library
does not include recognition models, provider calls, service credentials,
internal scene fields, payment, storage or account logic. Deployment into the
site is pending. Mapping normalized coordinates and rich per-line styles into
this smaller format belongs in a site adapter. Visual equivalence to all site
exports is not claimed; explicit topology/geometry can be compared separately.

## Scope of compatibility

The output uses a restricted, single-page subset of Draw.io's format. Editor
import and editing smoke tests establish practical compatibility for the supplied
example, not all shapes, plugins or future editor versions. Imported geometry
may be routed differently after edits, and fonts/wrapping depend on the editor.
Unknown fields/styles are errors, not claims of supported round trips.

## Primary sources

- [Official file and style reference](https://www.drawio.com/docs/reference/diagram-generation/style-reference/)
- [Official XML source editing guide](https://www.drawio.com/docs/manual/advanced/diagram-source-edit/)
- [Official file-format notes](https://github.com/jgraph/drawio/wiki/File-Format)

These references describe the target format; this repository's tests and recorded
manual checks define its narrower verified scope. No editor source is copied.
