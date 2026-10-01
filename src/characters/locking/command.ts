import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { STAND } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const LOCKING_COMMAND: MoveDef[] = [
  /** 6HP 엉클 샘 포인트: 몸을 숙이며 반대 어깨에서 한 손가락으로 길게 가리킨다 */
  strike({
    id: 'longPoint',
    name: '엉클 샘 포인트',
    desc: '몸을 숙이며 길게 찌르는 빠른 견제기',
    base: STAND,
    windup: pose(STAND, { torso: -5, aF: [40, 120] }),
    hit: pose(STAND, { torso: 30, aF: [95, 0], aB: [30, 90], lF: [55, -35], lB: [-25, -5] }),
    startup: 7,
    active: 3,
    recovery: 13,
    box: { x: 30, y: 118, w: 120, h: 24 },
    damage: 55,
    cancel: true,
  }),
];
