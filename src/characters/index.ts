import type { CharacterDef } from '../fighter/types';
import { BBOY } from './bboy';
import { KRUMP } from './krump';
import { LOCKER } from './locking';

/** 캐릭터 선택 화면에 나오는 순서 */
export const CHARACTERS: CharacterDef[] = [BBOY, KRUMP, LOCKER];

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
