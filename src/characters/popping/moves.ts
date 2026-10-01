import { pose } from '../../anim/pose';
import { airStrike, combo, moveTable, shooter, strike } from '../builders';
import { CROUCH, POP, ROBO_A, ROBO_B, STAND, TUT_C, WAVE_1, WAVE_RELEASE, WIN } from './poses';

// ── 기본기: 뻣뻣한 로봇 동작과 순간적인 팝 ──────────────────────────────

const sLP = strike({
  id: 'sLP',
  name: '팝 잽',
  base: STAND,
  hit: pose(STAND, { aF: [90, 0] }),
  startup: 5,
  active: 3,
  recovery: 7,
  box: { x: 20, y: 115, w: 70, h: 26 },
  damage: 28,
  cancel: true,
  chain: ['sLP', 'cLP'],
});

const sHP = strike({
  id: 'sHP',
  name: '튜팅 암',
  base: STAND,
  // 튜팅: 팔을 직각으로 접어 상자 모양을 만든 뒤, 각을 유지한 채 앞으로 밀어낸다
  windup: pose(STAND, { aF: [0, 90], aB: [90, 90] }),
  hit: pose(STAND, { torso: 10, aF: [90, 90], aB: [0, 90] }),
  startup: 9,
  active: 4,
  recovery: 15,
  // 팔을 뻗는 끝에서 팝 → 팔 끝에서 전기가 튀어 나가 멀리까지 닿는다
  box: { x: 20, y: 105, w: 120, h: 50 },
  damage: 78,
  cancel: true,
  more: { hitFx: 'electric' },
});

const sLK = strike({
  id: 'sLK',
  name: '킥 팝',
  base: STAND,
  hit: pose(STAND, { lF: [80, 0] }),
  startup: 6,
  active: 3,
  recovery: 10,
  box: { x: 25, y: 60, w: 80, h: 30 },
  damage: 38,
  cancel: true,
});

const sHK = strike({
  id: 'sHK',
  name: '부갈루 킥',
  base: STAND,
  windup: pose(STAND, { torso: -10, lF: [80, -100] }),
  hit: pose(STAND, { torso: -25, lF: [115, 0], aF: [40, 90], aB: [-30, 90] }),
  startup: 10,
  active: 4,
  recovery: 17,
  box: { x: 25, y: 105, w: 95, h: 40 },
  damage: 85,
  extra: { push: 12 },
});

const cLP = strike({
  id: 'cLP',
  name: '로우 팝',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 32, aF: [90, 0] }),
  startup: 4,
  active: 2,
  recovery: 7,
  box: { x: 20, y: 60, w: 68, h: 24 },
  damage: 22,
  cancel: true,
  chain: ['cLP', 'cLK'],
  more: { hurtbox: { x: -30, y: 0, w: 62, h: 112 } },
});

const cHP = strike({
  id: 'cHP',
  name: '업 튜트',
  base: CROUCH,
  hit: pose(STAND, { torso: -5, aF: [180, 0], aB: [90, 90] }),
  end: CROUCH,
  startup: 8,
  active: 5,
  recovery: 18,
  box: { x: 5, y: 100, w: 62, h: 115 },
  damage: 70,
  extra: { launch: { vx: 1.5, vy: 12 } },
  cancel: true,
});

const cLK = strike({
  id: 'cLK',
  name: '토 팝',
  base: CROUCH,
  hit: pose(CROUCH, { lF: [88, 0] }),
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
  name: '고 로우 스윕',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 55, aF: [55, 0], aB: [90, 90], lF: [92, 0], lB: [40, -130] }),
  startup: 9,
  active: 5,
  recovery: 20,
  box: { x: 10, y: 0, w: 118, h: 28 },
  damage: 75,
  extra: { level: 'low', knockdown: true },
  more: { hurtbox: { x: -30, y: 0, w: 70, h: 90 } },
});

const jL = airStrike({
  id: 'jL',
  name: '에어 팝',
  hit: { torso: 10, aF: [70, 0] },
  startup: 4,
  active: 8,
  box: { x: 15, y: 40, w: 72, h: 40 },
  damage: 45,
});

const jH = airStrike({
  id: 'jH',
  name: '에어 로봇',
  hit: { torso: 20, aF: [45, 0], aB: [35, 0], lF: [60, -40] },
  startup: 6,
  active: 8,
  box: { x: 10, y: 5, w: 80, h: 60 },
  damage: 76,
});

// ── 필살기 ─────────────────────────────────────────────────────────

const wave = shooter({
  id: 'wave',
  name: '웨이브',
  desc: '몸에서 팔끝으로 흘려보낸 파동이 그대로 날아간다',
  base: STAND,
  windup: WAVE_1,
  release: WAVE_RELEASE,
  frame: 14,
  recovery: 28,
  projectile: {
    x: 70,
    y: 120,
    vx: 7,
    life: 75,
    box: { x: -20, y: -15, w: 40, h: 30 },
    kind: 'wave',
    hit: { damage: 55, hitstun: 19, blockstun: 15, level: 'mid', chip: 6 },
  },
});

/** 팝 샷: 팔을 뻗으며 팝 하면 그 충격이 작고 빠른 전기탄이 되어 날아간다. 빈틈이 적은 기본 견제 */
const popShot = shooter({
  id: 'popShot',
  name: '팝 샷',
  desc: '팔을 뻗으며 팝 하면 작고 빠른 전기탄이 날아간다. 빈틈이 적은 기본 견제',
  base: STAND,
  windup: pose(POP, { aF: [40, 120] }),
  release: pose(POP, { torso: 8, aF: [92, 0], aB: [10, 100] }),
  frame: 9,
  recovery: 18,
  projectile: {
    x: 75,
    y: 115,
    vx: 11,
    life: 45,
    box: { x: -14, y: -10, w: 28, h: 20 },
    kind: 'bolt',
    hit: { damage: 35, hitstun: 16, blockstun: 10, level: 'mid', chip: 3 },
  },
});

/** 슬로 웨이브: 몸 전체를 타고 흐르는 느린 웨이브. 느리게 날아가서 뒤에서 따라 들어갈 수 있다 */
const slowWave = shooter({
  id: 'slowWave',
  name: '슬로 웨이브',
  desc: '몸 전체를 타고 흐르는 느린 웨이브. 장풍 뒤를 따라 들어가기 좋다',
  base: STAND,
  windup: WAVE_1,
  release: WAVE_RELEASE,
  frame: 18,
  recovery: 26,
  projectile: {
    x: 70,
    y: 110,
    vx: 3.5,
    life: 160,
    box: { x: -24, y: -18, w: 48, h: 36 },
    kind: 'wave',
    hit: { damage: 50, hitstun: 20, blockstun: 16, level: 'mid', chip: 5 },
  },
});

const robot = combo({
  id: 'robot',
  name: '로봇',
  desc: '뻣뻣한 로봇 동작으로 3연타. 도중에 한 번은 맞아도 멈추지 않는다(아머)',
  base: STAND,
  poses: [ROBO_A, ROBO_B],
  start: 10,
  interval: 9,
  count: 2,
  box: { x: 15, y: 100, w: 85, h: 45 },
  damage: 30,
  finish: { pose: pose(ROBO_A, { torso: 15, aF: [92, 0], aB: [80, 0] }), delay: 9, damage: 55 },
  recovery: 18,
  more: { armor: [1, 30] },
});

const popUpper = strike({
  id: 'popUpper',
  name: '팝 어퍼',
  kind: 'special',
  desc: '대공기. 팔을 튕기듯 뻗어 올린다. 발동 직후 무적',
  base: CROUCH,
  hit: pose(STAND, { lift: 20, torso: -5, aF: [180, 0], aB: [90, -90] }),
  end: CROUCH,
  startup: 5,
  active: 6,
  recovery: 24,
  box: { x: -10, y: 100, w: 85, h: 130 },
  damage: 90,
  extra: { launch: { vx: 1.5, vy: 12 }, knockdown: true, chip: 8 },
  more: { invuln: [1, 7] },
});

// ── 초필살기 ───────────────────────────────────────────────────────

const electricBoogaloo = combo({
  id: 'electricBoogaloo',
  name: '일렉트릭 부갈루',
  kind: 'super',
  desc: '잔상 대시로 파고들어 팝 6연타, 마지막은 긴 웨이브 타격',
  base: STAND,
  windup: WAVE_1,
  poses: [ROBO_A, POP, ROBO_B, TUT_C],
  start: 8,
  interval: 5,
  count: 6,
  box: { x: 10, y: 60, w: 100, h: 110 },
  damage: 30,
  finish: {
    pose: pose(WAVE_RELEASE, { torso: 20 }),
    delay: 9,
    damage: 150,
    box: { x: 20, y: 80, w: 170, h: 80 },
    extra: { launch: { vx: 6, vy: 12 }, hitstop: 18, heavy: true },
  },
  recovery: 26,
  end: WIN,
  more: { velocity: [{ from: 3, to: 10, vx: 10 }], trail: true },
});

export const POPPING_MOVES = moveTable([
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
  wave,
  popShot,
  slowWave,
  robot,
  popUpper,
  electricBoogaloo,
]);
