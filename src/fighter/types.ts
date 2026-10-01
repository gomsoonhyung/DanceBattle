import type { Anim } from '../anim/pose';
import type { Rect } from '../core/math';
import type { Button, Dir } from '../input/types';

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

export type ProjectileKind = 'shockwave' | 'spark' | 'wave' | 'heart' | 'cap' | 'arc' | 'bolt';

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
  /** 이 프레임이 지나면 방향을 바꿔 주인에게 돌아온다 (락킹 모자). 돌아오는 길에도 맞는다 */
  returnAfter?: number;
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
  /** 판정이 나와 있는 동안 판정 위치에 그리는 궤적 (휩·전기). 보이는 만큼 맞는다 */
  hitFx?: 'whip' | 'electric';
  /** 연습 모드 가이드에 나오는 한 줄 설명 */
  desc?: string;
  /** 잡기: frame 프레임에 몸 앞 range 안의 상대를 잡는다 (가드 불가, 잡기 풀기 가능) */
  grab?: { frame: number; range: number; damage: number; launch: { vx: number; vy: number } };
}

/** 대시·백대시 */
export interface DashDef {
  frames: number;
  speed: number;
  /** 무적 프레임 수 (처음부터) */
  invuln?: number;
  /** 잔상 연출 (팝핑 애니메이션 대시) */
  trail?: boolean;
}

/** 캐릭터 색상 */
export interface Palette {
  main: string; // 상의
  pants: string; // 바지
  hair: string;
  cap: string; // 모자 · 머리띠
  skin: string;
  shoe: string;
  accent: string; // 포인트 색 (줄무늬, 멜빵, 넥타이, 페인트 등)
}

/** 머리 장식: 뒤로 쓴 캡 / 머리띠 / 빅 애플 캡 / 올림머리 / 버킷햇 / 포니테일 / 비니 / 페도라 */
export type Headwear = 'backcap' | 'headband' | 'applecap' | 'bun' | 'bucket' | 'ponytail' | 'beanie' | 'fedora';

/** 상의: 반팔 / 민소매 / 후디 / 긴팔 / 크롭 / 수트 / 큰 칼라 셔츠 */
export type TopStyle = 'tee' | 'tank' | 'hoodie' | 'longsleeve' | 'crop' | 'suit' | 'collar';

/** 하의: 트랙 팬츠 / 배기 / 와이드(나팔) / 카고 / 슬림 / 무릎 바지 */
export type BottomStyle = 'track' | 'baggy' | 'wide' | 'cargo' | 'slim' | 'knickers';

export interface Outfit {
  top: TopStyle;
  bottom: BottomStyle;
  gloves?: boolean; // 흰 장갑 (팝핑)
  chain?: boolean; // 금목걸이 (힙합)
  suspenders?: boolean; // 멜빵 (락킹)
  stripedSocks?: boolean; // 줄무늬 양말 (락킹)
  facePaint?: boolean; // 페이스 페인트 (크럼프)
  wristbands?: boolean; // 손목 밴드
  earrings?: boolean; // 후프 귀걸이
  tie?: boolean; // 넥타이
  sideStripes?: boolean; // 바지 옆선
}

export interface Look {
  /** [P1용, P2용] — 같은 캐릭터끼리 붙어도 구분되도록 */
  palettes: [Palette, Palette];
  headwear: Headwear;
  /** 체격 배율 (팔다리·몸통 굵기) */
  build: number;
  outfit: Outfit;
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
    dash: Anim;
    backdash: Anim;
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
    /** 특수기 (방향 + 버튼): 6HP 등. 일반기보다 먼저 확인한다 */
    command?: { dir: Dir; button: Button; move: string }[];
    /** 잡기 (약P+약K) */
    throw?: string;
  };
  specials: { motion: 'qcf' | 'qcb' | 'dp'; button: 'P' | 'K'; move: string }[];
  super: string;
  walkF: number;
  walkB: number;
  jumpV: number;
  jumpVX: number;
  dash?: DashDef;
  backdash?: DashDef;
}
