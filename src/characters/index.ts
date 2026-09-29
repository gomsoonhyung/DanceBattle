import type { CharacterDef } from '../fighter/types';
import { BBOY } from './bboy';
import { HIPHOP_GIRL } from './girlshiphop';
import { HIPHOPPER } from './hiphop';
import { HOUSE_HEAD } from './house';
import { KRUMP } from './krump';
import { LOCKER } from './locking';
import { POPPER } from './popping';
import { WAACKER } from './waacking';

/** 캐릭터 선택 화면에 나오는 순서 */
export const CHARACTERS: CharacterDef[] = [WAACKER, KRUMP, HIPHOPPER, HIPHOP_GIRL, LOCKER, HOUSE_HEAD, POPPER, BBOY];

const MOTION_TEXT = { qcf: '↓↘→', qcb: '↓↙←', dp: '→↓↘' } as const;

/** 기술표: [기술 이름, 커맨드] */
export function commandList(c: CharacterDef): [string, string][] {
  const list: [string, string][] = c.specials.map((s) => [
    c.moves[s.move].name,
    `${MOTION_TEXT[s.motion]} + ${s.button}`,
  ]);
  list.push([`★ ${c.moves[c.super].name}`, '↓↘→↓↘→ + P  /  강P+강K']);
  return list;
}
