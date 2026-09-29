import { sfx } from '../audio/sfx';
import { GROUND_SCREEN_Y, SCREEN_H, SCREEN_W } from '../core/constants';
import type { Rect } from '../core/math';
import type { Fighter } from '../fighter/fighter';
import type { GameEvent } from '../game/events';
import type { Match } from '../game/match';
import { Effects } from './effects';
import { drawHud, FONT_KR, FONT_TITLE } from './hud';
import { drawStage } from './stage';
import { drawStickman, PALETTES } from './stickman';

export class Renderer {
  readonly fx = new Effects();
  showBoxes = false;
  private superText: { name: string; player: 0 | 1; life: number } | null = null;

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
      drawStickman(g, f.skeleton(), f.x, f.y, f.facing, PALETTES[f.index]);
    }

    if (this.showBoxes) for (const f of m.fighters) this.drawBoxes(f);
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
    g.fillStyle = PALETTES[st.player].main;
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

  private drawBoxes(f: Fighter): void {
    const g = this.g;
    const rect = (r: Rect, stroke: string, fill: string) => {
      const y = GROUND_SCREEN_Y - r.y - r.h;
      g.fillStyle = fill;
      g.fillRect(r.x, y, r.w, r.h);
      g.strokeStyle = stroke;
      g.lineWidth = 2;
      g.strokeRect(r.x, y, r.w, r.h);
    };
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
