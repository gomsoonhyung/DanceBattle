import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { airStrike, combo, moveTable, strike } from '../builders';
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
  name: '더블 휩',
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
  name: '하이 휩 킥',
  base: STAND,
  windup: pose(STAND, { lF: [100, -110], aF: [175, 0] }),
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
  name: '업 휩',
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

const whipStorm = combo({
  id: 'whipStorm',
  name: '휩 스톰',
  desc: '양팔을 번갈아 휘두르는 5연타. 마지막 타격에 다운',
  base: STAND,
  windup: ROLL_A,
  poses: [WHIP_A, WHIP_B],
  start: 7,
  interval: 5,
  count: 5,
  box: { x: 15, y: 90, w: 95, h: 70 },
  damage: 20,
  finish: { pose: pose(WHIP_A, { torso: 25, aF: [90, 0], aB: [80, 0] }), delay: 6, damage: 40 },
  recovery: 16,
  more: { velocity: [{ from: 6, to: 28, vx: 1.5 }] },
});

const highWhip = strike({
  id: 'highWhip',
  name: '하이 휩',
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

const waackWalk = combo({
  id: 'waackWalk',
  name: '왁킹 워크',
  desc: '팔을 휘두르며 빠르게 걸어 들어간다. 2연타 후 다운',
  base: STAND,
  poses: [pose(WHIP_A, { lF: [35, -20], lB: [-15, -5] }), pose(WHIP_B, { lB: [30, -30], lF: [-5, -5] })],
  start: 8,
  interval: 7,
  count: 1,
  box: { x: 15, y: 80, w: 85, h: 80 },
  damage: 30,
  finish: { pose: pose(WHIP_B, { torso: 20, lB: [30, -30] }), delay: 7, damage: 50 },
  recovery: 18,
  more: { velocity: [{ from: 3, to: 18, vx: 7 }] },
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
  sHP,
  sLK,
  sHK,
  cLP,
  cHP,
  cLK,
  cHK,
  jL,
  jH,
  whipStorm,
  highWhip,
  waackWalk,
  strikeAPose,
  divaFinale,
]);
