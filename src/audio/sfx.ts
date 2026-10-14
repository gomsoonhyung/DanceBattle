// 에셋 없이 Web Audio로 합성하는 간단한 효과음.

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

/** 배경 음악(music.ts)이 같은 오디오를 쓰도록 꺼내 준다. 아직 켜지지 않았으면 null */
export function audio(): { ctx: AudioContext; noise: AudioBuffer } | null {
  return ctx && noiseBuf ? { ctx, noise: noiseBuf } : null;
}

/** 브라우저 정책상 사용자 입력 이후에만 오디오를 켤 수 있다. */
export function unlockAudio(): void {
  if (!ctx) {
    ctx = new AudioContext();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function noise(dur: number, freq: number, gain: number, type: BiquadFilterType = 'lowpass'): void {
  if (!ctx || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(t);
  src.stop(t + dur);
}

function tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', slideTo?: number): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const sfx = {
  /** 타격음: 데미지가 클수록 낮고 길고 크게, 강공격에는 묵직한 저음을 한 겹 더 */
  hit(heavy: boolean, damage = heavy ? 80 : 30): void {
    const k = Math.min(1, damage / 120);
    noise(0.08 + k * 0.18, 3200 - k * 1600, 0.3 + k * 0.25);
    tone(220 - k * 110, 0.07 + k * 0.14, 0.4, 'triangle', 50);
    if (heavy) tone(70, 0.25, 0.35, 'sine', 35);
  },
  /** 휘두르는 소리: 기술이 나가는 순간. strength 0(약) ~ 1(필살) */
  whoosh(strength: number): void {
    noise(0.07 + strength * 0.1, 900 + strength * 1600, 0.06 + strength * 0.08, 'bandpass');
  },
  block(): void {
    noise(0.06, 5000, 0.25, 'highpass');
    tone(900, 0.05, 0.12, 'square', 600);
  },
  counter(): void {
    tone(1200, 0.25, 0.2, 'sawtooth', 2400);
    noise(0.15, 4000, 0.3, 'bandpass');
  },
  super(): void {
    tone(220, 0.6, 0.25, 'sawtooth', 880);
    tone(330, 0.6, 0.15, 'square', 1320);
  },
  ko(): void {
    tone(400, 0.9, 0.3, 'sawtooth', 60);
    noise(0.5, 800, 0.4);
  },
  announce(): void {
    tone(660, 0.12, 0.15, 'square');
  },
};
