import type { Dir, RawInput } from './types';
import { toDir } from './types';

interface FrameInput {
  dir: Dir;
  held: number;
  pressed: number; // 이번 프레임에 새로 눌린 버튼
}

const HISTORY = 60;

/**
 * 프레임 단위 입력 기록. 커맨드(236, 623 등) 인식과 선입력 버퍼를 담당한다.
 * 결정론적이라 나중에 롤백 넷코드에 그대로 쓸 수 있다.
 */
export class InputBuffer {
  private frames: FrameInput[] = [];
  private prevHeld = 0;
  /** 이 값 이전 프레임의 버튼 입력은 이미 사용된 것으로 본다. */
  private consumedAt = 0;
  private frameCount = 0;

  push(raw: RawInput, facing: 1 | -1): void {
    const pressed = raw.buttons & ~this.prevHeld;
    this.prevHeld = raw.buttons;
    this.frames.push({ dir: toDir(raw, facing), held: raw.buttons, pressed });
    if (this.frames.length > HISTORY) this.frames.shift();
    this.frameCount++;
  }

  reset(): void {
    this.frames = [];
    this.prevHeld = 0;
    this.consumedAt = this.frameCount;
  }

  get dir(): Dir {
    return this.frames.length ? this.frames[this.frames.length - 1].dir : 5;
  }

  get held(): number {
    return this.frames.length ? this.frames[this.frames.length - 1].held : 0;
  }

  /**
   * 최근 `window` 프레임 안에 `mask` 버튼 중 하나가 새로 눌렸으면 그 버튼 마스크를 반환 (선입력).
   * 아직 소비되지 않은 입력만 인정한다.
   */
  pressedWithin(mask: number, window: number): number {
    const n = this.frames.length;
    const minIdx = Math.max(0, n - window, n - (this.frameCount - this.consumedAt));
    for (let i = n - 1; i >= minIdx; i--) {
      const hit = this.frames[i].pressed & mask;
      if (hit) return hit;
    }
    return 0;
  }

  /** 최근 `window` 프레임 안에 `mask` 버튼들이 모두 눌렸는지 (동시 입력). */
  allPressedWithin(mask: number, window: number): boolean {
    const n = this.frames.length;
    const minIdx = Math.max(0, n - window, n - (this.frameCount - this.consumedAt));
    let acc = 0;
    for (let i = n - 1; i >= minIdx; i--) acc |= this.frames[i].pressed;
    return (acc & mask) === mask;
  }

  /** 입력 기록 표시용: 최근 입력을 (방향, 누른 버튼, 유지 프레임) 묶음으로. 최신이 앞 */
  recent(maxEntries: number): { dir: Dir; held: number; frames: number }[] {
    const out: { dir: Dir; held: number; frames: number }[] = [];
    for (let i = this.frames.length - 1; i >= 0 && out.length <= maxEntries; i--) {
      const f = this.frames[i];
      const top = out[out.length - 1];
      if (top && top.dir === f.dir && top.held === f.held) top.frames++;
      else out.push({ dir: f.dir, held: f.held, frames: 1 });
    }
    return out.slice(0, maxEntries);
  }

  consume(): void {
    this.consumedAt = this.frameCount;
  }

  /**
   * 같은 방향을 빠르게 두 번 (대시 66, 백대시 44).
   * 이번 프레임에 d를 새로 눌렀고, 바로 앞이 손을 뗀 상태(5)뿐이며 그 앞이 d면 true.
   * (↓↘→↓↘→ 처럼 대각선을 거쳐 다시 →가 되는 커맨드는 대시가 아니다)
   */
  doubleTap(d: Dir, window: number): boolean {
    const n = this.frames.length;
    if (n < 3 || this.frames[n - 1].dir !== d) return false;
    let i = n - 2;
    const min = Math.max(0, n - 1 - window);
    if (this.frames[i].dir !== 5) return false;
    while (i >= min && this.frames[i].dir === 5) i--;
    return i >= min && this.frames[i].dir === d;
  }

  /**
   * 방향 커맨드 인식. seq 순서대로 방향이 입력되었는지를 최근 window 프레임에서 확인한다.
   * 예: [2, 3, 6] = 앞으로 반원 (↓↘→)
   */
  motion(seq: readonly Dir[], window: number): boolean {
    let k = seq.length - 1;
    const n = this.frames.length;
    const minIdx = Math.max(0, n - window);
    for (let i = n - 1; i >= minIdx && k >= 0; i--) {
      if (this.frames[i].dir === seq[k]) k--;
    }
    return k < 0;
  }
}
