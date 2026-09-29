import { pose, type Anim, type Pose } from '../../anim/pose';
import { baseAnims } from '../common';

/** 걸스힙합 기본 자세: 골반을 옆으로 빼고 한 손은 허리에 */
export const STAND: Pose = {
  x: -4,
  y: 82,
  rot: 0,
  torso: 5,
  head: -5,
  aF: [25, 120],
  aB: [-25, 95],
  lF: [18, -20],
  lB: [-10, -5],
};

/** 골반 웨이브: 좌우로 흔드는 두 자세 */
export const SWAY_A = pose(STAND, { x: 6, torso: -5, head: 5 });
export const SWAY_B = pose(STAND, { x: -8, torso: 12, head: -10 });

export const CROUCH: Pose = {
  x: 0,
  y: 50,
  rot: 0,
  torso: 25,
  head: -5,
  aF: [70, 110],
  aB: [30, 100],
  lF: [85, -100],
  lB: [40, -120],
};

/** 헤어 플립: 고개를 앞으로 휘두른 순간 / 뒤로 젖힌 순간 */
export const HAIR_FLIP_A = pose(STAND, { torso: 25, head: 35, aF: [80, -10], aB: [-25, 95] });
export const HAIR_FLIP_B = pose(STAND, { torso: -15, head: -35, aF: [170, -120], aB: [-25, 95] });

/** 힙 범프: 골반을 앞으로 튕긴다 */
export const HIP_BUMP = pose(STAND, {
  x: 22,
  torso: -22,
  head: -10,
  aF: [40, 110],
  aB: [-30, 95],
  lF: [10, -10],
  lB: [-25, -15],
});

/** 블로우 키스: 입술에 댄 손을 앞으로 내민다 */
export const KISS_READY = pose(STAND, { head: 5, aF: [120, -130] });
export const KISS = pose(STAND, { torso: -5, aF: [95, 0] });

/** 회전 하이킥 (대공) */
export const TURN_KICK = pose(STAND, {
  lift: 30,
  torso: -20,
  lF: [160, 0],
  lB: [0, -30],
  aF: [-30, 40],
  aB: [130, 20],
});

/** 승리: 머리를 넘기며 허리에 손 */
export const WIN = pose(STAND, { x: -6, head: -30, aF: [160, -120], aB: [-25, 95], lF: [25, -5], lB: [-15, -10] });

export const common = baseAnims(STAND, CROUCH).anims;

export const idle: Anim = {
  loop: 30,
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: SWAY_A },
    { f: 15, p: STAND },
    { f: 23, p: SWAY_B },
  ],
};

/** 다리를 교차하며 걷는 캣워크 */
export const walkF: Anim = {
  loop: 32,
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: pose(STAND, { x: 6, lF: [30, -10], lB: [-5, -25] }) },
    { f: 16, p: STAND },
    { f: 24, p: pose(STAND, { x: -6, lB: [25, -15], lF: [-5, -25] }) },
  ],
};

export const walkB: Anim = {
  loop: 32,
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: pose(STAND, { x: -6, lB: [-30, -10], lF: [15, -25] }) },
    { f: 16, p: SWAY_B },
    { f: 24, p: pose(STAND, { lF: [-10, -15] }) },
  ],
};

export const crouch: Anim = {
  loop: 40,
  keys: [
    { f: 0, p: CROUCH },
    { f: 20, p: pose(CROUCH, { x: 6 }) },
  ],
};

export const win: Anim = {
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: HAIR_FLIP_B },
    { f: 18, p: WIN },
  ],
};
