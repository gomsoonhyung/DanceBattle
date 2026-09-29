// 동작 갤러리 스크린샷: node scripts/shot.mjs krump krump/stompWave bboy/windmill
// 인자 형식: <캐릭터id>[/<동작id>]  → shots/<캐릭터>_<동작>.png
import { mkdirSync } from 'node:fs';
import { BASE_URL, launch } from './browser.mjs';
const names = process.argv.slice(2);
mkdirSync('shots', { recursive: true });
const { browser, page } = await launch();
for (const n of names) {
  const [char, move = ''] = n.split('/');
  await page.goto(`${BASE_URL}/?gallery=${move}&char=${char}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/${char}_${move || 'all'}.png` });
}
await browser.close();
