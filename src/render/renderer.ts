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
import { ASSET, image } from './assets';
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
  /** 맞은 순간 하얗게 번쩍이는 남은 프레임 */
  private hitFlash = [0, 0];

  constructor(private readonly g: CanvasRenderingContext2D) {}

  /** 로직 프레임마다 호출: 이벤트 → 이펙트/사운드 */
  consume(events: GameEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'hit':
          this.fx.spark(e.x, e.y, e.heavy ? 'heavy' : 'hit');
          this.hitFlash[1 - e.attacker] = 3;
          sfx.hit(e.heavy);
          break;
        case 'counterHit':
          this.fx.spark(e.x, e.y, 'counter');
          this.fx.text(e.x, e.y + 46, 'COUNTER', '#ffe14d');
          sfx.counter();
          break;
        case 'throw':
          this.fx.spark(e.x, e.y, 'heavy');
          this.fx.text(e.x, e.y + 50, 'THROW', '#ff8a5c');
          this.fx.shake = Math.max(this.fx.shake, 10);
          sfx.hit(true);
          break;
        case 'tech':
          this.fx.spark(e.x, e.y, 'block');
          this.fx.text(e.x, e.y + 50, 'TECH!', '#7fe3ff');
          this.fx.screenFlash('#bfefff', 0.25);
          sfx.block();
          break;
        case 'dust':
          this.fx.dust(e.x, e.big);
          break;
        case 'block':
          this.fx.spark(e.x, e.y, 'block');
          sfx.block();
          break;
        case 'counter':
          this.fx.spark(e.x, e.y, 'counter');
          this.fx.text(e.x, e.y + 40, 'REVERSAL!', '#ffe14d');
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
          this.fx.screenFlash('#ffffff', 0.9);
          sfx.ko();
          break;
        case 'announce':
          sfx.announce();
          break;
      }
    }
    this.fx.update();
    for (const i of [0, 1]) if (this.hitFlash[i] > 0) this.hitFlash[i]--;
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
      if (sprite)
        drawSprite(
          g,
          sprite.img,
          f.x,
          f.y,
          f.facing,
          sprite.recolor ? fighterPalette(f).main : null,
          this.hitFlash[f.index] > 0,
        );
      else
        drawDancer(g, sk, f.x, f.y, f.facing, f.def.look, fighterPalette(f), {
          tail: this.updateTail(f, sk),
          airborne: f.y > 0,
        });
      this.trackSmears(f, sk, freeze);
    }
    this.drawSmears();
    for (const f of m.fighters) this.drawHitFx(f);

    for (const p of m.projectiles) this.drawProjectile(p, fighterPalette(m.fighters[p.owner]));
    if (this.showBoxes) {
      for (const f of m.fighters) this.drawBoxes(f);
      for (const p of m.projectiles) this.drawRect(projectileBox(p), '#ff3c3c', 'rgba(255,60,60,0.3)');
    }
    this.fx.draw(g);
    g.restore();

    drawHud(g, m);
    if (this.superText) this.drawSuperText(m);
    this.fx.drawFlash(g, SCREEN_W, SCREEN_H);
  }

  /** 휩·전기처럼 몸보다 멀리 닿는 기술: 판정이 나와 있는 곳에 궤적을 그린다 (보이는 만큼 맞는다) */
  private drawHitFx(f: Fighter): void {
    const kind = f.state === 'move' ? f.move?.hitFx : undefined;
    if (!kind) return;
    const g = this.g;
    const color = fighterPalette(f).main;
    for (const { box } of f.activeHits()) {
      const y = GROUND_SCREEN_Y - (box.y + box.h / 2);
      const near = f.facing > 0 ? box.x : box.x + box.w;
      const far = f.facing > 0 ? box.x + box.w : box.x;
      g.save();
      g.lineCap = 'round';
      g.lineJoin = 'round';
      if (kind === 'whip') {
        // 휘어진 채찍 궤적 (바깥은 캐릭터 색, 안은 흰색)
        for (const [w, c, a] of [
          [14, color, 0.35],
          [5, '#ffffff', 0.9],
        ] as const) {
          g.globalAlpha = a;
          g.strokeStyle = c;
          g.lineWidth = w;
          g.beginPath();
          g.moveTo(near, y + 18);
          g.quadraticCurveTo((near + far) / 2, y - 26, far, y);
          g.stroke();
        }
      } else {
        // 지그재그 전기
        for (const [w, c, a] of [
          [10, '#5fd7ff', 0.4],
          [3, '#ffffff', 1],
        ] as const) {
          g.globalAlpha = a;
          g.strokeStyle = c;
          g.lineWidth = w;
          g.beginPath();
          const n = 7;
          for (let i = 0; i <= n; i++) {
            const x = near + ((far - near) * i) / n;
            const jy = i === 0 || i === n ? 0 : (Math.random() - 0.5) * box.h;
            if (i) g.lineTo(x, y + jy);
            else g.moveTo(x, y + jy);
          }
          g.stroke();
        }
      }
      g.restore();
    }
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
    const dashTrail = (f.state === 'dash' || f.state === 'backdash') && f.dashDef().trail;
    if (!dashTrail && (f.state !== 'move' || !f.move?.trail)) {
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

  /** 초필살기 컷인: 방사형 줄무늬 띠 위로 초상화가 미끄러져 들어오고 기술 이름이 뜬다 */
  private drawSuperText(m: Match): void {
    const g = this.g;
    const st = this.superText!;
    const t = 1 - st.life / 40;
    const slide = Math.min(1, t * 4);
    const left = st.player === 0;
    const bandY = SCREEN_H / 2 + 40;
    const bandH = 120;
    g.save();
    g.globalAlpha = Math.min(1, st.life / 8);
    // 띠 + 속도선
    g.fillStyle = this.superColor;
    g.fillRect(0, bandY - bandH / 2, SCREEN_W, bandH);
    g.save();
    g.beginPath();
    g.rect(0, bandY - bandH / 2, SCREEN_W, bandH);
    g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      const y = bandY - bandH / 2 + ((i * 37 + this.frame * 11) % bandH);
      const len = 80 + ((i * 53) % 160);
      const x = ((i * 97 + this.frame * (left ? 34 : -34)) % (SCREEN_W + len)) - len / 2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + len, y);
      g.stroke();
    }
    // 초상화
    const portrait = image(ASSET.portrait(m.fighters[st.player].def.id));
    if (portrait) {
      const ph = bandH + 60;
      const pw = (ph * portrait.width) / portrait.height;
      // 왼쪽(P1)은 왼쪽 밖에서, 오른쪽(P2)은 오른쪽 밖에서 들어와 화면 가장자리에서 멈춘다
      const px = left ? -pw + slide * (pw + 20) : SCREEN_W - slide * (pw + 20);
      g.save();
      g.translate(px, bandY + bandH / 2 - ph + 30);
      if (!left) {
        g.translate(pw, 0);
        g.scale(-1, 1);
      }
      g.drawImage(portrait, 0, 0, pw, ph);
      g.restore();
    }
    g.restore();
    g.strokeStyle = '#000';
    g.lineWidth = 4;
    g.strokeRect(-4, bandY - bandH / 2, SCREEN_W + 8, bandH);
    // 기술 이름
    g.font = `900 44px ${FONT_KR}`;
    g.textAlign = left ? 'right' : 'left';
    g.lineJoin = 'round';
    g.lineWidth = 8;
    const x = left ? SCREEN_W + 300 - slide * 340 : -300 + slide * 340;
    g.strokeText(st.name + '!', x, bandY + 16);
    g.fillStyle = '#fff';
    g.fillText(st.name + '!', x, bandY + 16);
    g.font = `900 18px ${FONT_TITLE}`;
    g.fillStyle = '#ffd23f';
    g.fillText('SUPER', x, bandY - 26);
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

  private drawProjectile(p: Projectile, pal: { main: string; cap: string }): void {
    const g = this.g;
    const color = pal.main;
    const sy = GROUND_SCREEN_Y - p.y;
    g.save();
    if (p.def.kind === 'cap') {
      // 락킹 모자: 빙글빙글 돌며 날아갔다 돌아온다 (뒤에 잔상)
      for (let i = 3; i >= 0; i--) {
        g.save();
        g.globalAlpha = i ? 0.18 * (4 - i) : 1;
        g.translate(p.x - p.vx * i * 2, sy);
        g.rotate(p.age * 0.45 - i * 0.3);
        g.fillStyle = pal.cap;
        g.strokeStyle = '#111';
        g.lineWidth = 2.5;
        g.beginPath();
        g.ellipse(0, 4, 24, 7, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.beginPath();
        g.ellipse(0, -2, 15, 13, 0, Math.PI, Math.PI * 2);
        g.fill();
        g.stroke();
        g.restore();
      }
    } else if (p.def.kind === 'arc') {
      // 왁 포즈 웨이브: 휩의 기세가 날아가는 초승달 파동 (뒤에 잔상)
      const dir = Math.sign(p.vx) || 1;
      for (let i = 3; i >= 0; i--) {
        g.save();
        g.globalAlpha = i ? 0.15 * (4 - i) : 1;
        g.translate(p.x - p.vx * i * 2.5, sy);
        g.scale(dir, 1);
        g.lineCap = 'round';
        g.strokeStyle = i ? color : '#ffffff';
        g.lineWidth = i ? 12 : 5;
        g.beginPath();
        g.arc(-14, 0, 34, -1.1, 1.1);
        g.stroke();
        if (!i) {
          g.strokeStyle = color;
          g.lineWidth = 3;
          g.beginPath();
          g.arc(-22, 0, 30, -1, 1);
          g.stroke();
        }
        g.restore();
      }
    } else if (p.def.kind === 'bolt') {
      // 팝 샷: 작고 빠른 전기탄 (지글거리는 꼬리)
      const dir = Math.sign(p.vx) || 1;
      const glow = g.createRadialGradient(p.x, sy, 1, p.x, sy, 20);
      glow.addColorStop(0, 'rgba(255,255,255,0.95)');
      glow.addColorStop(1, 'rgba(95,215,255,0)');
      g.fillStyle = glow;
      g.fillRect(p.x - 20, sy - 20, 40, 40);
      g.strokeStyle = '#9fe9ff';
      g.lineWidth = 2.5;
      g.lineJoin = 'round';
      for (let k = 0; k < 2; k++) {
        g.beginPath();
        g.moveTo(p.x, sy);
        for (let i = 1; i <= 5; i++) g.lineTo(p.x - dir * i * 9, sy + (Math.random() - 0.5) * 14);
        g.stroke();
      }
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(p.x, sy, 6, 0, Math.PI * 2);
      g.fill();
    } else if (p.def.kind === 'shockwave') {
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
