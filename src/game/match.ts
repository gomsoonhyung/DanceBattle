import { BBOY } from '../characters/bboy';
import { FPS, MAX_METER, ROUNDS_TO_WIN, ROUND_TIME } from '../core/constants';
import { Fighter } from '../fighter/fighter';
import type { CharacterDef } from '../fighter/types';
import { EMPTY_INPUT, type RawInput } from '../input/types';
import { resolveHits, separate, spawnProjectile, updateProjectiles, type Projectile } from './combat';
import type { GameEvent } from './events';

export type MatchMode = 'versus' | 'training';
export type Phase = 'intro' | 'fight' | 'ko' | 'roundEnd' | 'matchEnd';

export type DummyMode = 'stand' | 'crouch' | 'jump' | 'guard';
export const DUMMY_MODES: DummyMode[] = ['stand', 'crouch', 'jump', 'guard'];
export const DUMMY_LABEL: Record<DummyMode, string> = {
  stand: '서 있기',
  crouch: '앉기',
  jump: '계속 점프',
  guard: '자동 가드',
};

const INTRO_FRAMES = 100;
const KO_FRAMES = 150;
const ROUND_END_FRAMES = 120;

export interface ComboDisplay {
  hits: number;
  damage: number;
  timer: number;
}

/**
 * 한 판의 대전. 게임 로직 전체가 여기서 결정론적으로 진행된다.
 * 렌더러는 이 객체의 상태를 읽기만 한다.
 */
export class Match {
  readonly fighters: [Fighter, Fighter];
  phase: Phase = 'intro';
  phaseFrame = 0;
  round = 1;
  wins: [number, number] = [0, 0];
  timerFrames = ROUND_TIME * FPS;
  winner: 0 | 1 | null = null; // 라운드 승자 (null = 무승부)
  matchWinner: 0 | 1 | null = null;
  superFreeze = 0;
  superOwner: 0 | 1 = 0;
  combo: [ComboDisplay, ComboDisplay] = [
    { hits: 0, damage: 0, timer: 0 },
    { hits: 0, damage: 0, timer: 0 },
  ];
  dummyMode: DummyMode = 'stand';
  private dummyIdle = 0;
  events: GameEvent[] = [];
  projectiles: Projectile[] = [];

  constructor(
    readonly mode: MatchMode,
    readonly chars: [CharacterDef, CharacterDef] = [BBOY, BBOY],
  ) {
    this.fighters = [new Fighter(chars[0], 0), new Fighter(chars[1], 1)];
    this.startRound();
  }

  private startRound(): void {
    const [p1, p2] = this.fighters;
    p1.resetForRound(330, 1);
    p2.resetForRound(630, -1);
    this.timerFrames = ROUND_TIME * FPS;
    this.winner = null;
    this.superFreeze = 0;
    this.projectiles = [];
    if (this.mode === 'training') {
      this.phase = 'fight';
      p1.meter = MAX_METER;
      this.applyDummyMode();
    } else {
      this.phase = 'intro';
      this.events.push({ type: 'announce', text: `ROUND ${this.round}` });
    }
    this.phaseFrame = 0;
  }

  cycleDummyMode(): void {
    const i = DUMMY_MODES.indexOf(this.dummyMode);
    this.dummyMode = DUMMY_MODES[(i + 1) % DUMMY_MODES.length];
    this.applyDummyMode();
  }

  private applyDummyMode(): void {
    this.fighters[1].autoGuard = this.dummyMode === 'guard';
  }

  resetPositions(): void {
    this.startRound();
  }

  private dummyInput(): RawInput {
    switch (this.dummyMode) {
      case 'crouch':
        return { ...EMPTY_INPUT, down: true };
      case 'jump':
        return { ...EMPTY_INPUT, up: true };
      default:
        return EMPTY_INPUT;
    }
  }

  update(p1Raw: RawInput, p2Raw: RawInput): void {
    this.events = [];
    this.phaseFrame++;
    const [p1, p2] = this.fighters;
    const training = this.mode === 'training';
    p1.recordInput(p1Raw);
    p2.recordInput(training ? this.dummyInput() : p2Raw);

    // 초필살기 화면 정지: 로직 전체 일시정지
    if (this.superFreeze > 0) {
      this.superFreeze--;
      return;
    }

    const canAct = this.phase === 'fight';
    p1.update(canAct);
    p2.update(canAct);

    for (const f of this.fighters) {
      if (f.pendingProjectile) {
        this.projectiles.push(spawnProjectile(f, f.pendingProjectile));
        f.pendingProjectile = null;
      }
      if (f.pendingSuperFreeze) {
        this.superFreeze = f.pendingSuperFreeze;
        this.superOwner = f.index;
        f.pendingSuperFreeze = 0;
        this.events.push({ type: 'super', player: f.index, name: f.move?.name ?? '' });
      }
    }

    separate(p1, p2);
    const canHit = this.phase === 'fight' || this.phase === 'ko';
    if (canHit) resolveHits(p1, p2, this.events);
    updateProjectiles(this.projectiles, this.fighters, canHit, this.events);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.faceEachOther();
    this.updateCombos();

    if (training) this.updateTraining();
    else this.updatePhase();
  }

  private faceEachOther(): void {
    const [p1, p2] = this.fighters;
    for (const [me, opp] of [
      [p1, p2],
      [p2, p1],
    ] as const) {
      const neutral =
        me.state === 'idle' || me.state === 'walkF' || me.state === 'walkB' || me.state === 'crouch' || me.state === 'land';
      if (neutral && me.x !== opp.x) me.facing = opp.x > me.x ? 1 : -1;
    }
  }

  private updateCombos(): void {
    for (const i of [0, 1] as const) {
      const def = this.fighters[1 - i];
      const c = this.combo[i];
      if (def.comboHits >= 2) {
        c.hits = def.comboHits;
        c.damage = def.comboDamage;
        c.timer = 90;
      } else if (c.timer > 0) {
        c.timer--;
      }
    }
  }

  private updateTraining(): void {
    const [p1, p2] = this.fighters;
    // 더미가 콤보에서 풀려나고 잠시 지나면 체력 회복
    const hurt = p2.state === 'hitstun' || p2.state === 'airHit' || p2.state === 'knockdown' || p2.state === 'blockstun';
    this.dummyIdle = hurt ? 0 : this.dummyIdle + 1;
    if (this.dummyIdle > 40) p2.health = p2.def.maxHealth;
    if (p2.state === 'ko') {
      p2.health = p2.def.maxHealth;
      p2.state = 'getup';
      p2.stateFrame = 0;
    }
    if (p1.state !== 'move') p1.meter = MAX_METER;
    p1.health = p1.def.maxHealth;
  }

  private updatePhase(): void {
    const [p1, p2] = this.fighters;
    switch (this.phase) {
      case 'intro':
        if (this.phaseFrame === 55) this.events.push({ type: 'announce', text: 'FIGHT!' });
        if (this.phaseFrame >= INTRO_FRAMES) this.setPhase('fight');
        break;
      case 'fight': {
        if (this.timerFrames > 0) this.timerFrames--;
        const koed = p1.health <= 0 || p2.health <= 0;
        if (koed || this.timerFrames <= 0) {
          if (p1.health === p2.health) this.winner = null;
          else this.winner = p1.health > p2.health ? 0 : 1;
          this.events.push(koed ? { type: 'ko' } : { type: 'announce', text: 'TIME OVER' });
          this.setPhase('ko');
        }
        break;
      }
      case 'ko': {
        const w = this.winner;
        const settled = this.phaseFrame > 60 && this.fighters.every((f) => f.state !== 'airHit' && f.state !== 'move');
        if (settled && w !== null && this.fighters[w].state !== 'win' && this.fighters[w].state !== 'ko') {
          const f = this.fighters[w];
          f.state = 'win';
          f.stateFrame = 0;
          f.move = null;
        }
        if (this.phaseFrame >= KO_FRAMES) {
          if (w !== null) this.wins[w]++;
          const done = this.wins.some((v) => v >= ROUNDS_TO_WIN);
          if (done) {
            this.matchWinner = this.wins[0] >= ROUNDS_TO_WIN ? 0 : 1;
            this.setPhase('matchEnd');
          } else {
            this.setPhase('roundEnd');
          }
        }
        break;
      }
      case 'roundEnd':
        if (this.phaseFrame >= ROUND_END_FRAMES) {
          this.round++;
          this.startRound();
        }
        break;
      case 'matchEnd':
        break;
    }
  }

  private setPhase(p: Phase): void {
    this.phase = p;
    this.phaseFrame = 0;
  }

  get timerSeconds(): number {
    return Math.ceil(this.timerFrames / FPS);
  }

  healthRatio(i: 0 | 1): number {
    return this.fighters[i].health / this.fighters[i].def.maxHealth;
  }
}
