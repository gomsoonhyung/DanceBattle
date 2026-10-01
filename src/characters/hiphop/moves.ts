import { pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { airStrike, combo, hit, moveTable, strike } from '../builders';
import { COOL, CROUCH, DOWN, ROGER, RUN_A, RUN_B, STAND } from './poses';

// ── 기본기: 바운스를 타며 내지르는 스트리트 스타일 ─────────────────────

const sLP = strike({
  id: 'sLP',
  name: '바운스 잽',
  base: STAND,
  hit: pose(DOWN, { torso: 22, aF: [90, 5] }),
  startup: 5,
  active: 3,
  recovery: 7,
  box: { x: 20, y: 105, w: 65, h: 28 },
  damage: 30,
  cancel: true,
  chain: ['sLP', 'cLP'],
});

const sHP = strike({
  id: 'sHP',
  name: '할렘 훅',
  base: STAND,
  windup: pose(STAND, { torso: -10, aF: [-40, 60] }),
  hit: pose(DOWN, { torso: 30, aF: [90, 40], aB: [-10, 70] }),
  startup: 9,
  active: 4,
  recovery: 15,
  box: { x: 20, y: 100, w: 80, h: 50 },
  damage: 80,
  cancel: true,
});

const sLK = strike({
  id: 'sLK',
  name: '킥 스텝',
  base: STAND,
  hit: pose(STAND, { torso: 0, lF: [75, -10], aF: [-20, 70], aB: [50, 70] }),
  startup: 6,
  active: 3,
  recovery: 10,
  box: { x: 25, y: 50, w: 78, h: 32 },
  damage: 40,
  cancel: true,
});

const sHK = strike({
  id: 'sHK',
  name: '스웨그 킥',
  base: STAND,
  windup: pose(STAND, { lF: [90, -110] }),
  hit: pose(STAND, { torso: -30, lF: [100, 0], aF: [20, 60], aB: [-40, 40] }),
  startup: 10,
  active: 4,
  recovery: 17,
  box: { x: 30, y: 90, w: 95, h: 40 },
  damage: 90,
  extra: { push: 12 },
});

const cLP = strike({
  id: 'cLP',
  name: '로우 잽',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 42, aF: [98, 3] }),
  startup: 5,
  active: 2,
  recovery: 7,
  box: { x: 20, y: 58, w: 62, h: 26 },
  damage: 25,
  cancel: true,
  chain: ['cLP', 'cLK'],
  more: { hurtbox: { x: -30, y: 0, w: 62, h: 112 } },
});

const cHP = strike({
  id: 'cHP',
  name: '업 바운스',
  base: CROUCH,
  windup: pose(CROUCH, { aF: [-10, 50] }),
  hit: pose(STAND, { torso: -12, aF: [172, -5], lF: [15, -10] }),
  end: CROUCH,
  startup: 8,
  active: 5,
  recovery: 19,
  box: { x: 5, y: 95, w: 68, h: 112 },
  damage: 72,
  extra: { launch: { vx: 1.5, vy: 12 } },
  cancel: true,
});

const cLK = strike({
  id: 'cLK',
  name: '크립 스텝',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 30, lF: [85, -10] }),
  startup: 6,
  active: 3,
  recovery: 8,
  box: { x: 20, y: 0, w: 78, h: 28 },
  damage: 32,
  extra: { level: 'low' },
  cancel: true,
  chain: ['cLP', 'cLK'],
});

const cHK = strike({
  id: 'cHK',
  name: '슬라이드 스윕',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 55, aF: [55, 0], lF: [92, 0], lB: [40, -130] }),
  startup: 10,
  active: 5,
  recovery: 20,
  box: { x: 15, y: 0, w: 112, h: 28 },
  damage: 80,
  extra: { level: 'low', knockdown: true },
  more: { hurtbox: { x: -30, y: 0, w: 70, h: 90 } },
});

const jL = airStrike({
  id: 'jL',
  name: '에어 니',
  hit: { torso: 10, lF: [95, -135] },
  startup: 5,
  active: 9,
  box: { x: 10, y: 30, w: 60, h: 50 },
  damage: 50,
});

const jH = airStrike({
  id: 'jH',
  name: '점프 스톰프',
  hit: { torso: 10, lF: [40, 0], lB: [20, -60] },
  startup: 7,
  active: 8,
  box: { x: 5, y: -15, w: 70, h: 60 },
  damage: 85,
});

// ── 필살기 ─────────────────────────────────────────────────────────

const runningManRush = combo({
  id: 'runningManRush',
  name: '러닝맨 러시',
  desc: '러닝맨 스텝으로 달려들어 어깨로 들이받는다. 2타 후 다운',
  base: STAND,
  windup: RUN_B,
  poses: [RUN_A],
  start: 9,
  interval: 8,
  count: 1,
  box: { x: 15, y: 50, w: 75, h: 110 },
  damage: 30,
  finish: { pose: pose(DOWN, { torso: 35, aF: [95, 40], aB: [80, 60] }), delay: 8, damage: 60 },
  recovery: 18,
  more: { velocity: [{ from: 3, to: 20, vx: 6 }] },
});

/** 크리스크로스: 다리를 꼬며 깡충 두 번 뛰어 들어간다. 착지할 때마다 타격, 두 번째는 중단 */
const CROSS = pose(STAND, { torso: 10, lF: [-12, -12], lB: [18, -10], aF: [60, 80], aB: [40, 80] });
const OPEN = pose(STAND, { torso: 10, lF: [35, -25], lB: [-25, -20], aF: [150, 40], aB: [130, 40] });
const crissCross: MoveDef = {
  id: 'crissCross',
  name: '크리스크로스',
  desc: '다리를 꼬며 깡충 두 번 뛰어 들어간다. 두 번째 착지는 중단(서서 막기)',
  kind: 'special',
  total: 44,
  velocity: [{ from: 3, to: 26, vx: 3.5 }],
  anim: {
    snap: false,
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: DOWN },
      { f: 8, p: pose(OPEN, { y: 120 }) },
      { f: 12, p: CROSS },
      { f: 16, p: DOWN },
      { f: 21, p: pose(OPEN, { y: 125 }) },
      { f: 25, p: pose(CROSS, { torso: 25, aF: [80, 20], aB: [60, 30] }) },
      { f: 30, p: DOWN },
      { f: 44, p: STAND },
    ],
  },
  hits: [
    hit([12, 14], { x: 10, y: 0, w: 80, h: 110 }, 40, { push: 2, hitstun: 20, chip: 4 }),
    hit([25, 28], { x: 10, y: 0, w: 85, h: 120 }, 60, { level: 'overhead', knockdown: true, push: 10, chip: 6 }),
  ],
};

/** 더기: 몸을 뒤로 젖히며 머리 위로 손을 쓸어 올린다 (대공) */
const dougie = strike({
  id: 'dougie',
  name: '더기',
  kind: 'special',
  desc: '대공기. 몸을 뒤로 젖히며 머리 위로 손을 쓸어 올린다. 발동 직후 무적',
  base: STAND,
  windup: pose(STAND, { torso: -22, head: 18, aF: [60, 120], aB: [-30, 60], lF: [30, -40] }),
  hit: pose(STAND, { torso: -30, head: 20, aF: [172, 20], aB: [-40, 60], lF: [35, -45], lB: [-10, -30] }),
  startup: 5,
  active: 8,
  recovery: 22,
  box: { x: -10, y: 100, w: 85, h: 125 },
  damage: 95,
  extra: { launch: { vx: 1.5, vy: 12 }, knockdown: true, chip: 8 },
  more: { invuln: [1, 8] },
});

const rogerRabbit: MoveDef = {
  id: 'rogerRabbit',
  name: '로저 래빗',
  kind: 'special',
  desc: '뒤로 튕기듯 물러나며 무적. 착지하면서 앞차기로 반격',
  total: 40,
  invuln: [1, 14],
  velocity: [{ from: 2, to: 14, vx: -6 }],
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 5, p: ROGER },
      { f: 10, p: pose(ROGER, { lF: [-40, -20], lB: [-20, -80] }) },
      { f: 14, p: DOWN },
      { f: 17, p: pose(STAND, { torso: -15, lF: [85, 0], aF: [-20, 60] }) },
      { f: 21, p: pose(STAND, { torso: -15, lF: [85, 0], aF: [-20, 60] }) },
      { f: 40, p: STAND },
    ],
  },
  hits: [hit([18, 21], { x: 20, y: 55, w: 80, h: 40 }, 50)],
};

// ── 초필살기 ───────────────────────────────────────────────────────

const cypherSwag = combo({
  id: 'cypherSwag',
  name: '사이퍼 스웨그',
  kind: 'super',
  desc: '러닝맨으로 파고들며 6연타, 마지막은 양손 훅',
  base: STAND,
  windup: COOL,
  poses: [RUN_A, pose(DOWN, { aF: [90, 40] }), RUN_B, pose(DOWN, { aB: [90, 40] })],
  start: 8,
  interval: 6,
  count: 6,
  box: { x: 10, y: 40, w: 100, h: 130 },
  damage: 35,
  finish: {
    pose: pose(DOWN, { torso: 40, aF: [95, 0], aB: [90, 0], lF: [45, -45] }),
    delay: 8,
    damage: 150,
    extra: { launch: { vx: 5, vy: 13 }, hitstop: 18, heavy: true },
  },
  recovery: 24,
  end: COOL,
  more: { velocity: [{ from: 4, to: 36, vx: 3.5 }] },
});

export const HIPHOP_MOVES = moveTable([
  sLP,
  crissCross,
  dougie,
  sHP,
  sLK,
  sHK,
  cLP,
  cHP,
  cLK,
  cHK,
  jL,
  jH,
  runningManRush,
  rogerRabbit,
  cypherSwag,
]);
