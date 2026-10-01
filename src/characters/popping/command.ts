import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { STAND } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const POPPING_COMMAND: MoveDef[] = [
  /** 6HP 프레즈노 히트: 옆으로 디디며 같은 쪽 팔을 팝 → 팔 끝에서 전기가 뻗어 나간다 (전기까지 판정) */
  strike({
    id: 'electricPop',
    name: '프레즈노 히트',
    desc: '팔을 팝 하면 팔 끝에서 전기가 뻗어 나간다',
    base: STAND,
    windup: pose(STAND, { torso: -5, aF: [30, 130] }),
    hit: pose(STAND, { torso: 12, aF: [92, 0], aB: [30, 100], lF: [25, -20] }),
    startup: 11,
    active: 4,
    recovery: 16,
    box: { x: 30, y: 105, w: 150, h: 40 },
    damage: 70,
    cancel: true,
    more: { hitFx: 'electric' },
  }),
];
