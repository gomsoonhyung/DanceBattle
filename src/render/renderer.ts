import { sfx } from '../audio/sfx';
import { GROUND_SCREEN_Y, SCREEN_H, SCREEN_W } from '../core/constants';
import type { Rect } from '../core/math';
import type { Fighter } from '../fighter/fighter';
import type { GameEvent } from '../game/events';
import { projectileBox, type Projectile } from '../game/combat';
import type { Match } from '../game/match';
import { Effects } from './effects';
import { drawHud, FONT_KR, FONT_TITLE } from './hud';
import { drawStage } from './stage';
import { drawStickman, fighterPalette } from './stickman';

export class Renderer {
  readonly fx = new Effects();
  showBoxes = false;
  private superText: { name: string; player: 0 | 1; life: number } | null = null;
  private superColor = '#fff';

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
      drawStickman(g, f.skeleton(), f.x, f.y, f.facing, f.def.look, fighterPalette(f));
    }

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
