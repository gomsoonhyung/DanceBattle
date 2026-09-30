import { BTN, type RawInput } from './types';

interface KeyMap {
  up: string;
  down: string;
  left: string;
  right: string;
  LP: string;
  HP: string;
  LK: string;
  HK: string;
}

// event.code(물리 키) 기준이라 한글 입력 상태에서도 동작한다.
export const KEYMAPS: [KeyMap, KeyMap] = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', LP: 'KeyF', HP: 'KeyG', LK: 'KeyV', HK: 'KeyB' },
  {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    LP: 'KeyK',
    HP: 'KeyL',
    LK: 'Comma',
    HK: 'Period',
  },
];

const held = new Set<string>();
const pressedOnce = new Set<string>();

export function initKeyboard(): void {
  window.addEventListener('keydown', (e) => {
    if (!held.has(e.code)) pressedOnce.add(e.code);
    held.add(e.code);
    if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab' || /^F\d+$/.test(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
}

/** 메뉴 조작용: 이번 프레임에 새로 눌린 키인지. endFrame()에서 초기화된다. */
export function keyPressed(code: string): boolean {
  return pressedOnce.has(code);
}

export function endInputFrame(): void {
  pressedOnce.clear();
}

// 표준 게임패드 매핑: X(2)=LP, Y(3)=HP, A(0)=LK, B(1)=HK
const PAD_BUTTONS: [number, number][] = [
  [2, BTN.LP],
  [3, BTN.HP],
  [0, BTN.LK],
  [1, BTN.HK],
];

function readGamepad(index: number): RawInput | null {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = pads[index];
  if (!pad || !pad.connected) return null;
  const ax = pad.axes[0] ?? 0;
  const ay = pad.axes[1] ?? 0;
  const b = (i: number) => pad.buttons[i]?.pressed ?? false;
  let buttons = 0;
  for (const [i, mask] of PAD_BUTTONS) if (b(i)) buttons |= mask;
  return {
    up: b(12) || ay < -0.5,
    down: b(13) || ay > 0.5,
    left: b(14) || ax < -0.5,
    right: b(15) || ax > 0.5,
    buttons,
  };
}

/** 플레이어 번호(0/1)의 현재 입력. 키보드와 게임패드를 합친다. */
export function readPlayerInput(player: 0 | 1): RawInput {
  const m = KEYMAPS[player];
  let buttons = 0;
  if (held.has(m.LP)) buttons |= BTN.LP;
  if (held.has(m.HP)) buttons |= BTN.HP;
  if (held.has(m.LK)) buttons |= BTN.LK;
  if (held.has(m.HK)) buttons |= BTN.HK;
  const kb: RawInput = {
    up: held.has(m.up),
    down: held.has(m.down),
    left: held.has(m.left),
    right: held.has(m.right),
    buttons,
  };
  const pad = readGamepad(player);
  if (!pad) return kb;
  return {
    up: kb.up || pad.up,
    down: kb.down || pad.down,
    left: kb.left || pad.left,
    right: kb.right || pad.right,
    buttons: kb.buttons | pad.buttons,
  };
}

// ── 메뉴 조작 (키보드 + 게임패드, 새로 눌린 순간만) ─────────────────

export interface MenuEdges {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean; // 약P
  cancel: boolean; // 강P
}

const NO_EDGES: MenuEdges = { up: false, down: false, left: false, right: false, confirm: false, cancel: false };
const prevMenu: RawInput[] = [
  { up: false, down: false, left: false, right: false, buttons: 0 },
  { up: false, down: false, left: false, right: false, buttons: 0 },
];
const edges: [MenuEdges, MenuEdges] = [NO_EDGES, NO_EDGES];

/** 매 로직 프레임 시작 시 호출 */
export function pollMenu(): void {
  for (const p of [0, 1] as const) {
    const cur = readPlayerInput(p);
    const prev = prevMenu[p];
    const pressed = cur.buttons & ~prev.buttons;
    edges[p] = {
      up: cur.up && !prev.up,
      down: cur.down && !prev.down,
      left: cur.left && !prev.left,
      right: cur.right && !prev.right,
      confirm: (pressed & BTN.LP) !== 0,
      cancel: (pressed & BTN.HP) !== 0,
    };
    prevMenu[p] = cur;
  }
}

export function menu(player: 0 | 1): MenuEdges {
  return edges[player];
}
