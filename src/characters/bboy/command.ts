import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { CROUCH_HAND, CROUCH } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const BBOY_COMMAND: MoveDef[] = [
  /** 3HK 식스스텝 스윕: 손을 짚고 다리를 한 바퀴 돌린다. 앞뒤 모두 맞는 하단 */
  strike({
    id: 'sixStepSweep',
    name: '식스스텝 스윕',
    desc: '손을 짚고 다리를 한 바퀴 돌리는 하단. 앞뒤 모두 맞는다',
    base: CROUCH_HAND,
    windup: pose(CROUCH_HAND, { lF: [-60, -30] }),
    hit: pose(CROUCH_HAND, { lF: [95, 0], lB: [60, -90] }),
    end: CROUCH,
    startup: 10,
    active: 6,
    recovery: 18,
    box: { x: -90, y: 0, w: 205, h: 32 },
    damage: 70,
    extra: { level: 'low', knockdown: true },
    more: { hurtbox: { x: -30, y: 0, w: 64, h: 90 } },
  }),
];
