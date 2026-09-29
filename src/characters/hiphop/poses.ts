import { pose, type Anim, type Pose } from '../../anim/pose';
import { baseAnims } from '../common';

/** 힙합 기본 자세: 무릎으로 리듬을 타는 바운스, 팔은 느슨하게 */
export const STAND: Pose = {
  x: 0,
  y: 80,
  rot: 0,
  torso: 12,
  head: -8,
  aF: [30, 80],
  aB: [10, 70],
  lF: [20, -25],
  lB: [-15, -20],
};

/** 바운스의 아래 박자 */
export const DOWN = pose(STAND, { torso: 18, head: -2, lF: [35, -55], lB: [-5, -45], aF: [35, 90] });

export const CROUCH: Pose = {
  x: 0,
  y: 50,
  rot: 0,
  torso: 35,
  head: -15,
  aF: [60, 70],
  aB: [30, 80],
  lF: [85, -100],
  lB: [45, -115],
};

/** 러닝맨: 무릎을 올리며 반대쪽 발을 끌어당기는 스텝 */
export const RUN_A = pose(STAND, { torso: 5, lF: [75, -95], lB: [-25, -10], aF: [70, 60], aB: [-25, 60] });
export const RUN_B = pose(STAND, { torso: 5, lB: [70, -100], lF: [-20, -15], aB: [70, 60], aF: [-25, 60] });

/** 크립 워크: 발뒤꿈치와 발끝을 번갈아 비트는 스텝 */
export const CRIP_A = pose(STAND, { torso: 15, lF: [55, -15], lB: [-10, -30], aF: [40, 100], aB: [20, 100] });
export const CRIP_B = pose(STAND, { torso: 15, lF: [20, -40], lB: [25, -10], aF: [20, 100], aB: [40, 100] });

/** 로저 래빗: 뒤로 튕기며 다리를 뒤로 차는 동작 */
export const ROGER = pose(STAND, { lift: 30, torso: 20, lF: [-20, -80], lB: [-40, -20], aF: [80, 50], aB: [60, 60] });

/** 팔짱 끼고 몸을 젖힌 여유로운 자세 */
export const COOL = pose(STAND, { torso: -8, head: -12, aF: [80, 120], aB: [70, 130], lF: [25, -10], lB: [-20, -5] });

export const common = baseAnims(STAND, CROUCH).anims;

export const idle: Anim = {
  loop: 24,
  keys: [
    { f: 0, p: STAND },
    { f: 12, p: DOWN },
  ],
};

export const walkF: Anim = {
  loop: 32,
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: RUN_A },
    { f: 16, p: DOWN },
    { f: 24, p: RUN_B },
  ],
};

/** 뒤로 미끄러지는 문워크 느낌 */
export const walkB: Anim = {
  loop: 32,
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: pose(STAND, { lB: [-30, -5], lF: [10, -40] }) },
    { f: 16, p: DOWN },
    { f: 24, p: pose(STAND, { lF: [-25, -5], lB: [10, -40] }) },
  ],
};

export const crouch: Anim = {
  loop: 30,
  keys: [
    { f: 0, p: CROUCH },
    { f: 15, p: pose(CROUCH, { torso: 40 }) },
  ],
};

export const win: Anim = {
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: DOWN },
    { f: 16, p: COOL },
  ],
};
