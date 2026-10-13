import type { Anim, Pose } from '../../anim/pose';
import type { CharacterDef, MoveDef } from '../../fighter/types';
import { CROUCH_HAND, FREEZE, STAND } from './poses';
import data from './studies.json';

/*
 * Codex 모션 연구(브레이킹)의 그림 시간표를 게임 동작에 붙인다.
 * studies.json 은 scripts/spritegen/import_bboy_studies.py 가 만든다: 동작마다 [프레임, 그림] 목록.
 * 그림이 그 프레임부터 다음 키까지 그대로 보인다 (hold). 타격 프레임·데미지는 각 기술 정의 그대로.
 * 코드 그림(스프라이트를 못 불러올 때)은 그림 종류에 맞는 대표 자세로 대신한다.
 */

type Study = { loop: number | null; keys: { f: number; kind: string; src: string }[] };
const STUDIES = data as Record<string, Study>;

const POSE: Record<string, Pose> = { stand: STAND, low: CROUCH_HAND, power: FREEZE };

function studyAnim(id: string, base: Anim): Anim {
  const s = STUDIES[id];
  if (!s) return base;
  return {
    ...base,
    hold: !s.loop,
    loop: s.loop ?? undefined,
    keys: s.keys.map((k) => ({ f: k.f, p: POSE[k.kind] ?? STAND })),
  };
}

/** 연구 시간표가 있는 기술의 동작을 바꾼다 */
export function withStudyMoves(moves: Record<string, MoveDef>): Record<string, MoveDef> {
  const out = { ...moves };
  for (const id of Object.keys(STUDIES)) if (out[id]) out[id] = { ...out[id], anim: studyAnim(id, out[id].anim) };
  return out;
}

/** 대기·걷기 등 기본 동작을 바꾼다 */
export function withStudyAnims(anims: CharacterDef['anims']): CharacterDef['anims'] {
  const out = { ...anims };
  for (const id of Object.keys(out) as (keyof CharacterDef['anims'])[]) out[id] = studyAnim(id, out[id]);
  return out;
}
