import type { Anim } from '../anim/pose';
import type { Rect } from '../core/math';

/** mid = 서서/앉아서 모두 가드 가능, low = 앉아서만, overhead = 서서만 */
export type HitLevel = 'mid' | 'low' | 'overhead';

export interface HitDef {
  /** 판정이 나오는 프레임 구간 (기술 시작 = 1프레임, 양 끝 포함) */
  frames: [number, number];
  /** 캐릭터 기준 박스. x = 바라보는 방향 +, y = 발 기준 위쪽 + */
  box: Rect;
  damage: number;
  hitstun: number;
  blockstun: number;
  level: HitLevel;
  push?: number; // 넉백 (기본 6)
  hitstop?: number; // 타격 경직 (기본 8)
  knockdown?: boolean;
  launch?: { vx: number; vy: number }; // 상대를 띄움 (공중 콤보)
  chip?: number; // 가드 시 깎이는 데미지
  heavy?: boolean; // 강공격 이펙트/사운드
}

export type MoveKind = 'normal' | 'special' | 'super';

export interface MoveDef {
  id: string;
  name: string;
  kind: MoveKind;
  total: number; // 전체 프레임 수
  anim: Anim;
  hits: HitDef[];
  /** 적중/가드 시 필살기로 캔슬 가능한 프레임 구간 */
  cancelWindow?: [number, number];
  /** 적중/가드 시 이어서 쓸 수 있는 일반기 id */
  chainInto?: string[];
  /** 기술 중 이동 (프레임 구간별 속도, 캐릭터 방향 기준) */
  velocity?: { from: number; to: number; vx: number }[];
  /** 무적 프레임 구간 */
  invuln?: [number, number];
  /** 이 기술 중 피격 판정을 바꿈 */
  hurtbox?: Rect;
  /** 공중 기술: 착지하면 끝난다 */
  air?: boolean;
  /** 반격기: 이 구간에 맞으면 into 기술로 반격 */
  counter?: { from: number; to: number; into: string };
  meterCost?: number;
  /** 초필살기 발동 시 화면 정지 연출 프레임 */
  superFreeze?: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  anims: {
    idle: Anim;
    walkF: Anim;
    walkB: Anim;
    crouch: Anim;
    prejump: Anim;
    jump: Anim;
    land: Anim;
    hitStand: Anim;
    hitCrouch: Anim;
    blockStand: Anim;
    blockCrouch: Anim;
    airHit: Anim;
    knockdown: Anim;
    getup: Anim;
    win: Anim;
  };
  moves: Record<string, MoveDef>;
  /** 입력 → 기술 id 매핑 */
  normals: {
    stand: Record<'LP' | 'HP' | 'LK' | 'HK', string>;
    crouch: Record<'LP' | 'HP' | 'LK' | 'HK', string>;
    airLight: string;
    airHeavy: string;
  };
  specials: { motion: 'qcf' | 'qcb' | 'dp'; button: 'P' | 'K'; move: string }[];
  super: string;
  walkF: number;
  walkB: number;
  jumpV: number;
  jumpVX: number;
}
