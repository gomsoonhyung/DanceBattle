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
  unblockable?: boolean; // 가드 불가
}

export type ProjectileKind = 'shockwave' | 'spark' | 'wave' | 'heart';

/** 기술에서 발사되는 장풍. 캐릭터 기준 위치에서 생성되어 직진한다. */
export interface ProjectileDef {
  frame: number; // 생성되는 기술 프레임
  x: number; // 생성 위치 (캐릭터 기준)
  y: number;
  vx: number; // 바라보는 방향 기준 속도
  life: number; // 유지 프레임
  box: Rect; // 장풍 중심 기준 판정
  hit: Omit<HitDef, 'frames' | 'box'>;
  kind: ProjectileKind;
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
  /** 슈퍼아머: 이 구간에서는 한 번 맞아도 경직 없이 기술이 계속된다 */
  armor?: [number, number];
  projectile?: ProjectileDef;
  /** 게이지 충전 (도발·포즈 기술): frame 프레임에 amount 만큼 */
  meterGain?: { frame: number; amount: number };
  /** 잔상 연출 (팝핑 애니메이션 대시 등) */
  trail?: boolean;
  /** 연습 모드 가이드에 나오는 한 줄 설명 */
  desc?: string;
}

/** 스틱맨 색상 */
export interface Palette {
  main: string; // 몸통, 앞쪽 팔다리
  back: string; // 뒤쪽 팔다리 (어둡게)
  cap: string; // 모자/머리띠
  skin: string;
  shoe: string;
  accent: string; // 멜빵, 양말 등 포인트 색
}

/** 머리 장식: 뒤로 쓴 캡 / 머리띠 / 빅 애플 캡 / 올림머리 / 버킷햇 / 포니테일 / 비니 / 페도라 */
export type Headwear = 'backcap' | 'headband' | 'applecap' | 'bun' | 'bucket' | 'ponytail' | 'beanie' | 'fedora';

export interface Look {
  /** [P1용, P2용] — 같은 캐릭터끼리 붙어도 구분되도록 */
  palettes: [Palette, Palette];
  headwear: Headwear;
  /** 선 굵기 배율 (체격) */
  build: number;
  /** 팔을 피부색으로 (민소매) */
  bareArms?: boolean;
  /** 멜빵 + 줄무늬 양말 (락킹 의상) */
  suspenders?: boolean;
}

export interface Profile {
  title: string; // 한 줄 소개
  desc: string;
  power: number; // 1~5
  speed: number;
  range: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  look: Look;
  profile: Profile;
  maxHealth: number;
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
