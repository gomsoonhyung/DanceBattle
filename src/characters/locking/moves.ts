import { genKeys, pose } from '../../anim/pose';
import type { HitDef, MoveDef } from '../../fighter/types';
import { JUMP_FALL, JUMP_TUCK } from '../common';
import { CROUCH, LOCK, POINT, ROLL_A, ROLL_B, SPLIT, STAND, STEP_B, STEP_F } from './poses';

// ── 기본기 ─────────────────────────────────────────────────────────

const sLP: MoveDef = {
  id: 'sLP',
  name: '포인트',
  kind: 'normal',
  total: 14,
  // 손이 반대쪽 어깨 앞에서 출발해 앞으로 빠르게 뻗어 가리킨다 (돈 캠벨의 포인트)
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 2, p: pose(STAND, { torso: -5, head: 5, aF: [35, 150], aB: [20, 110] }) },
      { f: 4, p: pose(STAND, { torso: 10, aF: [92, 0], aB: [20, 110], lF: [20, -15] }) },
      { f: 7, p: pose(STAND, { torso: 10, aF: [90, 3], aB: [20, 110], lF: [20, -15] }) },
      { f: 14, p: STAND },
    ],
  },
  hits: [
    {
      frames: [5, 7],
      box: { x: 20, y: 125, w: 78, h: 22 },
      damage: 28,
      hitstun: 14,
      blockstun: 10,
      level: 'mid',
      push: 5,
    },
  ],
  cancelWindow: [5, 11],
  chainInto: ['sLP', 'cLP', 'sLK'],
};

const sHP: MoveDef = {
  id: 'sHP',
  name: '리스트 롤 락',
  kind: 'normal',
  total: 28,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: ROLL_A },
      { f: 9, p: LOCK },
      { f: 12, p: LOCK },
      { f: 28, p: STAND },
    ],
  },
  hits: [
    {
      frames: [9, 11],
      box: { x: 20, y: 105, w: 85, h: 45 },
      damage: 75,
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
  name: '스쿠봇 킥',
  kind: 'normal',
  total: 18,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: pose(STAND, { torso: -5, lF: [60, -100], aF: [-10, 80] }) },
      { f: 6, p: pose(STAND, { torso: -5, lF: [85, -5], aF: [-10, 80] }) },
      { f: 9, p: pose(STAND, { torso: -5, lF: [83, -8], aF: [-10, 80] }) },
      { f: 18, p: STAND },
    ],
  },
  hits: [{ frames: [6, 8], box: { x: 25, y: 70, w: 80, h: 30 }, damage: 38, hitstun: 15, blockstun: 11, level: 'mid' }],
  cancelWindow: [6, 12],
};

const sHK: MoveDef = {
  id: 'sHK',
  name: '하이 킥 락',
  kind: 'normal',
  total: 30,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 5, p: pose(STAND, { torso: -10, lF: [110, -110] }) },
      { f: 10, p: pose(STAND, { torso: -35, head: 20, lF: [130, 0], aF: [40, 100], aB: [-30, 60] }) },
      { f: 13, p: pose(STAND, { torso: -35, head: 20, lF: [128, -3], aF: [40, 100], aB: [-30, 60] }) },
      { f: 30, p: STAND },
    ],
  },
  // 높게 차기 때문에 앉은 상대에게는 헛친다
  hits: [
    {
      frames: [10, 13],
      box: { x: 25, y: 120, w: 90, h: 45 },
      damage: 85,
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
  name: '로우 포인트',
  kind: 'normal',
  total: 12,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 3, p: pose(CROUCH, { torso: 30, aF: [95, 0] }) },
      { f: 5, p: pose(CROUCH, { torso: 30, aF: [93, 3] }) },
      { f: 12, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [4, 5],
      box: { x: 20, y: 60, w: 68, h: 24 },
      damage: 22,
      hitstun: 13,
      blockstun: 9,
      level: 'mid',
      push: 5,
    },
  ],
  cancelWindow: [4, 9],
  chainInto: ['cLP', 'cLK', 'sLP'],
};

const cHP: MoveDef = {
  id: 'cHP',
  name: '업 포인트',
  kind: 'normal',
  total: 30,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 4, p: pose(CROUCH, { aF: [40, 90] }) },
      { f: 8, p: pose(STAND, { torso: -8, aF: [165, 0], aB: [20, 100], lF: [15, -10] }) },
      { f: 12, p: pose(STAND, { torso: -8, aF: [163, 2], aB: [20, 100], lF: [15, -10] }) },
      { f: 30, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [8, 12],
      box: { x: 5, y: 110, w: 60, h: 110 },
      damage: 70,
      hitstun: 24,
      blockstun: 14,
      level: 'mid',
      launch: { vx: 1.5, vy: 12 },
      hitstop: 10,
      heavy: true,
    },
  ],
  cancelWindow: [8, 17],
};

const cLK: MoveDef = {
  id: 'cLK',
  name: '니 탭',
  kind: 'normal',
  total: 16,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 4, p: pose(CROUCH, { torso: 25, lF: [88, -10] }) },
      { f: 8, p: pose(CROUCH, { torso: 25, lF: [86, -12] }) },
      { f: 16, p: CROUCH },
    ],
  },
  hits: [{ frames: [5, 7], box: { x: 20, y: 0, w: 82, h: 26 }, damage: 30, hitstun: 14, blockstun: 10, level: 'low' }],
  cancelWindow: [5, 11],
  chainInto: ['cLP', 'cLK'],
};

const cHK: MoveDef = {
  id: 'cHK',
  name: '스플릿 스윕',
  kind: 'normal',
  total: 36,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 8, p: SPLIT },
      { f: 14, p: SPLIT },
      { f: 36, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [8, 13],
      box: { x: 0, y: 0, w: 130, h: 26 },
      damage: 75,
      hitstun: 20,
      blockstun: 14,
      level: 'low',
      knockdown: true,
      push: 8,
      hitstop: 10,
      heavy: true,
    },
  ],
  hurtbox: { x: -40, y: 0, w: 70, h: 90 },
};

const jL: MoveDef = {
  id: 'jL',
  name: '에어 포인트',
  kind: 'normal',
  total: 40,
  air: true,
  anim: {
    snap: false,
    keys: [
      { f: 0, p: JUMP_TUCK },
      { f: 4, p: pose(JUMP_TUCK, { torso: 15, aF: [65, 0] }) },
      { f: 12, p: pose(JUMP_TUCK, { torso: 15, aF: [63, 2] }) },
      { f: 22, p: JUMP_FALL },
    ],
  },
  hits: [
    { frames: [4, 12], box: { x: 15, y: 40, w: 70, h: 40 }, damage: 45, hitstun: 16, blockstun: 11, level: 'overhead' },
  ],
};

const jH: MoveDef = {
  id: 'jH',
  name: '스쿠비 홉 킥',
  kind: 'normal',
  total: 40,
  air: true,
  anim: {
    snap: false,
    keys: [
      { f: 0, p: JUMP_TUCK },
      { f: 6, p: pose(JUMP_TUCK, { torso: -15, lF: [70, 0], lB: [10, -90], aF: [150, 0], aB: [-30, 60] }) },
      { f: 14, p: pose(JUMP_TUCK, { torso: -15, lF: [68, -2], lB: [10, -90], aF: [150, 0], aB: [-30, 60] }) },
      { f: 24, p: JUMP_FALL },
    ],
  },
  hits: [
    {
      frames: [6, 14],
      box: { x: 20, y: 10, w: 75, h: 45 },
      damage: 75,
      hitstun: 20,
      blockstun: 14,
      level: 'overhead',
      hitstop: 11,
      heavy: true,
    },
  ],
};

// ── 필살기 ─────────────────────────────────────────────────────────

/** 캡 스로: 빅 애플 캡을 던진다. 날아갔다가 돌아오며, 가는 길·오는 길 모두 맞는다 */
const capThrow: MoveDef = {
  id: 'capThrow',
  name: '캡 스로',
  desc: '모자를 던진다. 날아갔다가 돌아오고, 오는 길에도 맞는다. 앉으면 피할 수 있다',
  kind: 'special',
  total: 38,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 6, p: pose(STAND, { torso: -12, aF: [170, 60], aB: [20, 110] }) },
      { f: 11, p: pose(STAND, { torso: 20, aF: [100, 10], aB: [10, 100], lF: [40, -30] }) },
      { f: 22, p: pose(STAND, { torso: 20, aF: [100, 10], aB: [10, 100], lF: [40, -30] }) },
      { f: 38, p: STAND },
    ],
  },
  hits: [],
  projectile: {
    frame: 12,
    x: 60,
    y: 128,
    vx: 9,
    life: 100,
    returnAfter: 40,
    box: { x: -18, y: -10, w: 36, h: 20 },
    kind: 'cap',
    hit: { damage: 45, hitstun: 18, blockstun: 14, level: 'mid', chip: 4 },
  },
};

const jumpLock: MoveDef = {
  id: 'jumpLock',
  name: '업 락',
  desc: '대공기. 두 팔을 어깨 위로 끌어올린 머슬맨 업 락으로 뛰어오른다. 발동 직후 무적',
  kind: 'special',
  total: 46,
  invuln: [1, 7],
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      // 업 락(머슬맨): 두 팔을 어깨 위로 끌어올려 팔꿈치를 굽힌 마초 자세로 뛰어오른다
      { f: 4, p: pose(STAND, { lift: 30, torso: -5, lF: [100, -120], lB: [80, -120], aF: [150, 70], aB: [140, 70] }) },
      {
        f: 10,
        p: pose(STAND, { lift: 60, torso: -8, head: 8, lF: [100, -120], lB: [80, -120], aF: [160, 80], aB: [150, 80] }),
      },
      { f: 18, p: pose(STAND, { lift: 20, lF: [30, -40], lB: [0, -30], aF: [100, -5], aB: [85, 10] }) },
      { f: 26, p: CROUCH },
      { f: 46, p: STAND },
    ],
  },
  hits: [
    {
      frames: [5, 12],
      box: { x: -10, y: 90, w: 90, h: 130 },
      damage: 90,
      hitstun: 24,
      blockstun: 14,
      level: 'mid',
      launch: { vx: 1.5, vy: 12 },
      knockdown: true,
      chip: 8,
      hitstop: 12,
      heavy: true,
    },
  ],
};

/** 머슬맨 업락 자세 (두 팔을 어깨 위로) */
const MUSCLE = pose(STAND, { torso: -8, head: 8, aF: [150, 70], aB: [140, 70] });

/** 스쿠봇: 머슬맨 락으로 돌면서 스쿠 비 두 킥을 번갈아 찬다. 도는 다리가 앞뒤를 친다 */
const scoobot: MoveDef = {
  id: 'scoobot',
  name: '스쿠봇',
  desc: '머슬맨 락으로 돌면서 스쿠 비 두 킥을 번갈아 찬다. 앞뒤 모두 맞는 다단',
  kind: 'special',
  total: 46,
  velocity: [{ from: 4, to: 30, vx: 2 }],
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 5, p: MUSCLE },
      { f: 8, p: pose(MUSCLE, { lF: [92, -5], lB: [-10, -20] }) },
      { f: 12, p: MUSCLE },
      { f: 15, p: pose(MUSCLE, { torso: 5, lF: [-15, -15], lB: [-95, -5] }) },
      { f: 19, p: MUSCLE },
      { f: 22, p: pose(MUSCLE, { lF: [95, -5], lB: [-10, -20] }) },
      { f: 26, p: LOCK },
      { f: 30, p: pose(LOCK, { lF: [100, 0], aF: [120, 0] }) },
      { f: 46, p: STAND },
    ],
  },
  hits: [
    {
      frames: [8, 10],
      box: { x: 15, y: 40, w: 90, h: 50 },
      damage: 25,
      hitstun: 22,
      blockstun: 12,
      level: 'mid',
      push: 1,
      chip: 3,
      hitstop: 5,
    },
    {
      frames: [15, 17],
      box: { x: -100, y: 40, w: 90, h: 50 },
      damage: 25,
      hitstun: 22,
      blockstun: 12,
      level: 'mid',
      push: 1,
      chip: 3,
      hitstop: 5,
    },
    {
      frames: [22, 24],
      box: { x: 15, y: 40, w: 90, h: 50 },
      damage: 25,
      hitstun: 22,
      blockstun: 12,
      level: 'mid',
      push: 1,
      chip: 3,
      hitstop: 5,
    },
    {
      frames: [30, 33],
      box: { x: 15, y: 40, w: 100, h: 60 },
      damage: 45,
      hitstun: 22,
      blockstun: 14,
      level: 'mid',
      knockdown: true,
      push: 10,
      chip: 5,
      hitstop: 10,
      heavy: true,
    },
  ],
};

/** 스쿠비 홉: 머슬맨 자세로 깡충 뛰어올라 공중에서 앞으로 찬다 (중단) */
const scoobyHop: MoveDef = {
  id: 'scoobyHop',
  name: '스쿠비 홉',
  desc: '머슬맨 자세로 깡충 뛰어 공중에서 앞으로 차는 중단. 서서 막아야 한다',
  kind: 'special',
  total: 40,
  velocity: [{ from: 3, to: 18, vx: 4 }],
  anim: {
    snap: false,
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: pose(CROUCH, { torso: 20 }) },
      { f: 9, p: pose(MUSCLE, { y: 150, lF: [90, -110], lB: [40, -100] }) },
      { f: 13, p: pose(MUSCLE, { y: 140, lF: [100, -5], lB: [40, -100] }) },
      { f: 18, p: pose(MUSCLE, { y: 120, lF: [100, -5], lB: [40, -100] }) },
      { f: 22, p: pose(CROUCH, { torso: 20 }) },
      { f: 40, p: STAND },
    ],
  },
  hits: [
    {
      frames: [13, 17],
      box: { x: 15, y: 50, w: 90, h: 80 },
      damage: 80,
      hitstun: 20,
      blockstun: 14,
      level: 'overhead',
      push: 8,
      chip: 6,
      hitstop: 11,
      heavy: true,
    },
  ],
};

const twirlHit = (from: number, last = false): HitDef => ({
  frames: [from, from + (last ? 3 : 2)],
  box: { x: 15, y: 90, w: 70, h: 60 },
  damage: last ? 50 : 22,
  hitstun: 18,
  blockstun: last ? 14 : 10,
  level: 'mid',
  push: last ? 10 : 1,
  chip: last ? 6 : 3,
  knockdown: last,
  heavy: last,
});

const wristTwirl: MoveDef = {
  id: 'wristTwirl',
  name: '리스트 트월',
  desc: '손목을 돌리며 근거리 4연타',
  kind: 'special',
  total: 38,
  anim: {
    keys: [
      { f: 0, p: STAND },
      ...genKeys(4, 24, 4, (_f, i) => (i % 2 ? ROLL_B : ROLL_A)),
      { f: 27, p: LOCK },
      { f: 30, p: LOCK },
      { f: 38, p: STAND },
    ],
  },
  hits: [twirlHit(6), twirlHit(12), twirlHit(18), twirlHit(26, true)],
};

// ── 초필살기 ───────────────────────────────────────────────────────

const BIG_POINT = pose(POINT, { torso: 30, head: -10, lF: [60, -40], lB: [-40, 0] });

const rushHits: HitDef[] = [8, 13, 18, 23].map((f) => ({
  frames: [f, f + 2],
  box: { x: 10, y: 60, w: 90, h: 110 },
  damage: 40,
  hitstun: 30,
  blockstun: 14,
  level: 'mid',
  push: 1,
  chip: 6,
  hitstop: 5,
}));

const lockAndPoint: MoveDef = {
  id: 'lockAndPoint',
  name: '락 앤 포인트',
  desc: '러시 연타 뒤 멀리까지 닿는 포인트로 마무리',
  kind: 'super',
  total: 80,
  meterCost: 100,
  superFreeze: 40,
  invuln: [1, 12],
  anim: {
    keys: [
      { f: 0, p: STAND },
      ...genKeys(4, 24, 5, (_f, i) => [STEP_F, LOCK, STEP_B, POINT][i % 4]),
      { f: 29, p: pose(STAND, { torso: -15, aF: [150, 40] }) },
      { f: 34, p: BIG_POINT },
      { f: 60, p: BIG_POINT },
      { f: 80, p: STAND },
    ],
  },
  velocity: [{ from: 4, to: 22, vx: 7 }],
  hits: [
    ...rushHits,
    {
      frames: [34, 40],
      box: { x: 20, y: 90, w: 180, h: 70 },
      damage: 150,
      hitstun: 40,
      blockstun: 18,
      level: 'mid',
      launch: { vx: 6, vy: 12 },
      knockdown: true,
      chip: 20,
      hitstop: 18,
      heavy: true,
    },
  ],
};

export const LOCKING_MOVES: Record<string, MoveDef> = Object.fromEntries(
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
    scoobot,
    scoobyHop,
    capThrow,
    jumpLock,
    wristTwirl,
    lockAndPoint,
  ].map((m) => [m.id, m]),
);
