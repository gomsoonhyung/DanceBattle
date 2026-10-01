import { GROUND_SCREEN_Y } from '../core/constants';
import { ASSET, FX_FRAMES, images, type FxKind } from './assets';

type SparkKind = 'hit' | 'heavy' | 'block' | 'counter';

/** 이펙트 종류 → 그림 파일 이름과 화면 크기 */
const FX: Record<SparkKind, { file: FxKind; size: number }> = {
  hit: { file: 'hit_light', size: 120 },
  heavy: { file: 'hit_heavy', size: 165 },
  block: { file: 'block', size: 115 },
  counter: { file: 'counter', size: 175 },
};

interface Spark {
  kind: SparkKind;
  rot: number;
  x: number;
  y: number;
  life: number;
  max: number;
  color: string;
  size: number;
  rays: number[];
}

/** 바닥 먼지 한 알갱이 */
interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

/** 순수 연출용 상태. 게임 로직에 영향을 주지 않는다. */
export class Effects {
  private sparks: Spark[] = [];
  private texts: FloatText[] = [];
  private puffs: Puff[] = [];
  shake = 0;
  /** 화면 전체 섬광 (KO 등). 0~1 */
  flash = 0;
  private flashColor = '#fff';

  spark(wx: number, wy: number, kind: SparkKind): void {
    const color =
      kind === 'block' ? '#9fd8ff' : kind === 'counter' ? '#ffe14d' : kind === 'heavy' ? '#ffb13b' : '#fff3a0';
    const size = kind === 'heavy' || kind === 'counter' ? 46 : kind === 'block' ? 26 : 30;
    const n = kind === 'block' ? 6 : 10;
    const rays = Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2 + Math.random() * 0.4);
    this.sparks.push({
      kind,
      rot: Math.random() * Math.PI * 2,
      x: wx,
      y: GROUND_SCREEN_Y - wy,
      life: 0,
      max: 14,
      color,
      size,
      rays,
    });
    if (kind === 'heavy' || kind === 'counter') this.shake = Math.max(this.shake, 8);
  }

  /** 발밑 먼지: 대시 출발·착지·넘어짐 */
  dust(wx: number, big: boolean): void {
    const n = big ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      const sp = (0.6 + Math.random() * 1.6) * (big ? 1.6 : 1);
      this.puffs.push({
        x: wx + side * Math.random() * 14,
        y: GROUND_SCREEN_Y - 2,
        vx: side * sp,
        vy: -(0.3 + Math.random() * (big ? 1.4 : 0.8)),
        r: (big ? 9 : 6) + Math.random() * 5,
        life: 0,
        max: 22 + Math.floor(Math.random() * 10),
      });
    }
  }

  screenFlash(color: string, amount = 1): void {
    this.flash = Math.max(this.flash, amount);
    this.flashColor = color;
  }

  text(wx: number, wy: number, text: string, color: string): void {
    this.texts.push({ x: wx, y: GROUND_SCREEN_Y - wy, text, color, life: 50 });
  }

  update(): void {
    for (const s of this.sparks) s.life++;
    this.sparks = this.sparks.filter((s) => s.life < s.max);
    for (const t of this.texts) {
      t.life--;
      t.y -= 0.8;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const p of this.puffs) {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.92;
      p.r += 0.35;
    }
    this.puffs = this.puffs.filter((p) => p.life < p.max);
    this.flash *= 0.86;
    if (this.flash < 0.02) this.flash = 0;
    this.shake *= 0.85;
    if (this.shake < 0.3) this.shake = 0;
  }

  draw(g: CanvasRenderingContext2D): void {
    g.save();
    for (const p of this.puffs) {
      g.globalAlpha = 0.28 * (1 - p.life / p.max);
      g.fillStyle = '#d9cbb8';
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.lineCap = 'round';
    for (const s of this.sparks) {
      const t = s.life / s.max;
      // 이펙트 그림이 준비됐으면 그림 애니메이션으로
      const fx = FX[s.kind];
      const frames = images(Array.from({ length: FX_FRAMES }, (_, i) => ASSET.fx(fx.file, i)));
      if (frames) {
        const img = frames[Math.min(FX_FRAMES - 1, Math.floor(t * FX_FRAMES))];
        g.globalAlpha = 1;
        g.save();
        g.translate(s.x, s.y);
        g.rotate(s.rot);
        g.drawImage(img, -fx.size / 2, -fx.size / 2, fx.size, fx.size);
        g.restore();
        continue;
      }
      g.globalAlpha = 1 - t;
      g.strokeStyle = s.color;
      g.lineWidth = 4 * (1 - t) + 1;
      const r0 = s.size * t * 0.4;
      const r1 = s.size * (0.4 + t * 0.8);
      g.beginPath();
      for (const a of s.rays) {
        g.moveTo(s.x + Math.cos(a) * r0, s.y + Math.sin(a) * r0);
        g.lineTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1);
      }
      g.stroke();
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(s.x, s.y, s.size * 0.35 * (1 - t), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.textAlign = 'center';
    g.font = '900 28px "Arial Black", Impact, sans-serif';
    g.lineWidth = 6;
    g.lineJoin = 'round';
    for (const t of this.texts) {
      g.globalAlpha = Math.min(1, t.life / 15);
      g.strokeStyle = '#000';
      g.strokeText(t.text, t.x, t.y);
      g.fillStyle = t.color;
      g.fillText(t.text, t.x, t.y);
    }
    g.restore();
  }

  /** 화면 전체 섬광 (HUD 위에 그린다) */
  drawFlash(g: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.flash <= 0) return;
    g.save();
    g.globalAlpha = this.flash;
    g.fillStyle = this.flashColor;
    g.fillRect(0, 0, w, h);
    g.restore();
  }
}
