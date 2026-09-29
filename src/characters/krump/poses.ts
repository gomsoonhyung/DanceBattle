import { pose, type Anim, type Pose } from '../../anim/pose';
import { baseAnims } from '../common';

/** 크럼프 기본 자세: 다리를 넓게 벌리고 상체를 숙인 공격적인 스탠스 */
export const STAND: Pose = {
  x: 0,
  y: 80,
  rot: 0,
  torso: 18,
  head: -12,
  aF: [55, 105],
  aB: [45, 95],
  lF: [28, -38],
  lB: [-22, -22],
};

/** 체스트 팝: 가슴을 앞으로 튕기며 팔을 뒤로 당김 */
export const CHEST_OUT = pose(STAND, { torso: 0, head: -22, aF: [20, 95], aB: [10, 100] });
export const DIP = pose(STAND, { torso: 26, lF: [38, -58], lB: [-12, -44], aF: [62, 110] });

export const CROUCH: Pose = {
  x: 0,
  y: 50,
  rot: 0,
  torso: 40,
  head: -25,
  aF: [75, 85],
  aB: [55, 90],
  lF: [85, -100],
  lB: [45, -115],
};

/** 무릎을 높이 들어 올린 스톰프 준비 자세 */
export const KNEE_UP = pose(STAND, { torso: 5, head: -5, lF: [95, -115], lB: [-10, -10], aF: [110, 50], aB: [90, 60] });
/** 발을 내리찍은 스톰프 자세 */
export const STOMP = pose(CROUCH, { torso: 45, lF: [60, -50], lB: [20, -100], aF: [40, 10], aB: [30, 20] });

const base = baseAnims(STAND, CROUCH);
export const common = base.anims;

export const idle: Anim = {
  loop: 30,
  keys: [
    { f: 0, p: STAND },
    { f: 5, p: CHEST_OUT },
    { f: 10, p: STAND },
    { f: 18, p: DIP },
  ],
};

/** 무릎을 들었다 내리찍으며 걷는 스톰프 워크 */
export const walkF: Anim = {
  loop: 44,
  keys: [
    { f: 0, p: STAND },
    { f: 10, p: pose(STAND, { torso: 12, lF: [80, -105], aF: [20, 100], aB: [70, 80] }) },
    { f: 22, p: DIP },
    { f: 32, p: pose(STAND, { torso: 12, lB: [75, -110], lF: [0, -20], aF: [70, 80], aB: [20, 100] }) },
  ],
};

export const walkB: Anim = {
  loop: 36,
  keys: [
    { f: 0, p: STAND },
    { f: 9, p: pose(STAND, { torso: 10, lB: [-40, -20], lF: [30, -45] }) },
    { f: 18, p: DIP },
    { f: 27, p: pose(STAND, { lF: [5, -30], lB: [-30, -15] }) },
  ],
};

export const crouch: Anim = {
  loop: 40,
  keys: [
    { f: 0, p: CROUCH },
    { f: 20, p: pose(CROUCH, { torso: 44, aF: [70, 90] }) },
  ],
};

/** 승리: 가슴을 튕기고 주먹을 치켜든다 */
export const win: Anim = {
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: CHEST_OUT },
    { f: 16, p: pose(CHEST_OUT, { torso: -8, head: -25, aF: [172, -20], aB: [60, 90], lF: [25, -30], lB: [-25, -20] }) },
  ],
};
