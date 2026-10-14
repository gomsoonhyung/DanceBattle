import type { Anim, Pose } from '../anim/pose';
import type { CharacterDef, MoveDef } from '../fighter/types';

/*
 * Codex 모션 연구 그림의 시간표를 게임 동작에 붙인다 (모든 캐릭터 공통).
 * 각 캐릭터의 studies.json 은 scripts/spritegen/import_studies.py (비보이는 import_bboy_studies.py) 가 만든다.
 * 그림이 그 프레임부터 다음 키까지 그대로 보인다 (hold). 타격 프레임·데미지는 각 기술 정의 그대로.
 * 코드 그림(스프라이트를 못 불러올 때)은 그림 종류에 맞는 대표 자세로 대신한다.
 */

export type StudyData = Record<string, { loop: number | null; keys: { f: number; kind: string; src: string }[] }>;

export function studyApplier(data: StudyData, poses: { stand: Pose; low?: Pose; power?: Pose }) {
  const pick = (kind: string) =>
    (kind === 'low' ? poses.low : kind === 'power' ? poses.power : undefined) ?? poses.stand;
  const anim = (id: string, base: Anim): Anim => {
    const s = data[id];
    if (!s) return base;
    return {
      ...base,
      hold: !s.loop,
      loop: s.loop ?? undefined,
      keys: s.keys.map((k) => ({ f: k.f, p: pick(k.kind) })),
    };
  };
  return {
    /** 연구 시간표가 있는 기술의 동작을 바꾼다 */
    moves(moves: Record<string, MoveDef>): Record<string, MoveDef> {
      const out = { ...moves };
      for (const id of Object.keys(data)) if (out[id]) out[id] = { ...out[id], anim: anim(id, out[id].anim) };
      return out;
    },
    /** 대기·걷기 등 기본 동작을 바꾼다 */
    anims(anims: CharacterDef['anims']): CharacterDef['anims'] {
      const out = { ...anims };
      for (const id of Object.keys(out) as (keyof CharacterDef['anims'])[]) out[id] = anim(id, out[id]);
      return out;
    },
  };
}

/** 캐릭터 정의 전체에 연구 그림 시간표를 붙인다 (수치 조정 tune 이 끝난 기술에) */
export function withStudies(
  def: CharacterDef,
  data: StudyData,
  poses: { stand: Pose; low?: Pose; power?: Pose },
): CharacterDef {
  const apply = studyApplier(data, poses);
  return { ...def, moves: apply.moves(def.moves), anims: apply.anims(def.anims) };
}
