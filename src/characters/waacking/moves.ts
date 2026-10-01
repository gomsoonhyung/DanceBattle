import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { airStrike, combo, moveTable, shooter, strike } from '../builders';
import { armW } from '../common';
import { CROUCH, POSE, ROLL_A, ROLL_B, STAND, WHIP_A, WHIP_B } from './poses';

// ── 기본기: 팔을 채찍처럼 쓰는 긴 리치 ────────────────────────────────

const sLP = strike({
  id: 'sLP',
  name: '휩',
  base: STAND,
  windup: pose(STAND, { aF: [178, -20] }),
  hit: pose(STAND, { torso: 10, aF: [88, 5] }),
  startup: 5,
  active: 3,
  recovery: 7,
  box: { x: 20, y: 110, w: 82, h: 40 },
  damage: 28,
  cancel: true,
  chain: ['sLP', 'cLP'],
});

const sHP = strike({
  id: 'sHP',
  name: '오버헤드 왁',
  base: STAND,
  windup: pose(STAND, { torso: -8, aF: [172, -40], aB: [165, -40] }),
  hit: pose(STAND, { torso: 20, aF: [95, 0], aB: [80, 10] }),
  startup: 9,
  active: 4,
  recovery: 15,
  box: { x: 20, y: 100, w: 95, h: 55 },
  damage: 75,
  cancel: true,
});

const sLK = strike({
  id: 'sLK',
  name: '포즈 킥',
  base: STAND,
  hit: pose(POSE, { torso: -10, lF: [80, -5] }),
  startup: 6,
  active: 3,
  recovery: 10,
  box: { x: 25, y: 65, w: 80, h: 30 },
  damage: 38,
  cancel: true,
});

const sHK = strike({
  id: 'sHK',
  name: '트월 킥',
  base: STAND,
  // 두 팔을 펴고 한 바퀴 돈 뒤(트월) 다리를 높이 뻗는다
  windup: pose(STAND, { torso: -10, aF: [90, 0], aB: [-90, 0], lF: [60, -90] }),
  hit: pose(STAND, { torso: -30, head: 15, lF: [122, 0], aF: [-40, 0], aB: [-60, 10] }),
  startup: 10,
  active: 4,
  recovery: 17,
  box: { x: 25, y: 115, w: 95, h: 45 },
  damage: 85,
  extra: { push: 12 },
});

const cLP = strike({
  id: 'cLP',
  name: '로우 휩',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 35, aF: [95, 0] }),
  startup: 4,
  active: 2,
  recovery: 7,
  box: { x: 20, y: 55, w: 72, h: 26 },
  damage: 22,
  cancel: true,
  chain: ['cLP', 'cLK', 'sLP'],
  more: { hurtbox: { x: -30, y: 0, w: 62, h: 112 } },
});

const cHP = strike({
  id: 'cHP',
  name: '언더헤드 왁',
  base: CROUCH,
  windup: pose(CROUCH, { aF: [40, 60] }),
  hit: pose(STAND, { torso: -10, head: 15, aF: [178, 0], aB: [-25, 85] }),
  end: CROUCH,
  startup: 8,
  active: 5,
  recovery: 18,
  box: { x: 5, y: 100, w: 65, h: 115 },
  damage: 70,
  extra: { launch: { vx: 1.5, vy: 12 } },
  cancel: true,
});

const cLK = strike({
  id: 'cLK',
  name: '로우 탭',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 20, lF: [88, -5] }),
  startup: 5,
  active: 3,
  recovery: 8,
  box: { x: 20, y: 0, w: 80, h: 26 },
  damage: 30,
  extra: { level: 'low' },
  cancel: true,
  chain: ['cLP', 'cLK'],
});

const cHK = strike({
  id: 'cHK',
  name: '딥 스윕',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 50, aF: [armW(0, 0, 50), 0], aB: [175, 0], lF: [92, 0], lB: [40, -130] }),
  startup: 9,
  active: 5,
  recovery: 20,
  box: { x: 10, y: 0, w: 120, h: 28 },
  damage: 75,
  extra: { level: 'low', knockdown: true },
  more: { hurtbox: { x: -30, y: 0, w: 70, h: 95 } },
});

const jL = airStrike({
  id: 'jL',
  name: '에어 휩',
  hit: { torso: 15, aF: [70, 0] },
  startup: 4,
  active: 8,
  box: { x: 15, y: 40, w: 72, h: 45 },
  damage: 45,
});

const jH = airStrike({
  id: 'jH',
  name: '에어 더블 휩',
  hit: { torso: 25, aF: [60, 0], aB: [50, 10] },
  startup: 6,
  active: 8,
  box: { x: 15, y: 10, w: 82, h: 60 },
  damage: 75,
});

// ── 필살기 ─────────────────────────────────────────────────────────

const highWhip = strike({
  id: 'highWhip',
  name: '오버헤드 롤',
  kind: 'special',
  desc: '대공기. 양팔을 머리 위로 휘감아 올린다. 발동 직후 무적',
  base: CROUCH,
  hit: pose(STAND, { lift: 20, torso: -5, head: 15, aF: [180, 0], aB: [165, 20] }),
  startup: 5,
  active: 8,
  recovery: 24,
  box: { x: -20, y: 100, w: 100, h: 130 },
  damage: 95,
  extra: { launch: { vx: 1.5, vy: 12 }, knockdown: true, chip: 8 },
  more: { invuln: [1, 7] },
});

const strikeAPose: MoveDef = {
  id: 'strikeAPose',
  name: '포즈',
  kind: 'special',
  desc: '멈춰 서서 포즈! 공격은 없지만 그루브 게이지가 크게 찬다',
  total: 40,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 8, p: POSE },
      { f: 32, p: POSE },
      { f: 40, p: STAND },
    ],
  },
  hits: [],
  meterGain: { frame: 12, amount: 30 },
};

// ── 초필살기 ───────────────────────────────────────────────────────

/** 왁 포즈 웨이브: 팔을 휩으로 휘두르다 포즈로 딱 멈추는 순간, 그 기세가 파동이 되어 날아간다 */
const poseWave = shooter({
  id: 'poseWave',
  name: '왁 포즈 웨이브',
  desc: '휩을 휘두르다 포즈로 멈추는 순간 파동이 날아간다',
  base: STAND,
  windup: WHIP_B,
  release: pose(STAND, { torso: -6, head: 15, aF: [100, 0], aB: [175, -150], lF: [25, -5], lB: [-8, -20] }),
  frame: 14,
  recovery: 24,
  projectile: {
    x: 70,
    y: 120,
    vx: 7.5,
    life: 70,
    box: { x: -18, y: -30, w: 36, h: 60 },
    kind: 'arc',
    hit: { damage: 55, hitstun: 19, blockstun: 15, level: 'mid', chip: 6 },
  },
});

/** 트월: 두 팔을 펴고 빙글빙글 돌며 전진한다. 펼친 팔이 앞뒤를 모두 친다 */
const twirl = combo({
  id: 'twirl',
  name: '트월',
  desc: '두 팔을 펴고 돌며 전진하는 다단. 펼친 팔이 앞뒤를 모두 친다',
  base: STAND,
  windup: pose(STAND, { torso: -5, aF: [140, 20], aB: [-60, 20] }),
  poses: [
    pose(STAND, { torso: 0, head: 10, aF: [90, 0], aB: [-90, 0], lF: [10, -5], lB: [-5, -30] }),
    pose(STAND, { torso: 0, head: -10, aF: [-90, 0], aB: [90, 0], lF: [-5, -30], lB: [10, -5] }),
  ],
  start: 8,
  interval: 6,
  count: 3,
  box: { x: -70, y: 90, w: 170, h: 60 },
  damage: 25,
  finish: { pose: POSE, delay: 8, damage: 45, box: { x: 10, y: 90, w: 100, h: 70 } },
  recovery: 18,
  more: { velocity: [{ from: 4, to: 26, vx: 2.5 }] },
});

const divaFinale = combo({
  id: 'divaFinale',
  name: '디바 피날레',
  kind: 'super',
  desc: '8연속 휩에 이어 머리 위에서 내려치는 마무리',
  base: STAND,
  windup: ROLL_B,
  poses: [WHIP_A, ROLL_B, WHIP_B, ROLL_A],
  start: 8,
  interval: 4,
  count: 8,
  box: { x: 10, y: 80, w: 105, h: 90 },
  damage: 30,
  finish: {
    pose: pose(WHIP_A, { torso: 35, aF: [100, 0], aB: [95, 0], lF: [40, -40] }),
    delay: 8,
    damage: 140,
    extra: { launch: { vx: 5, vy: 12 }, hitstop: 18, heavy: true },
  },
  recovery: 26,
  end: POSE,
  more: { velocity: [{ from: 6, to: 30, vx: 2 }] },
});

export const WAACKING_MOVES = moveTable([
  sLP,
  poseWave,
  twirl,
  sHP,
  sLK,
  sHK,
  cLP,
  cHP,
  cLK,
  cHK,
  jL,
  jH,
  highWhip,
  strikeAPose,
  divaFinale,
]);
