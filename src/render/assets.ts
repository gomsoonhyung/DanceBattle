/*
 * 무대·UI·이펙트 그림 불러오기.
 * image()는 처음 부르면 불러오기를 시작하고, 다 불러오기 전에는 null을 돌려준다.
 * 부르는 쪽은 null이면 코드로 그린 대체 그림을 쓴다.
 */

const cache = new Map<string, HTMLImageElement | null>();

export function image(path: string): HTMLImageElement | null {
  if (cache.has(path)) return cache.get(path)!;
  cache.set(path, null);
  const img = new Image();
  img.onload = () => cache.set(path, img);
  img.src = path;
  return null;
}

/** 여러 장이 모두 준비됐을 때만 배열로 (애니메이션 이펙트용) */
export function images(paths: string[]): HTMLImageElement[] | null {
  const list = paths.map(image);
  return list.every((x) => x) ? (list as HTMLImageElement[]) : null;
}

export const ASSET = {
  stage: 'assets/stage/alley/bg.webp',
  logo: 'assets/ui/logo.webp',
  portrait: (id: string) => `assets/ui/portrait/${id}.png`,
  fx: (kind: FxKind, i: number) => `assets/fx/${kind}_${i}.png`,
} as const;

export type FxKind = 'hit_light' | 'hit_heavy' | 'block' | 'counter';
export const FX_FRAMES = 6;

/** 게임 시작 때 미리 불러 둔다 (처음 쓰는 순간 대체 그림이 보이지 않도록) */
export function preloadAssets(characterIds: string[]): void {
  image(ASSET.stage);
  image(ASSET.logo);
  for (const id of characterIds) image(ASSET.portrait(id));
  for (const k of ['hit_light', 'hit_heavy', 'block', 'counter'] as FxKind[]) {
    for (let i = 0; i < FX_FRAMES; i++) image(ASSET.fx(k, i));
  }
}
