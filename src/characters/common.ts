import { pose, type Anim, type Pose } from '../anim/pose';

/*
 * 캐릭터 공통 포즈와 애니메이션.
 * 각도 규칙은 anim/pose.ts 참고.
 * 몸 전체가 rot만큼 돌아간 상태에서 "월드 기준" 각도를 원할 때:
 *   다리 고관절 = 월드각 + rot
 *   팔 어깨     = 월드각 + torso + rot
 * (월드각: 수직 아래 = 0, 앞쪽 = 90, 위 = 180, 뒤 = -90)
 */
export const legW = (world: number, rot: number) => world + rot;
export const armW = (world: number, rot: number, torso = 0) => world + torso + rot;

export const JUMP_TUCK: Pose = {
  x: 0,
  y: 95,
  rot: 0,
  torso: 10,
  head: -5,
  aF: [100, 50],
  aB: [70, 70],
  lF: [75, -115],
  lB: [45, -105],
};

export const JUMP_FALL = pose(JUMP_TUCK, { lF: [25, -35], lB: [-10, -25], aF: [60, 80], aB: [30, 90] });

/** 등으로 누운 자세 (다운) */
export const LYING: Pose = {
  x: 0,
  y: 10,
  rot: -90,
  torso: 0,
  head: 10,
  aF: [150, 10],
  aB: [120, 20],
  lF: [5, -15],
  lB: [-5, -5],
};

export const jump: Anim = {
  snap: false,
  keys: [
    { f: 0, p: JUMP_TUCK },
    { f: 18, p: pose(JUMP_TUCK, { lF: [85, -125], lB: [55, -115] }) },
    { f: 34, p: JUMP_FALL },
  ],
};

export const knockdown: Anim = {
  keys: [
    { f: 0, p: pose(LYING, { lF: [30, -40], lB: [20, -30] }) },
    { f: 8, p: LYING },
  ],
};

/** 캐릭터의 기본 서기/앉기 자세로 피격·가드·점프 준비 등 공통 동작을 만든다. */
export function baseAnims(stand: Pose, crouch: Pose) {
  const prejumpPose = pose(stand, { torso: stand.torso + 10, lF: [40, -60], lB: [10, -58], aF: [20, 90], aB: [0, 90] });
  const hitStandPose = pose(stand, {
    torso: -22,
    head: -18,
    aF: [25, 50],
    aB: [-15, 40],
    lF: [20, -15],
    lB: [-20, -8],
  });
  const hitCrouchPose = pose(crouch, { torso: 12, head: -30, aF: [30, 60], aB: [10, 50] });
  const blockStandPose = pose(stand, { torso: 2, head: 5, aF: [60, 125], aB: [50, 130], lF: [20, -20], lB: [-18, -10] });
  const blockCrouchPose = pose(crouch, { torso: 25, head: 0, aF: [75, 120], aB: [65, 125] });

  const anims = {
    prejump: { keys: [{ f: 0, p: stand }, { f: 3, p: prejumpPose }] } as Anim,
    jump,
    land: { keys: [{ f: 0, p: prejumpPose }, { f: 4, p: stand }] } as Anim,
    hitStand: { keys: [{ f: 0, p: stand }, { f: 3, p: hitStandPose }, { f: 16, p: stand }] } as Anim,
    hitCrouch: { keys: [{ f: 0, p: crouch }, { f: 3, p: hitCrouchPose }, { f: 16, p: crouch }] } as Anim,
    blockStand: { keys: [{ f: 0, p: blockStandPose }] } as Anim,
    blockCrouch: { keys: [{ f: 0, p: blockCrouchPose }] } as Anim,
    airHit: {
      snap: false,
      keys: [
        { f: 0, p: pose(hitStandPose, { y: 70, rot: -30, aF: [130, 30], aB: [160, 20], lF: [40, -30], lB: [10, -40] }) },
        { f: 24, p: pose(hitStandPose, { y: 40, rot: -75, aF: [150, 10], aB: [170, 10], lF: [30, -20], lB: [0, -30] }) },
      ],
    } as Anim,
    knockdown,
    /** 평범한 기상: 옆으로 굴러 일어난다 */
    getup: {
      keys: [
        { f: 0, p: LYING },
        { f: 8, p: pose(LYING, { rot: -60, lF: [80, -120], lB: [60, -110] }) },
        { f: 16, p: pose(crouch, { torso: 50 }) },
        { f: 26, p: stand },
      ],
    } as Anim,
  };
  return { poses: { prejump: prejumpPose, hitStand: hitStandPose }, anims };
}
