import { PUSHBOX_HALF_W, STAGE_LEFT, STAGE_RIGHT } from '../core/constants';
import { rectsOverlap, type Rect } from '../core/math';
import type { Fighter } from '../fighter/fighter';
import type { HitDef, ProjectileDef } from '../fighter/types';
import type { GameEvent } from './events';

type HitProps = Omit<HitDef, 'frames' | 'box'>;

const COUNTER_DAMAGE = 1.2;
const TECH_STUN = 14;

/** 날아가는 중인 장풍 */
export interface Projectile {
  owner: 0 | 1;
  def: ProjectileDef;
  x: number;
  y: number;
  vx: number;
  facing: 1 | -1;
  life: number;
  age: number;
  dead: boolean;
}

interface Contact {
  att: Fighter;
  def: Fighter;
  hit: HitProps;
  at: { x: number; y: number };
  /** 근접 공격이면 히트 번호, 장풍이면 해당 장풍 */
  idx?: number;
  projectile?: Projectile;
}

function overlapCenter(a: Rect, b: Rect): { x: number; y: number } {
  const x0 = Math.max(a.x, b.x);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y0 = Math.max(a.y, b.y);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
}

function findContact(att: Fighter, def: Fighter): Contact | null {
  const hurt = def.hurtbox();
  if (!hurt) return null;
  for (const { idx, box } of att.activeHits()) {
    if (rectsOverlap(box, hurt)) {
      return { att, def, hit: att.move!.hits[idx], idx, at: overlapCenter(box, hurt) };
    }
  }
  return null;
}

function applyPush(att: Fighter, def: Fighter, push: number, dir: 1 | -1, melee: boolean): void {
  const atWall = dir > 0 ? def.x >= STAGE_RIGHT - 2 : def.x <= STAGE_LEFT + 2;
  if (atWall && melee) att.pushVel = -dir * push;
  else def.pushVel = dir * push;
}

function applyContact(c: Contact, events: GameEvent[]): void {
  const { att, def, hit } = c;
  const melee = !c.projectile;
  if (melee) {
    att.hitIds.add(c.idx!);
    att.moveConnected = true;
  }
  const dir: 1 | -1 = c.projectile ? (c.projectile.vx >= 0 ? 1 : -1) : att.facing;
  const hitstop = hit.hitstop ?? 8;
  const isSuper = melee && att.move?.kind === 'super';

  // 프리즈 반격
  const counterInto = def.counterMoveId();
  if (counterInto && !isSuper) {
    def.startMove(def.def.moves[counterInto]);
    if (melee) att.hitstop = 18;
    def.hitstop = 6;
    events.push({ type: 'counter', x: c.at.x, y: c.at.y });
    return;
  }

  const guard = hit.unblockable ? null : def.guardAgainst(hit.level);
  if (guard) {
    def.enterBlockstun(hit.blockstun, guard);
    if (hit.chip) def.health = Math.max(1, def.health - hit.chip);
    applyPush(att, def, hit.push ?? 6, dir, melee);
    def.hitstop = Math.max(4, hitstop - 2);
    if (melee) att.hitstop = def.hitstop;
    att.addMeter(2);
    def.addMeter(2);
    events.push({ type: 'block', x: c.at.x, y: c.at.y, heavy: !!hit.heavy });
    return;
  }

  // 카운터 히트: 상대가 공격을 내미는 중에 맞히면 데미지·경직 증가
  const counterHit = def.inAttackStartup();
  // 콤보 보정: 히트 수가 늘수록 데미지 감소 (최소 30%)
  const scale = Math.max(0.3, 1 - def.comboHits * 0.1) * (counterHit ? COUNTER_DAMAGE : 1);
  const dmg = Math.max(1, Math.round(hit.damage * scale));

  // 슈퍼아머: 데미지만 받고 기술은 계속된다 (초필살기에는 깨짐)
  if (!isSuper && def.consumeArmor()) {
    def.health = Math.max(1, def.health - dmg);
    def.hitstop = hitstop;
    if (melee) att.hitstop = hitstop;
    events.push({ type: 'armor', x: c.at.x, y: c.at.y });
    return;
  }

  def.health = Math.max(0, def.health - dmg);
  def.comboHits++;
  def.comboDamage += dmg;
  if (!isSuper) att.addMeter(dmg / 8);
  def.addMeter(dmg / 16);

  if (def.health <= 0) {
    def.enterAirHit(4 * dir, 10);
  } else if (hit.launch || hit.knockdown || def.airborne) {
    const l = hit.launch ?? (hit.knockdown ? { vx: 4, vy: 7 } : { vx: 2.5, vy: 6 });
    def.enterAirHit(l.vx * dir, l.vy);
  } else {
    def.enterHitstun(hit.hitstun + (counterHit ? (hit.heavy ? 8 : 4) : 0));
    applyPush(att, def, hit.push ?? 6, dir, melee);
  }
  def.hitstop = hitstop + (counterHit ? 4 : 0);
  if (melee) att.hitstop = def.hitstop;
  events.push({ type: 'hit', x: c.at.x, y: c.at.y, heavy: !!hit.heavy, attacker: att.index });
  if (counterHit) events.push({ type: 'counterHit', x: c.at.x, y: c.at.y });
}

/** 잡기 판정: 잡기 기술이 잡는 프레임에 상대가 사거리 안에 있으면 잡는다 (가드 불가, 잡기 풀기 가능) */
function tryGrab(att: Fighter, def: Fighter, events: GameEvent[]): void {
  const g = att.move?.grab;
  if (att.state !== 'move' || !g || att.moveFrame !== g.frame || att.hitstop > 0) return;
  if (!def.canBeGrabbed() || Math.abs(def.x - att.x) > g.range) return;
  const at = { x: (att.x + def.x) / 2, y: 110 };
  // 잡기 풀기: 둘 다 튕겨 나오고 데미지 없음
  if (def.techsGrab()) {
    att.enterBlockstun(TECH_STUN, 'stand');
    def.enterBlockstun(TECH_STUN, 'stand');
    att.pushVel = -att.facing * 7;
    def.pushVel = att.facing * 7;
    events.push({ type: 'tech', x: at.x, y: at.y });
    return;
  }
  let dir = att.facing;
  if (att.grabBack) {
    // 뒤로 던지기: 상대를 내 뒤로 넘긴다
    def.x = att.x - att.facing * 40;
    dir = -att.facing as 1 | -1;
  }
  def.health = Math.max(0, def.health - g.damage);
  def.comboHits++;
  def.comboDamage += g.damage;
  att.addMeter(g.damage / 8);
  def.addMeter(g.damage / 16);
  def.enterAirHit(g.launch.vx * dir, g.launch.vy);
  att.hitstop = def.hitstop = 10;
  events.push({ type: 'throw', x: at.x, y: at.y });
}

/** 양쪽 공격 판정을 먼저 모두 찾은 뒤 적용한다 (동시 타격 = 상쇄 없이 둘 다 맞음). */
export function resolveHits(a: Fighter, b: Fighter, events: GameEvent[]): void {
  tryGrab(a, b, events);
  tryGrab(b, a, events);
  const c1 = findContact(a, b);
  const c2 = findContact(b, a);
  if (c1) applyContact(c1, events);
  if (c2) applyContact(c2, events);
}

export function spawnProjectile(owner: Fighter, def: ProjectileDef): Projectile {
  return {
    owner: owner.index,
    def,
    x: owner.x + def.x * owner.facing,
    y: owner.y + def.y,
    vx: def.vx * owner.facing,
    facing: owner.facing,
    life: def.life,
    age: 0,
    dead: false,
  };
}

export function projectileBox(p: Projectile): Rect {
  const b = p.def.box;
  const x = p.facing > 0 ? p.x + b.x : p.x - b.x - b.w;
  return { x, y: p.y + b.y, w: b.w, h: b.h };
}

/** 장풍 이동 → 장풍끼리 상쇄 → 상대 적중 처리 */
export function updateProjectiles(
  list: Projectile[],
  fighters: [Fighter, Fighter],
  canHit: boolean,
  events: GameEvent[],
): void {
  for (const p of list) {
    p.x += p.vx;
    p.age++;
    if (--p.life <= 0 || p.x < STAGE_LEFT - 60 || p.x > STAGE_RIGHT + 60) p.dead = true;
    // 되돌아오는 장풍: 방향을 바꾸고, 주인에게 닿으면 사라진다
    const back = p.def.returnAfter;
    if (back !== undefined) {
      if (p.age === back) p.vx = -p.vx;
      const owner = fighters[p.owner];
      if (p.age > back && Math.sign(owner.x - p.x) !== Math.sign(p.vx)) p.dead = true;
    }
  }
  for (const p of list) {
    for (const q of list) {
      if (p.dead || q.dead || p.owner === q.owner) continue;
      const pb = projectileBox(p);
      const qb = projectileBox(q);
      if (rectsOverlap(pb, qb)) {
        p.dead = q.dead = true;
        const at = overlapCenter(pb, qb);
        events.push({ type: 'block', x: at.x, y: at.y, heavy: true });
      }
    }
  }
  if (!canHit) return;
  for (const p of list) {
    if (p.dead) continue;
    const att = fighters[p.owner];
    const def = fighters[1 - p.owner];
    const hurt = def.hurtbox();
    const box = projectileBox(p);
    if (hurt && rectsOverlap(box, hurt)) {
      p.dead = true;
      applyContact({ att, def, hit: p.def.hit, at: overlapCenter(box, hurt), projectile: p }, events);
    }
  }
}

/** 두 캐릭터가 겹치지 않도록 밀어낸다. */
export function separate(a: Fighter, b: Fighter): void {
  const verticalOverlap = Math.abs(a.y - b.y) < 140;
  if (!verticalOverlap) return;
  const minDist = PUSHBOX_HALF_W * 2;
  const dx = b.x - a.x;
  const dist = Math.abs(dx);
  if (dist >= minDist) return;
  const dir = dx !== 0 ? Math.sign(dx) : a.facing;
  const overlap = (minDist - dist) / 2;
  a.x -= dir * overlap;
  b.x += dir * overlap;
  // 벽에 막힌 쪽 대신 반대쪽을 민다
  const lo = STAGE_LEFT;
  const hi = STAGE_RIGHT;
  for (const [p, q] of [
    [a, b],
    [b, a],
  ] as const) {
    if (p.x < lo) {
      q.x += lo - p.x;
      p.x = lo;
    } else if (p.x > hi) {
      q.x -= p.x - hi;
      p.x = hi;
    }
  }
}
