// 갤러리 화면 스크린샷: node scripts/look.mjs "gallery=lineup" "gallery=closeup&char=krump&anim=sHP&f=11"  → shots/look_*.png
import { launch, BASE_URL } from './browser.mjs';
const { browser, page } = await launch();
for (const [q, name] of process.argv.slice(2).map((a) => [a, a.replace(/[^a-z0-9]+/gi, '_')])) {
  await page.goto(`${BASE_URL}/?${q}`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `shots/look_${name}.png` });
}
await browser.close();
