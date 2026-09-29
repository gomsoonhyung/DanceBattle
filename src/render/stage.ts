import { GROUND_SCREEN_Y, SCREEN_H, SCREEN_W } from '../core/constants';

let cache: HTMLCanvasElement | null = null;

/** 골목 배틀 무대 (벽돌 벽 + 그래피티 + 골판지 매트). 한 번 그려서 캐시한다. */
export function drawStage(g: CanvasRenderingContext2D): void {
  if (!cache) cache = buildStage();
  g.drawImage(cache, 0, 0);
}

function buildStage(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SCREEN_W;
  c.height = SCREEN_H;
  const g = c.getContext('2d')!;

  // 밤하늘
  const sky = g.createLinearGradient(0, 0, 0, GROUND_SCREEN_Y);
  sky.addColorStop(0, '#120b24');
  sky.addColorStop(1, '#2b1a3d');
  g.fillStyle = sky;
  g.fillRect(0, 0, SCREEN_W, GROUND_SCREEN_Y);

  // 벽돌 벽
  const wallTop = 120;
  g.fillStyle = '#3a2430';
  g.fillRect(0, wallTop, SCREEN_W, GROUND_SCREEN_Y - wallTop);
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 2;
  const bh = 22;
  const bw = 54;
  for (let y = wallTop, row = 0; y < GROUND_SCREEN_Y; y += bh, row++) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(SCREEN_W, y);
    g.stroke();
    for (let x = row % 2 ? bw / 2 : 0; x < SCREEN_W; x += bw) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + bh);
      g.stroke();
    }
  }

  // 그래피티
  g.save();
  g.translate(SCREEN_W / 2, 230);
  g.rotate(-0.06);
  g.font = '900 86px "Arial Black", Impact, sans-serif';
  g.textAlign = 'center';
  g.lineJoin = 'round';
  g.lineWidth = 14;
  g.strokeStyle = '#111';
  g.strokeText('B-BOY', 0, 0);
  const grad = g.createLinearGradient(-200, -60, 200, 20);
  grad.addColorStop(0, '#ff3cac');
  grad.addColorStop(0.5, '#ffd23f');
  grad.addColorStop(1, '#2bd2ff');
  g.fillStyle = grad;
  g.fillText('B-BOY', 0, 0);
  g.font = '900 30px "Arial Black", Impact, sans-serif';
  g.lineWidth = 8;
  g.strokeText('FIGHTER', 150, 38);
  g.fillStyle = '#fff';
  g.fillText('FIGHTER', 150, 38);
  g.restore();

  // 조명
  for (const lx of [180, SCREEN_W - 180]) {
    const light = g.createRadialGradient(lx, 140, 5, lx, 300, 320);
    light.addColorStop(0, 'rgba(255,230,180,0.28)');
    light.addColorStop(1, 'rgba(255,230,180,0)');
    g.fillStyle = light;
    g.fillRect(0, 0, SCREEN_W, GROUND_SCREEN_Y);
  }

  // 바닥
  const floor = g.createLinearGradient(0, GROUND_SCREEN_Y, 0, SCREEN_H);
  floor.addColorStop(0, '#2a2a33');
  floor.addColorStop(1, '#15151b');
  g.fillStyle = floor;
  g.fillRect(0, GROUND_SCREEN_Y, SCREEN_W, SCREEN_H - GROUND_SCREEN_Y);

  // 골판지 매트 (비보이 연습장 느낌)
  g.fillStyle = '#9c7b4e';
  const matL = 120;
  const matR = SCREEN_W - 120;
  g.beginPath();
  g.moveTo(matL + 30, GROUND_SCREEN_Y);
  g.lineTo(matR - 30, GROUND_SCREEN_Y);
  g.lineTo(matR, SCREEN_H - 20);
  g.lineTo(matL, SCREEN_H - 20);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(60,40,20,0.5)';
  g.lineWidth = 1;
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    g.beginPath();
    g.moveTo(matL + 30 + (matR - matL - 60) * t, GROUND_SCREEN_Y);
    g.lineTo(matL + (matR - matL) * t, SCREEN_H - 20);
    g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(0, GROUND_SCREEN_Y, SCREEN_W, 3);
  return c;
}
