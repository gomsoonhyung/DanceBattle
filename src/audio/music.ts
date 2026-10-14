import { audio } from './sfx';

/*
 * 배경 음악: 음원 파일 없이 Web Audio로 장르별 비트를 만든다.
 * 16칸(16분음표) 두 마디 패턴을 반복하고, 조금 앞서 미리 예약해서 박자가 흔들리지 않게 한다.
 * 표시·소리 전용이며 게임 로직과 무관하다.
 */

export type MusicStyle = 'title' | 'boombap' | 'house' | 'disco' | 'funk' | 'breaks' | 'krump';

interface Pattern {
  bpm: number;
  swing: number; // 0 = 곧게, 0.15~0.25 = 힙합 스윙 (짝수 16분음표를 늦춘다)
  // 32칸 (두 마디). x = 세게, o = 약하게, . = 쉼
  kick: string;
  snare: string;
  clap?: string;
  hat: string;
  open?: string;
  // 베이스: 칸마다 반음 (루트 기준), '.' = 쉼, '-' = 이어 누름
  bass: (number | '.' | '-')[];
  root: number; // 베이스 루트 주파수 (Hz)
  bassType: OscillatorType;
  /** 화음 찌르기 (칸, 루트 기준 반음들) */
  stabs?: { at: number[]; notes: number[] };
}

const _ = '.' as const;
const H = '-' as const;

const STYLES: Record<MusicStyle, Pattern> = {
  title: {
    bpm: 88,
    swing: 0.2,
    kick: 'x......x..x.....x......x..o.....',
    snare: '....x.......x.......x.......x...',
    hat: 'o.o.o.o.o.o.o.o.o.o.o.o.o.o.o.o.',
    bass: [0, H, H, _, _, _, _, 0, _, _, 3, H, _, _, _, _, -2, H, H, _, _, _, _, -2, _, _, 1, H, _, _, _, _],
    root: 55,
    bassType: 'triangle',
    stabs: { at: [0, 16], notes: [12, 15, 19] },
  },
  boombap: {
    bpm: 92,
    swing: 0.22,
    kick: 'x......x..x.....x.....x...x.....',
    snare: '....x.......x.......x.......x..o',
    hat: 'x.o.x.o.x.o.x.o.x.o.x.o.x.o.x.o.',
    bass: [0, H, _, _, _, _, _, 0, _, _, 0, H, _, _, 3, _, -4, H, _, _, _, _, _, -4, _, _, -2, H, _, _, -1, _],
    root: 49,
    bassType: 'sawtooth',
  },
  house: {
    bpm: 124,
    swing: 0,
    kick: 'x...x...x...x...x...x...x...x...',
    snare: '................................',
    clap: '....x.......x.......x.......x...',
    hat: '..o...o...o...o...o...o...o...o.',
    open: '..x...x...x...x...x...x...x...x.',
    bass: [_, _, 0, _, _, _, 0, _, _, _, 0, _, _, _, 7, _, _, _, -2, _, _, _, -2, _, _, _, -2, _, _, _, 5, _],
    root: 55,
    bassType: 'square',
    stabs: { at: [6, 14, 22, 30], notes: [12, 15, 19, 22] },
  },
  disco: {
    bpm: 120,
    swing: 0,
    kick: 'x...x...x...x...x...x...x...x...',
    snare: '....x.......x.......x.......x...',
    hat: 'oxoxoxoxoxoxoxoxoxoxoxoxoxoxoxox',
    open: '..x...x...x...x...x...x...x...x.',
    bass: [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 5, _, 17, _, 5, _, 17, _, 7, _, 19, _, 7, _, 19, _],
    root: 55,
    bassType: 'sawtooth',
    stabs: { at: [2, 10, 18, 26], notes: [12, 16, 19] },
  },
  funk: {
    bpm: 104,
    swing: 0.08,
    kick: 'x.....x...x..x..x.....x.x....x..',
    snare: '....x..o....x.......x..o....x...',
    hat: 'xoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxo',
    bass: [0, _, _, 0, _, _, 12, _, _, 10, _, 0, _, 7, _, _, 0, _, _, 0, _, _, 12, _, 3, _, 5, _, 7, _, 10, _],
    root: 41,
    bassType: 'square',
    stabs: { at: [4, 12, 20, 28], notes: [16, 19, 22] },
  },
  breaks: {
    bpm: 110,
    swing: 0.1,
    kick: 'x.x.......x.....x.x...x...x.....',
    snare: '....x..o.o..x..o....x..o.o..x...',
    hat: 'xoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxo',
    open: '..............x...............x.',
    bass: [0, H, _, _, _, _, 0, _, _, _, 3, _, 5, _, _, _, 0, H, _, _, _, _, 0, _, _, _, -2, _, -5, _, _, _],
    root: 46,
    bassType: 'sawtooth',
  },
  krump: {
    // 빠른 템포를 반으로 느끼는 묵직한 하프타임: 스네어가 셋째 박에 크게
    bpm: 140,
    swing: 0.05,
    kick: 'x.....x.x.......x.x...x.........',
    snare: '........x...............x.......',
    clap: '........x...............x.......',
    hat: 'x.x.xxx.x.x.x.x.x.x.xxx.x.x.x.xx',
    bass: [0, H, H, H, H, H, 0, H, 0, H, H, H, _, _, _, _, -1, H, H, H, H, H, -1, H, -3, H, H, H, _, _, _, _],
    root: 36,
    bassType: 'sawtooth',
  },
};

const LOOKAHEAD = 0.12; // 초: 이만큼 앞까지 예약
const VOLUME = 0.32;

class Music {
  private style: MusicStyle | null = null;
  private step = 0;
  private nextTime = 0;
  private master: GainNode | null = null;
  private timer: number | null = null;
  muted = false;

  /** 장르 음악을 튼다 (이미 같은 음악이면 그대로) */
  play(style: MusicStyle): void {
    if (this.style === style) return;
    this.style = style;
    this.step = 0;
    this.nextTime = 0;
    if (this.timer === null) this.timer = window.setInterval(() => this.tick(), 25);
  }

  stop(): void {
    this.style = null;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : VOLUME;
    return this.muted;
  }

  private tick(): void {
    const a = audio();
    if (!a || !this.style) return;
    const { ctx } = a;
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : VOLUME;
      this.master.connect(ctx.destination);
    }
    const p = STYLES[this.style];
    const sixteenth = 60 / p.bpm / 4;
    if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      const s = this.step % 32;
      const t = this.nextTime + (s % 2 ? p.swing * sixteenth : 0);
      this.playStep(p, s, t, sixteenth);
      this.nextTime += sixteenth;
      this.step++;
    }
  }

  private playStep(p: Pattern, s: number, t: number, dur: number): void {
    const vel = (pat: string | undefined) => (pat?.[s] === 'x' ? 1 : pat?.[s] === 'o' ? 0.5 : 0);
    if (vel(p.kick)) this.kick(t, vel(p.kick));
    if (vel(p.snare)) this.snare(t, vel(p.snare));
    if (vel(p.clap)) this.clap(t, vel(p.clap));
    if (vel(p.hat)) this.hat(t, vel(p.hat) * 0.6, 0.03);
    if (vel(p.open)) this.hat(t, vel(p.open) * 0.5, 0.12);
    const n = p.bass[s];
    if (typeof n === 'number') {
      let len = 1;
      while (p.bass[(s + len) % 32] === '-' && len < 16) len++;
      this.bass(p, t, n, dur * len * 0.95);
    }
    if (p.stabs?.at.includes(s)) for (const k of p.stabs.notes) this.stab(p.root * 2 ** (k / 12), t, dur * 1.5);
  }

  // ── 소리 ──
  private env(t: number, peak: number, decay: number): GainNode {
    const { ctx } = audio()!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(this.master!);
    return g;
  }

  private kick(t: number, v: number): void {
    const { ctx } = audio()!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    o.connect(this.env(t, 0.9 * v, 0.3));
    o.start(t);
    o.stop(t + 0.32);
  }

  private noise(t: number, dur: number, type: BiquadFilterType, freq: number, peak: number): void {
    const { ctx, noise } = audio()!;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    src.connect(f).connect(this.env(t, peak, dur));
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.02);
  }

  private snare(t: number, v: number): void {
    this.noise(t, 0.16, 'highpass', 1500, 0.45 * v);
    const { ctx } = audio()!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    o.connect(this.env(t, 0.3 * v, 0.1));
    o.start(t);
    o.stop(t + 0.12);
  }

  private clap(t: number, v: number): void {
    for (const d of [0, 0.012, 0.024]) this.noise(t + d, 0.09, 'bandpass', 1400, 0.35 * v);
  }

  private hat(t: number, v: number, dur: number): void {
    this.noise(t, dur, 'highpass', 7500, 0.22 * v);
  }

  private bass(p: Pattern, t: number, semis: number, dur: number): void {
    const { ctx } = audio()!;
    const o = ctx.createOscillator();
    o.type = p.bassType;
    o.frequency.value = p.root * 2 ** (semis / 12);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(700, t);
    f.frequency.exponentialRampToValueAtTime(220, t + Math.max(0.05, dur));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
    g.gain.setValueAtTime(0.32, t + Math.max(0.02, dur - 0.03));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private stab(freq: number, t: number, dur: number): void {
    const { ctx } = audio()!;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1800;
    o.connect(f).connect(this.env(t, 0.06, dur));
    o.start(t);
    o.stop(t + dur + 0.02);
  }
}

export const music = new Music();

/** 캐릭터 id → 그 장르 음악 */
export const STYLE_FOR: Record<string, MusicStyle> = {
  hiphopper: 'boombap',
  hiphopgirl: 'boombap',
  househead: 'house',
  waacker: 'disco',
  locker: 'funk',
  popper: 'funk',
  bboy: 'breaks',
  krump: 'krump',
};
