import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../characters';
import { displayFrame, displayFrames, LOOP_STEP, type Anim } from './pose';

const P = CHARACTERS[0].anims.idle.keys[0].p;

describe('끊어 보여주기 (displayFrame)', () => {
  const anim: Anim = {
    keys: [
      { f: 0, p: P },
      { f: 4, p: P },
      { f: 14, p: P },
    ],
  };

  it('키프레임 사이에서는 앞 키 포즈를 유지한다', () => {
    expect(displayFrame(anim, 0)).toBe(0);
    expect(displayFrame(anim, 3)).toBe(0);
    expect(displayFrame(anim, 4)).toBe(4);
  });

  it('간격이 넓으면 중간 그림을 한 장 끼운다', () => {
    expect(displayFrame(anim, 8)).toBe(4);
    expect(displayFrame(anim, 9)).toBe(9);
    expect(displayFrame(anim, 13)).toBe(9);
    expect(displayFrame(anim, 20)).toBe(14);
  });

  it('반복 동작은 일정 간격으로 한 장씩', () => {
    const loop: Anim = { loop: 36, keys: anim.keys };
    expect(displayFrame(loop, LOOP_STEP + 1)).toBe(LOOP_STEP);
    expect(displayFrames(loop, 36)).toHaveLength(36 / LOOP_STEP);
  });

  it('모든 기술의 키프레임은 반드시 그려진다 (공격 판정 포즈가 빠지지 않게)', () => {
    for (const c of CHARACTERS) {
      for (const m of Object.values(c.moves)) {
        const shown = new Set(displayFrames(m.anim, m.total + 1));
        for (const k of m.anim.keys) if (k.f <= m.total) expect(shown.has(k.f), `${c.id}/${m.id} f${k.f}`).toBe(true);
      }
    }
  });
});
