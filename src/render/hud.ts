import { MAX_METER, ROUNDS_TO_WIN, SCREEN_H, SCREEN_W } from '../core/constants';
import { DUMMY_LABEL, type Match } from '../game/match';
import { fighterPalette } from './stickman';

export const FONT_KR = '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
export const FONT_TITLE = '"Arial Black", Impact, sans-serif';

/** 체력바 뒤에서 천천히 따라오는 "최근 데미지" 표시용 */
const trail = [1, 1];

export function drawHud(g: CanvasRenderingContext2D, m: Match): void {
  const barW = 380;
  const barH = 22;
  const top = 26;

  for (const i of [0, 1] as const) {
    const ratio = m.healthRatio(i);
    trail[i] = ratio > trail[i] ? ratio : Math.max(ratio, trail[i] - 0.006);
    const left = i === 0;
    const x = left ? 30 : SCREEN_W - 30 - barW;
    g.fillStyle = '#1b1b24';
    g.fillRect(x - 3, top - 3, barW + 6, barH + 6);
    g.fillStyle = '#5a1020';
    g.fillRect(x, top, barW, barH);
    // 줄어드는 방향: P1은 가운데→왼쪽, P2는 가운데→오른쪽
    const drawFill = (r: number, color: string) => {
      const w = barW * r;
      g.fillStyle = color;
      g.fillRect(left ? x + barW - w : x, top, w, barH);
    };
    drawFill(trail[i], '#ff5f5f');
    drawFill(ratio, ratio > 0.3 ? '#ffd23f' : '#ff8c1a');

    g.font = `bold 16px ${FONT_TITLE}`;
    g.textAlign = left ? 'left' : 'right';
    const pal = fighterPalette(m.fighters[i]);
    g.fillStyle = pal.main;
    g.fillText(`P${i + 1}  ${m.fighters[i].def.name}`, left ? x : x + barW, top + barH + 20);

    // 라운드 승리 표시
    for (let w = 0; w < ROUNDS_TO_WIN; w++) {
      const cx = left ? x + barW - 12 - w * 22 : x + 12 + w * 22;
      g.beginPath();
      g.arc(cx, top + barH + 14, 7, 0, Math.PI * 2);
      g.fillStyle = m.wins[i] > w ? '#ffd23f' : '#333';
      g.fill();
    }

    // 그루브 게이지
    const mw = 260;
    const mh = 14;
    const my = SCREEN_H - 30;
    const mx = left ? 30 : SCREEN_W - 30 - mw;
    const meter = m.fighters[i].meter / MAX_METER;
    const full = meter >= 1;
    g.fillStyle = '#1b1b24';
    g.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
    const pulse = full ? 0.6 + 0.4 * Math.sin(m.phaseFrame * 0.3) : 1;
    g.fillStyle = full ? `rgba(124,255,178,${pulse})` : '#2bd2ff';
    g.fillRect(left ? mx : mx + mw * (1 - meter), my, mw * meter, mh);
    g.font = `bold 13px ${FONT_TITLE}`;
    g.fillStyle = full ? '#7cffb2' : '#9ab';
    g.textAlign = left ? 'left' : 'right';
    g.fillText(full ? 'GROOVE MAX!' : 'GROOVE', left ? mx : mx + mw, my - 6);

    // 콤보 카운터
    const c = m.combo[i];
    if (c.timer > 0 && c.hits >= 2) {
      g.globalAlpha = Math.min(1, c.timer / 20);
      g.textAlign = left ? 'left' : 'right';
      const cx = left ? 30 : SCREEN_W - 30;
      g.font = `900 40px ${FONT_TITLE}`;
      g.lineWidth = 6;
      g.strokeStyle = '#000';
      g.strokeText(`${c.hits} HITS`, cx, 150);
      g.fillStyle = pal.cap;
      g.fillText(`${c.hits} HITS`, cx, 150);
      g.font = `bold 16px ${FONT_TITLE}`;
      g.fillStyle = '#fff';
      g.fillText(`${c.damage} DMG`, cx, 172);
      g.globalAlpha = 1;
    }
  }

  // 타이머
  g.textAlign = 'center';
  g.font = `900 38px ${FONT_TITLE}`;
  g.fillStyle = '#fff';
  const timer = m.mode === 'training' ? '∞' : String(m.timerSeconds);
  g.fillText(timer, SCREEN_W / 2, top + 30);

  if (m.mode === 'training') {
    g.font = `bold 15px ${FONT_KR}`;
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillText(`트레이닝 · 더미: ${DUMMY_LABEL[m.dummyMode]}  [F2 변경]  [R 위치 초기화]  [F1 판정 보기]  [ESC 메뉴]`, SCREEN_W / 2, 100);
  }

  drawBanner(g, m);
}

function bigText(g: CanvasRenderingContext2D, text: string, color: string, size = 90, y = SCREEN_H / 2 - 20): void {
  g.textAlign = 'center';
  g.font = `900 ${size}px ${FONT_TITLE}`;
  g.lineJoin = 'round';
  g.lineWidth = 12;
  g.strokeStyle = '#000';
  g.strokeText(text, SCREEN_W / 2, y);
  g.fillStyle = color;
  g.fillText(text, SCREEN_W / 2, y);
}

function drawBanner(g: CanvasRenderingContext2D, m: Match): void {
  const f = m.phaseFrame;
  switch (m.phase) {
    case 'intro':
      if (f < 55) bigText(g, `ROUND ${m.round}`, '#fff');
      else bigText(g, 'FIGHT!', '#ffd23f', 110);
      break;
    case 'ko': {
      const koed = m.fighters.some((x) => x.health <= 0);
      if (f < 90) bigText(g, koed ? 'K.O.' : 'TIME OVER', '#ff4d5e', koed ? 130 : 90);
      else bigText(g, m.winner === null ? 'DRAW' : `P${m.winner + 1} WIN`, m.winner === null ? '#fff' : fighterPalette(m.fighters[m.winner]).main);
      break;
    }
    case 'roundEnd':
      break;
    case 'matchEnd': {
      const w = m.matchWinner ?? 0;
      bigText(g, `P${w + 1} WINS!`, fighterPalette(m.fighters[w]).main, 100);
      g.font = `bold 20px ${FONT_KR}`;
      g.fillStyle = '#fff';
      g.fillText('약P: 재대결   ·   강P: 캐릭터 선택   ·   ESC: 메뉴', SCREEN_W / 2, SCREEN_H / 2 + 50);
      break;
    }
    default:
      break;
  }
}
