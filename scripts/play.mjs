// 실제 게임을 헤드리스 크롬으로 띄워 키 입력을 보내고 스크린샷을 찍는다.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
const k = page.keyboard;
const wait = (ms) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: `/tmp/shots/play_${n}.png` });
const tap = async (code, ms = 40) => { await k.down(code); await wait(ms); await k.up(code); };

await page.goto('http://localhost:5173/');
await wait(400);
await shot('title');
await tap('Digit1');
await wait(600);
await shot('intro');
await wait(1300);
// P1 앞으로 걸어가기
await k.down('KeyD'); await wait(900); await k.up('KeyD');
// 윈드밀 ↓↘→ + 약P
await k.down('KeyS'); await wait(40); await k.down('KeyD'); await wait(40); await k.up('KeyS'); await wait(40);
await tap('KeyF');
await k.up('KeyD');
await wait(350);
await shot('windmill');
await wait(1200);
// P2 헤드스핀 →↓↘ + 약P (P2는 왼쪽을 보므로 앞 = ArrowLeft)
await k.down('ArrowLeft'); await wait(40); await k.up('ArrowLeft'); await k.down('ArrowDown'); await wait(40);
await k.down('ArrowLeft'); await wait(30); await tap('KeyK'); await k.up('ArrowDown'); await k.up('ArrowLeft');
await wait(250);
await shot('headspin');
await browser.close();
