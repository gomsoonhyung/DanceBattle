import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { strike } from '../builders';
import { STAND } from './poses';

/** 특수기 (방향 + 버튼). docs/design/GAME_DESIGN.md 3장 */
export const GIRLS_HIPHOP_COMMAND: MoveDef[] = [
  /** 6HK 힐 드롭: 다리를 머리 위까지 들었다가 내리찍는 중단 */
  strike({
    id: 'heelDrop',
    name: '힐 드롭',
    desc: '다리를 높이 들었다가 내리찍는 중단',
    base: STAND,
    windup: pose(STAND, { torso: -15, lF: [175, 0] }),
    hit: pose(STAND, { torso: 25, lF: [70, 0] }),
    startup: 20,
    active: 3,
    recovery: 14,
    box: { x: 30, y: 40, w: 75, h: 120 },
    damage: 75,
    extra: { level: 'overhead' },
    cancel: true,
  }),
];
