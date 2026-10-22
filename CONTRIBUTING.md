# Contributing

Use Node.js 22+. Run npm ci --ignore-scripts, npm run check and npm run test:package.
For browser checks, build then run npm run demo and open /tests/browser.html.

Use small synthetic scenes in issues and tests. Do not post user diagrams,
credentials, signed URLs or internal service results. Include the editor version
and expected topology when reporting import/rendering problems.

New style/shape support needs validation, an independent structural test and an
editor import check. Keep labels as plain text. Do not introduce arbitrary HTML,
style-string passthrough, network calls or business-specific metadata.

Contributions are under the project's MIT license. The editor itself is not bundled.
