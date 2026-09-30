import type { Vec2 } from '../core/math';

/**
 * 머리카락·머리띠 끈처럼 몸을 따라 흔들리는 사슬 (연출 전용, 게임 로직과 무관).
 * 매 그리기마다 앞 점을 붙는 위치로 옮기고, 나머지 점은 관성·중력으로 따라온다.
 */
export class TailChain {
  private pts: Vec2[] = [];
  private prev: Vec2[] = [];

  constructor(
    readonly count: number,
    readonly segment: number,
  ) {}

  /** anchor = 붙는 위치, drift = 끝이 흘러가려는 방향 (보통 머리 뒤쪽) */
  update(anchor: Vec2, drift: Vec2): Vec2[] {
    if (!this.pts.length || Math.hypot(this.pts[0].x - anchor.x, this.pts[0].y - anchor.y) > 80) {
      // 처음이거나 순간이동(라운드 시작 등)했으면 새로 늘어뜨린다
      this.pts = Array.from({ length: this.count }, (_, i) => ({
        x: anchor.x + drift.x * this.segment * i,
        y: anchor.y + drift.y * this.segment * i + i * 2,
      }));
      this.prev = this.pts.map((p) => ({ ...p }));
    }
    this.pts[0] = { ...anchor };
    for (let i = 1; i < this.count; i++) {
      const p = this.pts[i];
      const vx = (p.x - this.prev[i].x) * 0.86;
      const vy = (p.y - this.prev[i].y) * 0.86;
      this.prev[i] = { ...p };
      p.x += vx + drift.x * 0.35;
      p.y += vy + 0.55 + drift.y * 0.35;
    }
    // 마디 길이 유지
    for (let k = 0; k < 3; k++) {
      for (let i = 1; i < this.count; i++) {
        const a = this.pts[i - 1];
        const b = this.pts[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const t = this.segment / d;
        b.x = a.x + dx * t;
        b.y = a.y + dy * t;
      }
    }
    return this.pts.map((p) => ({ ...p }));
  }
}

/** 빠르게 휘두른 손발이 남기는 궤적 */
export interface Smear {
  a: Vec2;
  b: Vec2;
  life: number;
  width: number;
}
