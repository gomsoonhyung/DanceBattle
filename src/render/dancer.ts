import { BONE, type Skeleton } from '../anim/pose';
import { GROUND_SCREEN_Y } from '../core/constants';
import { DEG, type Vec2 } from '../core/math';
import type { Fighter } from '../fighter/fighter';
import type { BottomStyle, Look, Palette } from '../fighter/types';

/*
 * 캐릭터 그리기 (2D 퍼펫 방식).
 * 스켈레톤의 관절 위치를 따라 부위(팔, 다리, 몸통, 머리)를 도형으로 그리고, 외곽선과 음영을 넣는다.
 * 부위마다 따로 그리기 때문에 나중에 부위 그림(PNG)으로 바꿔 끼우는 컷아웃 방식으로 확장할 수 있다.
 */

const OUTLINE = '#17131f';
/** 빛이 오는 방향(화면 기준 왼쪽 위). 이만큼 밀린 밝은 면을 겹쳐 그려 반대편에 그림자가 생긴다 */
const LIGHT: Vec2 = { x: -2.2, y: -2.6 };
const BACK_SHADE = 0.72;

export function fighterPalette(f: Fighter): Palette {
  return f.def.look.palettes[f.index];
}

/** #rrggbb 색의 밝기 조절 (k < 1 어둡게, k > 1 밝게) */
export function shade(color: string, k: number): string {
  let r: number, gg: number, bb: number;
  if (color.startsWith('#')) {
    const n = parseInt(color.slice(1), 16);
    [r, gg, bb] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  } else {
    [r, gg, bb] = (color.match(/\d+/g) ?? ['0', '0', '0']).map(Number);
  }
  const c = (v: number) => Math.min(255, Math.round(v * k));
  return `rgb(${c(r)},${c(gg)},${c(bb)})`;
}

/** 부위 안쪽 경계선 색: 같은 계열의 어두운 색 (검은 테두리는 몸 전체 바깥에만) */
const inner = (color: string) => shade(color, 0.5);

// ── 벡터 도우미 ─────────────────────────────────────────────────────

const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
const mix = (a: Vec2, b: Vec2, t: number): Vec2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
function norm(a: Vec2): Vec2 {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
}

/** 그리는 부위들의 가장 낮은 화면 y (바닥 맞추기용). null이면 기록하지 않는다 */
let lowest: number | null = null;
function track(y: number): void {
  if (lowest !== null && y > lowest) lowest = y;
}

/** 두 점을 잇는 둥근 막대 (양 끝 반지름이 다를 수 있음) */
function capsule(a: Vec2, b: Vec2, ra: number, rb: number): Path2D {
  track(Math.max(a.y + ra, b.y + rb));
  const p = new Path2D();
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  p.arc(a.x, a.y, ra, ang + Math.PI / 2, ang - Math.PI / 2);
  p.arc(b.x, b.y, rb, ang - Math.PI / 2, ang + Math.PI / 2);
  p.closePath();
  return p;
}

function circle(c: Vec2, r: number): Path2D {
  track(c.y + r);
  const p = new Path2D();
  p.arc(c.x, c.y, r, 0, Math.PI * 2);
  return p;
}

/** 점들을 부드럽게 잇는 닫힌 도형 */
function smoothClosed(pts: Vec2[]): Path2D {
  for (const q of pts) track(q.y);
  const p = new Path2D();
  const n = pts.length;
  const mid = (i: number) => mix(pts[i % n], pts[(i + 1) % n], 0.5);
  const start = mid(n - 1);
  p.moveTo(start.x, start.y);
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    p.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
  }
  p.closePath();
  return p;
}

// ── 칠하기 ──────────────────────────────────────────────────────────

class Painter {
  constructor(
    readonly g: CanvasRenderingContext2D,
    readonly silhouette?: string,
  ) {}

  /** 채우기 + 음영 + 안쪽 경계선 */
  part(path: Path2D, color: string, opts: { shadow?: boolean; outline?: boolean } = {}): void {
    const g = this.g;
    if (this.silhouette) {
      g.fillStyle = this.silhouette;
      g.fill(path);
      return;
    }
    g.fillStyle = color;
    g.fill(path);
    if (opts.shadow !== false) {
      g.save();
      g.clip(path);
      g.fillStyle = 'rgba(10,6,30,0.26)';
      g.fill(path);
      g.translate(LIGHT.x, LIGHT.y);
      g.fillStyle = color;
      g.fill(path);
      g.restore();
    }
    if (opts.outline !== false) {
      g.strokeStyle = inner(color);
      g.lineWidth = 1.4;
      g.stroke(path);
    }
  }

  /** 음영·외곽선 없이 채우기 (무늬, 소품) */
  flat(path: Path2D, color: string): void {
    if (this.silhouette) return;
    this.g.fillStyle = color;
    this.g.fill(path);
  }

  line(pts: Vec2[], color: string, width: number): void {
    if (this.silhouette) return;
    const g = this.g;
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.stroke();
  }

  /** 끊김 없는 경계선을 가진 띠 (머리카락, 끈): 굵은 경계선을 먼저 칠하고 그 위에 색을 칠한다 */
  ribbon(pts: Vec2[], w0: number, w1: number, color: string): void {
    const g = this.g;
    const saved = lowest;
    const n = pts.length - 1;
    const w = (i: number) => w0 + ((w1 - w0) * i) / n;
    for (const pass of [0, 1]) {
      if (pass === 0 && this.silhouette) continue;
      g.fillStyle = this.silhouette ?? (pass ? color : inner(color));
      for (let i = 0; i < n; i++)
        g.fill(capsule(pts[i], pts[i + 1], w(i) + (pass ? 0 : 1.2), w(i + 1) + (pass ? 0 : 1.2)));
    }
    lowest = saved;
  }
}

// ── 머리 방향 ───────────────────────────────────────────────────────

/** 화면 좌표 기준 머리 중심과 방향 (연출 계산용으로 렌더러에서도 쓴다) */
export interface HeadFrame {
  c: Vec2;
  up: Vec2;
  front: Vec2;
  r: number;
}

export function headFrame(sk: Skeleton, x: number, y: number, facing: 1 | -1): HeadFrame {
  const a = sk.headAngle * DEG;
  return {
    c: { x: x + sk.head.x * facing, y: GROUND_SCREEN_Y - (y + sk.head.y) },
    up: { x: Math.sin(a) * facing, y: -Math.cos(a) },
    front: { x: Math.cos(a) * facing, y: Math.sin(a) },
    r: BONE.headR * 1.08,
  };
}

/** 흔들리는 머리카락·끈이 붙는 위치 (없는 모자면 null) */
export function tailAnchor(h: HeadFrame, look: Look): Vec2 | null {
  const at = (u: number, f: number) => add(h.c, add(mul(h.up, u * h.r), mul(h.front, f * h.r)));
  if (look.headwear === 'ponytail') return at(0.55, -0.8);
  if (look.headwear === 'headband') return at(0.35, -1);
  return null;
}

// ── 부위별 치수 ─────────────────────────────────────────────────────

/** 다리 굵기 [골반, 무릎(허벅지 끝), 무릎(정강이 시작), 발목] */
const LEG_RADII: Record<BottomStyle, [number, number, number, number]> = {
  track: [11, 9.5, 9.5, 8.5],
  baggy: [13, 12, 12, 12.5],
  wide: [11.5, 11, 11, 16],
  cargo: [12.5, 11, 11, 11],
  slim: [10, 8, 8, 6.5],
  knickers: [12, 11, 11, 10.5],
};

export interface DancerOpts {
  /** 잔상 등: 모든 부위를 이 색 하나로 */
  silhouette?: string;
  /** 흔들리는 머리카락·끈의 점들 (화면 좌표). 없으면 기본 모양으로 그린다 */
  tail?: Vec2[];
  /** 공중에 떠 있음 (점프·띄워짐). false면 신발·바지 끝이 바닥선 아래로 내려가지 않게 한다 */
  airborne?: boolean;
}

/** 바깥 테두리 두께 */
const CONTOUR = 2.1;
const CONTOUR_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.71, 0.71],
  [-0.71, 0.71],
  [0.71, -0.71],
  [-0.71, -0.71],
];
const buffers: HTMLCanvasElement[] = [];
let measure: CanvasRenderingContext2D | null = null;
/** 치수만 재는 용도의 1×1 캔버스 (그려지는 픽셀은 버린다) */
function measureCtx(): CanvasRenderingContext2D {
  if (!measure) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    measure = c.getContext('2d')!;
  }
  return measure;
}
function buffer(i: number, w: number, h: number): CanvasRenderingContext2D {
  let c = buffers[i];
  if (!c) c = buffers[i] = document.createElement('canvas');
  if (c.width < w || c.height < h) {
    c.width = Math.max(c.width, w);
    c.height = Math.max(c.height, h);
  }
  return c.getContext('2d')!;
}

/**
 * 캐릭터 하나를 그린다.
 * sk = 로컬 좌표 스켈레톤, (x, y) = 캐릭터 월드 위치, facing = 보는 방향
 *
 * 부위를 먼저 따로 그린 다음, 몸 전체 실루엣에만 검은 테두리를 두른다.
 * 그래서 관절 이음새마다 선이 생기지 않고 한 장의 그림처럼 보인다.
 */
export function drawDancer(
  g: CanvasRenderingContext2D,
  sk: Skeleton,
  x: number,
  y: number,
  facing: 1 | -1,
  look: Look,
  pal: Palette,
  opts: DancerOpts = {},
): void {
  if (opts.silhouette) {
    paintBody(g, sk, x, y, facing, look, pal, opts);
    return;
  }
  // 그릴 영역 (화면 좌표)
  const S = (p: Vec2): Vec2 => ({ x: x + p.x * facing, y: GROUND_SCREEN_Y - (y + p.y) });
  const pts = [
    sk.hip,
    sk.neck,
    sk.head,
    sk.elbowF,
    sk.handF,
    sk.elbowB,
    sk.handB,
    sk.kneeF,
    sk.footF,
    sk.kneeB,
    sk.footB,
  ].map(S);
  for (const t of opts.tail ?? []) pts.push(t);
  const m = 40;
  const minX = Math.min(...pts.map((q) => q.x)) - m;
  const minY = Math.min(...pts.map((q) => q.y)) - m;
  const w = Math.max(...pts.map((q) => q.x)) - minX + m;
  const h = Math.max(...pts.map((q) => q.y)) - minY + m;

  // 현재 확대 비율에 맞춰 선명하게
  const t = g.getTransform();
  const scale = Math.min(5, Math.max(1, Math.hypot(t.a, t.b)));
  const W = Math.ceil(w * scale);
  const H = Math.ceil(h * scale);

  // 임시 캔버스는 재사용하므로 전체를 지운다 (일부만 지우면 확대·축소할 때 가장자리의 이전 그림이 묻어난다)
  const bg = buffer(0, W, H);
  bg.setTransform(1, 0, 0, 1, 0, 0);
  bg.clearRect(0, 0, bg.canvas.width, bg.canvas.height);
  // 땅에 서 있으면: 실제로 그려질 부위의 가장 낮은 지점을 먼저 재서, 바닥 아래로 내려간 만큼 전체를 올린다
  let rise = 0;
  if (!opts.airborne) {
    lowest = -Infinity;
    paintBody(measureCtx(), sk, x, y, facing, look, pal, opts);
    rise = Math.max(0, lowest - (GROUND_SCREEN_Y - y));
    lowest = null;
  }
  bg.setTransform(scale, 0, 0, scale, -minX * scale, -(minY + rise) * scale);
  paintBody(bg, sk, x, y, facing, look, pal, opts);

  // 실루엣을 테두리 색으로 칠한 사본
  const tg = buffer(1, W, H);
  tg.setTransform(1, 0, 0, 1, 0, 0);
  tg.clearRect(0, 0, tg.canvas.width, tg.canvas.height);
  tg.globalCompositeOperation = 'source-over';
  tg.drawImage(bg.canvas, 0, 0, W, H, 0, 0, W, H);
  tg.globalCompositeOperation = 'source-in';
  tg.fillStyle = OUTLINE;
  tg.fillRect(0, 0, W, H);
  tg.globalCompositeOperation = 'source-over';

  for (const [dx, dy] of CONTOUR_DIRS) {
    g.drawImage(tg.canvas, 0, 0, W, H, minX + dx * CONTOUR, minY + dy * CONTOUR, w, h);
  }
  g.drawImage(bg.canvas, 0, 0, W, H, minX, minY, w, h);
}

function paintBody(
  g: CanvasRenderingContext2D,
  sk: Skeleton,
  x: number,
  y: number,
  facing: 1 | -1,
  look: Look,
  pal: Palette,
  opts: DancerOpts = {},
): void {
  const S = (p: Vec2): Vec2 => ({ x: x + p.x * facing, y: GROUND_SCREEN_Y - (y + p.y) });
  const P = new Painter(g, opts.silhouette);
  const b = look.build;

  // 몸통 축과 앞쪽 방향 (화면 좌표)
  const hip = S(sk.hip);
  const neck = S(sk.neck);
  const up = norm(sub(neck, hip));
  const lu = norm(sub(sk.neck, sk.hip)); // 로컬 좌표 위쪽
  const front = { x: lu.y * facing, y: lu.x };
  const shoulder = mix(neck, hip, 0.07);

  // 앞뒤 팔다리를 몸 두께만큼 살짝 벌려서 입체감을 준다
  const off = (k: number) => mul(front, k);
  const armB = { sh: add(shoulder, off(-2.5)), el: add(S(sk.elbowB), off(-2.5)), ha: add(S(sk.handB), off(-2.5)) };
  const armF = { sh: add(shoulder, off(2)), el: add(S(sk.elbowF), off(2)), ha: add(S(sk.handF), off(2)) };
  const groundY = opts.airborne ? null : GROUND_SCREEN_Y - y;
  const legB = { hp: add(hip, off(-2.5)), kn: S(sk.kneeB), ft: S(sk.footB), ftLocalY: sk.footB.y };
  const legF = { hp: add(hip, off(2.5)), kn: S(sk.kneeF), ft: S(sk.footF), ftLocalY: sk.footF.y };

  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';

  drawArm(P, armB, look, pal, BACK_SHADE);
  drawLeg(P, legB, facing, look, pal, BACK_SHADE);
  drawTorso(P, hip, neck, up, front, look, pal);
  drawLeg(P, legF, facing, look, pal, 1);
  drawHead(P, sk, x, y, facing, neck, look, pal, opts.tail, groundY);
  drawArm(P, armF, look, pal, 1);

  g.restore();

  // ── 부위 ──────────────────────────────────────────────────────────

  /** 관절이 굽은 만큼 안쪽에 옷 주름을 그린다 */
  function folds(p: Painter, a: Vec2, j: Vec2, c: Vec2, r: number, color: string): void {
    const d1 = norm(sub(a, j));
    const d2 = norm(sub(c, j));
    const bend = Math.PI - Math.acos(Math.max(-1, Math.min(1, d1.x * d2.x + d1.y * d2.y)));
    if (bend < 0.45) return;
    const inside = norm(add(d1, d2)); // 굽은 쪽 안쪽
    const across = { x: -inside.y, y: inside.x };
    const n = bend > 1.1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const base = add(j, add(mul(inside, r * 0.55), mul(add(d1, d2), (i - (n - 1) / 2) * r * 0.25)));
      p.line(
        [add(base, mul(across, -r * 0.45)), add(add(base, mul(inside, r * 0.25)), mul(across, r * 0.1))],
        color,
        1.3,
      );
    }
  }

  function drawArm(p: Painter, a: { sh: Vec2; el: Vec2; ha: Vec2 }, lk: Look, pl: Palette, k: number): void {
    const top = shade(pl.main, k);
    const skin = shade(pl.skin, k);
    const loose = lk.outfit.top === 'hoodie' ? 1.3 : 0;
    const rS = 6.8 * b + loose;
    const rE = 5.6 * b + loose;
    const rW = 4.6 * b + loose * 0.6;
    const sleeve =
      lk.outfit.top === 'tank' ? 'none' : lk.outfit.top === 'tee' || lk.outfit.top === 'crop' ? 'short' : 'long';
    const armColor = sleeve === 'long' ? top : skin;

    p.part(capsule(a.sh, a.el, rS, rE), armColor);
    if (sleeve === 'short') p.part(capsule(a.sh, mix(a.sh, a.el, 0.55), rS + 1.6, rS + 0.9), top);
    p.part(capsule(a.el, a.ha, rE, rW), armColor);
    if (sleeve === 'long')
      p.part(capsule(mix(a.el, a.ha, 0.8), mix(a.el, a.ha, 0.9), rW + 1.1, rW + 1.1), shade(pl.main, k * 0.82));
    if (lk.outfit.wristbands && sleeve !== 'long') {
      p.part(capsule(mix(a.el, a.ha, 0.76), mix(a.el, a.ha, 0.9), rW + 1.3, rW + 1.3), shade(pl.accent, k));
    }
    if (sleeve === 'long') folds(p, a.sh, a.el, a.ha, rE, inner(top));
    const hand = lk.outfit.gloves ? shade('#ffffff', k) : skin;
    p.part(circle(a.ha, 6 * b), hand);
  }

  function drawLeg(
    p: Painter,
    l: { hp: Vec2; kn: Vec2; ft: Vec2; ftLocalY: number },
    f: 1 | -1,
    lk: Look,
    pl: Palette,
    k: number,
  ): void {
    const pants = shade(pl.pants, k);
    const [r0, r1, r2, r3] = LEG_RADII[lk.outfit.bottom].map((r) => r * b);
    const shinDir = norm(sub(l.ft, l.kn));

    // 신발 (발목 아래, 보는 방향 쪽으로)
    let toe = { x: -shinDir.y, y: shinDir.x };
    if (toe.x * f < 0) toe = mul(toe, -1);
    // 발목 관절은 바닥 3 위에 있다 (anim/pose.ts snapToGround). 신발·바지 끝이 바닥선에 딱 닿도록 반지름만큼 올린다
    // 바닥을 딛고 있으면 화면 수직으로, 공중(발차기 등)이면 정강이 방향으로 올린다
    const grounded = l.ftLocalY < 6;
    const lift = grounded ? { x: 0, y: 1 } : shinDir;
    if (grounded) {
      toe = { x: f, y: 0 }; // 바닥을 디딘 발은 바닥과 수평으로
    } else if (l.ftLocalY < 40) {
      // 뒤꿈치를 든 발: 앞코가 바닥 아래로 내려가지 않게 (까치발)
      const maxDown = (l.ftLocalY - 5 * b) / (13 * b);
      if (toe.y > maxDown) {
        const y = Math.max(-1, Math.min(1, maxDown));
        toe = { x: f * Math.sqrt(1 - y * y), y };
      }
    }
    // 땅에 서 있는 캐릭터는 반지름 r인 둥근 끝이 바닥선 아래로 내려가지 않게 한다 (점프 중에는 제한 없음)
    const floor = (q: Vec2, r: number): Vec2 =>
      groundY !== null && q.y + r > groundY ? { x: q.x, y: groundY - r } : q;
    const toGround = (r: number) => floor(add(l.ft, mul(lift, 3 - r)), r);
    const heel = floor(add(toGround(6 * b), mul(toe, -4 * b)), 6 * b);
    const tip = floor(add(toGround(5 * b), mul(toe, 13 * b)), 5 * b);

    p.part(capsule(l.hp, l.kn, r0, r1), pants);
    if (lk.outfit.bottom === 'knickers') {
      // 무릎 바지 + 양말
      const cuff = mix(l.kn, l.ft, 0.45);
      p.part(capsule(cuff, toGround(5.5 * b), 6.5 * b, 5.5 * b), shade('#ffffff', k));
      if (lk.outfit.stripedSocks) {
        for (const t of [0.62, 0.8]) {
          p.flat(capsule(mix(l.kn, l.ft, t), mix(l.kn, l.ft, t + 0.07), 6.6 * b, 6.4 * b), shade(pl.accent, k));
        }
      }
      p.part(capsule(l.kn, cuff, r2, r2 - 0.5), pants);
    } else {
      p.part(capsule(l.kn, toGround(r3), r2, r3), pants);
    }
    if (lk.outfit.sideStripes) {
      p.line([l.hp, l.kn, lk.outfit.bottom === 'knickers' ? mix(l.kn, l.ft, 0.45) : l.ft], shade(pl.accent, k), 2.4);
    }
    if (lk.outfit.bottom === 'cargo') {
      const c = mix(l.hp, l.kn, 0.55);
      p.part(capsule(add(c, mul(shinDir, -3)), add(c, mul(shinDir, 5)), 4.5 * b, 4.5 * b), shade(pl.pants, k * 0.85));
    }
    folds(p, l.hp, l.kn, l.ft, r1, inner(pants));
    if (lk.outfit.bottom === 'baggy' || lk.outfit.bottom === 'wide') {
      // 발목에 쌓이는 주름
      const across = { x: -shinDir.y, y: shinDir.x };
      const cuffEnd = toGround(r3);
      for (const t of [0.72, 0.84]) {
        const c = mix(l.kn, cuffEnd, t);
        p.line(
          [add(c, mul(across, -r3 * 0.7)), add(add(c, mul(shinDir, 3)), mul(across, r3 * 0.3))],
          inner(pants),
          1.3,
        );
      }
    }
    p.part(capsule(heel, tip, 6 * b, 5 * b), shade(pl.shoe, k));
    // 밑창: 신발 아랫면 안쪽에
    p.line([add(heel, mul(lift, 6 * b - 2)), add(tip, mul(lift, 5 * b - 2))], shade(pl.shoe, k * 0.55), 2.6);
  }

  function drawTorso(p: Painter, h: Vec2, n: Vec2, u: Vec2, f: Vec2, lk: Look, pl: Palette): void {
    const extra = lk.outfit.top === 'hoodie' ? 2 : lk.outfit.top === 'suit' ? 1 : 0;
    const A = (t: number) => mix(h, n, t);
    const F = (t: number, w: number) => add(A(t), mul(f, (w + extra) * b));
    const B = (t: number, w: number) => add(A(t), mul(f, -(w + extra) * b));
    const pts = [
      add(h, mul(u, -5)),
      F(0, 10.5),
      F(0.35, 10),
      F(0.7, 13.5),
      F(1, 9),
      add(n, mul(u, 4)),
      B(1, 9),
      B(0.7, 11.5),
      B(0.35, 10.5),
      B(0, 10.5),
    ];
    const body = smoothClosed(pts);
    p.part(body, pl.main);

    const band = (t0: number, t1: number, color: string) => {
      const q = new Path2D();
      const w = 40;
      const c0 = A(t0);
      const c1 = A(t1);
      q.moveTo(c0.x + f.x * w, c0.y + f.y * w);
      q.lineTo(c1.x + f.x * w, c1.y + f.y * w);
      q.lineTo(c1.x - f.x * w, c1.y - f.y * w);
      q.lineTo(c0.x - f.x * w, c0.y - f.y * w);
      q.closePath();
      if (p.silhouette) return;
      p.g.save();
      p.g.clip(body);
      p.flat(q, color);
      p.g.restore();
    };

    // 허리: 바지 윗부분과 벨트
    band(-0.3, 0.14, pl.pants);
    if (lk.outfit.top === 'crop') band(0.15, 0.33, pl.skin);
    if (!p.silhouette) {
      p.g.save();
      p.g.clip(body);
      p.line([B(0.14, 12), F(0.14, 12)], shade(pl.pants, 0.55), 2.5);
      p.g.restore();
      p.g.strokeStyle = inner(pl.main);
      p.g.lineWidth = 1.4;
      p.g.stroke(body);
    }

    switch (lk.outfit.top) {
      case 'hoodie': {
        // 후드와 앞주머니
        p.part(
          capsule(add(n, add(mul(f, -7), mul(u, 2))), add(n, add(mul(f, -11), mul(u, 16))), 8 * b, 7 * b),
          shade(pl.main, 0.85),
        );
        p.line([F(0.22, 1), F(0.36, 4), F(0.22, 8)], shade(pl.main, 0.7), 2);
        p.line([F(0.95, 3), F(0.62, 5)], '#ffffff', 1.6);
        break;
      }
      case 'suit': {
        // 라펠, 단추, 넥타이
        p.line([F(0.98, 2), F(0.5, 10.5)], shade(pl.main, 0.7), 2);
        p.part(circle(F(0.38, 11), 1.8), shade(pl.main, 0.6), { shadow: false, outline: false });
        p.part(circle(F(0.25, 10.5), 1.8), shade(pl.main, 0.6), { shadow: false, outline: false });
        if (lk.outfit.tie) p.part(capsule(F(0.96, 7), F(0.55, 12), 2.5, 3.5), pl.accent, { shadow: false });
        break;
      }
      case 'collar': {
        // 큰 셔츠 칼라
        const c = new Path2D();
        const a0 = F(1, 7);
        const a1 = F(0.8, 13);
        const a2 = F(0.9, 2);
        c.moveTo(a0.x, a0.y);
        c.lineTo(a1.x, a1.y);
        c.lineTo(a2.x, a2.y);
        c.closePath();
        p.part(c, shade(pl.main, 1.25), { shadow: false });
        break;
      }
      case 'tank': {
        p.line([B(0.98, 6), B(0.78, 9)], shade(pl.main, 0.7), 2);
        break;
      }
    }
    if (lk.outfit.suspenders) {
      p.line([F(0.14, 8), F(0.97, 5)], pl.accent, 3.2);
      p.line([B(0.14, 8), B(0.97, 5)], shade(pl.accent, 0.8), 3.2);
    }
    if (lk.outfit.chain) {
      const low = F(0.62, 9);
      p.line([B(0.98, 2), F(0.8, 6), low], '#ffd23f', 2.4);
      p.part(circle(low, 3.2), '#ffd23f', { shadow: false });
    }
  }
}

// ── 머리 ────────────────────────────────────────────────────────────

function drawHead(
  p: Painter,
  sk: Skeleton,
  x: number,
  y: number,
  facing: 1 | -1,
  neck: Vec2,
  look: Look,
  pal: Palette,
  tail?: Vec2[],
  groundY: number | null = null,
): void {
  const g = p.g;
  const h = headFrame(sk, x, y, facing);
  const { c, up, front, r } = h;
  const back = mul(front, -1);
  const b = look.build;
  /** 머리 기준 좌표: u = 위쪽, f = 얼굴 쪽 (음수면 뒤통수 쪽) */
  const at = (u: number, f: number) => add(c, add(mul(up, u * r), mul(front, f * r)));

  // 목
  p.part(capsule(neck, mix(neck, c, 0.6), 5 * b, 5 * b), pal.skin, { shadow: false });

  // 뒤로 늘어지는 포니테일·머리띠 끈은 머리 뒤에
  const anchor = tailAnchor(h, look);
  if (anchor) {
    const pts =
      tail ??
      (look.headwear === 'ponytail'
        ? [
            anchor,
            add(anchor, add(mul(back, 10), mul(up, -4))),
            add(anchor, add(mul(back, 15), mul(up, -14))),
            add(anchor, add(mul(back, 17), mul(up, -25))),
          ]
        : [anchor, add(anchor, add(mul(back, 10), mul(up, -3))), add(anchor, add(mul(back, 19), mul(up, -8)))]);
    if (groundY !== null) for (const q of pts) q.y = Math.min(q.y, groundY - 3);
    if (look.headwear === 'ponytail') p.ribbon(pts, 6, 3, pal.hair);
    else {
      p.ribbon(pts, 2.4, 1.8, pal.cap);
      p.ribbon(
        pts.map((q, i) => add(q, mul(up, -i * 3))),
        2.4,
        1.8,
        shade(pal.cap, 0.85),
      );
    }
  }

  // 머리 (살짝 세로로 긴 타원)
  const headPath = new Path2D();
  headPath.ellipse(c.x, c.y, r * 0.98, r * 1.06, Math.atan2(front.y, front.x), 0, Math.PI * 2);
  track(c.y + r * 1.06);
  p.part(headPath, pal.skin);

  if (!p.silhouette) {
    // 머리카락: 머리 모양 안에서 뒤통수·정수리 쪽을 덮는다
    g.save();
    g.clip(headPath);
    p.flat(circle(at(0.9, -0.6), r * 1.0), pal.hair);
    g.restore();
    // 귀
    p.part(circle(at(-0.08, -0.3), 2.6), shade(pal.skin, 0.85), { shadow: false, outline: false });
    // 얼굴: 눈, 눈썹, 입
    const eye = at(0.12, 0.52);
    g.fillStyle = OUTLINE;
    g.beginPath();
    g.ellipse(eye.x, eye.y, 2, 2.6, Math.atan2(front.y, front.x), 0, Math.PI * 2);
    g.fill();
    p.line([at(0.42, 0.34), at(0.46, 0.7)], OUTLINE, 2);
    p.line([at(-0.48, 0.5), at(-0.44, 0.72)], shade(pal.skin, 0.5), 1.8);
    if (look.outfit.facePaint) {
      p.line([at(-0.08, 0.22), at(-0.14, 0.62)], pal.accent, 2.4);
      p.line([at(-0.3, 0.2), at(-0.36, 0.58)], pal.accent, 2.4);
    }
    if (look.outfit.earrings) {
      g.strokeStyle = '#ffd23f';
      g.lineWidth = 1.8;
      const e = at(-0.36, -0.3);
      g.beginPath();
      g.arc(e.x, e.y, 3.8, 0, Math.PI * 2);
      g.stroke();
    }
    g.strokeStyle = inner(pal.skin);
    g.lineWidth = 1.4;
    g.stroke(headPath);
  }

  drawHeadwear(p, h, look, pal);
}

function drawHeadwear(p: Painter, h: HeadFrame, look: Look, pal: Palette): void {
  const { c, up, front, r } = h;
  const at = (u: number, f: number) => add(c, add(mul(up, u * r), mul(front, f * r)));
  const capAngle = Math.atan2(up.y, up.x);
  const dome = (scale: number, spread = 0) => {
    const q = new Path2D();
    q.arc(c.x + up.x * 2, c.y + up.y * 2, r * scale, capAngle - Math.PI / 2 - spread, capAngle + Math.PI / 2 + spread);
    q.closePath();
    return q;
  };

  switch (look.headwear) {
    case 'backcap': {
      p.part(dome(1.04), pal.cap);
      p.part(capsule(at(0.2, -0.55), at(0.14, -1.55), 2.6, 2.4), pal.cap, { shadow: false });
      break;
    }
    case 'headband': {
      p.part(capsule(at(0.38, -0.98), at(0.38, 0.98), 3, 3), pal.cap, { shadow: false });
      break;
    }
    case 'applecap': {
      // 부풀어 오른 빅 애플 캡 + 짧은 챙 + 꼭지 단추
      const q = new Path2D();
      const cc = at(0.25, -0.05);
      q.ellipse(cc.x, cc.y, r * 1.28, r * 0.9, capAngle + Math.PI / 2, Math.PI, Math.PI * 2);
      q.closePath();
      p.part(q, pal.cap);
      p.part(capsule(at(0.18, 0.4), at(0.1, 1.45), 2.6, 2.2), shade(pal.cap, 0.85), { shadow: false });
      p.part(circle(at(1.12, -0.05), 2.8), pal.accent, { shadow: false });
      break;
    }
    case 'bun': {
      p.part(circle(at(0.8, -0.7), 7.5), pal.hair);
      break;
    }
    case 'ponytail': {
      p.part(circle(at(0.55, -0.8), 3.5), pal.accent, { shadow: false });
      break;
    }
    case 'bucket': {
      p.part(dome(1.08, 0.05), pal.cap);
      const brim = new Path2D();
      const l = at(0.1, -1.55);
      const m = at(0.38, 0);
      const f = at(0.1, 1.55);
      brim.moveTo(l.x, l.y);
      brim.quadraticCurveTo(m.x, m.y, f.x, f.y);
      const f2 = at(-0.08, 1.45);
      const m2 = at(0.18, 0);
      const l2 = at(-0.08, -1.45);
      brim.lineTo(f2.x, f2.y);
      brim.quadraticCurveTo(m2.x, m2.y, l2.x, l2.y);
      brim.closePath();
      p.part(brim, shade(pal.cap, 0.9));
      break;
    }
    case 'beanie': {
      p.part(dome(1.05, 0.25), pal.cap);
      p.part(capsule(at(0.22, -1.02), at(0.22, 1.02), 3.2, 3.2), pal.accent, { shadow: false });
      p.part(circle(at(1.28, 0), 5), pal.accent);
      break;
    }
    case 'fedora': {
      const crown = new Path2D();
      const pts = [at(0.35, -0.85), at(1.3, -0.6), at(1.2, 0.6), at(0.35, 0.85)];
      crown.moveTo(pts[0].x, pts[0].y);
      for (const q of pts.slice(1)) crown.lineTo(q.x, q.y);
      crown.closePath();
      p.part(crown, pal.cap);
      p.part(capsule(at(0.4, -0.6), at(0.4, 0.6), 2, 2), pal.accent, { shadow: false, outline: false });
      p.part(capsule(at(0.3, -1.55), at(0.3, 1.6), 2.4, 2.4), shade(pal.cap, 0.9), { shadow: false });
      break;
    }
  }
}
