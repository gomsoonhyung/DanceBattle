import type { CharacterDef, MoveDef } from '../fighter/types';
import type { Match } from '../game/match';
import { BTN, type Dir, type RawInput } from '../input/types';

/** 가이드에 나오는 기술 하나 */
export interface GuideEntry {
  move: MoveDef;
  /** 커맨드 방향 (캐릭터가 보는 방향 기준: 6 = 앞) */
  dirs: Dir[];
  button: 'P' | 'K';
  isSuper: boolean;
  successes: number;
}

/** 시범 입력 한 프레임. step = 지금 입력 중인 커맨드 칸 (-1 = 없음, dirs.length = 버튼) */
interface DemoFrame {
  raw: RawInput;
  step: number;
}

const MOTION_DIRS: Record<'qcf' | 'qcb' | 'dp', Dir[]> = { qcf: [2, 3, 6], qcb: [2, 1, 4], dp: [6, 2, 3] };
const SUPER_DIRS: Dir[] = [2, 3, 6, 2, 3, 6];
const FRAMES_PER_DIR = 4;

/** 넘패드 방향 → 실제로 눌러야 하는 방향키 (facing = 캐릭터가 보는 방향) */
export function dirToRaw(d: Dir, facing: 1 | -1, buttons = 0): RawInput {
  const h = (((d - 1) % 3) - 1) * facing;
  const v = Math.floor((d - 1) / 3) - 1;
  return { left: h < 0, right: h > 0, down: v < 0, up: v > 0, buttons };
}

/** 시범에서 연습 상대를 세울 거리: 장풍은 멀리, 돌진기는 중간, 나머지는 가까이 */
function demoGap(m: MoveDef): number {
  if (m.projectile) return 320;
  if (m.velocity?.some((v) => v.vx < 0)) return 110;
  if (m.velocity?.some((v) => v.vx > 0)) return 190;
  return 85;
}

/**
 * 연습 모드 기술 가이드.
 * - 기술을 고르면 커맨드를 보여 주고, 플레이어가 성공하면 횟수를 센다
 * - 시범: 정해진 입력을 P1 대신 넣어서 캐릭터가 직접 기술을 쓰는 모습을 보여 준다
 */
export class TrainingGuide {
  readonly entries: GuideEntry[];
  selected = 0;
  visible = true;
  /** 시범 중 지금 불이 들어온 커맨드 칸 */
  demoStep = -1;
  /** 성공 표시가 남은 프레임 */
  successFlash = 0;
  lastSuccess: GuideEntry | null = null;

  private demo: DemoFrame[] | null = null;
  private demoIndex = 0;
  private inputWasDemo = false;
  private lastSerial = 0;

  constructor(readonly char: CharacterDef) {
    this.entries = buildEntries(char);
  }

  get current(): GuideEntry {
    return this.entries[this.selected];
  }

  get demoActive(): boolean {
    return this.demo !== null;
  }

  select(i: number): void {
    if (i < 0 || i >= this.entries.length) return;
    this.selected = i;
    this.demo = null;
    this.demoStep = -1;
  }

  /** 선택한 기술의 시범을 시작한다 */
  startDemo(match: Match): void {
    const e = this.current;
    match.placeForDemo(demoGap(e.move));
    const p1 = match.fighters[0];
    const facing = p1.facing;
    const btn = e.button === 'P' ? BTN.LP : BTN.LK;
    const frames: DemoFrame[] = [];
    const neutral = (n: number, step: number) => {
      for (let i = 0; i < n; i++) frames.push({ raw: dirToRaw(5, facing), step });
    };
    neutral(12, -1);
    e.dirs.forEach((d, k) => {
      const last = k === e.dirs.length - 1;
      for (let i = 0; i < FRAMES_PER_DIR; i++) frames.push({ raw: dirToRaw(d, facing), step: k });
      if (last) frames.push({ raw: dirToRaw(d, facing, btn), step: e.dirs.length });
    });
    neutral(16, e.dirs.length);
    neutral(e.move.total + (e.move.superFreeze ?? 0) + 30, -1);
    this.demo = frames;
    this.demoIndex = 0;
    this.lastSerial = p1.moveSerial;
  }

  /** 이번 프레임 P1 입력을 시범 입력으로 바꿔야 하면 그 입력을, 아니면 null */
  nextInput(): RawInput | null {
    if (!this.demo) {
      this.inputWasDemo = false;
      return null;
    }
    const fr = this.demo[this.demoIndex++];
    this.demoStep = fr.step;
    if (this.demoIndex >= this.demo.length) {
      this.demo = null;
      this.demoStep = -1;
    }
    this.inputWasDemo = true;
    return fr.raw;
  }

  /** 로직 1프레임 뒤에 호출: 플레이어가 기술을 성공했는지 확인 */
  observe(match: Match): void {
    const p1 = match.fighters[0];
    if (p1.moveSerial !== this.lastSerial) {
      this.lastSerial = p1.moveSerial;
      const e = this.entries.find((x) => x.move.id === p1.move?.id);
      if (e && !this.inputWasDemo) {
        e.successes++;
        this.lastSuccess = e;
        this.successFlash = 75;
      }
    }
    if (this.successFlash > 0) this.successFlash--;
  }
}

/** 캐릭터의 필살기 + 초필살기 → 가이드 항목 */
function buildEntries(char: CharacterDef): GuideEntry[] {
  const list: GuideEntry[] = char.specials.map((s) => ({
    move: char.moves[s.move],
    dirs: MOTION_DIRS[s.motion],
    button: s.button,
    isSuper: false,
    successes: 0,
  }));
  list.push({ move: char.moves[char.super], dirs: SUPER_DIRS, button: 'P', isSuper: true, successes: 0 });
  return list;
}
