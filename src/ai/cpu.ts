import type { Fighter } from '../fighter/fighter';
import type { MoveDef } from '../fighter/types';
import type { Match } from '../game/match';
import { BTN, EMPTY_INPUT, type Dir, type RawInput } from '../input/types';
import { dirToRaw } from '../training/guide';

/*
 * CPU 상대. 매 프레임 대전 상태를 읽고 P2 컨트롤러 입력(RawInput)을 만든다.
 * 게임 로직은 바꾸지 않고, 사람처럼 "버튼을 누르는 쪽"에만 있다.
 * - 상대를 반응 지연(reaction) 프레임 전의 모습으로 본다 (사람의 반응 속도)
 * - 같은 시드면 항상 같은 행동을 한다 (Math.random 대신 고정 시드 난수)
 */

export type CpuLevel = 'easy' | 'normal' | 'hard';

interface LevelDef {
  reaction: number; // 상대를 몇 프레임 늦게 보는지
  block: number; // 막을 수 있는 공격을 막을 확률
  antiAir: number; // 점프해 오는 상대를 떨어뜨릴 확률
  combo: number; // 붙었을 때 콤보를 넣을 확률
  think: number; // 행동 사이 쉬는 프레임
}

export const CPU_LEVELS: Record<CpuLevel, LevelDef> = {
  easy: { reaction: 24, block: 0.3, antiAir: 0.2, combo: 0.25, think: 18 },
  normal: { reaction: 14, block: 0.6, antiAir: 0.55, combo: 0.6, think: 10 },
  hard: { reaction: 8, block: 0.85, antiAir: 0.85, combo: 0.9, think: 5 },
};

export const CPU_LEVEL_LABEL: Record<CpuLevel, string> = { easy: '쉬움', normal: '보통', hard: '어려움' };

/** 한 동작: 방향(6 = 앞)과 버튼을 frames 동안 */
interface Step {
  dir: Dir;
  buttons?: number;
  frames: number;
}

interface Seen {
  state: Fighter['state'];
  move: MoveDef | null;
  moveFrame: number;
  x: number;
  y: number;
  vx: number;
}

const MOTION: Record<'qcf' | 'qcb' | 'dp', Dir[]> = { qcf: [2, 3, 6], qcb: [2, 1, 4], dp: [6, 2, 3] };
const NEUTRAL: Fighter['state'][] = ['idle', 'walkF', 'walkB', 'crouch', 'land'];

export class CpuPlayer {
  private plan: Step[] = [];
  private seen: Seen[] = [];
  private seed: number;
  private wait = 0;
  /** 쉬는 동안 누르고 있는 방향 (4 = 서서 막기, 1 = 앉아 막기, 5 = 그냥 서 있기) */
  private waitDir: Dir = 5;
  readonly lv: LevelDef;

  constructor(
    readonly me: 0 | 1,
    readonly level: CpuLevel = 'normal',
    seed = 20261015,
  ) {
    this.lv = CPU_LEVELS[level];
    this.seed = seed >>> 0;
  }

  /** 0 이상 1 미만 난수 (mulberry32) */
  private rand(): number {
    let t = (this.seed = (this.seed + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  private chance(p: number): boolean {
    return this.rand() < p;
  }

  /** 이번 프레임 입력 */
  next(m: Match): RawInput {
    const self = m.fighters[this.me];
    const opp = m.fighters[1 - this.me];
    this.seen.push({ state: opp.state, move: opp.move, moveFrame: opp.moveFrame, x: opp.x, y: opp.y, vx: opp.vx });
    if (this.seen.length > 60) this.seen.shift();
    if (m.phase !== 'fight') {
      this.plan = [];
      return EMPTY_INPUT;
    }
    if (!this.plan.length) {
      if (this.wait > 0) {
        this.wait--;
        // 공격은 보고 나서 막으면 늦는다. 쉬는 동안 미리 막기 자세를 잡는다
        return dirToRaw(this.waitDir, self.facing);
      }
      this.decide(m, self, opp);
    }
    const step = this.plan[0];
    if (!step) return dirToRaw(this.waitDir, self.facing);
    if (--step.frames <= 0) this.plan.shift();
    return dirToRaw(step.dir, self.facing, step.buttons ?? 0);
  }

  /** 반응 지연을 둔 상대의 모습 */
  private view(): Seen {
    return this.seen[Math.max(0, this.seen.length - 1 - this.lv.reaction)];
  }

  private push(...steps: Step[]): void {
    this.plan.push(...steps.map((s) => ({ ...s })));
  }

  private decide(m: Match, self: Fighter, opp: Fighter): void {
    const v = this.view();
    const dist = Math.abs(v.x - self.x);
    // 다음에 쉴 때 막기 자세를 잡을지: 가까울수록, 어려울수록 자주. 하단이 있는 상대면 앉아서
    const near = dist < 260;
    this.waitDir = near && this.chance(this.lv.block) ? (this.chance(0.55) ? 1 : 4) : 5;
    const def = self.def;
    const canAct = NEUTRAL.includes(self.state);

    // 막는 중이면 계속 막는다
    if (self.state === 'blockstun') {
      const low = (opp.move?.hits ?? []).some((h) => h.level === 'low');
      this.push({ dir: low ? 1 : 4, frames: 2 });
      return;
    }
    if (!canAct) return;

    // 1) 날아오는 장풍
    const shot = m.projectiles.find(
      (p) => p.owner !== this.me && Math.sign(self.x - p.x) === Math.sign(p.vx) && Math.abs(self.x - p.x) < 220,
    );
    if (shot && this.chance(this.lv.block)) {
      this.push({ dir: shot.def.hit.level === 'low' ? 1 : 4, frames: 14 });
      return;
    }

    // 2) 상대가 공격을 내미는 중이고 닿을 거리
    const mv = v.state === 'move' ? v.move : null;
    if (mv && mv.hits.length) {
      const reach = Math.max(...mv.hits.map((h) => h.box.x + h.box.w));
      const lastHit = Math.max(...mv.hits.map((h) => h.frames[1]));
      if (v.moveFrame <= lastHit && dist < reach + 60 && this.chance(this.lv.block)) {
        const levels = new Set(mv.hits.map((h) => h.level));
        const dir: Dir = levels.has('low') ? 1 : levels.has('overhead') ? 4 : this.chance(0.5) ? 1 : 4;
        this.push({ dir, frames: Math.min(30, lastHit - v.moveFrame + 8) });
        return;
      }
      // 빈틈(마지막 타격이 끝난 뒤)이 보이면 반격
      if (v.moveFrame > lastHit + 2 && dist < 120 && this.chance(this.lv.combo)) {
        this.combo(self);
        return;
      }
    }

    // 3) 대공
    const jumping = v.state === 'jump' || (v.state === 'move' && !!v.move?.air);
    if (jumping && dist < 230 && v.y > 30 && this.chance(this.lv.antiAir)) {
      const dp = def.specials.find((s) => s.motion === 'dp');
      if (dp) this.special(dp.motion, dp.button);
      else this.push({ dir: 2, buttons: BTN.HP, frames: 1 }, { dir: 2, frames: 10 });
      this.wait = this.lv.think;
      return;
    }

    // 4) 공격·이동 (거리별)
    const full = self.meter >= 100;
    if (dist < 130) {
      // 붙어 있을 때는 계속 때리기만 하지 않고 막으며 상대를 본다 (어려울수록 자주)
      if (this.chance(this.lv.block * 0.45)) {
        this.push({ dir: this.chance(0.55) ? 1 : 4, frames: 16 + Math.floor(this.rand() * 16) });
        return;
      }
      const r = this.rand();
      if (full && r < 0.25) this.push({ dir: 5, buttons: BTN.HP | BTN.HK, frames: 1 });
      else if (r < this.lv.combo * 0.8) this.combo(self);
      else if (r < 0.8) this.push({ dir: 5, buttons: BTN.LP | BTN.LK, frames: 1 }, { dir: 5, frames: 8 });
      else if (r < 0.9) this.push({ dir: 5, buttons: BTN.HP, frames: 1 }, { dir: 5, frames: 12 });
      else this.push({ dir: 4, frames: 1 }, { dir: 5, frames: 1 }, { dir: 4, frames: 1 }, { dir: 5, frames: 10 });
    } else if (dist < 330) {
      const r = this.rand();
      if (r < 0.35) this.push({ dir: 6, frames: 14 + Math.floor(this.rand() * 14) });
      else if (r < 0.55)
        this.push({ dir: 6, frames: 1 }, { dir: 5, frames: 1 }, { dir: 6, frames: 1 }, { dir: 5, frames: 12 });
      else if (r < 0.75) this.poke(self, dist);
      else if (r < 0.88) this.jumpIn();
      else this.push({ dir: this.chance(0.5) ? 1 : 4, frames: 20 }); // 기다리며 막기
    } else {
      const shooter = def.specials.find((s) => def.moves[s.move].projectile);
      if (shooter && this.chance(0.4)) this.special(shooter.motion, shooter.button);
      else if (this.chance(0.4))
        this.push({ dir: 6, frames: 1 }, { dir: 5, frames: 1 }, { dir: 6, frames: 1 }, { dir: 5, frames: 10 });
      else this.push({ dir: 6, frames: 20 + Math.floor(this.rand() * 20) });
    }
    this.wait = this.lv.think;
  }

  /** 커맨드 필살기. 연속 회전(repeat)이 있으면 가끔 버튼을 누르고 있는다 */
  private special(motion: 'qcf' | 'qcb' | 'dp', button: 'P' | 'K', self?: Fighter): void {
    const btn = button === 'P' ? BTN.LP : BTN.LK;
    const seq = MOTION[motion];
    seq.forEach((d, i) => this.push({ dir: d, frames: 2, buttons: i === seq.length - 1 ? btn : 0 }));
    const sp = self?.def.specials.find((s) => s.motion === motion && s.button === button);
    const hold = sp && self?.def.moves[sp.move].repeat && this.chance(0.6);
    this.push({ dir: 5, frames: hold ? 70 : 6, buttons: hold ? btn : 0 });
  }

  /** 기본 콤보: 앉아 약K → 앉아 약P → 필살기 (맞든 막히든 캔슬된다) */
  private combo(self: Fighter): void {
    this.push(
      { dir: 2, buttons: BTN.LK, frames: 1 },
      { dir: 2, frames: 7 },
      { dir: 2, buttons: BTN.LP, frames: 1 },
      { dir: 2, frames: 5 },
    );
    const pick = self.def.specials.filter((s) => s.motion === 'qcf');
    const sp = pick[Math.floor(this.rand() * pick.length)] ?? self.def.specials[0];
    if (sp) this.special(sp.motion, sp.button, self);
    if (self.meter >= 100 && this.chance(0.5)) this.push({ dir: 5, buttons: BTN.HP | BTN.HK, frames: 1 });
  }

  /** 닿는 일반기 중 하나로 찌르기 */
  private poke(self: Fighter, dist: number): void {
    const n = self.def.normals;
    const options: { dir: Dir; btn: number; reach: number }[] = [];
    for (const [k, id] of Object.entries(n.stand))
      options.push({ dir: 5, btn: BTN[k as keyof typeof BTN], reach: maxReach(self.def.moves[id]) });
    for (const c of n.command ?? [])
      options.push({ dir: c.dir, btn: BTN[c.button], reach: maxReach(self.def.moves[c.move]) });
    const ok = options.filter((o) => o.reach + 30 >= dist);
    const o = ok[Math.floor(this.rand() * ok.length)];
    if (o) this.push({ dir: o.dir, buttons: o.btn, frames: 1 }, { dir: 5, frames: 14 });
    else this.push({ dir: 6, frames: 16 });
  }

  /** 앞으로 점프해서 내려올 때 강공격 */
  private jumpIn(): void {
    this.push(
      { dir: 9, frames: 6 },
      { dir: 5, frames: 14 },
      { dir: 5, buttons: BTN.HK, frames: 1 },
      { dir: 5, frames: 20 },
    );
  }
}

function maxReach(m: MoveDef): number {
  return m.hits.length ? Math.max(...m.hits.map((h) => h.box.x + h.box.w)) : 0;
}
