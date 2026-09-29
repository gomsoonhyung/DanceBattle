export type Button = 'LP' | 'HP' | 'LK' | 'HK';
export const BUTTONS: readonly Button[] = ['LP', 'HP', 'LK', 'HK'];

export const BTN: Record<Button, number> = { LP: 1, HP: 2, LK: 4, HK: 8 };
export const PUNCHES = BTN.LP | BTN.HP;
export const KICKS = BTN.LK | BTN.HK;

/** 장치에서 읽은 한 프레임의 원시 입력 (화면 기준 좌/우). */
export interface RawInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  buttons: number; // BTN 비트마스크
}

export const EMPTY_INPUT: RawInput = { up: false, down: false, left: false, right: false, buttons: 0 };

/**
 * 넘패드 표기 방향 (캐릭터가 바라보는 방향 기준).
 * 7 8 9
 * 4 5 6   (6 = 앞, 4 = 뒤)
 * 1 2 3
 */
export type Dir = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function toDir(raw: RawInput, facing: 1 | -1): Dir {
  let h = (raw.right ? 1 : 0) - (raw.left ? 1 : 0);
  const v = (raw.up ? 1 : 0) - (raw.down ? 1 : 0);
  h *= facing;
  return (5 + h + v * 3) as Dir;
}
