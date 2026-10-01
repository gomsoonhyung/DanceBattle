import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../characters';
import { STAGE_RIGHT } from '../core/constants';
import { BBOY } from '../characters/bboy';
import { KRUMP } from '../characters/krump';
import { LOCKER } from '../characters/locking';
import { InputBuffer } from '../input/inputBuffer';
import type { CharacterDef } from '../fighter/types';
import { BTN, EMPTY_INPUT, type RawInput } from '../input/types';
import { Match } from './match';

const MAX_HEALTH = BBOY.maxHealth;

const I = (o: Partial<RawInput> = {}): RawInput => ({ ...EMPTY_INPUT, ...o });

/** 인트로를 건너뛰고 싸움 단계로 */
function fightingMatch(chars: [CharacterDef, CharacterDef] = [BBOY, BBOY]): Match {
  const m = new Match('versus', chars);
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
        const p1 = I({
          right: i % 50 < 20,
          down: i % 90 > 70,
          buttons: i % 17 === 0 ? BTN.LP : i % 23 === 0 ? BTN.HK : 0,
        });
        const p2 = I({ left: i % 40 < 10, buttons: i % 29 === 0 ? BTN.LK : 0 });
        m.update(p1, p2);
      }
      return m.fighters.map((f) => [f.x, f.y, f.health, f.state]);
    };
    expect(script(fightingMatch())).toEqual(script(fightingMatch()));
  });
});

const QCF = [I({ down: true }), I({ down: true, right: true }), I({ right: true })];

describe('캐릭터 데이터', () => {
  it.each(CHARACTERS.map((c) => [c.name, c] as const))('%s: 기술 참조와 프레임 데이터가 올바르다', (_n, c) => {
    const ids = [
      ...Object.values(c.normals.stand),
      ...Object.values(c.normals.crouch),
      c.normals.airLight,
      c.normals.airHeavy,
      ...c.specials.map((s) => s.move),
      c.super,
    ];
    for (const id of ids) expect(c.moves[id], id).toBeDefined();
    for (const m of Object.values(c.moves)) {
      for (const h of m.hits) {
        expect(h.frames[0], m.id).toBeLessThanOrEqual(h.frames[1]);
        if (!m.air) expect(h.frames[1], m.id).toBeLessThanOrEqual(m.total);
      }
      if (m.counter) expect(c.moves[m.counter.into], m.id).toBeDefined();
      if (m.projectile) expect(m.projectile.frame, m.id).toBeLessThanOrEqual(m.total);
    }
  });

  it.each(CHARACTERS.map((c) => [c.name, c] as const))('%s: 모든 필살기 커맨드가 나간다', (_n, c) => {
    const inputs: Record<string, RawInput[]> = {
      qcf: [I({ down: true }), I({ down: true, right: true }), I({ right: true })],
      qcb: [I({ down: true }), I({ down: true, left: true }), I({ left: true })],
      dp: [I({ right: true }), I({ down: true }), I({ down: true, right: true })],
    };
    for (const sp of c.specials) {
      const m = fightingMatch([c, c]);
      const seqIn = inputs[sp.motion].map((x) => ({ ...x }));
      seqIn[seqIn.length - 1].buttons = sp.button === 'P' ? BTN.LP : BTN.LK;
      seq(m, seqIn);
      expect(m.fighters[0].move?.id, sp.move).toBe(sp.move);
    }
  });
});

describe('크럼프', () => {
  it('스톰프 웨이브 장풍이 날아가서 멀리 있는 상대를 맞힌다', () => {
    const m = fightingMatch([KRUMP, BBOY]);
    m.fighters[0].x = 200;
    m.fighters[1].x = 600;
    seq(m, [...QCF.slice(0, 2), I({ right: true, buttons: BTN.LP })]);
    run(m, 20);
    expect(m.projectiles.length).toBe(1);
    run(m, 80);
    expect(m.fighters[1].health).toBeLessThan(BBOY.maxHealth);
    expect(m.projectiles.length).toBe(0);
  });

  it('스톰프 웨이브는 하단이라 서서 막을 수 없다', () => {
    const m = fightingMatch([KRUMP, BBOY]);
    // 뒤로 누른 상대가 물러나지 않도록 벽에 붙인다
    m.fighters[0].x = STAGE_RIGHT - 400;
    m.fighters[1].x = STAGE_RIGHT;
    seq(m, [...QCF.slice(0, 2), I({ right: true, buttons: BTN.LP })], I({ right: true }));
    run(m, 100, I(), I({ right: true }));
    expect(m.fighters[1].health).toBeLessThan(BBOY.maxHealth);
  });

  it('버스트 러시는 아머로 한 번 버티고 계속 돌진한다', () => {
    const m = fightingMatch([KRUMP, BBOY]);
    closeIn(m, 110);
    seq(m, [...QCF.slice(0, 2), I({ right: true, buttons: BTN.LK })], I({ buttons: BTN.LP }));
    run(m, 6);
    const k = m.fighters[0];
    expect(k.health).toBeLessThan(KRUMP.maxHealth);
    expect(k.state).toBe('move');
    expect(k.move?.id).toBe('burstRush');
  });

  it('체스트 팝은 가드할 수 없다', () => {
    const m = fightingMatch([KRUMP, BBOY]);
    m.fighters[0].x = STAGE_RIGHT - 70;
    m.fighters[1].x = STAGE_RIGHT;
    const guard = I({ right: true });
    seq(m, [I({ down: true }), I({ down: true, left: true }), I({ left: true, buttons: BTN.LP })], guard);
    expect(m.fighters[0].move?.id).toBe('chestPop');
    run(m, 40, I(), guard);
    expect(m.fighters[1].health).toBeLessThan(BBOY.maxHealth);
  });
});

describe('락킹', () => {
  it('포인트 장풍은 서 있는 상대에게 맞는다', () => {
    const m = fightingMatch([LOCKER, BBOY]);
    m.fighters[0].x = 200;
    m.fighters[1].x = 600;
    seq(m, [...QCF.slice(0, 2), I({ right: true, buttons: BTN.LP })]);
    run(m, 70);
    expect(m.fighters[1].health).toBeLessThan(BBOY.maxHealth);
  });

  it('포인트 장풍은 앉으면 피할 수 있다', () => {
    const m = fightingMatch([LOCKER, BBOY]);
    m.fighters[0].x = 200;
    m.fighters[1].x = 600;
    const duck = I({ down: true });
    seq(m, [...QCF.slice(0, 2), I({ right: true, buttons: BTN.LP })], duck);
    run(m, 70, I(), duck);
    expect(m.fighters[1].health).toBe(BBOY.maxHealth);
  });

  it('장풍끼리 부딪히면 둘 다 사라진다', () => {
    const m = fightingMatch([LOCKER, LOCKER]);
    m.fighters[0].x = 200;
    m.fighters[1].x = 700;
    const p2qcf = [I({ down: true }), I({ down: true, left: true }), I({ left: true, buttons: BTN.LP })];
    for (let i = 0; i < 3; i++) m.update(i < 2 ? QCF[i] : I({ right: true, buttons: BTN.LP }), p2qcf[i]);
    run(m, 20);
    expect(m.projectiles.length).toBe(2);
    run(m, 40);
    expect(m.projectiles.length).toBe(0);
    expect(m.fighters[0].health).toBe(LOCKER.maxHealth);
    expect(m.fighters[1].health).toBe(LOCKER.maxHealth);
  });
});

describe('기본 시스템: 대시 · 잡기 · 카운터 · 기상', () => {
  const THROW = BTN.LP | BTN.LK;

  it('→ → 를 빠르게 누르면 앞으로 대시한다', () => {
    const m = fightingMatch();
    const p1 = m.fighters[0];
    m.fighters[1].x = 900;
    const x0 = p1.x;
    seq(m, [I({ right: true }), I(), I({ right: true })]);
    expect(p1.state).toBe('dash');
    run(m, 20);
    expect(p1.x - x0).toBeGreaterThan(100);
    expect(p1.state).toBe('idle');
  });

  it('↓↘→↓↘→ 는 대시가 되지 않는다', () => {
    const m = fightingMatch();
    seq(m, [I({ down: true }), I({ down: true, right: true }), I({ right: true })]);
    seq(m, [I({ down: true }), I({ down: true, right: true }), I({ right: true })]);
    expect(m.fighters[0].state).not.toBe('dash');
  });

  it('백대시는 처음 몇 프레임 동안 무적이다', () => {
    const m = fightingMatch();
    closeIn(m);
    seq(m, [I({ left: true }), I(), I({ left: true })]);
    expect(m.fighters[0].state).toBe('backdash');
    expect(m.fighters[0].hurtbox()).toBeNull();
  });

  it('붙어서 약P+약K로 잡으면 가드해도 데미지를 주고 넘어뜨린다', () => {
    const m = fightingMatch();
    closeIn(m, 60);
    // P2는 계속 뒤(오른쪽)를 눌러 가드
    seq(m, [I({ buttons: THROW })], I({ right: true }));
    run(m, 30, I(), I({ right: true }));
    expect(m.fighters[1].health).toBe(MAX_HEALTH - 120);
    expect(['airHit', 'knockdown']).toContain(m.fighters[1].state);
  });

  it('잡히는 순간 약P+약K를 누르면 잡기를 푼다', () => {
    const m = fightingMatch();
    closeIn(m, 60);
    const events: string[] = [];
    seq(m, [I({ buttons: THROW }), I(), I()], I());
    m.update(I(), I({ buttons: THROW }));
    events.push(...m.events.map((e) => e.type));
    for (let i = 0; i < 6; i++) {
      m.update(I(), I());
      events.push(...m.events.map((e) => e.type));
    }
    expect(events).toContain('tech');
    expect(m.fighters[1].health).toBe(MAX_HEALTH);
  });

  it('멀리서는 잡을 수 없다', () => {
    const m = fightingMatch();
    closeIn(m, 160);
    seq(m, [I({ buttons: THROW })]);
    run(m, 30);
    expect(m.fighters[1].health).toBe(MAX_HEALTH);
  });

  it('상대가 공격을 내미는 중에 맞히면 카운터 히트 (데미지 1.2배)', () => {
    const m = fightingMatch();
    closeIn(m);
    // 같은 프레임에 P1 약P(발생 5), P2 강P(발생 9) → P2가 내미는 중에 맞는다
    m.update(I({ buttons: BTN.LP }), I({ buttons: BTN.HP }));
    const types: string[] = [];
    for (let i = 0; i < 10; i++) {
      m.update(I(), I());
      types.push(...m.events.map((e) => e.type));
    }
    expect(types).toContain('counterHit');
    expect(m.fighters[1].health).toBe(MAX_HEALTH - Math.round(30 * 1.2));
  });

  it('넘어진 직후 버튼을 누르면 빨리 일어난다', () => {
    const framesToStand = (quick: boolean) => {
      const m = fightingMatch();
      closeIn(m, 60);
      seq(m, [I({ buttons: THROW })]);
      const state = (): string => m.fighters[1].state;
      let n = 0;
      while (state() !== 'knockdown') {
        m.update(I(), I());
        n++;
      }
      m.update(I(), I({ buttons: quick ? BTN.LP : 0 }));
      n++;
      while (state() !== 'idle' && n < 300) {
        m.update(I(), I());
        n++;
      }
      return n;
    };
    expect(framesToStand(false) - framesToStand(true)).toBeGreaterThanOrEqual(15);
  });
});

describe('특수기 · 새 필살기', () => {
  it('앞+강P 로 크럼프 해머 스윙이 나간다', () => {
    const m = fightingMatch([KRUMP, BBOY]);
    closeIn(m, 90);
    seq(m, [I({ right: true, buttons: BTN.HP })]);
    expect(m.fighters[0].move?.id).toBe('hammerSwing');
  });

  it('해머 스윙은 중단이라 앉아서는 막을 수 없다', () => {
    const m = fightingMatch([KRUMP, BBOY]);
    closeIn(m, 90);
    // P2는 뒤아래(오른쪽 아래)로 앉아 가드
    const crouchGuard = I({ down: true, right: true });
    seq(m, [I({ right: true, buttons: BTN.HP })], crouchGuard);
    run(m, 30, I(), crouchGuard);
    expect(m.fighters[1].health).toBeLessThan(BBOY.maxHealth);
  });

  it('락킹 모자는 날아갔다가 주인에게 돌아온다', () => {
    const m = fightingMatch([LOCKER, BBOY]);
    m.fighters[0].x = 100;
    m.fighters[1].x = 900;
    seq(m, [...QCF.slice(0, 2), I({ right: true, buttons: BTN.LP })]);
    run(m, 20);
    expect(m.projectiles[0].vx).toBeGreaterThan(0);
    run(m, 30);
    expect(m.projectiles[0].vx).toBeLessThan(0);
    run(m, 50);
    expect(m.projectiles.length).toBe(0);
  });
});
