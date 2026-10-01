import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { STAND } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const WAACKING_COMMAND: MoveDef[] = [
  /** 6LP 라인: 팔을 아래에서 옆(앞)으로 곧게 뻗어 선을 긋는다. 가장 멀리 닿지만 약하다 */
  strike({
    id: 'longWhip',
    name: '라인',
    desc: '팔을 곧게 뻗어 선을 긋는, 가장 멀리 닿는 견제기',
    base: STAND,
    windup: pose(STAND, { torso: -10, aF: [-80, 40] }),
    hit: pose(STAND, { torso: 18, aF: [96, 0], aB: [-30, 60], lF: [40, -30], lB: [-20, -5] }),
    startup: 8,
    active: 3,
    recovery: 14,
    box: { x: 30, y: 110, w: 140, h: 30 },
    damage: 35,
    cancel: true,
    more: { hitFx: 'whip' },
  }),
];
