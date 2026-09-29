// 실제 게임을 헤드리스 크롬으로 띄워 키 입력을 보내고 스크린샷을 찍는다.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
const k = page.keyboard;
const wait = (ms) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: `/tmp/shots/play_${n}.png` });
const tap = async (code, ms = 40) => { await k.down(code); await wait(ms); await k.up(code); };
const qcf = async (dir, btn) => {
  // ↓ → ↓+앞 → 앞 + 버튼
  await k.down(dir === 'p1' ? 'KeyS' : 'ArrowDown'); await wait(40);
  await k.down(dir === 'p1' ? 'KeyD' : 'ArrowLeft'); await wait(40);
  await k.up(dir === 'p1' ? 'KeyS' : 'ArrowDown'); await wait(30);
  await tap(btn);
  await k.up(dir === 'p1' ? 'KeyD' : 'ArrowLeft');
};

await page.goto('http://localhost:5173/');
await wait(300);
await shot('title');
await tap('Digit1');
await wait(300);
await tap('KeyD'); // P1 → KRUMPER
await tap('ArrowRight'); // P2 → LOCKER
await wait(300);
await shot('select');
await tap('KeyF');
await tap('KeyK');
await wait(200);
await shot('select_ready');
await wait(900);
await wait(1800); // 인트로
await qcf('p1', 'KeyF'); // 스톰프 웨이브
await wait(80);
await qcf('p2', 'KeyK'); // 엉클 샘 포인트
await wait(250);
await shot('projectiles');
await browser.close();
