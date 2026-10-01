import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { STAND } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const KRUMP_COMMAND: MoveDef[] = [
  /** 6HP 피치 스윙: 공을 던지듯 팔을 머리 뒤에서 위로 돌려 내리꽂는 중단. 느리지만 아머로 버틴다 */
  strike({
    id: 'hammerSwing',
    name: '피치 스윙',
    desc: '공을 던지듯 팔을 위에서 내리꽂는 중단. 느리지만 아머로 버틴다',
    base: STAND,
    windup: pose(STAND, { torso: -12, head: -5, aF: [175, 15], aB: [165, 20] }),
    hit: pose(STAND, { torso: 42, head: 10, aF: [70, 5], aB: [60, 10], lF: [45, -45] }),
    startup: 18,
    active: 3,
    recovery: 18,
    box: { x: 20, y: 50, w: 85, h: 120 },
    damage: 110,
    extra: { level: 'overhead' },
    cancel: true,
    more: { armor: [6, 17] },
  }),
];
