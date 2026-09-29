import { pose } from '../../anim/pose';
import { airStrike, combo, moveTable, shooter, strike } from '../builders';
import { CROUCH, HAIR_FLIP_A, HAIR_FLIP_B, HIP_BUMP, KISS, KISS_READY, STAND, TURN_KICK, WIN } from './poses';

// ── 기본기: 날카로운 스냅과 골반·헤어를 쓰는 스타일 ───────────────────

const sLP = strike({
  id: 'sLP',
  name: '핑거 스냅',
  base: STAND,
  hit: pose(STAND, { torso: 8, aF: [92, 10] }),
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
  name: '헤어 휩',
  base: STAND,
  windup: HAIR_FLIP_B,
  hit: HAIR_FLIP_A,
  startup: 9,
  active: 4,
  recovery: 15,
  box: { x: 15, y: 120, w: 85, h: 50 },
  damage: 75,
  cancel: true,
});

const sLK = strike({
  id: 'sLK',
  name: '힐 탭',
  base: STAND,
  hit: pose(STAND, { torso: -5, lF: [70, -30], aF: [40, 120] }),
  startup: 6,
  active: 3,
  recovery: 9,
  box: { x: 25, y: 50, w: 75, h: 32 },
  damage: 36,
  cancel: true,
});

const sHK = strike({
  id: 'sHK',
  name: '하이 킥',
  base: STAND,
  windup: pose(STAND, { lF: [110, -120] }),
  hit: pose(STAND, { torso: -35, head: 10, lF: [135, 0], aF: [160, -120] }),
  startup: 10,
  active: 4,
  recovery: 16,
  box: { x: 25, y: 120, w: 90, h: 45 },
  damage: 82,
  extra: { push: 12 },
});

const cLP = strike({
  id: 'cLP',
  name: '로우 스냅',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 30, aF: [95, 5] }),
  startup: 4,
  active: 2,
  recovery: 7,
  box: { x: 20, y: 58, w: 65, h: 24 },
  damage: 22,
  cancel: true,
  chain: ['cLP', 'cLK', 'sLP'],
  more: { hurtbox: { x: -30, y: 0, w: 62, h: 112 } },
});

const cHP = strike({
  id: 'cHP',
  name: '힙 업',
  base: CROUCH,
  hit: pose(STAND, { x: 10, torso: -15, head: -10, aF: [170, -10], aB: [-25, 95] }),
  end: CROUCH,
  startup: 8,
  active: 5,
  recovery: 18,
  box: { x: 5, y: 100, w: 65, h: 110 },
  damage: 70,
  extra: { launch: { vx: 1.5, vy: 12 } },
  cancel: true,
});

const cLK = strike({
  id: 'cLK',
  name: '토 탭',
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
  name: '드롭 스윕',
  base: CROUCH,
  hit: pose(CROUCH, { torso: 10, head: -15, aF: [150, 0], aB: [120, 0], lF: [92, 0], lB: [-10, -150] }),
  startup: 9,
  active: 5,
  recovery: 20,
  box: { x: 10, y: 0, w: 118, h: 28 },
  damage: 75,
  extra: { level: 'low', knockdown: true },
  more: { hurtbox: { x: -30, y: 0, w: 70, h: 95 } },
});

const jL = airStrike({
  id: 'jL',
  name: '에어 스냅',
  hit: { torso: 15, aF: [70, 5] },
  startup: 4,
  active: 8,
  box: { x: 15, y: 40, w: 70, h: 40 },
  damage: 45,
});

const jH = airStrike({
  id: 'jH',
  name: '힐 드롭',
  hit: { torso: -20, lF: [60, 0], lB: [20, -80], aF: [150, -100] },
  startup: 7,
  active: 8,
  box: { x: 15, y: -10, w: 75, h: 60 },
  damage: 80,
});

// ── 필살기 ─────────────────────────────────────────────────────────

const hairFlip = combo({
  id: 'hairFlip',
  name: '헤어 플립',
  desc: '머리를 앞뒤로 크게 휘두르는 2연타. 두 번째에 다운',
  base: STAND,
  windup: HAIR_FLIP_B,
  poses: [HAIR_FLIP_A],
  start: 7,
  interval: 7,
  count: 1,
  box: { x: 10, y: 105, w: 85, h: 75 },
  damage: 40,
  finish: { pose: pose(HAIR_FLIP_B, { torso: -20 }), delay: 7, damage: 60 },
  recovery: 18,
});

const hipBump = strike({
  id: 'hipBump',
  name: '힙 범프',
  kind: 'special',
  desc: '파고들며 골반으로 튕겨 멀리 날려 버린다',
  base: STAND,
  windup: pose(STAND, { x: -12, torso: 15 }),
  hit: HIP_BUMP,
  startup: 11,
  active: 4,
  recovery: 20,
  box: { x: 5, y: 60, w: 70, h: 70 },
  damage: 70,
  extra: { push: 16, knockdown: true, chip: 6 },
  more: { velocity: [{ from: 3, to: 12, vx: 6 }] },
});

const blowKiss = shooter({
  id: 'blowKiss',
  name: '블로우 키스',
  desc: '느리게 떠가는 하트 장풍. 오래 남아서 상대의 움직임을 묶는다',
  base: STAND,
  windup: KISS_READY,
  release: KISS,
  frame: 15,
  recovery: 28,
  projectile: {
    x: 40,
    y: 125,
    vx: 3,
    life: 130,
    box: { x: -15, y: -15, w: 30, h: 30 },
    kind: 'heart',
    hit: { damage: 45, hitstun: 20, blockstun: 14, level: 'mid', chip: 4 },
  },
});

const turnKick = strike({
  id: 'turnKick',
  name: '턴 킥',
  kind: 'special',
  desc: '대공기. 다리를 머리 위까지 차올린다. 발동 직후 무적',
  base: CROUCH,
  hit: TURN_KICK,
  end: CROUCH,
  startup: 6,
  active: 6,
  recovery: 24,
  box: { x: -10, y: 100, w: 95, h: 120 },
  damage: 90,
  extra: { launch: { vx: 1.5, vy: 12 }, knockdown: true, chip: 8 },
  more: { invuln: [1, 7] },
});

// ── 초필살기 ───────────────────────────────────────────────────────

const spotlight = combo({
  id: 'spotlight',
  name: '스포트라이트',
  kind: 'super',
  desc: '힙 범프와 헤어 휩을 섞은 5연타 뒤 큰 헤어 플립',
  base: STAND,
  windup: WIN,
  poses: [HIP_BUMP, HAIR_FLIP_A, pose(HIP_BUMP, { x: 18 }), HAIR_FLIP_B],
  start: 8,
  interval: 6,
  count: 5,
  box: { x: 5, y: 50, w: 100, h: 130 },
  damage: 35,
  finish: {
    pose: pose(HAIR_FLIP_A, { torso: 35, aF: [95, 0] }),
    delay: 9,
    damage: 160,
    extra: { launch: { vx: 5, vy: 13 }, hitstop: 18, heavy: true },
  },
  recovery: 26,
  end: WIN,
  more: { velocity: [{ from: 4, to: 30, vx: 3 }] },
});

export const GIRLS_HIPHOP_MOVES = moveTable([
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
  hairFlip,
  hipBump,
  blowKiss,
  turnKick,
  spotlight,
]);
