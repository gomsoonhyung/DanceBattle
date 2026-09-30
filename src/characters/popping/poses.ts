import { pose, type Anim, type Pose } from '../../anim/pose';
import { baseAnims } from '../common';

/** 팝핑 기본 자세: 꼿꼿하게 서서 팔을 직각으로 꺾은 튜팅 자세 */
export const STAND: Pose = {
  x: 0,
  y: 82,
  rot: 0,
  torso: 0,
  head: 0,
  aF: [90, 90],
  aB: [0, 90],
  lF: [10, -5],
  lB: [-10, -5],
};

/** 팝: 근육을 순간적으로 튕기는 수축 */
export const POP = pose(STAND, { torso: 5, head: -5, lF: [14, -14], lB: [-12, -12] });

/** 튜팅: 팔로 각을 만드는 자세들 */
export const TUT_B = pose(STAND, { aF: [0, 90], aB: [90, 90] });
export const TUT_C = pose(STAND, { aF: [90, -90], aB: [0, 90], head: -10 });

export const CROUCH: Pose = {
  x: 0,
  y: 50,
  rot: 0,
  torso: 30,
  head: -10,
  aF: [90, 90],
  aB: [40, 90],
  lF: [85, -95],
  lB: [40, -120],
};

/** 로봇: 뻣뻣하게 뻗는 팔 */
export const ROBO_A = pose(STAND, { torso: 5, aF: [90, 0], aB: [0, 90] });
export const ROBO_B = pose(STAND, { torso: 5, aF: [0, 90], aB: [90, 0] });

/** 웨이브: 에너지가 몸에서 팔끝으로 흘러가는 순서 */
export const WAVE_1 = pose(STAND, { torso: -5, aF: [80, 80], aB: [80, 80] });
export const WAVE_RELEASE = pose(STAND, { torso: 10, aF: [92, 0], aB: [20, 90], lF: [25, -15] });

/** 애니메이션 글라이드: 미끄러지듯 이동하는 자세 */
export const GLIDE = pose(STAND, { torso: 10, aF: [92, 0], aB: [80, 0], lF: [40, -5], lB: [-30, -5] });

export const WIN = pose(STAND, { torso: -3, head: -15, aF: [90, 90], aB: [90, -90] });

export const common = baseAnims(STAND, CROUCH).anims;

/** 로봇처럼 뚝뚝 끊기는 대기 동작: 같은 자세를 두 번 두어 멈춘 뒤 빠르게 다음 자세로 */
export const idle: Anim = {
  loop: 42,
  keys: [
    { f: 0, p: STAND },
    { f: 7, p: STAND },
    { f: 9, p: POP },
    { f: 11, p: STAND },
    { f: 19, p: STAND },
    { f: 21, p: TUT_B },
    { f: 29, p: TUT_B },
    { f: 31, p: TUT_C },
    { f: 39, p: TUT_C },
  ],
};

/** 발을 떼지 않고 미끄러지는 글라이드 */
export const walkF: Anim = {
  loop: 36,
  keys: [
    { f: 0, p: STAND },
    { f: 9, p: pose(STAND, { lF: [30, -5], lB: [-20, -5] }) },
    { f: 18, p: STAND },
    { f: 27, p: pose(STAND, { lB: [25, -5], lF: [-15, -5] }) },
  ],
};

export const walkB: Anim = {
  loop: 36,
  keys: [
    { f: 0, p: STAND },
    { f: 9, p: pose(STAND, { lB: [-30, -5], lF: [15, -5] }) },
    { f: 18, p: STAND },
    { f: 27, p: pose(STAND, { lF: [-25, -5], lB: [10, -5] }) },
  ],
};

export const crouch: Anim = {
  loop: 30,
  keys: [
    { f: 0, p: CROUCH },
    { f: 14, p: CROUCH },
    { f: 16, p: pose(CROUCH, { aF: [0, 90], aB: [90, 90] }) },
  ],
};

export const win: Anim = {
  keys: [
    { f: 0, p: STAND },
    { f: 6, p: POP },
    { f: 10, p: TUT_C },
    { f: 18, p: TUT_C },
    { f: 20, p: WIN },
  ],
};
