import { BONE, type Skeleton } from '../anim/pose';
import { GROUND_SCREEN_Y } from '../core/constants';
import { DEG, type Vec2 } from '../core/math';
import type { Fighter } from '../fighter/fighter';
import type { Look, Palette } from '../fighter/types';

/** 캐릭터 색상 (P1/P2에 따라 다른 색 세트) */
export function fighterPalette(f: Fighter): Palette {
  return f.def.look.palettes[f.index];
}

/** #rrggbb 색을 어둡게 */
function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * k);
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

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
  look: Look,
  pal: Palette,
): void {
  const S = (p: Vec2) => ({ x: worldX + p.x * facing, y: GROUND_SCREEN_Y - (worldY + p.y) });
  const W = look.build;

  const line = (pts: Vec2[], color: string, width: number) => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.stroke();
  };

  const leg = (knee: Vec2, foot: Vec2, color: string) => {
    const ph = S(sk.hip);
    const pk = S(knee);
    const pf = S(foot);
    line([ph, pk, pf], color, 10 * W);
    if (look.suspenders) {
      // 무릎 아래 줄무늬 양말
      const mid = { x: pk.x + (pf.x - pk.x) * 0.45, y: pk.y + (pf.y - pk.y) * 0.45 };
      line([mid, pf], '#ffffff', 9 * W);
      for (const t of [0.6, 0.8]) {
        const a = { x: pk.x + (pf.x - pk.x) * t, y: pk.y + (pf.y - pk.y) * t };
        const b = { x: pk.x + (pf.x - pk.x) * (t + 0.07), y: pk.y + (pf.y - pk.y) * (t + 0.07) };
        line([a, b], pal.accent, 9 * W);
      }
    }
    // 신발: 정강이에 수직, 바라보는 방향 쪽
    const dx = pf.x - pk.x;
    const dy = pf.y - pk.y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    if (nx * facing < 0) {
      nx = -nx;
      ny = -ny;
    }
    line([pf, { x: pf.x + nx * 11 * W, y: pf.y + ny * 11 * W }], pal.shoe, 9 * W);
  };

  const shoulder = { x: sk.neck.x + (sk.hip.x - sk.neck.x) * 0.07, y: sk.neck.y + (sk.hip.y - sk.neck.y) * 0.07 };
  const arm = (elbow: Vec2, hand: Vec2, color: string) => {
    const ph = S(hand);
    line([S(shoulder), S(elbow), ph], color, 9 * W);
    return ph;
  };

  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';

  // 뒤쪽 팔다리
  leg(sk.kneeB, sk.footB, pal.back);
  arm(sk.elbowB, sk.handB, look.bareArms ? shade(pal.skin, 0.75) : pal.back);

  // 몸통
  const ph = S(sk.hip);
  const pn = S(sk.neck);
  line([ph, pn], pal.main, 16 * W);
  if (look.suspenders) {
    const tx = pn.x - ph.x;
    const ty = pn.y - ph.y;
    const tl = Math.hypot(tx, ty) || 1;
    const ox = (-ty / tl) * 4 * facing;
    const oy = (tx / tl) * 4 * facing;
    line(
      [
        { x: ph.x + ox, y: ph.y + oy },
        { x: pn.x + ox, y: pn.y + oy },
      ],
      pal.accent,
      3,
    );
  }

  // 앞쪽 다리
  leg(sk.kneeF, sk.footF, pal.main);

  drawHead(g, S(sk.head), sk.headAngle, facing, look, pal);

  // 앞쪽 팔
  const hand = arm(sk.elbowF, sk.handF, look.bareArms ? pal.skin : pal.main);
  g.fillStyle = pal.skin;
  g.beginPath();
  g.arc(hand.x, hand.y, 5.5 * W, 0, Math.PI * 2);
  g.fill();

  g.restore();
}

function drawHead(
  g: CanvasRenderingContext2D,
  hc: Vec2,
  headAngle: number,
  facing: 1 | -1,
  look: Look,
  pal: Palette,
): void {
  const r = BONE.headR;
  g.fillStyle = pal.skin;
  g.beginPath();
  g.arc(hc.x, hc.y, r, 0, Math.PI * 2);
  g.fill();

  const up = headAngle * DEG; // 머리 위쪽 방향 (앞으로 기울면 +)
  const ux = Math.sin(up) * facing;
  const uy = -Math.cos(up);
  const bx = -Math.cos(up) * facing; // 머리 뒤쪽 방향
  const by = -Math.sin(up);
  const capAngle = Math.atan2(uy, ux);

  g.fillStyle = pal.cap;
  g.strokeStyle = pal.cap;
  switch (look.headwear) {
    case 'backcap': {
      // 뒤로 쓴 야구모자
      g.beginPath();
      g.arc(hc.x, hc.y, r + 1, capAngle - Math.PI / 2, capAngle + Math.PI / 2);
      g.closePath();
      g.fill();
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(hc.x + bx * r * 0.6 + ux * 2, hc.y + by * r * 0.6 + uy * 2);
      g.lineTo(hc.x + bx * (r + 10) + ux * 2, hc.y + by * (r + 10) + uy * 2);
      g.stroke();
      break;
    }
    case 'headband': {
      // 이마를 두르는 머리띠 + 뒤로 날리는 끈
      const cx = hc.x + ux * r * 0.35;
      const cy = hc.y + uy * r * 0.35;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(cx + bx * r * 0.95, cy + by * r * 0.95);
      g.lineTo(cx - bx * r * 0.95, cy - by * r * 0.95);
      g.stroke();
      g.lineWidth = 3.5;
      const tx = cx + bx * r;
      const ty = cy + by * r;
      g.beginPath();
      g.moveTo(tx, ty);
      g.lineTo(tx + bx * 12 - ux * 6, ty + by * 12 - uy * 6);
      g.moveTo(tx, ty);
      g.lineTo(tx + bx * 10 - ux * 12, ty + by * 10 - uy * 12);
      g.stroke();
      break;
    }
    case 'applecap': {
      // 락킹의 빅 애플 캡: 부풀어 오른 윗부분 + 앞쪽 짧은 챙
      const cx = hc.x + ux * 3;
      const cy = hc.y + uy * 3;
      g.beginPath();
      g.ellipse(cx, cy, r + 5, r - 1, capAngle + Math.PI / 2, Math.PI, Math.PI * 2);
      g.closePath();
      g.fill();
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(hc.x - bx * r * 0.3, hc.y - by * r * 0.3);
      g.lineTo(hc.x - bx * (r + 9), hc.y - by * (r + 9));
      g.stroke();
      g.fillStyle = pal.accent;
      g.beginPath();
      g.arc(cx + ux * (r - 2), cy + uy * (r - 2), 3, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'bun': {
      // 올림머리: 머리카락 + 뒤통수 위쪽의 둥근 번
      hairTop(g, hc, r, capAngle);
      const b = P(r * 0.75, r * 0.7);
      g.beginPath();
      g.arc(b.x, b.y, 7, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'ponytail': {
      // 포니테일: 뒤로 흘러내리는 머리 묶음
      hairTop(g, hc, r, capAngle);
      const a = P(r * 0.55, r * 0.8);
      const c = P(r * 0.6, r + 18);
      const e = P(-r * 0.9, r + 14);
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.quadraticCurveTo(c.x, c.y, e.x, e.y);
      g.stroke();
      g.fillStyle = pal.accent;
      g.beginPath();
      g.arc(a.x, a.y, 3.5, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'bucket': {
      // 버킷햇: 둥근 윗부분 + 아래로 처진 넓은 챙
      g.beginPath();
      g.arc(hc.x + ux * 2, hc.y + uy * 2, r + 2, capAngle - Math.PI / 2, capAngle + Math.PI / 2);
      g.closePath();
      g.fill();
      const l = P(r * 0.05, r + 9);
      const m = P(r * 0.3, 0);
      const f = P(r * 0.05, -(r + 9));
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(l.x, l.y);
      g.quadraticCurveTo(m.x, m.y, f.x, f.y);
      g.stroke();
      break;
    }
    case 'beanie': {
      // 비니: 머리를 덮는 니트 모자 + 접힌 단 + 방울
      g.beginPath();
      g.arc(hc.x + ux * 2, hc.y + uy * 2, r + 1, capAngle - Math.PI / 2 - 0.2, capAngle + Math.PI / 2 + 0.2);
      g.closePath();
      g.fill();
      const l = P(r * 0.15, r + 1);
      const f = P(r * 0.15, -(r + 1));
      g.strokeStyle = pal.accent;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(l.x, l.y);
      g.lineTo(f.x, f.y);
      g.stroke();
      const pom = P(r + 5, 0);
      g.fillStyle = pal.accent;
      g.beginPath();
      g.arc(pom.x, pom.y, 5, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'fedora': {
      // 페도라: 각진 크라운 + 넓은 챙 + 띠
      const crown = [P(r * 0.3, r * 0.85), P(r + 7, r * 0.6), P(r + 5, -r * 0.6), P(r * 0.3, -r * 0.85)];
      g.beginPath();
      crown.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
      g.closePath();
      g.fill();
      const l = P(r * 0.3, r + 8);
      const f = P(r * 0.3, -(r + 10));
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(l.x, l.y);
      g.lineTo(f.x, f.y);
      g.stroke();
      const a = P(r * 0.55, r * 0.8);
      const b = P(r * 0.55, -r * 0.8);
      g.strokeStyle = pal.accent;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
      break;
    }
  }

  /** 머리 기준 좌표: up = 위쪽으로, back = 뒤통수 쪽으로 (음수면 얼굴 쪽) */
  function P(up: number, back: number): Vec2 {
    return { x: hc.x + ux * up + bx * back, y: hc.y + uy * up + by * back };
  }
}

/** 머리카락 윗부분 (정수리 반원) */
function hairTop(g: CanvasRenderingContext2D, hc: Vec2, r: number, capAngle: number): void {
  g.beginPath();
  g.arc(hc.x, hc.y, r + 1, capAngle - Math.PI / 2 - 0.35, capAngle + Math.PI / 2);
  g.closePath();
  g.fill();
}
