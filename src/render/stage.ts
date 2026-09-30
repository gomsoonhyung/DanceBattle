import { GROUND_SCREEN_Y, RENDER_SCALE, SCREEN_H, SCREEN_W } from '../core/constants';
import { ASSET, image } from './assets';

let cache: HTMLCanvasElement | null = null;

/** 골목 배틀 무대 (벽돌 벽 + 그래피티 + 골판지 매트). 한 번 그려서 캐시한다. */
/** 무대 그림(에셋)이 준비됐는지. 준비되면 관중은 그림에 들어 있으므로 따로 그리지 않는다 */
export function stageImageReady(): boolean {
  return image(ASSET.stage) !== null;
}

export function drawStage(g: CanvasRenderingContext2D): void {
  const bg = image(ASSET.stage);
  if (bg) {
    g.drawImage(bg, 0, 0, SCREEN_W, SCREEN_H);
    return;
  }
  // 그림을 불러오는 동안은 코드로 그린 무대
  if (!cache) cache = buildStage();
  g.drawImage(cache, 0, 0, SCREEN_W, SCREEN_H);
}

function buildStage(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SCREEN_W * RENDER_SCALE;
  c.height = SCREEN_H * RENDER_SCALE;
  const g = c.getContext('2d')!;
  g.scale(RENDER_SCALE, RENDER_SCALE);

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
  g.strokeText('DANCE', 0, 0);
  const grad = g.createLinearGradient(-200, -60, 200, 20);
  grad.addColorStop(0, '#ff3cac');
  grad.addColorStop(0.5, '#ffd23f');
  grad.addColorStop(1, '#2bd2ff');
  g.fillStyle = grad;
  g.fillText('DANCE', 0, 0);
  g.font = '900 30px "Arial Black", Impact, sans-serif';
  g.lineWidth = 8;
  g.strokeText('BATTLE', 150, 38);
  g.fillStyle = '#fff';
  g.fillText('BATTLE', 150, 38);
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

/** 0~1 사이의 고정된 가짜 난수 (관중마다 모습이 다르지만 매번 같게) */
function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const BEAT = 30; // 120 BPM = 30프레임마다 한 박

/**
 * 배틀을 둘러싼 관중과 움직이는 조명. 매 프레임 그린다.
 * 캐릭터가 잘 보이도록 어두운 실루엣으로 그린다.
 */
export function drawCrowd(g: CanvasRenderingContext2D, frame: number): void {
  // 움직이는 조명
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const [i, color] of [
    [0, 'rgba(255,60,172,0.07)'],
    [1, 'rgba(43,210,255,0.07)'],
  ] as const) {
    const ox = i ? SCREEN_W - 120 : 120;
    const sway = Math.sin(frame * 0.012 + i * 2) * 0.35;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(ox, 0);
    g.lineTo(SCREEN_W / 2 + Math.sin(sway) * 520 - 90, GROUND_SCREEN_Y);
    g.lineTo(SCREEN_W / 2 + Math.sin(sway) * 520 + 90, GROUND_SCREEN_Y);
    g.closePath();
    g.fill();
  }
  g.restore();

  // 무대 그림에는 관중이 이미 있다
  if (stageImageReady()) return;

  // 뒷줄 (작고 어둡게, 무대 전체)
  for (let i = 0; i < 17; i++) person(g, 20 + i * 57 + hash(i) * 20, 0.72, i, frame, '#1e172d', '#2c2342');
  // 앞줄 (양쪽 끝만, 조금 크게)
  for (let i = 0; i < 6; i++) {
    const x = i < 3 ? 10 + i * 42 : SCREEN_W - 10 - (i - 3) * 42;
    person(g, x, 0.92, 40 + i, frame, '#191325', '#3a2e55');
  }
}

function person(
  g: CanvasRenderingContext2D,
  x: number,
  scale: number,
  seed: number,
  frame: number,
  body: string,
  rim: string,
): void {
  const r = hash(seed);
  const phase = hash(seed + 7) * Math.PI * 2;
  const beat = (frame % BEAT) / BEAT;
  const bob = Math.abs(Math.sin(beat * Math.PI + phase * 0.2)) * 4 * scale;
  const hype = r > 0.55; // 팔을 드는 관중
  const h = (130 + r * 30) * scale;
  const baseY = GROUND_SCREEN_Y - 6;
  const headY = baseY - h + bob;
  const sh = headY + 22 * scale;

  g.save();
  g.fillStyle = body;
  g.strokeStyle = rim;
  g.lineWidth = 2;
  // 몸통
  g.beginPath();
  g.roundRect(x - 16 * scale, sh, 32 * scale, baseY - sh, 10 * scale);
  g.fill();
  g.stroke();
  // 팔
  g.lineCap = 'round';
  g.lineWidth = 9 * scale;
  g.strokeStyle = body;
  const wave = Math.sin(frame * 0.2 + phase) * 10 * scale;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(x + side * 13 * scale, sh + 6 * scale);
    if (hype && (side === 1 || r > 0.8)) {
      g.lineTo(x + side * 22 * scale + wave * 0.3, sh - 20 * scale);
      g.lineTo(x + side * 18 * scale + wave, sh - 44 * scale);
    } else {
      g.lineTo(x + side * 20 * scale, sh + 30 * scale);
      g.lineTo(x + side * 10 * scale, sh + 44 * scale);
    }
    g.stroke();
  }
  // 머리
  g.fillStyle = body;
  g.strokeStyle = rim;
  g.lineWidth = 2;
  g.beginPath();
  g.arc(x, headY, 13 * scale, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.restore();
}
