import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { CROUCH } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const HOUSE_COMMAND: MoveDef[] = [
  /** 3LK 힐 토 슬라이드: 뒤꿈치·발끝으로 미끄러지며 낮게 찬다 (하단) */
  strike({
    id: 'heelToe',
    name: '힐 토 슬라이드',
    desc: '미끄러지며 낮게 차고 들어가는 하단',
    base: CROUCH,
    hit: pose(CROUCH, { torso: -10, lF: [88, -5], lB: [20, -110] }),
    startup: 8,
    active: 4,
    recovery: 14,
    box: { x: 20, y: 0, w: 95, h: 30 },
    damage: 45,
    extra: { level: 'low' },
    cancel: true,
    more: { velocity: [{ from: 2, to: 12, vx: 5 }], hurtbox: { x: -30, y: 0, w: 62, h: 90 } },
  }),
];
