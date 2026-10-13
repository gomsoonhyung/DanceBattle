import { CHARACTERS } from '../characters';
import type { CharacterDef } from '../fighter/types';

/**
 * 시작·선택 화면에서 고를 수 있는 캐릭터.
 * 배포판마다 공개할 캐릭터를 고를 수 있다 (예: 시험 배포판은 B-BOY만).
 *   빌드 설정: .env.release 의 VITE_ROSTER=bboy
 *   개발 중 시험: 주소 뒤에 ?roster=bboy,krump
 * 비어 있거나 맞는 id가 없으면 전체 캐릭터.
 */
function pick(): CharacterDef[] {
  const fromUrl = new URLSearchParams(location.search).get('roster');
  const ids = (fromUrl ?? import.meta.env.VITE_ROSTER ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const list = ids.map((id) => CHARACTERS.find((c) => c.id === id)).filter((c): c is CharacterDef => !!c);
  return list.length ? list : CHARACTERS;
}

export const ROSTER: CharacterDef[] = pick();
