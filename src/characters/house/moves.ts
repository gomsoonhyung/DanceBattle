import { pose } from '../../anim/pose';
import { airStrike, combo, moveTable, strike } from '../builders';
import { CROUCH, JACK_A, JACK_B, LOFT_KICK, SHUF_A, SHUF_B, SHUF_LOW_A, SHUF_LOW_B, SLIDE, STAND, WIN } from './poses';

// ── 기본기: 잭킹 상체와 빠른 발 ────────────────────────────────────────

const sLP = strike({
  id: 'sLP',
  name: '잭 잽',
  base: STAND,
  hit: pose(JACK_A, { torso: 25, aF: [90, 10] }),
  startup: 4,
  active: 3,
  recovery: 7,
  box: { x: 20, y: 110, w: 65, h: 28 },
  damage: 26,
  cancel: true,
  chain: ['sLP', 'sLK', 'cLK'],
});

const sHP = strike({
  id: 'sHP',
  name: '잭킹 엘보',
  base: STAND,
  windup: JACK_B,
  hit: pose(JACK_A, { torso: 35, aF: [80, 110], aB: [20, 90] }),
  startup: 8,
  active: 4,
  recovery: 14,
  box: { x: 15, y: 110, w: 70, h: 50 },
  damage: 70,
  cancel: true,
});

const sLK = strike({
  id: 'sLK',
  name: '셔플 킥',
  base: STAND,
  hit: pose(STAND, { torso: 0, lF: [70, -5] }),
  startup: 5,
  active: 3,
  recovery: 8,
  box: { x: 25, y: 30, w: 78, h: 30 },
  damage: 35,
  cancel: true,
  chain: ['sLK', 'cLK'],
});

const sHK = strike({
  id: 'sHK',
  name: '로프트 킥',
  base: STAND,
  windup: pose(STAND, { lF: [95, -110] }),
  hit: pose(STAND, { torso: -25, lF: [110, 0], aF: [40, 40], aB: [-40, 30] }),
  startup: 9,
  active: 4,
  recovery: 16,
  box: { x: 25, y: 100, w: 95, h: 40 },
  damage: 80,
  extra: { push: 12 },
});

const cLP = strike({
  id: 'cLP',
  name: '로우 잭',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 40, aF: [95, 5] }),
  startup: 4,
  active: 2,
  recovery: 7,
  box: { x: 20, y: 58, w: 64, h: 24 },
  damage: 22,
  cancel: true,
  chain: ['cLP', 'cLK'],
  more: { hurtbox: { x: -30, y: 0, w: 62, h: 112 } },
});

const cHP = strike({
  id: 'cHP',
  name: '업 잭',
  base: CROUCH,
  hit: pose(JACK_B, { torso: -15, aF: [170, -10], lF: [15, -10] }),
  end: CROUCH,
  startup: 8,
  active: 5,
  recovery: 18,
  box: { x: 5, y: 100, w: 65, h: 110 },
  damage: 68,
  extra: { launch: { vx: 1.5, vy: 12 } },
  cancel: true,
});

const cLK = strike({
  id: 'cLK',
  name: '힐 토',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 25, lF: [88, -5] }),
  startup: 4,
  active: 3,
  recovery: 8,
  box: { x: 20, y: 0, w: 82, h: 26 },
  damage: 28,
  extra: { level: 'low' },
  cancel: true,
  chain: ['cLP', 'cLK'],
});

const cHK = strike({
  id: 'cHK',
  name: '스윕 루프',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 60, aF: [60, 0], lF: [92, 0], lB: [45, -125] }),
  startup: 9,
  active: 5,
  recovery: 19,
  box: { x: 10, y: 0, w: 118, h: 28 },
  damage: 72,
  extra: { level: 'low', knockdown: true },
  more: { hurtbox: { x: -30, y: 0, w: 70, h: 90 } },
});

const jL = airStrike({
  id: 'jL',
  name: '에어 셔플',
  hit: { lF: [70, -10], lB: [10, -80] },
  startup: 4,
  active: 8,
  box: { x: 15, y: 20, w: 70, h: 45 },
  damage: 42,
});

const jH = airStrike({
  id: 'jH',
  name: '다이브',
  // 공중에서 앞으로 몸을 날린다: 몸통을 눕히고 두 팔을 앞으로, 다리는 뒤로 (로프팅의 다이브)
  hit: { torso: 70, head: -20, aF: [115, 0], aB: [105, 5], lF: [-35, -5], lB: [-50, -10] },
  startup: 6,
  active: 9,
  box: { x: 10, y: -15, w: 75, h: 60 },
  damage: 78,
});

// ── 필살기 ─────────────────────────────────────────────────────────

/** 루즈 레그: 다리를 힘 빼고 털듯 흔들다가 상대 발등을 밟는다. 밟을 때마다 하단 */
const LOOSE_A = pose(JACK_A, { lF: [38, -4], lB: [-45, -40], aF: [50, 60], aB: [-20, 60] });
const LOOSE_B = pose(JACK_A, { lF: [-30, -35], lB: [36, -4], aF: [-20, 60], aB: [50, 60] });
const looseLegs = combo({
  id: 'looseLegs',
  name: '루즈 레그',
  desc: '다리를 털듯 흔들며 다가가 상대 발을 밟는 하단 5연타',
  base: STAND,
  poses: [LOOSE_A, LOOSE_B],
  start: 6,
  interval: 6,
  count: 4,
  box: { x: 15, y: 0, w: 80, h: 32 },
  damage: 17,
  extra: { level: 'low' },
  finish: { pose: pose(LOOSE_A, { torso: 30, lF: [42, -2] }), delay: 6, damage: 35, extra: { level: 'low' } },
  recovery: 14,
  more: { velocity: [{ from: 3, to: 30, vx: 3 }] },
});

/** 셔플: 셔플 스텝으로 파고들다 뛰어올라 뒤꿈치로 내리찍는다. 마지막은 중단 */
const shuffle = combo({
  id: 'shuffle',
  name: '셔플',
  desc: '셔플로 파고들어 뛰어올라 뒤꿈치로 내리찍는다. 마지막은 중단(서서 막기)',
  base: STAND,
  poses: [pose(SHUF_A, { torso: 18 }), pose(SHUF_B, { torso: 18 })],
  start: 6,
  interval: 6,
  count: 2,
  box: { x: 15, y: 30, w: 80, h: 50 },
  damage: 22,
  finish: {
    pose: pose(JACK_A, { torso: 25, lF: [70, -5], lB: [-20, -40], aF: [130, 40], aB: [110, 40] }),
    delay: 9,
    damage: 55,
    box: { x: 15, y: 20, w: 85, h: 110 },
    extra: { level: 'overhead' },
  },
  recovery: 16,
  more: { velocity: [{ from: 3, to: 22, vx: 3 }] },
});

const skateSlide = strike({
  id: 'skateSlide',
  name: '스케이트 슬라이드',
  kind: 'special',
  desc: '바닥을 미끄러지며 다리를 걸어 넘어뜨린다. 몸이 낮아서 높은 공격과 장풍 밑을 빠져나간다',
  base: STAND,
  windup: pose(CROUCH, { torso: 10 }),
  hit: SLIDE,
  end: CROUCH,
  startup: 10,
  active: 13,
  recovery: 14,
  box: { x: 10, y: 0, w: 80, h: 40 },
  damage: 60,
  extra: { level: 'low', knockdown: true, chip: 6 },
  more: { velocity: [{ from: 4, to: 22, vx: 8 }], hurtbox: { x: -30, y: 0, w: 60, h: 70 } },
});

const loftSpin = strike({
  id: 'loftSpin',
  name: '로프팅 스핀',
  kind: 'special',
  desc: '대공기. 뛰어올라 몸을 틀며 차올린다. 발동 직후 무적',
  base: CROUCH,
  hit: LOFT_KICK,
  end: CROUCH,
  startup: 5,
  active: 8,
  recovery: 24,
  box: { x: -15, y: 100, w: 100, h: 130 },
  damage: 90,
  extra: { launch: { vx: 1.5, vy: 12 }, knockdown: true, chip: 8 },
  more: { invuln: [1, 7] },
});

// ── 초필살기 ───────────────────────────────────────────────────────

const houseParty = combo({
  id: 'houseParty',
  name: '하우스 파티',
  kind: 'super',
  desc: '8연속 셔플로 몰아붙이고 로프팅 킥으로 띄운다',
  base: STAND,
  windup: JACK_A,
  poses: [SHUF_LOW_A, SHUF_LOW_B],
  start: 8,
  interval: 4,
  count: 8,
  box: { x: 10, y: 0, w: 100, h: 70 },
  damage: 25,
  finish: {
    pose: LOFT_KICK,
    delay: 8,
    damage: 160,
    box: { x: -10, y: 40, w: 120, h: 160 },
    extra: { launch: { vx: 5, vy: 13 }, hitstop: 18, heavy: true },
  },
  recovery: 24,
  end: WIN,
  more: { velocity: [{ from: 4, to: 36, vx: 3.5 }] },
});

export const HOUSE_MOVES = moveTable([
  sLP,
  looseLegs,
  shuffle,
  sHP,
  sLK,
  sHK,
  cLP,
  cHP,
  cLK,
  cHK,
  jL,
  jH,
  skateSlide,
  loftSpin,
  houseParty,
]);
