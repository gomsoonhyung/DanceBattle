import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { STAND } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const HIPHOP_COMMAND: MoveDef[] = [
  /** 6LK 바운스 스텝: 바운스를 타며 앞으로 한 발 나가며 찬다 */
  strike({
    id: 'bounceStep',
    name: '바운스 스텝',
    desc: '바운스를 타며 앞으로 나가는 중거리 킥',
    base: STAND,
    windup: pose(STAND, { torso: -5, lF: [60, -90] }),
    hit: pose(STAND, { torso: 5, lF: [85, -5], aF: [60, 90], aB: [20, 90] }),
    startup: 9,
    active: 3,
    recovery: 12,
    box: { x: 25, y: 45, w: 85, h: 35 },
    damage: 50,
    cancel: true,
    more: { velocity: [{ from: 1, to: 10, vx: 4 }] },
  }),
];
