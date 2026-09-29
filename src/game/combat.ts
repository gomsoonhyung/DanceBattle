import { PUSHBOX_HALF_W, STAGE_LEFT, STAGE_RIGHT } from '../core/constants';
import { rectsOverlap, type Rect } from '../core/math';
import type { Fighter } from '../fighter/fighter';
import type { HitDef } from '../fighter/types';
import type { GameEvent } from './events';

interface Contact {
  att: Fighter;
  def: Fighter;
  hit: HitDef;
  idx: number;
  at: { x: number; y: number };
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

function applyPush(att: Fighter, def: Fighter, push: number): void {
  const dir = att.facing;
  const atWall = dir > 0 ? def.x >= STAGE_RIGHT - 2 : def.x <= STAGE_LEFT + 2;
  if (atWall) att.pushVel = -dir * push;
  else def.pushVel = dir * push;
}

function applyContact(c: Contact, events: GameEvent[]): void {
  const { att, def, hit } = c;
  att.hitIds.add(c.idx);
  att.moveConnected = true;
  const hitstop = hit.hitstop ?? 8;

  // 프리즈 반격
  const counterInto = def.counterMoveId();
  if (counterInto && att.move?.kind !== 'super') {
    def.startMove(def.def.moves[counterInto]);
    att.hitstop = 18;
    def.hitstop = 6;
    events.push({ type: 'counter', x: c.at.x, y: c.at.y });
    return;
  }

  const guard = def.guardAgainst(hit.level);
  if (guard) {
    def.enterBlockstun(hit.blockstun, guard);
    if (hit.chip) def.health = Math.max(1, def.health - hit.chip);
    applyPush(att, def, hit.push ?? 6);
    att.hitstop = def.hitstop = Math.max(4, hitstop - 2);
    att.addMeter(2);
    def.addMeter(2);
    events.push({ type: 'block', x: c.at.x, y: c.at.y, heavy: !!hit.heavy });
    return;
  }

  // 콤보 보정: 히트 수가 늘수록 데미지 감소 (최소 30%)
  const scale = Math.max(0.3, 1 - def.comboHits * 0.1);
  const dmg = Math.max(1, Math.round(hit.damage * scale));
  def.health = Math.max(0, def.health - dmg);
  def.comboHits++;
  def.comboDamage += dmg;
  if (att.move?.kind !== 'super') att.addMeter(dmg / 8);
  def.addMeter(dmg / 16);

  const f = att.facing;
  if (def.health <= 0) {
    def.enterAirHit(4 * f, 10);
  } else if (hit.launch || hit.knockdown || def.airborne) {
    const l = hit.launch ?? (hit.knockdown ? { vx: 4, vy: 7 } : { vx: 2.5, vy: 6 });
    def.enterAirHit(l.vx * f, l.vy);
  } else {
    def.enterHitstun(hit.hitstun);
    applyPush(att, def, hit.push ?? 6);
  }
  att.hitstop = def.hitstop = hitstop;
  events.push({ type: 'hit', x: c.at.x, y: c.at.y, heavy: !!hit.heavy, attacker: att.index });
}

/** 양쪽 공격 판정을 먼저 모두 찾은 뒤 적용한다 (동시 타격 = 상쇄 없이 둘 다 맞음). */
export function resolveHits(a: Fighter, b: Fighter, events: GameEvent[]): void {
  const c1 = findContact(a, b);
  const c2 = findContact(b, a);
  if (c1) applyContact(c1, events);
  if (c2) applyContact(c2, events);
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
