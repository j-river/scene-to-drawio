import { toDrawioXml, toDrawioModel, validateScene, SceneExportError } from 'scene-to-drawio';
import { toDrawioXml as browserExport } from 'scene-to-drawio/browser';
import type { DiagramScene, ValidatedScene, SceneErrorCode } from 'scene-to-drawio';
const scene: DiagramScene = { width: 800, height: 600, nodes: [] };
const validated: ValidatedScene = validateScene(scene);
const output: string = toDrawioXml(validated);
const code: SceneErrorCode = new SceneExportError('INVALID_SCENE', 'invalid').code;
void [output, code, toDrawioModel(scene), browserExport(scene)];
