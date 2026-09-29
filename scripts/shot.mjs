import { chromium } from 'playwright-core';
const names = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
for (const n of names) {
  await page.goto(`http://localhost:5173/?gallery=${n}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `/tmp/shots/${n || 'all'}.png` });
}
await browser.close();
