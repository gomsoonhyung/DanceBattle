import { displayFrames, evalAnim, type Anim } from '../anim/pose';
import { CHARACTERS } from '../characters';
import { GROUND_SCREEN_Y } from '../core/constants';
import { drawDancer } from '../render/dancer';
import { SPRITE } from '../render/sprites';

/*
 * ?gallery=export 페이지. scripts/export-sprites.mjs 가 이 페이지를 열어
 * window.__sprites 로 키 포즈 그림을 한 장씩 받아 PNG로 저장한다.
 */

interface ExportApi {
  /** 캐릭터의 모든 동작과 그릴 프레임 목록 */
  list(charId: string): { anim: string; frames: number[] }[];
  /** 한 프레임을 스프라이트 규격 PNG(data URL)로 */
  render(charId: string, animId: string, frame: number, slot: 0 | 1): string;
}

function animsOf(charId: string): [string, Anim, number][] {
  const c = CHARACTERS.find((x) => x.id === charId);
  if (!c) return [];
  return [
    ...Object.entries(c.anims).map(([k, a]): [string, Anim, number] => [
      k,
      a,
      a.loop ?? a.keys[a.keys.length - 1].f + 1,
    ]),
    ...Object.values(c.moves).map((m): [string, Anim, number] => [m.id, m.anim, m.total]),
  ];
}

export function installExportApi(): void {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE.width * SPRITE.scale;
  canvas.height = SPRITE.height * SPRITE.scale;
  const g = canvas.getContext('2d')!;

  const api: ExportApi = {
    list: (charId) => animsOf(charId).map(([anim, a, len]) => ({ anim, frames: displayFrames(a, len) })),
    render: (charId, animId, frame, slot) => {
      const c = CHARACTERS.find((x) => x.id === charId)!;
      const a = animsOf(charId).find(([id]) => id === animId)![1];
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(SPRITE.scale, 0, 0, SPRITE.scale, 0, 0);
      // 발밑이 기준점(anchor)에 오도록: 화면 y = GROUND_SCREEN_Y - 월드 y
      drawDancer(
        g,
        evalAnim(a, frame),
        SPRITE.anchorX,
        GROUND_SCREEN_Y - SPRITE.anchorY,
        1,
        c.look,
        c.look.palettes[slot],
        { airborne: a.snap === false },
      );
      return canvas.toDataURL('image/png');
    },
  };
  (window as unknown as { __sprites: ExportApi }).__sprites = api;
}
