// 에셋 없이 Web Audio로 합성하는 간단한 효과음.

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;

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
  hit(heavy: boolean): void {
    noise(heavy ? 0.22 : 0.1, heavy ? 1800 : 3000, heavy ? 0.5 : 0.35);
    tone(heavy ? 120 : 200, heavy ? 0.18 : 0.08, 0.4, 'triangle', 50);
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
