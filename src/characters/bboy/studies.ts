import { studyApplier, type StudyData } from '../studies';
import { CROUCH_HAND, FREEZE, STAND } from './poses';
import data from './studies.json';

// 비보이: Codex 브레이킹 모션 연구 (scripts/spritegen/import_bboy_studies.py)
const apply = studyApplier(data as StudyData, { stand: STAND, low: CROUCH_HAND, power: FREEZE });
export const withStudyMoves = apply.moves;
export const withStudyAnims = apply.anims;
