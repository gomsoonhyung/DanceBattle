import { evalAnim, type Anim } from '../anim/pose';
import { BBOY } from '../characters/bboy';
import { GROUND_SCREEN_Y, SCREEN_W } from '../core/constants';
import { drawStickman, PALETTES } from '../render/stickman';

/**
 * 애니메이션 확인용 페이지.
 *   ?gallery          → 모든 동작을 반복 재생
 *   ?gallery=windmill → 해당 동작을 프레임별로 나열 (필름 스트립)
 */
export function renderGallery(g: CanvasRenderingContext2D, only: string): void {
  const all: [string, Anim, number][] = [
    ...Object.entries(BBOY.anims).map(([k, a]): [string, Anim, number] => [k, a, a.loop ?? 40]),
    ...Object.values(BBOY.moves).map((m): [string, Anim, number] => [m.id, m.anim, m.total]),
  ];

  if (only) {
    const found = all.find(([k]) => k === only);
    if (!found) return;
    const [name, anim, len] = found;
    const cols = 8;
    const rows = 2;
    const n = cols * rows;
    const cellW = SCREEN_W / cols;
    const scale = 0.5;
    g.fillStyle = '#222';
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    for (let i = 0; i < n; i++) {
      const f = Math.round((i / (n - 1)) * (len - 1));
      const col = i % cols;
      const row = Math.floor(i / cols);
      g.save();
      g.translate(col * cellW + cellW / 2, row * 260 + 20);
      g.scale(scale, scale);
      g.translate(0, -GROUND_SCREEN_Y + 440);
      g.strokeStyle = '#555';
      g.beginPath();
      g.moveTo(-cellW, GROUND_SCREEN_Y);
      g.lineTo(cellW, GROUND_SCREEN_Y);
      g.stroke();
      drawStickman(g, evalAnim(anim, f), 0, 0, 1, PALETTES[0]);
      g.restore();
      g.fillStyle = '#fff';
      g.font = '12px sans-serif';
      g.textAlign = 'center';
      g.fillText(`${name} f${f}`, col * cellW + cellW / 2, row * 260 + 250);
    }
    return;
  }

  const cols = 8;
  const cellW = SCREEN_W / cols;
  const cellH = 135;
  let t = 0;
  const loop = () => {
    t++;
    g.fillStyle = '#222';
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    all.forEach(([name, anim, len], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      g.save();
      g.translate(col * cellW + cellW / 2, row * cellH + cellH - 22);
      g.scale(0.5, 0.5);
      g.translate(0, -GROUND_SCREEN_Y);
      drawStickman(g, evalAnim(anim, t % (len + 20)), 0, 0, 1, PALETTES[i % 2]);
      g.restore();
      g.fillStyle = '#ccc';
      g.font = '11px sans-serif';
      g.textAlign = 'center';
      g.fillText(name, col * cellW + cellW / 2, row * cellH + cellH - 6);
    });
    requestAnimationFrame(loop);
  };
  loop();
}
