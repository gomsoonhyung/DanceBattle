import { pose, type Anim, type Pose } from '../../anim/pose';
import { baseAnims } from '../common';

/** 락킹 기본 자세: 꼿꼿하게 서서 가볍게 튕기는 페이싱 스탠스 */
export const STAND: Pose = {
  x: 0,
  y: 82,
  rot: 0,
  torso: 2,
  head: 0,
  aF: [35, 95],
  aB: [15, 105],
  lF: [12, -10],
  lB: [-10, -6],
};

const BOUNCE = { lF: [20, -30] as [number, number], lB: [-5, -25] as [number, number] };

export const CROUCH: Pose = {
  x: 0,
  y: 50,
  rot: 0,
  torso: 20,
  head: -10,
  aF: [60, 110],
  aB: [40, 110],
  lF: [85, -95],
  lB: [30, -130],
};

/** 엉클 샘 포인트: 팔을 쭉 뻗어 상대를 가리킨다 */
export const POINT = pose(STAND, { torso: 15, head: -5, aF: [92, 0], aB: [20, 110], lF: [40, -30], lB: [-20, -5] });

/** 락: 양팔을 앞으로 뻗은 채 순간 정지 */
export const LOCK = pose(STAND, { torso: 15, aF: [100, -5], aB: [85, 10], lF: [25, -20] });

/** 손목 돌리기 두 자세 (번갈아 보간하면 돌리는 것처럼 보인다) */
export const ROLL_A = pose(STAND, { torso: 8, aF: [80, 130], aB: [65, 100], ...BOUNCE });
export const ROLL_B = pose(STAND, { torso: 8, aF: [65, 100], aB: [80, 130] });

/** 스쿠비 두 스텝: 무릎을 차올리는 걸음 */
export const STEP_F = pose(STAND, { torso: -8, lF: [70, -90], aF: [-20, 80], aB: [60, 90] });
export const STEP_B = pose(STAND, { torso: -8, lB: [65, -95], aB: [-20, 80], aF: [60, 90] });

/** 양 무릎을 꿇은 자세 (니 드롭 착지) */
export const KNEEL = pose(STAND, { torso: -10, head: 0, aF: [160, -10], aB: [150, -10], lF: [5, -95], lB: [-5, -90] });

/** 앞뒤로 다리를 찢어 앉는 스플릿 */
export const SPLIT = pose(STAND, { torso: 0, head: -5, aF: [150, 0], aB: [120, 0], lF: [90, 0], lB: [-90, 0] });

const base = baseAnims(STAND, CROUCH);
export const common = base.anims;

export const idle: Anim = {
  loop: 40,
  keys: [
    { f: 0, p: STAND },
    { f: 10, p: pose(STAND, { aF: [70, 120], aB: [40, 130], ...BOUNCE }) },
    { f: 20, p: STAND },
    { f: 30, p: pose(STAND, { aF: [20, 140], aB: [60, 110], ...BOUNCE }) },
  ],
};

export const walkF: Anim = {
  loop: 32,
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: STEP_F },
    { f: 16, p: STAND },
    { f: 24, p: STEP_B },
  ],
};

export const walkB: Anim = {
  loop: 32,
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: pose(STAND, { lB: [-35, -10], lF: [15, -25], aF: [80, 60] }) },
    { f: 16, p: STAND },
    { f: 24, p: pose(STAND, { lF: [-10, -20], aB: [70, 70] }) },
  ],
};

export const crouch: Anim = {
  loop: 40,
  keys: [
    { f: 0, p: CROUCH },
    { f: 20, p: pose(CROUCH, { torso: 24, aF: [55, 115] }) },
  ],
};

/** 승리: 하늘을 가리켰다가 관객을 향해 포인트 */
export const win: Anim = {
  keys: [
    { f: 0, p: STAND },
    { f: 10, p: pose(STAND, { torso: -10, aF: [150, 0] }) },
    { f: 22, p: POINT },
  ],
};
