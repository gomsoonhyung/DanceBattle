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

  it('반복 동작은 몇 바퀴를 돌아도 한 바퀴 안의 그림 번호를 쓴다 (스프라이트 이름과 맞도록)', () => {
    const loop: Anim = { loop: 30, keys: anim.keys };
    expect(displayFrame(loop, 30)).toBe(0);
    expect(displayFrame(loop, 1000)).toBe(displayFrame(loop, 1000 % 30));
  });

  it('게임 중 어떤 프레임이든 표시 번호는 내보내기 목록 안에 있다 (교체 그림을 항상 찾을 수 있다)', () => {
    for (const c of CHARACTERS) {
      for (const a of Object.values(c.anims)) {
        const len = a.loop ?? a.keys[a.keys.length - 1].f + 1;
        const list = new Set(displayFrames(a, len));
        for (let f = 0; f < 300; f++) expect(list.has(displayFrame(a, f)), `${c.id} f${f}`).toBe(true);
      }
    }
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
