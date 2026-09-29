import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../characters';
import { WAACKER } from '../characters/waacking';
import { Match } from '../game/match';
import { BTN, EMPTY_INPUT, type RawInput } from '../input/types';
import { dirToRaw, TrainingGuide } from './guide';

const I = (o: Partial<RawInput> = {}): RawInput => ({ ...EMPTY_INPUT, ...o });

describe('dirToRaw', () => {
  it('앞(6)은 오른쪽을 볼 때 →, 왼쪽을 볼 때 ←', () => {
    expect(dirToRaw(6, 1).right).toBe(true);
    expect(dirToRaw(6, -1).left).toBe(true);
    expect(dirToRaw(1, 1)).toMatchObject({ left: true, down: true, right: false, up: false });
  });
});

describe('기술 시범', () => {
  for (const c of CHARACTERS) {
    it(`${c.name}: 모든 기술의 시범이 실제로 그 기술을 쓴다`, () => {
      const guide = new TrainingGuide(c);
      guide.entries.forEach((entry, i) => {
        const m = new Match('training', [c, c]);
        guide.select(i);
        guide.startDemo(m);
        let used = false;
        let litButton = false;
        while (guide.demoActive) {
          const raw = guide.nextInput()!;
          m.update(raw, I());
          guide.observe(m);
          if (m.fighters[0].move?.id === entry.move.id) used = true;
          if (guide.demoStep === entry.dirs.length) litButton = true;
        }
        expect(used, entry.move.id).toBe(true);
        expect(litButton, `${entry.move.id} 버튼 칸 표시`).toBe(true);
        // 시범은 성공 횟수에 들어가지 않는다
        expect(entry.successes, entry.move.id).toBe(0);
      });
    });
  }
});

describe('성공 판정', () => {
  it('직접 커맨드를 넣으면 성공 횟수가 오른다', () => {
    const m = new Match('training', [WAACKER, WAACKER]);
    const guide = new TrainingGuide(WAACKER);
    const seq = [I({ down: true }), I({ down: true, right: true }), I({ right: true, buttons: BTN.LP })];
    for (const raw of seq) {
      m.update(raw, I());
      guide.observe(m);
    }
    const storm = guide.entries.find((e) => e.move.id === 'whipStorm')!;
    expect(storm.successes).toBe(1);
    expect(guide.successFlash).toBeGreaterThan(0);
  });

  it('포즈를 쓰면 게이지가 찬다', () => {
    const m = new Match('versus', [WAACKER, WAACKER]);
    while (m.phase !== 'fight') m.update(I(), I());
    const w = m.fighters[0];
    w.meter = 0;
    const seq = [I({ down: true }), I({ down: true, left: true }), I({ left: true, buttons: BTN.LP })];
    for (const raw of seq) m.update(raw, I());
    expect(w.move?.id).toBe('strikeAPose');
    for (let i = 0; i < 20; i++) m.update(I(), I());
    expect(w.meter).toBeGreaterThanOrEqual(30);
  });
});
