import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { CROUCH_HAND, CROUCH } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const BBOY_COMMAND: MoveDef[] = [
  /** 3HK 고다운 → CC: 탑록 디딤에서 무릎·손 순서로 내려가, 손을 짚고 한 다리를 내보내는 하단 (id는 예전 그대로) */
  strike({
    id: 'sixStepSweep',
    name: '고다운 CC',
    desc: '탑록에서 바닥으로 내려가며 앞으로 나가, 손을 짚고 다리를 내보내는 하단. 느리지만 멀리 닿고 넘어뜨린다',
    base: CROUCH_HAND,
    windup: pose(CROUCH_HAND, { lF: [-60, -30] }),
    hit: pose(CROUCH_HAND, { lF: [95, 0], lB: [60, -90] }),
    end: CROUCH,
    startup: 22,
    active: 4,
    recovery: 14,
    box: { x: 20, y: 0, w: 115, h: 32 },
    damage: 80,
    extra: { level: 'low', knockdown: true },
    more: { velocity: [{ from: 3, to: 18, vx: 4 }], hurtbox: { x: -30, y: 0, w: 64, h: 90 } },
  }),
];
