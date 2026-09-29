import { describe, expect, it } from 'vitest';
import { MAX_HEALTH } from '../core/constants';
import { InputBuffer } from '../input/inputBuffer';
import { BTN, EMPTY_INPUT, type RawInput } from '../input/types';
import { Match } from './match';

const I = (o: Partial<RawInput> = {}): RawInput => ({ ...EMPTY_INPUT, ...o });

/** 인트로를 건너뛰고 싸움 단계로 */
function fightingMatch(): Match {
  const m = new Match('versus');
  while (m.phase !== 'fight') m.update(I(), I());
  return m;
}

function run(m: Match, frames: number, p1: RawInput = I(), p2: RawInput = I()): void {
  for (let i = 0; i < frames; i++) m.update(p1, p2);
}

/** 한 프레임에 한 입력씩 순서대로 */
function seq(m: Match, p1s: RawInput[], p2: RawInput = I()): void {
  for (const p of p1s) m.update(p, p2);
}

function closeIn(m: Match, gap = 70): void {
  const [p1, p2] = m.fighters;
  p1.x = 400;
  p2.x = 400 + gap;
}

describe('InputBuffer', () => {
  it('↓↘→ + P 를 인식한다', () => {
    const b = new InputBuffer();
    b.push(I({ down: true }), 1);
    b.push(I({ down: true, right: true }), 1);
    b.push(I({ right: true, buttons: BTN.LP }), 1);
    expect(b.motion([2, 3, 6], 16)).toBe(true);
    expect(b.pressedWithin(BTN.LP, 5)).toBe(BTN.LP);
  });

  it('왼쪽을 볼 때는 좌우가 뒤집힌다', () => {
    const b = new InputBuffer();
    b.push(I({ down: true }), -1);
    b.push(I({ down: true, left: true }), -1);
    b.push(I({ left: true }), -1);
    expect(b.motion([2, 3, 6], 16)).toBe(true);
  });

  it('소비한 버튼 입력은 다시 쓰이지 않는다', () => {
    const b = new InputBuffer();
    b.push(I({ buttons: BTN.HP }), 1);
    b.consume();
    b.push(I(), 1);
    expect(b.pressedWithin(BTN.HP, 5)).toBe(0);
  });
});

describe('Match', () => {
  it('가까이서 약P를 맞히면 데미지가 들어간다', () => {
    const m = fightingMatch();
    closeIn(m);
    seq(m, [I({ buttons: BTN.LP })]);
    run(m, 10);
    expect(m.fighters[1].health).toBe(MAX_HEALTH - 30);
  });

  it('뒤로 입력하면 중단을 가드한다', () => {
    const m = fightingMatch();
    closeIn(m);
    // P2는 왼쪽을 보고 있으므로 뒤 = 오른쪽
    seq(m, [I({ buttons: BTN.LP })], I({ right: true }));
    run(m, 10, I(), I({ right: true }));
    expect(m.fighters[1].health).toBe(MAX_HEALTH);
  });

  it('서서 가드하면 하단(앉아 약K)에 맞는다', () => {
    const m = fightingMatch();
    closeIn(m);
    seq(m, [I({ down: true }), I({ down: true, buttons: BTN.LK })], I({ right: true }));
    run(m, 12, I({ down: true }), I({ right: true }));
    expect(m.fighters[1].health).toBeLessThan(MAX_HEALTH);
  });

  it('앉아서 가드하면 하단을 막는다', () => {
    const m = fightingMatch();
    closeIn(m);
    const guard = I({ right: true, down: true });
    seq(m, [I({ down: true }), I({ down: true, buttons: BTN.LK })], guard);
    run(m, 12, I({ down: true }), guard);
    expect(m.fighters[1].health).toBe(MAX_HEALTH);
  });

  it('윈드밀 커맨드가 나가고 다단히트한다', () => {
    const m = fightingMatch();
    closeIn(m, 90);
    seq(m, [I({ down: true }), I({ down: true, right: true }), I({ right: true, buttons: BTN.LP })]);
    expect(m.fighters[0].move?.id).toBe('windmill');
    run(m, 60);
    expect(m.combo[0].hits).toBeGreaterThanOrEqual(3);
  });

  it('헤드스핀은 무적 중에 공격을 흘린다', () => {
    const m = fightingMatch();
    closeIn(m);
    // P2가 먼저 강K, P1이 바로 →↓↘+P
    seq(m, [I(), I()], I({ buttons: BTN.HK }));
    seq(m, [I({ right: true }), I({ down: true }), I({ down: true, right: true, buttons: BTN.LP })]);
    expect(m.fighters[0].move?.id).toBe('headspin');
    run(m, 6);
    expect(m.fighters[0].health).toBe(MAX_HEALTH);
  });

  it('게이지가 가득하면 강P+강K로 초필살기가 나가고 게이지를 소모한다', () => {
    const m = fightingMatch();
    closeIn(m, 90);
    m.fighters[0].meter = 100;
    seq(m, [I({ buttons: BTN.HP | BTN.HK })]);
    expect(m.fighters[0].move?.id).toBe('powerCombo');
    expect(m.fighters[0].meter).toBe(0);
    expect(m.superFreeze).toBeGreaterThan(0);
    run(m, 150);
    expect(m.fighters[1].health).toBeLessThan(MAX_HEALTH - 200);
  });

  it('프리즈 자세에서 맞으면 반격한다', () => {
    const m = fightingMatch();
    closeIn(m);
    seq(m, [I({ down: true }), I({ down: true, left: true }), I({ left: true, buttons: BTN.LP })]);
    expect(m.fighters[0].move?.id).toBe('freeze');
    run(m, 4);
    seq(m, [I()], I({ buttons: BTN.LP }));
    run(m, 8);
    expect(m.fighters[0].move?.id).toBe('freezeKick');
    run(m, 20);
    expect(m.fighters[0].health).toBe(MAX_HEALTH);
    expect(m.fighters[1].health).toBeLessThan(MAX_HEALTH);
  });

  it('콤보: 앉아 약K → 앉아 약P → 윈드밀', () => {
    const m = fightingMatch();
    closeIn(m, 60);
    const d = I({ down: true });
    seq(m, [d, I({ down: true, buttons: BTN.LK })]);
    run(m, 8, d);
    seq(m, [I({ down: true, buttons: BTN.LP })]);
    run(m, 4, d);
    seq(m, [d, I({ down: true, right: true }), I({ right: true, buttons: BTN.LP })]);
    run(m, 50);
    expect(m.combo[0].hits).toBeGreaterThanOrEqual(5);
  });

  it('콤보: 앉아 강P(띄움) → 헤드스핀', () => {
    const m = fightingMatch();
    closeIn(m, 60);
    const d = I({ down: true });
    seq(m, [d, I({ down: true, buttons: BTN.HP })]);
    run(m, 10, d);
    seq(m, [I({ right: true }), d, I({ down: true, right: true, buttons: BTN.LP })]);
    run(m, 6);
    expect(m.fighters[0].move?.id).toBe('headspin');
    run(m, 40);
    expect(m.combo[0].hits).toBeGreaterThanOrEqual(2);
  });

  it('체력이 0이 되면 K.O. 후 라운드 승리가 기록된다', () => {
    const m = fightingMatch();
    m.fighters[1].health = 1;
    closeIn(m);
    seq(m, [I({ buttons: BTN.LP })]);
    run(m, 400);
    expect(m.wins[0]).toBe(1);
  });

  it('같은 입력이면 항상 같은 결과가 나온다 (결정론)', () => {
    const script = (m: Match) => {
      closeIn(m, 120);
      for (let i = 0; i < 600; i++) {
        const p1 = I({ right: i % 50 < 20, down: i % 90 > 70, buttons: i % 17 === 0 ? BTN.LP : i % 23 === 0 ? BTN.HK : 0 });
        const p2 = I({ left: i % 40 < 10, buttons: i % 29 === 0 ? BTN.LK : 0 });
        m.update(p1, p2);
      }
      return m.fighters.map((f) => [f.x, f.y, f.health, f.state]);
    };
    expect(script(fightingMatch())).toEqual(script(fightingMatch()));
  });
});
