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
    // 한 팔을 머리 뒤로 젖혔다가 (공 던지기 자세) 위에서 아래로 내리꽂는다
    windup: pose(STAND, { torso: -15, head: -5, aF: [-150, 40], aB: [70, 80], lF: [40, -30] }),
    hit: pose(STAND, { torso: 45, head: 10, aF: [55, 0], aB: [-25, 60], lF: [48, -48] }),
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
