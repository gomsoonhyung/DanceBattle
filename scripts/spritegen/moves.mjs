import { mkdirSync, writeFileSync } from 'node:fs';
import { BASE_URL, launch } from '../browser.mjs';
const { browser, page } = await launch();
await page.goto(`${BASE_URL}/?gallery=export`);
await page.waitForFunction(() => window.__sprites);
const data = await page.evaluate(async () => {
  const m = await import('/src/characters/index.ts');
  const out = {};
  for (const c of m.CHARACTERS) {
    const moves = {};
    for (const [id, mv] of Object.entries(c.moves ?? {})) {
      const { anim, ...rest } = mv;
      moves[id] = JSON.parse(JSON.stringify(rest, (k, v) => (typeof v === 'function' ? undefined : v)));
      moves[id].animLen = anim?.length ?? anim?.duration ?? null;
    }
    out[c.id] = { name: c.name, genre: c.genre ?? c.profile?.genre ?? null, moves, keys: Object.keys(c) };
  }
  return out;
});
mkdirSync('sprites-work/batch', { recursive: true });
writeFileSync('sprites-work/batch/moves.json', JSON.stringify(data, null, 1));
await browser.close();
