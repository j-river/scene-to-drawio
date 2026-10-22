import api = require('scene-to-drawio');
const scene: api.DiagramScene = { width: 800, height: 600, nodes: [] };
const output: string = api.toDrawioXml(scene);
const validated: api.ValidatedScene = api.validateScene(scene);
void [output, validated];
