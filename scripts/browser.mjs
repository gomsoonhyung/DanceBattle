// 스크린샷 스크립트 공용: 설치된 Chrome을 헤드리스로 띄운다.
// Chrome 위치가 다르면 환경변수 CHROME_PATH로 지정한다.
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

export const BASE_URL = process.env.GAME_URL ?? 'http://localhost:5173';

export async function launch() {
  const executablePath = CANDIDATES.find((p) => p && existsSync(p));
  if (!executablePath) {
    console.error('Chrome을 찾을 수 없습니다. CHROME_PATH 환경변수로 경로를 지정해 주세요.');
    process.exit(1);
  }
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  return { browser, page };
}
