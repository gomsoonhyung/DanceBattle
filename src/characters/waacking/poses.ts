import { pose, type Anim, type Pose } from '../../anim/pose';
import { baseAnims } from '../common';

/** 왁킹 기본 자세: 한 팔은 우아하게 들고, 한 손은 허리에. 턱을 살짝 든다 */
export const STAND: Pose = {
  x: 0,
  y: 82,
  rot: 0,
  torso: -3,
  head: 6,
  aF: [150, 30],
  aB: [-25, 85],
  lF: [12, -8],
  lB: [-12, -4],
};

/** 팔을 바꿔 든 자세 */
export const STAND_B = pose(STAND, { aF: [-25, 85], aB: [150, 30] });

export const CROUCH: Pose = {
  x: 0,
  y: 50,
  rot: 0,
  torso: 25,
  head: 0,
  aF: [130, 40],
  aB: [40, 90],
  lF: [85, -95],
  lB: [40, -120],
};

/** 암 롤: 팔을 머리 뒤로 감아 올리는 준비 동작 */
export const ROLL_A = pose(STAND, { aF: [165, -70], aB: [100, 40] });
export const ROLL_B = pose(STAND, { aF: [100, 40], aB: [165, -70] });

/** 왁: 팔을 채찍처럼 앞으로 내려치는 순간 */
export const WHIP_A = pose(STAND, { torso: 12, aF: [95, 0], aB: [170, -40] });
export const WHIP_B = pose(STAND, { torso: 12, aF: [170, -40], aB: [95, 0] });

/** 포즈: 손을 머리에 대고 멈춰 서는 보깅 프레임 */
export const POSE = pose(STAND, { torso: -8, head: 18, aF: [175, -150], aB: [-25, 85], lF: [25, -5], lB: [-8, -20] });

export const common = baseAnims(STAND, CROUCH).anims;

export const idle: Anim = {
  loop: 40,
  keys: [
    { f: 0, p: STAND },
    { f: 10, p: pose(STAND, { aF: [160, 10], lF: [15, -20], lB: [-8, -15] }) },
    { f: 20, p: STAND_B },
    { f: 30, p: pose(STAND_B, { aB: [160, 10], lF: [15, -20], lB: [-8, -15] }) },
  ],
};

/** 팔을 돌리며 걷는 우아한 스텝 */
export const walkF: Anim = {
  loop: 36,
  keys: [
    { f: 0, p: STAND },
    { f: 9, p: pose(ROLL_A, { lF: [35, -20], lB: [-15, -5] }) },
    { f: 18, p: STAND_B },
    { f: 27, p: pose(ROLL_B, { lB: [30, -30], lF: [-5, -5] }) },
  ],
};

export const walkB: Anim = {
  loop: 36,
  keys: [
    { f: 0, p: STAND },
    { f: 9, p: pose(STAND, { lB: [-30, -10], lF: [15, -20] }) },
    { f: 18, p: STAND_B },
    { f: 27, p: pose(STAND_B, { lF: [-5, -20], lB: [-20, -5] }) },
  ],
};

export const crouch: Anim = {
  loop: 40,
  keys: [
    { f: 0, p: CROUCH },
    { f: 20, p: pose(CROUCH, { aF: [150, 20] }) },
  ],
};

export const win: Anim = {
  keys: [
    { f: 0, p: STAND },
    { f: 10, p: ROLL_A },
    { f: 20, p: POSE },
  ],
};
