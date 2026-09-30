import type { Keyframe, Pose } from '../anim/pose';
import type { Rect } from '../core/math';
import type { HitDef, MoveDef, MoveKind, ProjectileDef } from '../fighter/types';
import { JUMP_FALL, JUMP_TUCK } from './common';

/*
 * 기술 데이터를 짧게 쓰기 위한 도우미.
 * 발생 프레임, 자세, 판정만 주면 애니메이션 키프레임과 히트 데이터를 만들어 준다.
 * 세밀한 조정이 필요하면 MoveDef를 직접 써도 된다 (bboy/moves.ts 참고).
 */

export type HitExtra = Partial<Omit<HitDef, 'frames' | 'box' | 'damage'>>;

/** 데미지로 기본 경직·타격감을 정한다 (강할수록 길게) */
function hitDefaults(damage: number): Pick<HitDef, 'hitstun' | 'blockstun' | 'hitstop' | 'heavy'> {
  const hitstun = Math.round(12 + damage / 10);
  return { hitstun, blockstun: hitstun - 5, hitstop: damage >= 70 ? 11 : 8, heavy: damage >= 70 };
}

export function hit(frames: [number, number], box: Rect, damage: number, extra: HitExtra = {}): HitDef {
  return { frames, box, damage, level: 'mid', ...hitDefaults(damage), ...extra };
}

interface Common {
  id: string;
  name: string;
  kind?: MoveKind;
  desc?: string;
  /** velocity, invuln, armor, hurtbox, trail 등 나머지 MoveDef 필드 */
  more?: Partial<MoveDef>;
}

export interface StrikeOpts extends Common {
  base: Pose; // 시작·끝 자세
  windup?: Pose; // 예비 동작 (선택)
  hit: Pose; // 판정이 나오는 순간의 자세
  end?: Pose; // 끝 자세 (기본 = base)
  startup: number; // 첫 판정 프레임
  active: number; // 판정 지속 프레임 수
  recovery: number; // 판정이 끝난 뒤 빈틈
  box: Rect;
  damage: number;
  extra?: HitExtra;
  cancel?: boolean; // 적중 시 필살기 캔슬 가능
  chain?: string[]; // 적중 시 이어서 쓸 수 있는 기본기
}

/** 한 번 때리는 기술 */
export function strike(o: StrikeOpts): MoveDef {
  const first = o.startup;
  const last = first + o.active - 1;
  const total = last + o.recovery;
  const keys: Keyframe[] = [{ f: 0, p: o.base }];
  if (o.windup && first > 3) keys.push({ f: Math.max(1, Math.round((first - 1) * 0.55)), p: o.windup });
  keys.push({ f: first - 1, p: o.hit }, { f: last, p: o.hit }, { f: total, p: o.end ?? o.base });
  return {
    id: o.id,
    name: o.name,
    kind: o.kind ?? 'normal',
    desc: o.desc,
    total,
    anim: { keys },
    hits: [hit([first, last], o.box, o.damage, o.extra)],
    cancelWindow: o.cancel ? [first, last + 5] : undefined,
    chainInto: o.chain,
    ...o.more,
  };
}

export interface AirStrikeOpts extends Common {
  hit: Partial<Pose>; // 점프 자세(JUMP_TUCK)에서 바꿀 부분
  startup: number;
  active: number;
  box: Rect;
  damage: number;
  extra?: HitExtra;
}

/** 점프 공격 (기본 중단) */
export function airStrike(o: AirStrikeOpts): MoveDef {
  const first = o.startup;
  const last = first + o.active - 1;
  const p: Pose = { ...JUMP_TUCK, ...o.hit };
  return {
    id: o.id,
    name: o.name,
    kind: 'normal',
    desc: o.desc,
    total: 40,
    air: true,
    anim: {
      snap: false,
      keys: [
        { f: 0, p: JUMP_TUCK },
        { f: first - 1, p },
        { f: last, p },
        { f: last + 10, p: JUMP_FALL },
      ],
    },
    hits: [hit([first, last], o.box, o.damage, { level: 'overhead', ...o.extra })],
    ...o.more,
  };
}

export interface ComboOpts extends Common {
  base: Pose;
  windup?: Pose;
  poses: Pose[]; // 타격마다 번갈아 쓰는 자세
  start: number; // 첫 타격 프레임
  interval: number; // 타격 간격
  count: number; // 타격 수
  box: Rect;
  damage: number; // 한 타당 데미지
  extra?: HitExtra;
  /** 마무리 타격 */
  finish?: { pose: Pose; delay: number; damage: number; box?: Rect; extra?: HitExtra };
  recovery: number;
  end?: Pose;
}

/** 여러 번 때리는 기술 (필살기·초필살기). kind가 'super'면 게이지 100 소모와 발동 연출이 붙는다. */
export function combo(o: ComboOpts): MoveDef {
  const kind = o.kind ?? 'special';
  const keys: Keyframe[] = [{ f: 0, p: o.base }];
  if (o.windup && o.start >= 5) keys.push({ f: o.start - 3, p: o.windup });
  const hits: HitDef[] = [];
  for (let i = 0; i < o.count; i++) {
    const f = o.start + i * o.interval;
    keys.push({ f: f - 1, p: o.poses[i % o.poses.length] });
    hits.push(
      hit([f, f + 1], o.box, o.damage, {
        push: 1,
        hitstun: o.interval + 14,
        hitstop: 5,
        heavy: false,
        chip: Math.ceil(o.damage / 6),
        ...o.extra,
      }),
    );
  }
  let end = o.start + (o.count - 1) * o.interval + 1;
  if (o.finish) {
    const ff = end - 1 + o.finish.delay;
    keys.push({ f: ff - 1, p: o.finish.pose }, { f: ff + 3, p: o.finish.pose });
    hits.push(
      hit([ff, ff + 3], o.finish.box ?? o.box, o.finish.damage, {
        knockdown: true,
        push: 10,
        chip: Math.ceil(o.finish.damage / 8),
        ...o.finish.extra,
      }),
    );
    end = ff + 3;
  }
  const total = end + o.recovery;
  keys.push({ f: total, p: o.end ?? o.base });
  const superFields: Partial<MoveDef> = kind === 'super' ? { meterCost: 100, superFreeze: 40, invuln: [1, 12] } : {};
  return {
    id: o.id,
    name: o.name,
    kind,
    desc: o.desc,
    total,
    anim: { keys },
    hits,
    ...superFields,
    ...o.more,
  };
}

export interface ShooterOpts extends Common {
  base: Pose;
  windup?: Pose;
  release: Pose; // 발사하는 순간의 자세
  frame: number; // 발사 프레임
  recovery: number;
  projectile: Omit<ProjectileDef, 'frame'>;
}

/** 장풍을 쏘는 기술 */
export function shooter(o: ShooterOpts): MoveDef {
  const total = o.frame + o.recovery;
  const keys: Keyframe[] = [{ f: 0, p: o.base }];
  if (o.windup) keys.push({ f: Math.max(1, Math.round(o.frame * 0.5)), p: o.windup });
  keys.push({ f: o.frame - 1, p: o.release }, { f: o.frame + 10, p: o.release }, { f: total, p: o.base });
  return {
    id: o.id,
    name: o.name,
    kind: o.kind ?? 'special',
    desc: o.desc,
    total,
    anim: { keys },
    hits: [],
    projectile: { ...o.projectile, frame: o.frame },
    ...o.more,
  };
}

/** 기술 배열 → id로 찾는 사전 */
export function moveTable(moves: MoveDef[]): Record<string, MoveDef> {
  return Object.fromEntries(moves.map((m) => [m.id, m]));
}
