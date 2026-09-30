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
  shake = 0;

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
    this.shake *= 0.85;
    if (this.shake < 0.3) this.shake = 0;
  }

  draw(g: CanvasRenderingContext2D): void {
    g.save();
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
}
