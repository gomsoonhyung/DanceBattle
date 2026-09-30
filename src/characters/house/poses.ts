import { pose, type Anim, type Pose } from '../../anim/pose';
import { baseAnims } from '../common';

/** 하우스 기본 자세: 가볍게 선 채 상체로 박자를 탄다 */
export const STAND: Pose = {
  x: 0,
  y: 82,
  rot: 0,
  torso: 6,
  head: -3,
  aF: [30, 70],
  aB: [15, 60],
  lF: [15, -15],
  lB: [-10, -10],
};

/** 잭킹: 가슴을 앞뒤로 튕기는 하우스의 기본 그루브 */
export const JACK_A = pose(STAND, { torso: 22, head: -12, lF: [22, -28], lB: [-5, -22] });
export const JACK_B = pose(STAND, { torso: -6, head: 6 });

export const CROUCH: Pose = {
  x: 0,
  y: 50,
  rot: 0,
  torso: 30,
  head: -10,
  aF: [50, 80],
  aB: [20, 80],
  lF: [85, -100],
  lB: [40, -120],
};

/** 셔플: 발을 번갈아 차내는 스텝 */
export const SHUF_A = pose(STAND, { torso: 0, lF: [55, -15], lB: [-5, -20] });
export const SHUF_B = pose(STAND, { torso: 0, lF: [-10, -20], lB: [50, -15] });

/** 낮은 셔플: 무릎을 굽힌 채 바닥 가까이 차는 풋워크 */
export const SHUF_LOW_A = pose(STAND, { torso: 15, lF: [70, -5], lB: [-15, -60] });
export const SHUF_LOW_B = pose(STAND, { torso: 15, lF: [-15, -60], lB: [70, -5] });

/** 스케이트 슬라이드: 몸을 뒤로 눕히고 앞발부터 미끄러진다 */
export const SLIDE = pose(CROUCH, { torso: -40, head: 10, lF: [88, 0], lB: [40, -120], aF: [60, 40], aB: [-60, 0] });

/** 로프팅: 공중에서 몸을 틀며 차올리는 킥 */
export const LOFT_KICK = pose(STAND, {
  lift: 45,
  rot: 20,
  torso: -10,
  lF: [150, 0],
  lB: [20, -80],
  aF: [100, 20],
  aB: [-40, 30],
});

export const WIN = pose(JACK_B, { aF: [160, 0], aB: [150, 10], lF: [30, -20] });

export const common = baseAnims(STAND, CROUCH).anims;

export const idle: Anim = {
  loop: 20,
  keys: [
    { f: 0, p: STAND },
    { f: 5, p: JACK_A },
    { f: 10, p: STAND },
    { f: 15, p: JACK_B },
  ],
};

export const walkF: Anim = {
  loop: 24,
  keys: [
    { f: 0, p: STAND },
    { f: 6, p: SHUF_A },
    { f: 12, p: JACK_A },
    { f: 18, p: SHUF_B },
  ],
};

export const walkB: Anim = {
  loop: 24,
  keys: [
    { f: 0, p: STAND },
    { f: 6, p: pose(STAND, { lB: [-35, -10], lF: [10, -20] }) },
    { f: 12, p: JACK_B },
    { f: 18, p: pose(STAND, { lF: [-25, -10] }) },
  ],
};

export const crouch: Anim = {
  loop: 20,
  keys: [
    { f: 0, p: CROUCH },
    { f: 10, p: pose(CROUCH, { torso: 38 }) },
  ],
};

export const win: Anim = {
  keys: [
    { f: 0, p: STAND },
    { f: 6, p: JACK_A },
    { f: 14, p: WIN },
  ],
};
