import { genKeys, pose, type Pose } from '../../anim/pose';
import type { MoveDef } from '../../fighter/types';
import { armW, CROUCH, CROUCH_HAND, FREEZE, JUMP_FALL, JUMP_TUCK, legW, STAND } from './poses';

// ── 회전 기술 포즈 생성기 ─────────────────────────────────────────────

/** 윈드밀/에어플레어: 어깨(또는 손)로 몸을 지탱하고 V자로 벌린 다리를 돌린다. */
function spinPose(phase: number, opts: { tilt: number; spread: number; arms: 'floor' | 'plant' }): Pose {
  const rot = 180 + opts.tilt * Math.sin((phase * Math.PI) / 180);
  const legF = phase;
  const legB = phase + opts.spread;
  return {
    x: 0,
    y: 0,
    rot,
    torso: 0,
    head: 20,
    aF: opts.arms === 'plant' ? [armW(10, rot), 0] : [armW(70, rot), 20],
    aB: opts.arms === 'plant' ? [armW(-10, rot), 0] : [armW(-70, rot), 20],
    lF: [legW(legF, rot), 0],
    lB: [legW(legB, rot), 0],
  };
}

/** 헤드스핀: 머리로 서서 다리를 가위처럼 교차시키며 회전 */
function headspinPose(phase: number, legsOpen: number): Pose {
  const s = Math.sin((phase * Math.PI) / 180);
  return {
    x: 0,
    y: 0,
    rot: 180 + 6 * s,
    torso: 0,
    head: 0,
    aF: [armW(35, 180), 60],
    aB: [armW(-35, 180), 60],
    lF: [legsOpen * s, 0],
    lB: [-legsOpen * s, -10],
  };
}

/** 프리즈 카운터: 거꾸로 선 채 다리를 앞으로 뻗은 자세 (legWorld = 앞다리의 월드 각도) */
function flipKick(rot: number, legWorld: number): Pose {
  return pose(FREEZE, {
    rot,
    head: 20,
    aF: [armW(0, rot), 0],
    aB: [armW(30, rot), 30],
    lF: [legW(legWorld, rot), 0],
    lB: [legW(legWorld + 40, rot), -40],
  });
}

const DIVE = pose(CROUCH_HAND, { torso: 80, head: -40, aF: [80, 0], aB: [70, 10] });

// ── 기본기 ─────────────────────────────────────────────────────────

const sLP: MoveDef = {
  id: 'sLP',
  name: '탑락 잽',
  kind: 'normal',
  total: 14,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: pose(STAND, { torso: 18, aF: [92, 4], aB: [30, 115], lF: [22, -18] }) },
      { f: 7, p: pose(STAND, { torso: 18, aF: [90, 8], aB: [30, 115], lF: [22, -18] }) },
      { f: 14, p: STAND },
    ],
  },
  hits: [
    {
      frames: [5, 7],
      box: { x: 20, y: 118, w: 62, h: 26 },
      damage: 30,
      hitstun: 14,
      blockstun: 10,
      level: 'mid',
      push: 5,
    },
  ],
  cancelWindow: [5, 11],
  chainInto: ['sLP', 'cLP'],
};

const sHP: MoveDef = {
  id: 'sHP',
  name: '번 스윙',
  kind: 'normal',
  total: 28,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 6, p: pose(STAND, { torso: -12, head: 5, aF: [-40, 70], aB: [60, 90], lF: [10, -20], lB: [-25, -10] }) },
      { f: 10, p: pose(STAND, { torso: 30, head: -10, aF: [110, -5], aB: [10, 100], lF: [38, -30], lB: [-15, -5] }) },
      { f: 13, p: pose(STAND, { torso: 32, head: -10, aF: [95, 0], aB: [5, 100], lF: [38, -30], lB: [-15, -5] }) },
      { f: 28, p: STAND },
    ],
  },
  hits: [
    {
      frames: [9, 12],
      box: { x: 20, y: 105, w: 85, h: 50 },
      damage: 80,
      hitstun: 20,
      blockstun: 14,
      level: 'mid',
      push: 8,
      hitstop: 11,
      heavy: true,
    },
  ],
  cancelWindow: [9, 16],
};

const sLK: MoveDef = {
  id: 'sLK',
  name: '탑락 킥',
  kind: 'normal',
  total: 19,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: pose(STAND, { torso: 0, lF: [70, -100], lB: [-8, -5] }) },
      { f: 7, p: pose(STAND, { torso: -8, lF: [82, -2], lB: [-8, -5], aF: [60, 80] }) },
      { f: 10, p: pose(STAND, { torso: -8, lF: [80, -5], lB: [-8, -5], aF: [60, 80] }) },
      { f: 19, p: STAND },
    ],
  },
  hits: [{ frames: [7, 9], box: { x: 25, y: 55, w: 75, h: 34 }, damage: 40, hitstun: 15, blockstun: 11, level: 'mid' }],
  cancelWindow: [7, 13],
};

const sHK: MoveDef = {
  id: 'sHK',
  name: '킥 아웃',
  kind: 'normal',
  total: 32,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 6, p: pose(STAND, { torso: -10, lF: [85, -115], lB: [-5, -8], aF: [30, 110] }) },
      { f: 11, p: pose(STAND, { torso: -35, head: 15, lF: [108, 0], lB: [-10, -5], aF: [0, 60], aB: [-40, 40] }) },
      { f: 15, p: pose(STAND, { torso: -35, head: 15, lF: [104, -4], lB: [-10, -5], aF: [0, 60], aB: [-40, 40] }) },
      { f: 32, p: STAND },
    ],
  },
  hits: [
    {
      frames: [11, 14],
      box: { x: 30, y: 105, w: 100, h: 38 },
      damage: 90,
      hitstun: 22,
      blockstun: 15,
      level: 'mid',
      push: 12,
      hitstop: 12,
      heavy: true,
    },
  ],
};

const cLP: MoveDef = {
  id: 'cLP',
  name: '다운 잽',
  kind: 'normal',
  total: 13,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 4, p: pose(CROUCH, { torso: 45, aF: [100, 2] }) },
      { f: 6, p: pose(CROUCH, { torso: 45, aF: [98, 5] }) },
      { f: 13, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [5, 6],
      box: { x: 20, y: 60, w: 60, h: 26 },
      damage: 25,
      hitstun: 13,
      blockstun: 9,
      level: 'mid',
      push: 5,
    },
  ],
  cancelWindow: [5, 10],
  chainInto: ['cLP', 'sLP', 'cLK'],
};

const cHP: MoveDef = {
  id: 'cHP',
  name: '업 스윙',
  kind: 'normal',
  total: 32,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 5, p: pose(CROUCH, { torso: 50, aF: [-10, 40] }) },
      { f: 9, p: pose(STAND, { torso: -12, head: 10, aF: [175, -5], aB: [20, 90], lF: [20, -10], lB: [-15, -5] }) },
      { f: 13, p: pose(STAND, { torso: -12, head: 10, aF: [170, -10], aB: [20, 90], lF: [20, -10], lB: [-15, -5] }) },
      { f: 32, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [8, 12],
      box: { x: 5, y: 95, w: 65, h: 110 },
      damage: 70,
      hitstun: 24,
      blockstun: 14,
      level: 'mid',
      launch: { vx: 1.5, vy: 12 },
      hitstop: 10,
      heavy: true,
    },
  ],
  cancelWindow: [8, 18],
};

const cLK: MoveDef = {
  id: 'cLK',
  name: '식스스텝 탭',
  kind: 'normal',
  total: 17,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 4, p: pose(CROUCH_HAND, { lF: [88, -60] }) },
      { f: 6, p: pose(CROUCH_HAND, { lF: [88, 0], lB: [60, -120] }) },
      { f: 9, p: pose(CROUCH_HAND, { lF: [86, 0], lB: [60, -120] }) },
      { f: 17, p: CROUCH },
    ],
  },
  hits: [{ frames: [6, 8], box: { x: 20, y: 0, w: 85, h: 28 }, damage: 30, hitstun: 14, blockstun: 10, level: 'low' }],
  cancelWindow: [6, 12],
  chainInto: ['cLP', 'cLK'],
  hurtbox: { x: -30, y: 0, w: 64, h: 100 },
};

const cHK: MoveDef = {
  id: 'cHK',
  name: '백 스윕',
  kind: 'normal',
  total: 36,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 6, p: pose(CROUCH_HAND, { torso: 65, aF: [65, 0], aB: [65, 0], lF: [60, -120], lB: [-40, -60] }) },
      { f: 10, p: pose(CROUCH_HAND, { torso: 70, aF: [70, 0], aB: [70, 0], lF: [92, 0], lB: [40, -130] }) },
      { f: 15, p: pose(CROUCH_HAND, { torso: 70, aF: [70, 0], aB: [70, 0], lF: [90, 0], lB: [40, -130] }) },
      { f: 36, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [10, 14],
      box: { x: 15, y: 0, w: 110, h: 30 },
      damage: 80,
      hitstun: 20,
      blockstun: 15,
      level: 'low',
      knockdown: true,
      push: 8,
      hitstop: 10,
      heavy: true,
    },
  ],
  hurtbox: { x: -30, y: 0, w: 70, h: 90 },
};

const jL: MoveDef = {
  id: 'jL',
  name: '에어 니킥',
  kind: 'normal',
  total: 40,
  air: true,
  anim: {
    snap: false,
    keys: [
      { f: 0, p: JUMP_TUCK },
      { f: 4, p: pose(JUMP_TUCK, { lF: [60, 0], lB: [20, -100], aF: [60, 90], torso: 5 }) },
      { f: 14, p: pose(JUMP_TUCK, { lF: [58, -5], lB: [20, -100], aF: [60, 90], torso: 5 }) },
      { f: 24, p: JUMP_FALL },
    ],
  },
  hits: [
    { frames: [5, 14], box: { x: 10, y: 20, w: 65, h: 45 }, damage: 50, hitstun: 16, blockstun: 11, level: 'overhead' },
  ],
};

const jH: MoveDef = {
  id: 'jH',
  name: '플라잉 킥',
  kind: 'normal',
  total: 40,
  air: true,
  anim: {
    snap: false,
    keys: [
      { f: 0, p: JUMP_TUCK },
      { f: 6, p: pose(JUMP_TUCK, { torso: -20, head: 10, lF: [55, 0], lB: [-10, -80], aF: [-20, 60], aB: [-40, 40] }) },
      {
        f: 16,
        p: pose(JUMP_TUCK, { torso: -20, head: 10, lF: [52, 0], lB: [-10, -80], aF: [-20, 60], aB: [-40, 40] }),
      },
      { f: 26, p: JUMP_FALL },
    ],
  },
  hits: [
    {
      frames: [7, 16],
      box: { x: 20, y: 0, w: 70, h: 50 },
      damage: 80,
      hitstun: 20,
      blockstun: 14,
      level: 'overhead',
      hitstop: 11,
      heavy: true,
    },
  ],
};

// ── 필살기 ─────────────────────────────────────────────────────────

const windmillHit = (from: number, to: number, last = false) => ({
  frames: [from, to] as [number, number],
  box: { x: -20, y: 0, w: last ? 120 : 115, h: last ? 80 : 70 },
  damage: last ? 50 : 30,
  hitstun: 20,
  blockstun: last ? 14 : 12,
  level: 'low' as const,
  push: last ? 8 : 2,
  chip: last ? 8 : 5,
  knockdown: last,
  heavy: last,
});

const windmill: MoveDef = {
  id: 'windmill',
  name: '윈드밀',
  kind: 'special',
  total: 48,
  anim: {
    pivot: 'neck',
    keys: [
      { f: 0, p: STAND },
      { f: 5, p: DIVE },
      ...genKeys(7, 38, 3, (f) => spinPose((f - 7) * 22, { tilt: 25, spread: 110, arms: 'floor' })),
      { f: 48, p: CROUCH },
    ],
  },
  velocity: [{ from: 5, to: 38, vx: 3.5 }],
  hurtbox: { x: -40, y: 0, w: 80, h: 110 },
  hits: [windmillHit(9, 11), windmillHit(16, 18), windmillHit(23, 25), windmillHit(30, 33, true)],
};

const headspin: MoveDef = {
  id: 'headspin',
  name: '헤드스핀',
  kind: 'special',
  total: 50,
  invuln: [1, 9],
  anim: {
    pivot: 'head',
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: pose(DIVE, { rot: 140 }) },
      ...genKeys(6, 34, 2, (f) => headspinPose((f - 6) * 40, 45)),
      { f: 42, p: DIVE },
      { f: 50, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [6, 11],
      box: { x: -35, y: 85, w: 115, h: 130 },
      damage: 60,
      hitstun: 24,
      blockstun: 14,
      level: 'mid',
      launch: { vx: 1, vy: 11 },
      chip: 6,
      heavy: true,
    },
    {
      frames: [16, 19],
      box: { x: -35, y: 85, w: 115, h: 130 },
      damage: 30,
      hitstun: 24,
      blockstun: 12,
      level: 'mid',
      launch: { vx: 1, vy: 8 },
      chip: 4,
    },
    {
      frames: [24, 28],
      box: { x: -35, y: 85, w: 115, h: 130 },
      damage: 40,
      hitstun: 24,
      blockstun: 12,
      level: 'mid',
      launch: { vx: 3.5, vy: 11 },
      knockdown: true,
      chip: 4,
      heavy: true,
    },
  ],
  hurtbox: { x: -30, y: 0, w: 60, h: 90 },
};

const airflare: MoveDef = {
  id: 'airflare',
  name: '에어플레어',
  kind: 'special',
  total: 50,
  anim: {
    pivot: 'neck',
    keys: [
      { f: 0, p: STAND },
      { f: 6, p: DIVE },
      ...genKeys(8, 38, 2, (f) => spinPose((f - 8) * 24, { tilt: 55, spread: 150, arms: 'plant' })),
      { f: 50, p: CROUCH },
    ],
  },
  velocity: [{ from: 7, to: 38, vx: 6 }],
  hits: [
    {
      frames: [15, 19],
      box: { x: -10, y: 30, w: 115, h: 120 },
      damage: 50,
      hitstun: 24,
      blockstun: 14,
      level: 'mid',
      push: 3,
      chip: 6,
    },
    {
      frames: [29, 33],
      box: { x: -10, y: 30, w: 115, h: 120 },
      damage: 70,
      hitstun: 24,
      blockstun: 16,
      level: 'mid',
      knockdown: true,
      push: 10,
      chip: 8,
      heavy: true,
    },
  ],
};

const swipe: MoveDef = {
  id: 'swipe',
  name: '스와이프 킥',
  kind: 'special',
  total: 42,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 7, p: pose(CROUCH_HAND, { torso: 60, lF: [60, -100], lB: [20, -110] }) },
      {
        f: 13,
        p: pose(STAND, {
          lift: 55,
          rot: -10,
          torso: -25,
          head: 10,
          aF: [-30, 60],
          aB: [-60, 40],
          lF: [150, -10],
          lB: [-10, -60],
        }),
      },
      {
        f: 18,
        p: pose(STAND, {
          lift: 40,
          rot: 15,
          torso: -15,
          head: 0,
          aF: [-20, 60],
          aB: [-50, 40],
          lF: [135, 0],
          lB: [-10, -70],
        }),
      },
      {
        f: 22,
        p: pose(STAND, {
          lift: 8,
          rot: 30,
          torso: 0,
          head: -10,
          aF: [20, 80],
          aB: [-30, 60],
          lF: [95, 0],
          lB: [-10, -50],
        }),
      },
      { f: 28, p: CROUCH },
      { f: 42, p: STAND },
    ],
  },
  velocity: [{ from: 8, to: 20, vx: 4.5 }],
  hits: [
    {
      frames: [17, 22],
      box: { x: 10, y: 40, w: 95, h: 140 },
      damage: 80,
      hitstun: 22,
      blockstun: 12,
      level: 'overhead',
      push: 8,
      chip: 6,
      hitstop: 12,
      heavy: true,
    },
  ],
};

const freeze: MoveDef = {
  id: 'freeze',
  name: '프리즈',
  kind: 'special',
  total: 38,
  counter: { from: 4, to: 24, into: 'freezeKick' },
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: FREEZE },
      { f: 24, p: FREEZE },
      { f: 32, p: CROUCH_HAND },
      { f: 38, p: STAND },
    ],
  },
  hits: [],
};

/** 프리즈 반격 성공 시 자동으로 나가는 발차기 */
const freezeKick: MoveDef = {
  id: 'freezeKick',
  name: '프리즈 카운터',
  kind: 'special',
  total: 32,
  invuln: [1, 14],
  anim: {
    // 프리즈 자세에서 몸을 앞으로 계속 굴려 다리를 머리 위로 넘기며 찬다
    keys: [
      { f: 0, p: FREEZE },
      { f: 4, p: flipKick(185, 105) },
      { f: 9, p: flipKick(200, 80) },
      { f: 20, p: pose(CROUCH_HAND, { rot: 360 }) },
      { f: 32, p: pose(STAND, { rot: 360 }) },
    ],
  },
  hits: [
    {
      frames: [4, 9],
      box: { x: 10, y: 30, w: 120, h: 120 },
      damage: 100,
      hitstun: 30,
      blockstun: 16,
      level: 'mid',
      knockdown: true,
      push: 10,
      hitstop: 14,
      heavy: true,
    },
  ],
};

// ── 초필살기 ───────────────────────────────────────────────────────

const superHits = [10, 16, 22, 28, 34, 40].map((f) => ({
  frames: [f, f + 2] as [number, number],
  box: { x: -20, y: 0, w: 125, h: 110 },
  damage: 40,
  hitstun: 30,
  blockstun: 14,
  level: 'mid' as const,
  push: 1,
  chip: 6,
  hitstop: 5,
}));

const powerCombo: MoveDef = {
  id: 'powerCombo',
  name: '파워무브 콤보',
  kind: 'super',
  total: 100,
  meterCost: 100,
  superFreeze: 40,
  invuln: [1, 20],
  anim: {
    pivot: 'neck',
    keys: [
      { f: 0, p: STAND },
      { f: 6, p: DIVE },
      ...genKeys(8, 48, 2, (f) => spinPose((f - 8) * 30, { tilt: 45, spread: 140, arms: 'plant' })),
      ...genKeys(50, 64, 2, (f) => headspinPose((f - 50) * 60, 70)),
      { f: 72, p: FREEZE },
      { f: 90, p: FREEZE },
      { f: 100, p: STAND },
    ],
  },
  velocity: [{ from: 6, to: 42, vx: 5 }],
  hits: [
    ...superHits,
    {
      frames: [54, 60],
      box: { x: -40, y: 60, w: 150, h: 170 },
      damage: 150,
      hitstun: 40,
      blockstun: 18,
      level: 'mid',
      launch: { vx: 5, vy: 15 },
      knockdown: true,
      chip: 20,
      hitstop: 18,
      heavy: true,
    },
  ],
};

export const BBOY_MOVES: Record<string, MoveDef> = Object.fromEntries(
  [
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
    windmill,
    headspin,
    airflare,
    swipe,
    freeze,
    freezeKick,
    powerCombo,
  ].map((m) => [m.id, m]),
);
