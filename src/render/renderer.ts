import { sfx } from '../audio/sfx';
import { GROUND_SCREEN_Y, SCREEN_H, SCREEN_W } from '../core/constants';
import type { Rect, Vec2 } from '../core/math';
import type { Skeleton } from '../anim/pose';
import type { Fighter } from '../fighter/fighter';
import type { GameEvent } from '../game/events';
import { projectileBox, type Projectile } from '../game/combat';
import type { Match } from '../game/match';
import { Effects } from './effects';
import { drawHud, FONT_KR, FONT_TITLE } from './hud';
import { drawStage } from './stage';
import { drawDancer, fighterPalette, headFrame, tailAnchor } from './dancer';
import { TailChain, type Smear } from './dynamics';
import { drawSprite, spriteFor } from './sprites';
import { drawCrowd } from './stage';

export class Renderer {
  readonly fx = new Effects();
  showBoxes = false;
  private superText: { name: string; player: 0 | 1; life: number } | null = null;
  private superColor = '#fff';
  /** 잔상 연출용: 캐릭터별 최근 모습 */
  private trails: { x: number; y: number; facing: 1 | -1; sk: Skeleton }[][] = [[], []];
  /** 흔들리는 머리카락·끈 */
  private tails: (TailChain | null)[] = [null, null];
  /** 공격 궤적 */
  private smears: Smear[] = [];
  private lastEnds: (Vec2[] | null)[] = [null, null];
  private frame = 0;

  constructor(private readonly g: CanvasRenderingContext2D) {}

  /** 로직 프레임마다 호출: 이벤트 → 이펙트/사운드 */
  consume(events: GameEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'hit':
          this.fx.spark(e.x, e.y, e.heavy ? 'heavy' : 'hit');
          sfx.hit(e.heavy);
          break;
        case 'block':
          this.fx.spark(e.x, e.y, 'block');
          sfx.block();
          break;
        case 'counter':
          this.fx.spark(e.x, e.y, 'counter');
          this.fx.text(e.x, e.y + 40, 'COUNTER!', '#ffe14d');
          sfx.counter();
          break;
        case 'taunt':
          this.fx.spark(e.x, e.y, 'counter');
          this.fx.text(e.x, e.y + 30, 'STRIKE A POSE!', '#ff9ff3');
          sfx.announce();
          break;
        case 'armor':
          this.fx.spark(e.x, e.y, 'block');
          this.fx.text(e.x, e.y + 40, 'ARMOR', '#ffffff');
          sfx.block();
          break;
        case 'super':
          this.superText = { name: e.name, player: e.player, life: 40 };
          sfx.super();
          break;
        case 'ko':
          this.fx.shake = 14;
          sfx.ko();
          break;
        case 'announce':
          sfx.announce();
          break;
      }
    }
    this.fx.update();
    if (this.superText && --this.superText.life <= 0) this.superText = null;
  }

  draw(m: Match): void {
    const g = this.g;
    if (this.superText) this.superColor = fighterPalette(m.fighters[this.superText.player]).main;
    g.save();
    if (this.fx.shake > 0) {
      g.translate((Math.random() - 0.5) * this.fx.shake, (Math.random() - 0.5) * this.fx.shake);
    }
    drawStage(g);
    drawCrowd(g, this.frame++);

    const freeze = m.superFreeze > 0;
    if (freeze) {
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.fillRect(-20, -20, SCREEN_W + 40, SCREEN_H + 40);
    }

    // 그림자
    for (const f of m.fighters) {
      const scale = Math.max(0.4, 1 - f.y / 300);
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath();
      g.ellipse(f.x, GROUND_SCREEN_Y + 4, 42 * scale, 8 * scale, 0, 0, Math.PI * 2);
      g.fill();
    }

    // 공격 중인 캐릭터를 앞에 그린다
    const order = [...m.fighters].sort((a, b) => Number(a.state === 'move') - Number(b.state === 'move'));
    for (const f of order) {
      if (freeze && f.index === m.superOwner) this.drawAura(f);
      const sk = f.skeleton();
      this.drawTrail(f, sk, freeze);
      // 교체 그림(스프라이트)이 있으면 그 그림을, 없으면 코드로 그린 캐릭터를
      const key = f.displayKey();
      const sprite = spriteFor(f.def.id, key.id, key.frame, f.index);
      if (sprite) drawSprite(g, sprite.img, f.x, f.y, f.facing, sprite.recolor ? fighterPalette(f).main : null);
      else
        drawDancer(g, sk, f.x, f.y, f.facing, f.def.look, fighterPalette(f), {
          tail: this.updateTail(f, sk),
          airborne: f.y > 0,
        });
      this.trackSmears(f, sk, freeze);
    }
    this.drawSmears();

    for (const p of m.projectiles) this.drawProjectile(p, fighterPalette(m.fighters[p.owner]).main);
    if (this.showBoxes) {
      for (const f of m.fighters) this.drawBoxes(f);
      for (const p of m.projectiles) this.drawRect(projectileBox(p), '#ff3c3c', 'rgba(255,60,60,0.3)');
    }
    this.fx.draw(g);
    g.restore();

    drawHud(g, m);
    if (this.superText) this.drawSuperText();
  }

  /** 포니테일·머리띠 끈 흔들림 계산 */
  private updateTail(f: Fighter, sk: Skeleton): Vec2[] | undefined {
    const h = headFrame(sk, f.x, f.y, f.facing);
    const anchor = tailAnchor(h, f.def.look);
    if (!anchor) return undefined;
    const ponytail = f.def.look.headwear === 'ponytail';
    const chain = (this.tails[f.index] ??= new TailChain(ponytail ? 5 : 4, ponytail ? 7 : 6));
    return chain.update(anchor, { x: -h.front.x, y: -h.front.y }, GROUND_SCREEN_Y);
  }

  /** 기술 중 빠르게 움직인 손발 끝을 궤적으로 남긴다 */
  private trackSmears(f: Fighter, sk: Skeleton, frozen: boolean): void {
    const S = (p: Vec2): Vec2 => ({ x: f.x + p.x * f.facing, y: GROUND_SCREEN_Y - (f.y + p.y) });
    const ends = [S(sk.handF), S(sk.footF), S(sk.handB), S(sk.footB)];
    const last = this.lastEnds[f.index];
    if (last && !frozen && f.state === 'move') {
      ends.forEach((e, i) => {
        const d = Math.hypot(e.x - last[i].x, e.y - last[i].y);
        if (d > 9 && d < 120) this.smears.push({ a: last[i], b: e, life: 8, width: Math.min(16, 6 + d * 0.3) });
      });
    }
    this.lastEnds[f.index] = ends;
  }

  private drawSmears(): void {
    const g = this.g;
    g.save();
    g.lineCap = 'round';
    for (const sm of this.smears) {
      const t = sm.life / 8;
      g.strokeStyle = `rgba(255,255,255,${0.32 * t})`;
      g.lineWidth = sm.width * t;
      g.beginPath();
      g.moveTo(sm.a.x, sm.a.y);
      g.lineTo(sm.b.x, sm.b.y);
      g.stroke();
      sm.life--;
    }
    g.restore();
    this.smears = this.smears.filter((sm) => sm.life > 0);
  }

  /** 잔상이 있는 기술(trail) 중이면 지나온 모습을 반투명하게 그린다 */
  private drawTrail(f: Fighter, sk: Skeleton, frozen: boolean): void {
    const list = this.trails[f.index];
    if (f.state !== 'move' || !f.move?.trail) {
      list.length = 0;
      return;
    }
    const pal = fighterPalette(f);
    list.forEach((t, i) => {
      this.g.globalAlpha = 0.12 + (i / list.length) * 0.3;
      drawDancer(this.g, t.sk, t.x, t.y, t.facing, f.def.look, pal, { silhouette: pal.main });
    });
    this.g.globalAlpha = 1;
    if (!frozen) {
      list.push({ x: f.x, y: f.y, facing: f.facing, sk });
      if (list.length > 5) list.shift();
    }
  }

  private drawAura(f: Fighter): void {
    const g = this.g;
    const cx = f.x;
    const cy = GROUND_SCREEN_Y - f.y - 90;
    const grad = g.createRadialGradient(cx, cy, 10, cx, cy, 160);
    grad.addColorStop(0, 'rgba(124,255,178,0.55)');
    grad.addColorStop(1, 'rgba(124,255,178,0)');
    g.fillStyle = grad;
    g.fillRect(cx - 170, cy - 170, 340, 340);
  }

  private drawSuperText(): void {
    const g = this.g;
    const st = this.superText!;
    const t = 1 - st.life / 40;
    const slide = Math.min(1, t * 4);
    const left = st.player === 0;
    g.save();
    g.globalAlpha = Math.min(1, st.life / 10);
    g.fillStyle = this.superColor;
    const bandY = SCREEN_H / 2 + 60;
    g.fillRect(0, bandY - 36, SCREEN_W, 56);
    g.font = `900 40px ${FONT_KR}`;
    g.textAlign = left ? 'left' : 'right';
    g.fillStyle = '#fff';
    const x = left ? -300 + slide * 360 : SCREEN_W + 300 - slide * 360;
    g.fillText(st.name + '!', x, bandY + 6);
    g.font = `900 16px ${FONT_TITLE}`;
    g.fillText('SUPER', x, bandY - 42);
    g.restore();
  }

  private drawRect(r: Rect, stroke: string, fill: string): void {
    const g = this.g;
    const y = GROUND_SCREEN_Y - r.y - r.h;
    g.fillStyle = fill;
    g.fillRect(r.x, y, r.w, r.h);
    g.strokeStyle = stroke;
    g.lineWidth = 2;
    g.strokeRect(r.x, y, r.w, r.h);
  }

  private drawProjectile(p: Projectile, color: string): void {
    const g = this.g;
    const sy = GROUND_SCREEN_Y - p.y;
    g.save();
    if (p.def.kind === 'shockwave') {
      // 바닥을 타고 가는 충격파: 겹친 아치 + 튀는 파편
      g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const t = (p.age * 0.25 + i) % 3;
        const r = 12 + t * 10;
        g.globalAlpha = 1 - t / 3;
        g.strokeStyle = i === 0 ? '#fff3c4' : color;
        g.lineWidth = 6 - t * 1.5;
        g.beginPath();
        g.ellipse(p.x, GROUND_SCREEN_Y, r * 1.3, r * 1.6, 0, Math.PI, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
      g.fillStyle = color;
      for (let i = 0; i < 5; i++) {
        const a = (p.age * 7 + i * 71) % 360;
        const dx = Math.cos(a) * 22;
        const dy = Math.abs(Math.sin(a * 1.7)) * 34;
        g.fillRect(p.x + dx - 2, GROUND_SCREEN_Y - dy - 2, 4, 4);
      }
    } else if (p.def.kind === 'wave') {
      // 팝핑 웨이브: 출렁이며 날아가는 에너지 파동
      const dir = Math.sign(p.vx) || 1;
      for (const [w, a, c] of [
        [10, 0.25, color],
        [4, 1, '#ffffff'],
      ] as const) {
        g.globalAlpha = a;
        g.strokeStyle = c;
        g.lineWidth = w;
        g.lineCap = 'round';
        g.beginPath();
        for (let i = 0; i <= 12; i++) {
          const x = p.x - dir * i * 4;
          const y = sy + Math.sin(p.age * 0.5 - i * 0.7) * 10 * (1 - i / 16);
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.stroke();
      }
    } else if (p.def.kind === 'heart') {
      // 블로우 키스: 둥실 떠가는 하트
      const bob = Math.sin(p.age * 0.15) * 6;
      const glow = g.createRadialGradient(p.x, sy + bob, 2, p.x, sy + bob, 30);
      glow.addColorStop(0, 'rgba(255,120,200,0.8)');
      glow.addColorStop(1, 'rgba(255,120,200,0)');
      g.fillStyle = glow;
      g.fillRect(p.x - 30, sy + bob - 30, 60, 60);
      g.translate(p.x, sy + bob);
      g.scale(1 + Math.sin(p.age * 0.3) * 0.08, 1 + Math.sin(p.age * 0.3) * 0.08);
      g.fillStyle = '#ff5fb2';
      g.beginPath();
      g.moveTo(0, 12);
      g.bezierCurveTo(-18, -2, -12, -18, 0, -8);
      g.bezierCurveTo(12, -18, 18, -2, 0, 12);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.beginPath();
      g.arc(-6, -6, 3, 0, Math.PI * 2);
      g.fill();
    } else {
      // 포인트 스파크: 빛나는 별 + 꼬리
      g.strokeStyle = 'rgba(255,240,160,0.5)';
      g.lineWidth = 8;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(p.x, sy);
      g.lineTo(p.x - p.vx * 5, sy);
      g.stroke();
      const glow = g.createRadialGradient(p.x, sy, 2, p.x, sy, 26);
      glow.addColorStop(0, 'rgba(255,255,255,0.9)');
      glow.addColorStop(1, 'rgba(255,220,80,0)');
      g.fillStyle = glow;
      g.fillRect(p.x - 26, sy - 26, 52, 52);
      g.translate(p.x, sy);
      g.rotate(p.age * 0.3);
      g.fillStyle = '#fff5a0';
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 6 : 15;
        const a = (i / 10) * Math.PI * 2;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  private drawBoxes(f: Fighter): void {
    const g = this.g;
    const rect = (r: Rect, stroke: string, fill: string) => this.drawRect(r, stroke, fill);
    const hurt = f.hurtbox();
    if (hurt) rect(hurt, '#3cff7a', 'rgba(60,255,122,0.15)');
    for (const h of f.activeHits()) rect(h.box, '#ff3c3c', 'rgba(255,60,60,0.3)');
    g.fillStyle = '#fff';
    g.fillRect(f.x - 2, GROUND_SCREEN_Y - f.y - 2, 4, 4);
    g.font = `12px ${FONT_KR}`;
    g.textAlign = 'center';
    const label = f.state === 'move' ? `${f.move!.name} ${f.moveFrame}F` : f.state;
    g.fillText(label, f.x, GROUND_SCREEN_Y + 22 + f.index * 14);
  }
}
