// 키 포즈 참고 그림 내보내기 (개발 서버가 켜져 있어야 함)
//   node scripts/export-sprites.mjs krump            → krump의 모든 동작 (P1 색)
//   node scripts/export-sprites.mjs krump sHP idle   → 지정한 동작만
//   --p2 를 붙이면 P2 색도 함께
// 결과: sprites-ref/<캐릭터>/<동작>_<프레임>.png + manifest.json  (규격: docs/SPRITES.md)
import { mkdirSync, writeFileSync } from 'node:fs';
import { BASE_URL, launch } from './browser.mjs';

const args = process.argv.slice(2);
const withP2 = args.includes('--p2');
const [charId, ...only] = args.filter((a) => !a.startsWith('--'));
if (!charId) {
  console.error('사용법: node scripts/export-sprites.mjs <캐릭터id> [동작id...] [--p2]');
  process.exit(1);
}

const { browser, page } = await launch();
await page.goto(`${BASE_URL}/?gallery=export`);
await page.waitForFunction(() => window.__sprites);
const list = await page.evaluate((id) => window.__sprites.list(id), charId);
if (!list.length) {
  console.error(`캐릭터 '${charId}'를 찾을 수 없습니다.`);
  process.exit(1);
}

const dir = `sprites-ref/${charId}`;
mkdirSync(dir, { recursive: true });
const manifest = { frames: {} };
let count = 0;
for (const { anim, frames } of list) {
  if (only.length && !only.includes(anim)) continue;
  for (const f of frames) {
    const key = `${anim}_${f}`;
    const entry = { p1: `${key}.png` };
    for (const slot of withP2 ? [0, 1] : [0]) {
      const url = await page.evaluate(([c, a, fr, s]) => window.__sprites.render(c, a, fr, s), [charId, anim, f, slot]);
      const file = slot ? `${key}_p2.png` : `${key}.png`;
      writeFileSync(`${dir}/${file}`, Buffer.from(url.split(',')[1], 'base64'));
      if (slot) entry.p2 = file;
      count++;
    }
    manifest.frames[key] = entry;
  }
}
writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✅ ${count}장 저장: ${dir}/`);
await browser.close();
