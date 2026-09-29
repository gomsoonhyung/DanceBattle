import { DEG, lerp, type Vec2 } from '../core/math';

/**
 * 스틱맨 포즈. 로컬 좌표 기준: x = 캐릭터가 바라보는 방향 +, y = 위쪽 +.
 *
 * 각도(도) 규칙:
 * - rot:   몸 전체 회전. + 이면 윗부분이 앞으로 넘어감 (180 = 물구나무)
 * - torso: 상체 기울기. + 이면 앞으로 숙임
 * - head:  상체 대비 고개 각도
 * - 팔 [어깨, 팔꿈치]: 어깨는 "상체를 따라 아래로 늘어뜨린 상태"가 0, + 이면 앞으로 들어올림.
 *                     팔꿈치 + 이면 주먹이 앞/위로 접힘.
 * - 다리 [고관절, 무릎]: 고관절은 "수직 아래"가 0, + 이면 다리가 앞으로. 무릎 - 이면 자연스럽게 뒤로 접힘.
 * - x, y:  pivot 관절의 위치 (지면 기준). 기본 pivot은 골반(hip).
 */
export interface Pose {
  x: number;
  y: number;
  rot: number;
  torso: number;
  head: number;
  aF: [number, number]; // 앞팔 (화면 쪽)
  aB: [number, number]; // 뒷팔
  lF: [number, number]; // 앞다리
  lB: [number, number]; // 뒷다리
  /** 지면 스냅 이후 추가로 띄우는 높이 (점프성 동작용) */
  lift?: number;
}

/** 회전·위치의 기준 관절. 헤드스핀은 head, 윈드밀은 neck 기준으로 돈다. */
export type Pivot = 'hip' | 'neck' | 'head';

export const BONE = {
  torso: 58,
  neck: 8,
  headR: 15,
  upperArm: 32,
  foreArm: 30,
  thigh: 42,
  shin: 42,
} as const;

export interface Skeleton {
  hip: Vec2;
  neck: Vec2;
  head: Vec2;
  headAngle: number; // 머리가 향하는 방향(위쪽 벡터)의 각도, 모자 그리기용
  elbowF: Vec2;
  handF: Vec2;
  elbowB: Vec2;
  handB: Vec2;
  kneeF: Vec2;
  footF: Vec2;
  kneeB: Vec2;
  footB: Vec2;
}

/** "아래 방향 기준, 앞쪽으로 회전하는" 각도를 단위 벡터로. */
function dirFromDown(deg: number): Vec2 {
  const r = deg * DEG;
  return { x: Math.sin(r), y: -Math.cos(r) };
}

function add(p: Vec2, d: Vec2, len: number): Vec2 {
  return { x: p.x + d.x * len, y: p.y + d.y * len };
}

/** 포즈 → 관절 위치 (로컬 좌표). */
export function solvePose(p: Pose, pivot: Pivot = 'hip'): Skeleton {
  const hip = { x: 0, y: 0 };
  const torsoUp = { x: Math.sin(p.torso * DEG), y: Math.cos(p.torso * DEG) };
  const neck = add(hip, torsoUp, BONE.torso);
  const headAng = p.torso + p.head;
  const head = add(neck, { x: Math.sin(headAng * DEG), y: Math.cos(headAng * DEG) }, BONE.neck + BONE.headR);
  const shoulder = add(hip, torsoUp, BONE.torso - 4);

  const armBase = -p.torso;
  const elbowF = add(shoulder, dirFromDown(armBase + p.aF[0]), BONE.upperArm);
  const handF = add(elbowF, dirFromDown(armBase + p.aF[0] + p.aF[1]), BONE.foreArm);
  const elbowB = add(shoulder, dirFromDown(armBase + p.aB[0]), BONE.upperArm);
  const handB = add(elbowB, dirFromDown(armBase + p.aB[0] + p.aB[1]), BONE.foreArm);

  const kneeF = add(hip, dirFromDown(p.lF[0]), BONE.thigh);
  const footF = add(kneeF, dirFromDown(p.lF[0] + p.lF[1]), BONE.shin);
  const kneeB = add(hip, dirFromDown(p.lB[0]), BONE.thigh);
  const footB = add(kneeB, dirFromDown(p.lB[0] + p.lB[1]), BONE.shin);

  const pts = { hip, neck, head, elbowF, handF, elbowB, handB, kneeF, footF, kneeB, footB };

  // 몸 전체 회전 (+ = 시계방향 = 앞으로 넘어감)
  const r = -p.rot * DEG;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const rotated = (v: Vec2): Vec2 => ({ x: v.x * c - v.y * s, y: v.x * s + v.y * c });
  const pv = rotated(pts[pivot]);
  // pivot 관절이 (p.x, p.y)에 오도록 이동
  const ox = p.x - pv.x;
  const oy = p.y - pv.y;
  const out = {} as Record<keyof typeof pts, Vec2>;
  for (const key of Object.keys(pts) as (keyof typeof pts)[]) {
    const v = rotated(pts[key]);
    out[key] = { x: v.x + ox, y: v.y + oy };
  }
  return { ...out, headAngle: headAng + p.rot };
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l2 = (u: [number, number], v: [number, number]): [number, number] => [lerp(u[0], v[0], t), lerp(u[1], v[1], t)];
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    rot: lerp(a.rot, b.rot, t),
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head, b.head, t),
    aF: l2(a.aF, b.aF),
    aB: l2(a.aB, b.aB),
    lF: l2(a.lF, b.lF),
    lB: l2(a.lB, b.lB),
    lift: lerp(a.lift ?? 0, b.lift ?? 0, t),
  };
}

/**
 * 가장 낮은 신체 부위가 지면(y=0)에 닿도록 스켈레톤을 위아래로 옮긴다.
 * 포즈를 만들 때 골반 높이를 일일이 맞추지 않아도 된다.
 */
export function snapToGround(sk: Skeleton, lift = 0): Skeleton {
  const pts: (keyof Skeleton)[] = ['hip', 'neck', 'elbowF', 'handF', 'elbowB', 'handB', 'kneeF', 'footF', 'kneeB', 'footB'];
  let minY = sk.head.y - BONE.headR;
  for (const k of pts) minY = Math.min(minY, (sk[k] as Vec2).y - 3);
  return offsetSkeleton(sk, 0, lift - minY);
}

export function offsetSkeleton(sk: Skeleton, dx: number, dy: number): Skeleton {
  const out = { ...sk };
  for (const k of Object.keys(sk) as (keyof Skeleton)[]) {
    if (k === 'headAngle') continue;
    const v = sk[k] as Vec2;
    (out as Record<string, unknown>)[k] = { x: v.x + dx, y: v.y + dy };
  }
  return out;
}

/** 기준 포즈에서 일부만 바꾼 포즈를 만든다. */
export function pose(base: Pose, over: Partial<Pose>): Pose {
  return { ...base, ...over };
}

export interface Keyframe {
  f: number; // 몇 번째 프레임 (0부터)
  p: Pose;
}

export interface Anim {
  keys: Keyframe[];
  pivot?: Pivot;
  loop?: number; // 반복 주기 (프레임). 없으면 마지막 키에서 멈춤
  /** false면 지면 스냅을 하지 않고 pose.y를 그대로 쓴다 (공중 동작) */
  snap?: boolean;
}

/** 애니메이션의 특정 프레임을 관절 위치로 계산 (지면 스냅 포함). */
export function evalAnim(anim: Anim, frame: number): Skeleton {
  const p = sampleAnim(anim, frame);
  const sk = solvePose(p, anim.pivot ?? 'hip');
  return anim.snap === false ? sk : snapToGround(sk, p.lift ?? 0);
}

/** from~to 프레임 사이에 step 간격으로 키프레임을 생성 (회전 기술용). */
export function genKeys(from: number, to: number, step: number, fn: (f: number, i: number) => Pose): Keyframe[] {
  const out: Keyframe[] = [];
  let i = 0;
  for (let f = from; f <= to; f += step) out.push({ f, p: fn(f, i++) });
  return out;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

export function sampleAnim(anim: Anim, frame: number): Pose {
  const keys = anim.keys;
  let f = frame;
  if (anim.loop) f = ((frame % anim.loop) + anim.loop) % anim.loop;
  if (f <= keys[0].f) return keys[0].p;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f < b.f) return lerpPose(a.p, b.p, smooth((f - a.f) / (b.f - a.f)));
  }
  const last = keys[keys.length - 1];
  if (anim.loop) {
    // 마지막 키 → 첫 키로 이어서 반복
    const first = keys[0];
    return lerpPose(last.p, first.p, smooth((f - last.f) / (anim.loop - last.f)));
  }
  return last.p;
}
