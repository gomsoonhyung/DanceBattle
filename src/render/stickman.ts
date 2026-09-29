import { BONE, type Skeleton } from '../anim/pose';
import { GROUND_SCREEN_Y } from '../core/constants';
import { DEG, type Vec2 } from '../core/math';

export interface Palette {
  main: string; // 앞쪽 팔다리, 몸통
  back: string; // 뒤쪽 팔다리 (어둡게)
  cap: string;
  skin: string;
  shoe: string;
}

export const PALETTES: [Palette, Palette] = [
  { main: '#ff4d5e', back: '#a8303d', cap: '#ffd23f', skin: '#f1c9a5', shoe: '#ffffff' },
  { main: '#4da3ff', back: '#2d62a0', cap: '#7cffb2', skin: '#c68b5e', shoe: '#ffffff' },
];

/**
 * 스켈레톤(로컬 좌표)을 화면에 그린다.
 * worldX/worldY = 캐릭터 위치, facing = 바라보는 방향.
 */
export function drawStickman(
  g: CanvasRenderingContext2D,
  sk: Skeleton,
  worldX: number,
  worldY: number,
  facing: 1 | -1,
  pal: Palette,
): void {
  const S = (p: Vec2) => ({ x: worldX + p.x * facing, y: GROUND_SCREEN_Y - (worldY + p.y) });

  const limb = (a: Vec2, b: Vec2, c: Vec2, color: string, width: number) => {
    const pa = S(a);
    const pb = S(b);
    const pc = S(c);
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(pa.x, pa.y);
    g.lineTo(pb.x, pb.y);
    g.lineTo(pc.x, pc.y);
    g.stroke();
    return pc;
  };

  const foot = (knee: Vec2, ankle: Vec2) => {
    // 발끝 방향으로 신발을 짧게 그린다
    const pk = S(knee);
    const pa = S(ankle);
    const dx = pa.x - pk.x;
    const dy = pa.y - pk.y;
    const len = Math.hypot(dx, dy) || 1;
    // 정강이에 수직, 바라보는 방향 쪽
    let nx = -dy / len;
    let ny = dx / len;
    if (nx * facing < 0) {
      nx = -nx;
      ny = -ny;
    }
    g.strokeStyle = pal.shoe;
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(pa.x, pa.y);
    g.lineTo(pa.x + nx * 11, pa.y + ny * 11);
    g.stroke();
  };

  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';

  // 뒤쪽 팔다리
  limb(sk.hip, sk.kneeB, sk.footB, pal.back, 10);
  foot(sk.kneeB, sk.footB);
  const shoulder = { x: sk.neck.x + (sk.hip.x - sk.neck.x) * 0.07, y: sk.neck.y + (sk.hip.y - sk.neck.y) * 0.07 };
  limb(shoulder, sk.elbowB, sk.handB, pal.back, 9);

  // 몸통
  const ph = S(sk.hip);
  const pn = S(sk.neck);
  g.strokeStyle = pal.main;
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(ph.x, ph.y);
  g.lineTo(pn.x, pn.y);
  g.stroke();

  // 앞쪽 다리
  limb(sk.hip, sk.kneeF, sk.footF, pal.main, 10);
  foot(sk.kneeF, sk.footF);

  // 머리 + 뒤로 쓴 캡
  const hc = S(sk.head);
  g.fillStyle = pal.skin;
  g.beginPath();
  g.arc(hc.x, hc.y, BONE.headR, 0, Math.PI * 2);
  g.fill();
  const up = sk.headAngle * DEG; // 머리 위쪽 방향 (앞으로 기울면 +)
  const ux = Math.sin(up) * facing;
  const uy = -Math.cos(up);
  const capAngle = Math.atan2(uy, ux);
  g.fillStyle = pal.cap;
  g.beginPath();
  g.arc(hc.x, hc.y, BONE.headR + 1, capAngle - Math.PI / 2, capAngle + Math.PI / 2);
  g.closePath();
  g.fill();
  // 챙: 머리 뒤쪽으로
  const bx = -Math.cos(up) * facing; // 뒤쪽 방향 = 위 방향을 90도 회전
  const by = -Math.sin(up);
  const r = BONE.headR;
  g.strokeStyle = pal.cap;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(hc.x + bx * r * 0.6 + ux * 2, hc.y + by * r * 0.6 + uy * 2);
  g.lineTo(hc.x + bx * (r + 10) + ux * 2, hc.y + by * (r + 10) + uy * 2);
  g.stroke();

  // 앞쪽 팔
  const hand = limb(shoulder, sk.elbowF, sk.handF, pal.main, 9);
  g.fillStyle = pal.skin;
  g.beginPath();
  g.arc(hand.x, hand.y, 5.5, 0, Math.PI * 2);
  g.fill();

  g.restore();
}
