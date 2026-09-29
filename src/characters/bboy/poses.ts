import { pose, type Anim, type Pose } from '../../anim/pose';
import { armW, legW, LYING } from '../common';

export { armW, JUMP_FALL, JUMP_TUCK, legW } from '../common';
export { jump, knockdown } from '../common';

/** 탑락 기본 자세: 가드를 올리고 무릎을 살짝 굽힌 상태 */
export const STAND: Pose = {
  x: 0,
  y: 82,
  rot: 0,
  torso: 8,
  head: -5,
  aF: [40, 100],
  aB: [25, 110],
  lF: [15, -12],
  lB: [-12, -6],
};

export const STAND_DIP = pose(STAND, {
  torso: 14,
  aF: [34, 108],
  aB: [18, 118],
  lF: [30, -40],
  lB: [-2, -34],
});

export const CROUCH: Pose = {
  x: 0,
  y: 50,
  rot: 0,
  torso: 38,
  head: -20,
  aF: [70, 80],
  aB: [40, 95],
  lF: [82, -92],
  lB: [50, -110],
};

/** 한 손을 바닥에 짚은 다운락 자세 */
export const CROUCH_HAND = pose(CROUCH, { torso: 55, head: -30, aF: [55, 0], aB: [50, 90] });

export const PREJUMP = pose(STAND, { torso: 18, lF: [40, -60], lB: [10, -58], aF: [20, 90], aB: [0, 90] });

export const HIT_STAND = pose(STAND, {
  torso: -22,
  head: -18,
  aF: [25, 50],
  aB: [-15, 40],
  lF: [20, -15],
  lB: [-20, -8],
});

export const HIT_CROUCH = pose(CROUCH, { torso: 12, head: -30, aF: [30, 60], aB: [10, 50] });

export const BLOCK_STAND = pose(STAND, { torso: 2, head: 5, aF: [60, 125], aB: [50, 130], lF: [20, -20], lB: [-18, -10] });
export const BLOCK_CROUCH = pose(CROUCH, { torso: 25, head: 0, aF: [75, 120], aB: [65, 125] });

/** 체어 프리즈: 한 손으로 바닥을 짚고 몸을 거꾸로 세운 자세 */
export const FREEZE: Pose = {
  x: 0,
  y: 40,
  rot: 115,
  torso: 0,
  head: 25,
  aF: [armW(0, 115), 0],
  aB: [armW(35, 115), 40],
  lF: [legW(-160, 115), -95],
  lB: [legW(-120, 115), -70],
};

export const idle: Anim = {
  loop: 36,
  keys: [
    { f: 0, p: STAND },
    { f: 18, p: STAND_DIP },
  ],
};

/** 앞으로 걷기 = 탑락 인디언 스텝 (다리를 교차하며 전진) */
export const walkF: Anim = {
  loop: 40,
  keys: [
    { f: 0, p: STAND },
    {
      f: 10,
      p: pose(STAND, { torso: 0, aF: [75, 40], aB: [-30, 70], lF: [50, -30], lB: [-8, -12] }),
    },
    { f: 20, p: STAND_DIP },
    {
      f: 30,
      p: pose(STAND, { torso: 16, aF: [-10, 90], aB: [80, 50], lF: [0, -10], lB: [42, -40] }),
    },
  ],
};

export const walkB: Anim = {
  loop: 32,
  keys: [
    { f: 0, p: STAND },
    { f: 8, p: pose(STAND, { torso: -4, lB: [-38, -15], lF: [22, -20], aB: [-10, 80] }) },
    { f: 16, p: STAND_DIP },
    { f: 24, p: pose(STAND, { torso: 4, lF: [-5, -25], lB: [-30, -8], aF: [55, 90] }) },
  ],
};

export const crouch: Anim = {
  loop: 40,
  keys: [
    { f: 0, p: CROUCH },
    { f: 20, p: pose(CROUCH, { torso: 42, aF: [65, 88] }) },
  ],
};

export const prejump: Anim = { keys: [{ f: 0, p: STAND }, { f: 3, p: PREJUMP }] };

export const land: Anim = { keys: [{ f: 0, p: PREJUMP }, { f: 4, p: STAND }] };

export const hitStand: Anim = { keys: [{ f: 0, p: STAND }, { f: 3, p: HIT_STAND }, { f: 16, p: STAND }] };
export const hitCrouch: Anim = { keys: [{ f: 0, p: CROUCH }, { f: 3, p: HIT_CROUCH }, { f: 16, p: CROUCH }] };
export const blockStand: Anim = { keys: [{ f: 0, p: BLOCK_STAND }] };
export const blockCrouch: Anim = { keys: [{ f: 0, p: BLOCK_CROUCH }] };

export const airHit: Anim = {
  snap: false,
  keys: [
    { f: 0, p: pose(HIT_STAND, { y: 70, rot: -30, aF: [130, 30], aB: [160, 20], lF: [40, -30], lB: [10, -40] }) },
    { f: 24, p: pose(HIT_STAND, { y: 40, rot: -75, aF: [150, 10], aB: [170, 10], lF: [30, -20], lB: [0, -30] }) },
  ],
};

export const getup: Anim = {
  keys: [
    { f: 0, p: LYING },
    {
      f: 9,
      p: pose(LYING, {
        aF: [armW(-150, -90), -110],
        aB: [armW(-140, -90), -100],
        lF: [legW(165, -90), -40],
        lB: [legW(150, -90), -30],
      }),
    },
    {
      f: 15,
      p: pose(STAND, { rot: -20, torso: -10, lift: 25, aF: [100, 20], aB: [80, 30], lF: [30, -50], lB: [0, -40] }),
    },
    { f: 20, p: CROUCH },
    { f: 26, p: STAND },
  ],
};

export const win: Anim = {
  keys: [
    { f: 0, p: STAND },
    { f: 10, p: CROUCH_HAND },
    { f: 20, p: FREEZE },
  ],
};
