import { displayFrame, evalAnim, type Anim, type Skeleton } from '../anim/pose';
import { GRAVITY, MAX_METER, STAGE_LEFT, STAGE_RIGHT } from '../core/constants';
import { clamp, type Rect } from '../core/math';
import { InputBuffer } from '../input/inputBuffer';
import { BTN, KICKS, PUNCHES, type Button, type Dir, type RawInput } from '../input/types';
import type { CharacterDef, HitLevel, MoveDef, ProjectileDef } from './types';

export type FighterState =
  | 'idle'
  | 'walkF'
  | 'walkB'
  | 'crouch'
  | 'prejump'
  | 'jump'
  | 'land'
  | 'move'
  | 'hitstun'
  | 'blockstun'
  | 'airHit'
  | 'knockdown'
  | 'getup'
  | 'ko'
  | 'win';

const STAND_HURT: Rect = { x: -26, y: 0, w: 52, h: 172 };
const CROUCH_HURT: Rect = { x: -30, y: 0, w: 62, h: 112 };
const AIR_HURT: Rect = { x: -26, y: 15, w: 52, h: 135 };

const MOTIONS: Record<'qcf' | 'qcb' | 'dp', { seq: Dir[]; window: number }> = {
  qcf: { seq: [2, 3, 6], window: 16 }, // ↓↘→
  qcb: { seq: [2, 1, 4], window: 16 }, // ↓↙←
  dp: { seq: [6, 2, 3], window: 14 }, // →↓↘
};
const SUPER_MOTION: Dir[] = [2, 3, 6, 2, 3, 6];

const PRESS_BUFFER = 5; // 선입력 허용 프레임
const JUGGLE_LIMIT = 4;
const KNOCKDOWN_FRAMES = 40;
const GETUP_FRAMES = 26;
const PREJUMP_FRAMES = 4;
const LAND_FRAMES = 4;

export type GuardType = 'stand' | 'crouch';

export class Fighter {
  readonly input = new InputBuffer();

  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  facing: 1 | -1 = 1;

  state: FighterState = 'idle';
  stateFrame = 0;
  move: MoveDef | null = null;
  moveFrame = 0;
  /** 현재 기술에서 이미 적중한 히트 번호 (다단히트 관리) */
  readonly hitIds = new Set<number>();
  /** 현재 기술이 적중 또는 가드되었는지 (캔슬 조건) */
  moveConnected = false;

  health: number;
  meter = 0;
  stun = 0;
  stunCrouching = false;
  hitstop = 0;
  pushVel = 0;
  comboHits = 0;
  comboDamage = 0;
  juggle = 0;
  jumpDir = 0;
  airAttackUsed = false;
  /** 트레이닝 더미용: 가능한 모든 공격을 자동으로 올바르게 가드 */
  autoGuard = false;
  /** 히트스톱 중 예약된 캔슬 기술 */
  private queuedCancel: MoveDef | null = null;
  /** 초필살기 발동 시 Match가 읽어가는 화면 정지 요청 */
  pendingSuperFreeze = 0;
  /** 기술을 시작할 때마다 1씩 증가 (연습 가이드가 성공 여부를 알아보는 데 사용) */
  moveSerial = 0;
  /** 포즈 등으로 게이지를 채운 순간. Match가 읽어서 연출 이벤트를 보낸다 */
  pendingTaunt = false;
  /** 이번 프레임에 발사한 장풍. Match가 읽어간다 */
  pendingProjectile: ProjectileDef | null = null;
  /** 슈퍼아머로 버틸 수 있는 남은 횟수 */
  private armorHits = 0;

  constructor(
    readonly def: CharacterDef,
    readonly index: 0 | 1,
  ) {
    this.health = def.maxHealth;
  }

  resetForRound(x: number, facing: 1 | -1): void {
    this.x = x;
    this.y = 0;
    this.vx = this.vy = 0;
    this.facing = facing;
    this.state = 'idle';
    this.stateFrame = 0;
    this.move = null;
    this.moveFrame = 0;
    this.hitIds.clear();
    this.moveConnected = false;
    this.health = this.def.maxHealth;
    this.stun = 0;
    this.hitstop = 0;
    this.pushVel = 0;
    this.comboHits = 0;
    this.comboDamage = 0;
    this.juggle = 0;
    this.pendingSuperFreeze = 0;
    this.queuedCancel = null;
    this.input.reset();
  }

  // ── 매 프레임 업데이트 ────────────────────────────────────────────

  recordInput(raw: RawInput): void {
    this.input.push(raw, this.facing);
  }

  update(canAct: boolean): void {
    if (this.hitstop > 0) {
      this.hitstop--;
      // 히트스톱 중에 넣은 캔슬 커맨드는 예약해 두었다가 경직이 풀리면 바로 발동
      if (canAct && this.state === 'move' && !this.queuedCancel) this.queuedCancel = this.findCancel();
      return;
    }
    if (this.queuedCancel && this.state === 'move') {
      this.startMove(this.queuedCancel);
      return;
    }
    this.stateFrame++;

    switch (this.state) {
      case 'idle':
      case 'walkF':
      case 'walkB':
      case 'crouch':
        this.updateNeutral(canAct);
        break;
      case 'prejump':
        if (this.stateFrame >= PREJUMP_FRAMES) {
          this.vy = this.def.jumpV;
          this.vx = this.jumpDir * this.def.jumpVX * this.facing;
          this.airAttackUsed = false;
          this.setState('jump');
        }
        break;
      case 'jump':
        if (canAct && !this.airAttackUsed && this.tryAirAttack()) break;
        if (this.airPhysics()) this.landFromAir();
        break;
      case 'land':
        if (this.stateFrame >= LAND_FRAMES) this.updateNeutral(canAct);
        break;
      case 'move':
        this.updateMove(canAct);
        break;
      case 'hitstun':
      case 'blockstun':
        if (--this.stun <= 0) {
          if (this.state === 'hitstun') this.endCombo();
          this.setState(this.stunCrouching ? 'crouch' : 'idle');
        }
        break;
      case 'airHit':
        if (this.airPhysics()) {
          this.juggle = 0;
          this.vx = 0;
          this.setState('knockdown');
        }
        break;
      case 'knockdown':
        if (this.stateFrame >= KNOCKDOWN_FRAMES && this.health > 0) {
          this.endCombo();
          this.setState('getup');
        } else if (this.health <= 0 && this.stateFrame >= 20) {
          this.setState('ko');
        }
        break;
      case 'getup':
        if (this.stateFrame >= GETUP_FRAMES) this.setState('idle');
        break;
      case 'ko':
      case 'win':
        break;
    }

    // 넉백
    if (this.pushVel !== 0) {
      this.x += this.pushVel;
      this.pushVel *= 0.75;
      if (Math.abs(this.pushVel) < 0.1) this.pushVel = 0;
    }
    this.x = clamp(this.x, STAGE_LEFT, STAGE_RIGHT);
  }

  private setState(s: FighterState): void {
    if (this.state !== s) {
      this.state = s;
      this.stateFrame = 0;
    }
    if (s !== 'move') {
      this.move = null;
      this.queuedCancel = null;
    }
  }

  private updateNeutral(canAct: boolean): void {
    if (canAct && this.tryGroundAttack()) return;
    const d = canAct ? this.input.dir : 5;
    this.vx = 0;
    if (d >= 7) {
      this.jumpDir = d === 7 ? -1 : d === 9 ? 1 : 0;
      this.setState('prejump');
    } else if (d <= 3) {
      this.setState('crouch');
    } else if (d === 6) {
      this.setState('walkF');
      this.x += this.def.walkF * this.facing;
    } else if (d === 4) {
      this.setState('walkB');
      this.x -= this.def.walkB * this.facing;
    } else {
      this.setState('idle');
    }
  }

  /** 공중 물리. 착지하면 true */
  private airPhysics(): boolean {
    this.vy -= GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    if (this.y <= 0 && this.vy < 0) {
      this.y = 0;
      this.vy = 0;
      return true;
    }
    return false;
  }

  private landFromAir(): void {
    this.vx = 0;
    this.setState('land');
  }

  private updateMove(canAct: boolean): void {
    const m = this.move!;
    this.moveFrame++;
    if (m.projectile && this.moveFrame === m.projectile.frame) this.pendingProjectile = m.projectile;
    if (m.meterGain && this.moveFrame === m.meterGain.frame) {
      this.addMeter(m.meterGain.amount);
      this.pendingTaunt = true;
    }

    if (canAct) {
      const next = this.findCancel();
      if (next) {
        this.startMove(next);
        return;
      }
    }

    if (m.air) {
      if (this.airPhysics()) this.landFromAir();
      return;
    }

    const seg = m.velocity?.find((v) => this.moveFrame >= v.from && this.moveFrame <= v.to);
    this.vx = seg ? seg.vx * this.facing : 0;
    this.x += this.vx;

    if (this.moveFrame >= m.total) {
      this.vx = 0;
      const crouching = canAct && this.input.dir <= 3;
      this.setState(crouching ? 'crouch' : 'idle');
    }
  }

  /** 적중/가드한 기술을 캔슬해서 이어 쓸 기술 (없으면 null) */
  private findCancel(): MoveDef | null {
    const m = this.move;
    if (!m || !this.moveConnected) return null;
    if (m.cancelWindow) {
      const [a, b] = m.cancelWindow;
      if (this.moveFrame >= a && this.moveFrame <= b) {
        const next = this.matchSuper() ?? this.matchSpecial();
        if (next) return next;
        if (m.chainInto) return this.matchChain(m.chainInto);
      }
    }
    // 필살기 → 초필살기 캔슬
    if (m.kind === 'special') return this.matchSuper();
    return null;
  }

  // ── 입력 → 기술 ─────────────────────────────────────────────────

  startMove(m: MoveDef): void {
    this.move = m;
    this.moveFrame = 1;
    this.moveSerial++;
    this.hitIds.clear();
    this.moveConnected = false;
    this.queuedCancel = null;
    this.state = 'move';
    this.stateFrame = 0;
    this.input.consume();
    this.armorHits = m.armor ? 1 : 0;
    if (m.meterCost) this.meter -= m.meterCost;
    if (m.superFreeze) this.pendingSuperFreeze = m.superFreeze;
    if (!m.air) this.vx = 0;
  }

  private tryGroundAttack(): boolean {
    const m = this.matchSuper() ?? this.matchSpecial() ?? this.matchNormal();
    if (!m) return false;
    this.startMove(m);
    return true;
  }

  private tryAirAttack(): boolean {
    const pressed = this.input.pressedWithin(PUNCHES | KICKS, 3);
    if (!pressed) return false;
    const heavy = pressed & (BTN.HP | BTN.HK);
    this.airAttackUsed = true;
    this.startMove(this.def.moves[heavy ? this.def.normals.airHeavy : this.def.normals.airLight]);
    return true;
  }

  private matchSuper(): MoveDef | null {
    const m = this.def.moves[this.def.super];
    if (this.meter < (m.meterCost ?? 0)) return null;
    const ib = this.input;
    const byMotion = ib.motion(SUPER_MOTION, 36) && ib.pressedWithin(PUNCHES, PRESS_BUFFER) !== 0;
    const byShortcut = ib.allPressedWithin(BTN.HP | BTN.HK, 3);
    return byMotion || byShortcut ? m : null;
  }

  private matchSpecial(): MoveDef | null {
    for (const sp of this.def.specials) {
      const mo = MOTIONS[sp.motion];
      const mask = sp.button === 'P' ? PUNCHES : KICKS;
      if (this.input.pressedWithin(mask, PRESS_BUFFER) && this.input.motion(mo.seq, mo.window)) {
        return this.def.moves[sp.move];
      }
    }
    return null;
  }

  private matchNormal(): MoveDef | null {
    const btn = this.pickButton(this.input.pressedWithin(PUNCHES | KICKS, 3));
    if (!btn) return null;
    const table = this.input.dir <= 3 ? this.def.normals.crouch : this.def.normals.stand;
    return this.def.moves[table[btn]];
  }

  private matchChain(allowed: string[]): MoveDef | null {
    const m = this.matchNormal();
    return m && allowed.includes(m.id) ? m : null;
  }

  /** 여러 버튼이 동시에 눌렸으면 강한 버튼 우선 */
  private pickButton(mask: number): Button | null {
    if (mask & BTN.HK) return 'HK';
    if (mask & BTN.HP) return 'HP';
    if (mask & BTN.LK) return 'LK';
    if (mask & BTN.LP) return 'LP';
    return null;
  }

  // ── 피격 / 가드 ─────────────────────────────────────────────────

  get airborne(): boolean {
    return (
      this.y > 0 || this.state === 'jump' || this.state === 'airHit' || this.state === 'prejump' || !!this.move?.air
    );
  }

  private inCrouchMove(): boolean {
    return this.state === 'move' && !!this.move && Object.values(this.def.normals.crouch).includes(this.move.id);
  }

  isCrouching(): boolean {
    if (this.state === 'crouch') return true;
    if (this.state === 'hitstun' || this.state === 'blockstun') return this.stunCrouching;
    return false;
  }

  /** 이 공격을 가드할 수 있으면 가드 자세를, 아니면 null */
  guardAgainst(level: HitLevel): GuardType | null {
    const guardable =
      this.state === 'idle' ||
      this.state === 'walkB' ||
      this.state === 'crouch' ||
      this.state === 'blockstun' ||
      (this.state === 'walkF' && this.autoGuard);
    if (!guardable) return null;
    if (this.autoGuard) {
      if (level === 'low') return 'crouch';
      if (level === 'overhead') return 'stand';
      return this.isCrouching() ? 'crouch' : 'stand';
    }
    const d = this.input.dir;
    const g: GuardType | null = d === 4 ? 'stand' : d === 1 ? 'crouch' : null;
    if (!g) return null;
    if (level === 'low' && g === 'stand') return null;
    if (level === 'overhead' && g === 'crouch') return null;
    return g;
  }

  enterBlockstun(frames: number, g: GuardType): void {
    this.setState('blockstun');
    this.stateFrame = 0;
    this.stun = frames;
    this.stunCrouching = g === 'crouch';
    this.vx = 0;
  }

  enterHitstun(frames: number): void {
    const crouching = this.isCrouching() || this.inCrouchMove();
    this.setState('hitstun');
    this.stateFrame = 0;
    this.stun = frames;
    this.stunCrouching = crouching;
    this.vx = 0;
  }

  enterAirHit(vx: number, vy: number): void {
    this.setState('airHit');
    this.stateFrame = 0;
    this.vx = vx;
    this.vy = vy;
    if (this.y <= 0) this.y = 1;
    this.juggle++;
  }

  endCombo(): void {
    this.comboHits = 0;
    this.comboDamage = 0;
  }

  addMeter(v: number): void {
    this.meter = clamp(this.meter + v, 0, MAX_METER);
  }

  isInvulnerable(): boolean {
    if (this.state === 'knockdown' || this.state === 'getup' || this.state === 'ko' || this.state === 'win')
      return true;
    if (this.state === 'airHit' && this.juggle >= JUGGLE_LIMIT) return true;
    const inv = this.move?.invuln;
    return !!(this.state === 'move' && inv && this.moveFrame >= inv[0] && this.moveFrame <= inv[1]);
  }

  /** 슈퍼아머 구간이면 아머를 1회 소모하고 true */
  consumeArmor(): boolean {
    const a = this.move?.armor;
    if (this.state !== 'move' || !a || this.armorHits <= 0) return false;
    if (this.moveFrame < a[0] || this.moveFrame > a[1]) return false;
    this.armorHits--;
    return true;
  }

  /** 반격기(프리즈)의 반격 구간인지 */
  counterMoveId(): string | null {
    const c = this.move?.counter;
    if (this.state !== 'move' || !c) return null;
    return this.moveFrame >= c.from && this.moveFrame <= c.to ? c.into : null;
  }

  // ── 판정 박스 ───────────────────────────────────────────────────

  /** 캐릭터 기준 박스 → 월드 박스 (바라보는 방향 반영) */
  toWorld(b: Rect): Rect {
    const x = this.facing > 0 ? this.x + b.x : this.x - b.x - b.w;
    return { x, y: this.y + b.y, w: b.w, h: b.h };
  }

  hurtbox(): Rect | null {
    if (this.isInvulnerable()) return null;
    if (this.state === 'move' && this.move?.hurtbox) return this.toWorld(this.move.hurtbox);
    if (this.airborne) return this.toWorld(AIR_HURT);
    if (this.isCrouching() || this.inCrouchMove()) return this.toWorld(CROUCH_HURT);
    return this.toWorld(STAND_HURT);
  }

  /** 현재 프레임에 활성화된 공격 판정들 */
  activeHits(): { idx: number; box: Rect }[] {
    if (this.state !== 'move' || !this.move || this.hitstop > 0) return [];
    const out: { idx: number; box: Rect }[] = [];
    this.move.hits.forEach((h, idx) => {
      if (this.moveFrame >= h.frames[0] && this.moveFrame <= h.frames[1] && !this.hitIds.has(idx)) {
        out.push({ idx, box: this.toWorld(h.box) });
      }
    });
    return out;
  }

  // ── 렌더링용 ────────────────────────────────────────────────────

  /** 지금 재생 중인 동작: id = 기술 id 또는 기본 동작 이름 (idle, walkF, hitStand ...) */
  currentAnim(): { id: string; anim: Anim; frame: number } {
    const base = (id: keyof CharacterDef['anims'], frame = this.stateFrame) => ({
      id,
      anim: this.def.anims[id],
      frame,
    });
    switch (this.state) {
      case 'move':
        return { id: this.move!.id, anim: this.move!.anim, frame: this.moveFrame - 1 };
      case 'walkF':
      case 'walkB':
      case 'crouch':
      case 'prejump':
      case 'jump':
      case 'land':
      case 'airHit':
      case 'getup':
      case 'win':
        return base(this.state);
      case 'hitstun':
        return base(this.stunCrouching ? 'hitCrouch' : 'hitStand');
      case 'blockstun':
        return base(this.stunCrouching ? 'blockCrouch' : 'blockStand');
      case 'knockdown':
        return base('knockdown');
      case 'ko':
        return base('knockdown', 99);
      default:
        return base('idle');
    }
  }

  /** 화면에 그릴 그림의 식별자: 같은 값이면 같은 그림 (스프라이트 교체에 사용) */
  displayKey(): { id: string; frame: number } {
    const { id, anim, frame } = this.currentAnim();
    return { id, frame: displayFrame(anim, frame) };
  }

  /** 화면에 그릴 자세 (끊어 보여주기 적용: 키 포즈 사이를 딱딱 넘어간다) */
  skeleton(): Skeleton {
    const { anim, frame } = this.currentAnim();
    return evalAnim(anim, displayFrame(anim, frame));
  }
}
