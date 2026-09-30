import { GROUND_SCREEN_Y } from '../core/constants';
import type { CharacterDef } from '../fighter/types';

/*
 * 그림(스프라이트) 교체.
 * public/sprites/<캐릭터id>/manifest.json 에 적힌 프레임은 코드로 그린 캐릭터 대신 그 그림을 쓴다.
 * 그림 규격과 만드는 방법은 docs/SPRITES.md 참고.
 */

/** 스프라이트 한 장의 규격 (게임 좌표 단위). 발밑 기준점이 anchor 위치에 오도록 그린다 */
export const SPRITE = { width: 320, height: 320, anchorX: 160, anchorY: 290, scale: 2 } as const;

interface Manifest {
  /** 키 = "<동작id>_<프레임>", 값 = 파일 이름 (p2가 없으면 p1 그림에 P2 색 테두리 빛을 둘러 쓴다) */
  frames: Record<string, { p1: string; p2?: string }>;
}

type Loaded = Map<string, [HTMLImageElement, HTMLImageElement | null]>;
const sheets = new Map<string, Loaded>();

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 캐릭터들의 교체 그림을 불러온다. 없으면 조용히 넘어간다 (코드로 그린 캐릭터를 쓴다) */
export async function loadSprites(chars: CharacterDef[]): Promise<void> {
  await Promise.all(
    chars.map(async (c) => {
      if (sheets.has(c.id)) return;
      sheets.set(c.id, new Map());
      const base = `sprites/${c.id}/`;
      let manifest: Manifest;
      try {
        const res = await fetch(base + 'manifest.json');
        if (!res.ok) return;
        manifest = await res.json();
      } catch {
        return; // 파일이 없거나 JSON이 아님 (개발 서버는 없는 파일 대신 index.html을 줄 수 있다)
      }
      if (!manifest?.frames) return;
      const loaded: Loaded = new Map();
      await Promise.all(
        Object.entries(manifest.frames).map(async ([key, f]) => {
          const p1 = await loadImage(base + f.p1);
          const p2 = f.p2 ? await loadImage(base + f.p2) : null;
          if (p1) loaded.set(key, [p1, p2]);
        }),
      );
      sheets.set(c.id, loaded);
    }),
  );
}

/** 이 프레임을 대신할 그림이 있으면 반환. recolor = P2인데 전용 그림이 없어 P1 그림으로 대신함 */
export function spriteFor(
  charId: string,
  animId: string,
  frame: number,
  slot: 0 | 1,
): { img: HTMLImageElement; recolor: boolean } | null {
  const e = sheets.get(charId)?.get(`${animId}_${frame}`);
  if (!e) return null;
  if (slot === 1) return e[1] ? { img: e[1], recolor: false } : { img: e[0], recolor: true };
  return { img: e[0], recolor: false };
}

/**
 * 스프라이트를 캐릭터 위치(발밑)에 맞춰 그린다. 왼쪽을 보면 좌우 반전.
 * glow: P2 전용 그림이 없을 때 P1 그림에 두르는 구분용 테두리 빛 색
 * (색상 전체를 돌리면 피부색까지 바뀌어 어색하므로, 색은 그대로 두고 테두리로만 구분한다)
 */
export function drawSprite(
  g: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  facing: 1 | -1,
  glow: string | null,
): void {
  g.save();
  g.translate(x, GROUND_SCREEN_Y - y);
  g.scale(facing, 1);
  if (glow) g.filter = `drop-shadow(0 0 2px ${glow}) drop-shadow(0 0 4px ${glow})`;
  g.drawImage(img, -SPRITE.anchorX, -SPRITE.anchorY, SPRITE.width, SPRITE.height);
  g.restore();
}
