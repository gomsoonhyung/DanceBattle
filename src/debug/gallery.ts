import { displayFrame, evalAnim, type Anim } from '../anim/pose';
import { CHARACTERS } from '../characters';
import { GROUND_SCREEN_Y, SCREEN_W } from '../core/constants';
import { drawDancer } from '../render/dancer';
import { installExportApi } from './exportPage';

/**
 * 애니메이션 확인용 페이지.
 *   ?gallery&char=krump          → 해당 캐릭터의 모든 동작을 반복 재생 (char 생략 시 비보이)
 *   ?gallery=stompWave&char=krump → 해당 동작을 프레임별로 나열 (필름 스트립)
 *   ?gallery=lineup               → 8명 전원을 나란히 (대기 동작, P1/P2 색)
 *   ?gallery=export               → 스프라이트 내보내기용 (scripts/export-sprites.mjs)
 *   ?gallery=closeup&char=krump&anim=sHP&f=12 → 한 동작의 한 프레임을 크게
 */
export function renderGallery(g: CanvasRenderingContext2D, only: string, charId: string): void {
  const params = new URLSearchParams(location.search);
  if (only === 'export') return installExportApi();
  if (only === 'lineup') return lineup(g);
  if (only === 'closeup') return closeup(g, charId, params.get('anim') || 'idle', Number(params.get('f') || 0));
  const c = CHARACTERS.find((x) => x.id === charId) ?? CHARACTERS[0];
  const pal = c.look.palettes;
  const all: [string, Anim, number][] = [
    ...Object.entries(c.anims).map(([k, a]): [string, Anim, number] => [k, a, a.loop ?? 40]),
    ...Object.values(c.moves).map((m): [string, Anim, number] => [m.id, m.anim, m.total]),
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
      drawDancer(g, evalAnim(anim, f), 0, 0, 1, c.look, pal[0]);
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
      drawDancer(g, evalAnim(anim, displayFrame(anim, t % (len + 20))), 0, 0, 1, c.look, pal[i % 2]);
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

function background(g: CanvasRenderingContext2D): void {
  g.fillStyle = '#2a2433';
  g.fillRect(0, 0, SCREEN_W, 540);
  g.fillStyle = '#1c1824';
  g.fillRect(0, GROUND_SCREEN_Y, SCREEN_W, 540 - GROUND_SCREEN_Y);
}

function lineup(g: CanvasRenderingContext2D): void {
  let t = 0;
  const loop = () => {
    t++;
    background(g);
    CHARACTERS.forEach((c, i) => {
      for (const slot of [0, 1] as const) {
        g.save();
        const cx = 60 + i * 120;
        g.translate(cx, slot ? GROUND_SCREEN_Y : GROUND_SCREEN_Y - 250);
        g.scale(slot ? 0.95 : 0.95, 0.95);
        g.translate(0, -GROUND_SCREEN_Y);
        drawDancer(g, evalAnim(c.anims.idle, displayFrame(c.anims.idle, t)), 0, 0, 1, c.look, c.look.palettes[slot]);
        g.restore();
      }
      g.fillStyle = '#fff';
      g.font = 'bold 12px sans-serif';
      g.textAlign = 'center';
      g.fillText(c.name, 60 + i * 120, 20);
    });
    requestAnimationFrame(loop);
  };
  loop();
}

function closeup(g: CanvasRenderingContext2D, charId: string, animId: string, frame: number): void {
  const c = CHARACTERS.find((x) => x.id === charId) ?? CHARACTERS[0];
  const anim = (c.anims as Record<string, Anim>)[animId] ?? c.moves[animId]?.anim ?? c.anims.idle;
  background(g);
  for (const slot of [0, 1] as const) {
    g.save();
    g.translate(slot ? 700 : 260, 500);
    g.scale(2.2, 2.2);
    g.translate(0, -GROUND_SCREEN_Y);
    drawDancer(g, evalAnim(anim, frame), 0, 0, slot ? -1 : 1, c.look, c.look.palettes[slot]);
    g.restore();
  }
  g.fillStyle = '#fff';
  g.font = 'bold 14px sans-serif';
  g.textAlign = 'left';
  g.fillText(`${c.name} · ${animId} f${frame}`, 12, 22);
}
