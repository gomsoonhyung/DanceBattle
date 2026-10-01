import { genKeys, pose } from '../../anim/pose';
import type { HitDef, MoveDef } from '../../fighter/types';
import { JUMP_FALL, JUMP_TUCK } from '../common';
import { CHEST_OUT, CROUCH, KNEE_UP, STAND, STOMP } from './poses';

// ── 기본기 ─────────────────────────────────────────────────────────

const sLP: MoveDef = {
  id: 'sLP',
  name: '크럼프 잽',
  kind: 'normal',
  total: 16,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: pose(STAND, { torso: 28, aF: [92, 3], aB: [40, 100], lF: [35, -40] }) },
      { f: 7, p: pose(STAND, { torso: 28, aF: [90, 6], aB: [40, 100], lF: [35, -40] }) },
      { f: 16, p: STAND },
    ],
  },
  hits: [
    {
      frames: [5, 7],
      box: { x: 20, y: 115, w: 65, h: 28 },
      damage: 35,
      hitstun: 15,
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
  name: '배트 스윙',
  kind: 'normal',
  total: 32,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 7, p: pose(STAND, { torso: -10, head: 0, aF: [-60, 40], aB: [70, 80] }) },
      { f: 11, p: pose(STAND, { torso: 38, aF: [100, -10], aB: [20, 90], lF: [45, -45] }) },
      { f: 15, p: pose(STAND, { torso: 45, aF: [60, 0], aB: [15, 90], lF: [45, -45] }) },
      { f: 32, p: STAND },
    ],
  },
  hits: [
    {
      frames: [11, 14],
      box: { x: 15, y: 95, w: 95, h: 60 },
      damage: 100,
      hitstun: 21,
      blockstun: 15,
      level: 'mid',
      push: 9,
      hitstop: 12,
      heavy: true,
    },
  ],
  cancelWindow: [11, 18],
};

const sLK: MoveDef = {
  id: 'sLK',
  name: '프론트 스톰프',
  kind: 'normal',
  total: 20,
  // 무릎을 높이 들었다가 상대 발등을 내리찍는다 (서서 쓰는 하단)
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: KNEE_UP },
      { f: 7, p: pose(STAND, { torso: 22, head: -18, lF: [38, -6], lB: [-18, -30], aF: [40, 60], aB: [20, 70] }) },
      { f: 10, p: pose(STAND, { torso: 22, head: -18, lF: [38, -6], lB: [-18, -30], aF: [40, 60], aB: [20, 70] }) },
      { f: 20, p: STAND },
    ],
  },
  hits: [{ frames: [7, 9], box: { x: 25, y: 0, w: 70, h: 32 }, damage: 45, hitstun: 15, blockstun: 11, level: 'low' }],
  cancelWindow: [7, 13],
};

const sHK: MoveDef = {
  id: 'sHK',
  name: '버킹 킥',
  kind: 'normal',
  total: 34,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 7, p: pose(STAND, { torso: -5, lF: [95, -120] }) },
      { f: 12, p: pose(STAND, { torso: -25, head: 10, lF: [95, -5], aF: [20, 70], aB: [-30, 60] }) },
      { f: 16, p: pose(STAND, { torso: -25, head: 10, lF: [92, -8], aF: [20, 70], aB: [-30, 60] }) },
      { f: 34, p: STAND },
    ],
  },
  hits: [
    {
      frames: [12, 15],
      box: { x: 30, y: 80, w: 95, h: 45 },
      damage: 105,
      hitstun: 22,
      blockstun: 15,
      level: 'mid',
      push: 14,
      hitstop: 12,
      heavy: true,
    },
  ],
};

const cLP: MoveDef = {
  id: 'cLP',
  name: '로우 잽',
  kind: 'normal',
  total: 14,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 4, p: pose(CROUCH, { torso: 48, aF: [100, 2] }) },
      { f: 6, p: pose(CROUCH, { torso: 48, aF: [98, 5] }) },
      { f: 14, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [5, 6],
      box: { x: 20, y: 60, w: 60, h: 26 },
      damage: 30,
      hitstun: 14,
      blockstun: 9,
      level: 'mid',
      push: 5,
    },
  ],
  cancelWindow: [5, 10],
  chainInto: ['cLP', 'cLK'],
};

const cHP: MoveDef = {
  id: 'cHP',
  name: '어퍼 스윙',
  kind: 'normal',
  total: 34,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 5, p: pose(CROUCH, { torso: 52, aF: [-10, 40] }) },
      { f: 9, p: pose(STAND, { torso: -15, head: 10, aF: [175, -10], aB: [30, 90], lF: [20, -15], lB: [-15, -8] }) },
      { f: 14, p: pose(STAND, { torso: -15, head: 10, aF: [170, -10], aB: [30, 90], lF: [20, -15], lB: [-15, -8] }) },
      { f: 34, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [9, 13],
      box: { x: 5, y: 90, w: 70, h: 115 },
      damage: 80,
      hitstun: 24,
      blockstun: 14,
      level: 'mid',
      launch: { vx: 1.5, vy: 12 },
      hitstop: 11,
      heavy: true,
    },
  ],
  cancelWindow: [9, 18],
};

const cLK: MoveDef = {
  id: 'cLK',
  name: '로우 스톰프',
  kind: 'normal',
  total: 18,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 4, p: pose(CROUCH, { torso: 30, lF: [85, -60] }) },
      { f: 7, p: pose(CROUCH, { torso: 30, lF: [88, -5] }) },
      { f: 10, p: pose(CROUCH, { torso: 30, lF: [86, -8] }) },
      { f: 18, p: CROUCH },
    ],
  },
  hits: [{ frames: [7, 9], box: { x: 20, y: 0, w: 75, h: 28 }, damage: 35, hitstun: 14, blockstun: 10, level: 'low' }],
  cancelWindow: [7, 12],
  chainInto: ['cLP', 'cLK'],
};

const cHK: MoveDef = {
  id: 'cHK',
  name: '스톰프 크래시',
  kind: 'normal',
  total: 38,
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 7, p: KNEE_UP },
      { f: 12, p: STOMP },
      { f: 16, p: STOMP },
      { f: 38, p: CROUCH },
    ],
  },
  hits: [
    {
      frames: [12, 15],
      box: { x: 10, y: 0, w: 110, h: 30 },
      damage: 90,
      hitstun: 20,
      blockstun: 15,
      level: 'low',
      knockdown: true,
      push: 8,
      hitstop: 12,
      heavy: true,
    },
  ],
};

const jL: MoveDef = {
  id: 'jL',
  name: '니 드롭',
  kind: 'normal',
  total: 40,
  air: true,
  anim: {
    snap: false,
    keys: [
      { f: 0, p: JUMP_TUCK },
      { f: 4, p: pose(JUMP_TUCK, { torso: 15, lF: [95, -140], lB: [20, -60] }) },
      { f: 14, p: pose(JUMP_TUCK, { torso: 15, lF: [92, -140], lB: [20, -60] }) },
      { f: 24, p: JUMP_FALL },
    ],
  },
  hits: [
    { frames: [5, 14], box: { x: 10, y: 30, w: 60, h: 50 }, damage: 55, hitstun: 16, blockstun: 11, level: 'overhead' },
  ],
};

const jH: MoveDef = {
  id: 'jH',
  name: '점프 스톰프',
  kind: 'normal',
  total: 40,
  air: true,
  // 공중에서 무릎을 끌어올렸다가 두 발로 아래를 내리찍는다
  anim: {
    snap: false,
    keys: [
      { f: 0, p: JUMP_TUCK },
      { f: 6, p: pose(JUMP_TUCK, { torso: 10, aF: [120, 40], aB: [130, 40], lF: [100, -120], lB: [80, -120] }) },
      { f: 9, p: pose(JUMP_TUCK, { torso: 20, aF: [60, 20], aB: [50, 30], lF: [25, -10], lB: [5, -20] }) },
      { f: 17, p: pose(JUMP_TUCK, { torso: 20, aF: [60, 20], aB: [50, 30], lF: [25, -10], lB: [5, -20] }) },
      { f: 27, p: JUMP_FALL },
    ],
  },
  hits: [
    {
      frames: [8, 16],
      box: { x: 10, y: -10, w: 70, h: 70 },
      damage: 90,
      hitstun: 20,
      blockstun: 14,
      level: 'overhead',
      hitstop: 12,
      heavy: true,
    },
  ],
};

// ── 필살기 ─────────────────────────────────────────────────────────

const stompWave: MoveDef = {
  id: 'stompWave',
  name: '스톰프 웨이브',
  desc: '땅을 내리찍어 바닥을 타고 가는 충격파를 보낸다. 하단',
  kind: 'special',
  total: 46,
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 8, p: KNEE_UP },
      { f: 13, p: STOMP },
      { f: 20, p: STOMP },
      { f: 46, p: STAND },
    ],
  },
  hits: [],
  projectile: {
    frame: 14,
    x: 60,
    y: 20,
    vx: 6.5,
    life: 70,
    box: { x: -28, y: -20, w: 56, h: 40 },
    kind: 'shockwave',
    hit: { damage: 60, hitstun: 20, blockstun: 16, level: 'low', chip: 8, heavy: true },
  },
};

const burstUpper: MoveDef = {
  id: 'burstUpper',
  name: '체스트 팝 어퍼',
  desc: '대공기. 가슴을 위로 터뜨리며 두 팔이 튀어 오른다. 발동 직후 무적',
  kind: 'special',
  total: 52,
  invuln: [1, 8],
  anim: {
    keys: [
      { f: 0, p: CROUCH },
      { f: 4, p: pose(CROUCH, { torso: 60, aF: [20, 30], aB: [10, 30] }) },
      {
        f: 8,
        p: pose(STAND, {
          lift: 20,
          torso: -15,
          head: 10,
          aF: [175, -5],
          aB: [165, -10],
          lF: [10, -10],
          lB: [-20, -30],
        }),
      },
      {
        f: 14,
        p: pose(STAND, {
          lift: 25,
          torso: -15,
          head: 10,
          aF: [172, -5],
          aB: [162, -10],
          lF: [10, -10],
          lB: [-20, -30],
        }),
      },
      { f: 24, p: CROUCH },
      { f: 52, p: STAND },
    ],
  },
  hits: [
    {
      frames: [6, 12],
      box: { x: 0, y: 80, w: 80, h: 140 },
      damage: 110,
      hitstun: 26,
      blockstun: 16,
      level: 'mid',
      launch: { vx: 2, vy: 13 },
      knockdown: true,
      chip: 10,
      hitstop: 14,
      heavy: true,
    },
  ],
};

/** 어깨를 앞세워 달려드는 자세: 상체를 크게 숙이고 앞팔로 얼굴을 가린 채 뒷팔을 흔든다 */
const chargePose = (step: 0 | 1) =>
  pose(STAND, {
    torso: 40,
    head: -30,
    aF: [60, 70],
    aB: step ? [-55, 70] : [20, 80],
    lF: step ? [-15, -25] : [60, -75],
    lB: step ? [55, -80] : [-35, -10],
  });

/** 들이받는 순간: 몸을 던지며 팔뚝을 쭉 뻗는다 */
const RUSH_IMPACT = pose(STAND, {
  torso: 50,
  head: -35,
  aF: [95, 10],
  aB: [-60, 40],
  lF: [55, -40],
  lB: [-45, -5],
});

const burstRush: MoveDef = {
  id: 'burstRush',
  name: '벅 러시',
  desc: '웅크린 채 벅 홉으로 연달아 뛰며 돌진해 어깨로 들이받는다. 한 번은 맞아도 멈추지 않는다(아머)',
  kind: 'special',
  total: 46,
  armor: [3, 22],
  anim: {
    keys: [
      { f: 0, p: STAND },
      ...genKeys(5, 21, 4, (_f, i) => chargePose((i % 2) as 0 | 1)),
      { f: 24, p: RUSH_IMPACT },
      { f: 30, p: CHEST_OUT },
      { f: 46, p: STAND },
    ],
  },
  velocity: [{ from: 5, to: 22, vx: 7 }],
  hits: [
    {
      frames: [10, 22],
      box: { x: 10, y: 60, w: 90, h: 100 },
      damage: 90,
      hitstun: 22,
      blockstun: 14,
      level: 'mid',
      knockdown: true,
      push: 10,
      chip: 8,
      hitstop: 12,
      heavy: true,
    },
  ],
};

const chestPop: MoveDef = {
  id: 'chestPop',
  name: '찢기',
  desc: '가슴을 움켜쥐었다가 바깥으로 찢어 젖히며 터뜨린다. 가드 불가지만 느려서 점프로 피할 수 있다',
  kind: 'special',
  total: 50,
  // 두 손으로 가슴을 움켜쥐고 웅크림 → 힘을 모음 → 두 팔을 앞뒤로 찢어 젖히며 가슴을 내민다
  anim: {
    keys: [
      { f: 0, p: STAND },
      { f: 10, p: pose(STAND, { torso: 30, head: -30, aF: [70, 150], aB: [60, 150], lF: [35, -55] }) },
      { f: 18, p: pose(STAND, { torso: 35, head: -32, aF: [72, 152], aB: [62, 152], lF: [38, -58] }) },
      { f: 21, p: pose(STAND, { torso: -18, head: 15, aF: [100, 5], aB: [-90, 10], lF: [40, -40] }) },
      { f: 26, p: pose(STAND, { torso: -18, head: 15, aF: [100, 5], aB: [-90, 10], lF: [40, -40] }) },
      { f: 50, p: STAND },
    ],
  },
  hits: [
    {
      frames: [21, 24],
      box: { x: 15, y: 60, w: 70, h: 110 },
      damage: 120,
      hitstun: 24,
      blockstun: 0,
      level: 'mid',
      unblockable: true,
      knockdown: true,
      push: 10,
      hitstop: 16,
      heavy: true,
    },
  ],
};

/** 점프 스톰프: 뛰어올라 두 발로 내리찍고, 바닥에 충격파가 퍼진다 (중단) */
const jumpStomp: MoveDef = {
  id: 'jumpStomp',
  name: '점프 스톰프',
  desc: '뛰어올라 두 발로 내리찍는 중단. 바닥에 짧은 충격파가 퍼진다',
  kind: 'special',
  total: 46,
  velocity: [{ from: 4, to: 17, vx: 5 }],
  anim: {
    snap: false,
    keys: [
      { f: 0, p: STAND },
      { f: 4, p: pose(CROUCH, { torso: 30 }) },
      { f: 10, p: pose(KNEE_UP, { y: 150, lB: [80, -120] }) },
      { f: 16, p: pose(KNEE_UP, { y: 130, lB: [80, -120] }) },
      { f: 19, p: STOMP },
      { f: 26, p: STOMP },
      { f: 46, p: STAND },
    ],
  },
  hits: [
    {
      frames: [18, 21],
      box: { x: 5, y: 0, w: 90, h: 100 },
      damage: 100,
      hitstun: 22,
      blockstun: 16,
      level: 'overhead',
      knockdown: true,
      push: 8,
      chip: 8,
      hitstop: 14,
      heavy: true,
    },
  ],
  projectile: {
    frame: 20,
    x: 60,
    y: 0,
    vx: 6,
    life: 24,
    box: { x: -22, y: 0, w: 44, h: 36 },
    kind: 'shockwave',
    hit: { damage: 40, hitstun: 18, blockstun: 12, level: 'low', chip: 4 },
  },
};

// ── 초필살기 ───────────────────────────────────────────────────────

const swingA = pose(STAND, { torso: 35, aF: [100, -10], aB: [-30, 60], lF: [40, -45] });
const swingB = pose(STAND, { torso: 35, aF: [-30, 60], aB: [100, -10], lF: [40, -45] });

const killOffHits: HitDef[] = [10, 17, 24, 31, 38].map((f) => ({
  frames: [f, f + 2],
  box: { x: 10, y: 60, w: 100, h: 100 },
  damage: 45,
  hitstun: 30,
  blockstun: 14,
  level: 'mid',
  push: 1,
  chip: 6,
  hitstop: 6,
}));

const killOff: MoveDef = {
  id: 'killOff',
  name: '킬 오프',
  desc: '암 스윙 연타 뒤 스톰프로 마무리하는 크럼프의 킬 오프',
  kind: 'super',
  total: 84,
  meterCost: 100,
  superFreeze: 40,
  invuln: [1, 15],
  anim: {
    keys: [
      { f: 0, p: STAND },
      ...genKeys(6, 41, 7, (_f, i) => (i % 2 ? swingB : swingA)),
      { f: 50, p: KNEE_UP },
      { f: 56, p: STOMP },
      { f: 70, p: STOMP },
      { f: 84, p: STAND },
    ],
  },
  velocity: [{ from: 5, to: 40, vx: 3.5 }],
  hits: [
    ...killOffHits,
    {
      frames: [55, 59],
      box: { x: -10, y: 0, w: 140, h: 120 },
      damage: 170,
      hitstun: 40,
      blockstun: 18,
      level: 'mid',
      launch: { vx: 5, vy: 13 },
      knockdown: true,
      chip: 20,
      hitstop: 18,
      heavy: true,
    },
  ],
};

export const KRUMP_MOVES: Record<string, MoveDef> = Object.fromEntries(
  [sLP, sHP, sLK, sHK, cLP, cHP, cLK, cHK, jL, jH, stompWave, burstUpper, burstRush, chestPop, jumpStomp, killOff].map(
    (m) => [m.id, m],
  ),
);
