export interface Vec2 {
  x: number;
  y: number;
}

/** 월드 좌표 박스. x,y는 왼쪽 아래 모서리 (y 위쪽 +). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DEG = Math.PI / 180;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
