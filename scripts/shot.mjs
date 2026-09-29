// 동작 갤러리 스크린샷: node scripts/shot.mjs krump krump/stompWave bboy/windmill
// 인자 형식: <캐릭터id>[/<동작id>]  → /tmp/shots/<캐릭터>_<동작>.png
import { chromium } from 'playwright-core';
const names = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
for (const n of names) {
  const [char, move = ''] = n.split('/');
  await page.goto(`http://localhost:5173/?gallery=${move}&char=${char}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `/tmp/shots/${char}_${move || 'all'}.png` });
}
await browser.close();
