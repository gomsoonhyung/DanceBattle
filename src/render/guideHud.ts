import { SCREEN_W } from '../core/constants';
import type { Match } from '../game/match';
import { BTN, type Dir } from '../input/types';
import type { GuideEntry, TrainingGuide } from '../training/guide';
import { FONT_KR, FONT_TITLE } from './hud';

/** 캐릭터가 보는 방향 기준 화살표 (→ = 상대 쪽) */
const ARROW: Record<Dir, string> = { 1: '↙', 2: '↓', 3: '↘', 4: '←', 5: '·', 6: '→', 7: '↖', 8: '↑', 9: '↗' };

const TOP = 108;
const LIST_W = 330;
const ROW_H = 21;

function panel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.fillStyle = 'rgba(10,8,24,0.88)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.15)';
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function tokens(e: GuideEntry): string[] {
  return [...e.dirs.map((d) => ARROW[d]), e.button];
}

/** 연습 모드 기술 가이드: 기술 목록 · 선택한 기술의 커맨드 · 입력 기록 */
export function drawGuide(g: CanvasRenderingContext2D, guide: TrainingGuide, m: Match): void {
  drawInputHistory(g, m);
  if (!guide.visible) return;

  // ── 기술 목록 ──
  const n = guide.entries.length;
  // 목록과 상세 패널을 같은 높이로 (상세 패널에 필요한 최소 높이 168)
  const listH = Math.max(28 + n * ROW_H + 6, 168);
  panel(g, 12, TOP, LIST_W, listH);
  g.textAlign = 'left';
  g.font = `bold 13px ${FONT_KR}`;
  g.fillStyle = '#ffd23f';
  g.fillText(`기술 가이드 · ${guide.char.name}`, 22, TOP + 19);
  g.fillStyle = '#889';
  g.font = `11px ${FONT_KR}`;
  g.textAlign = 'right';
  g.fillText('숫자키로 선택', 12 + LIST_W - 10, TOP + 19);

  guide.entries.forEach((e, i) => {
    const y = TOP + 28 + i * ROW_H;
    const sel = i === guide.selected;
    if (sel) {
      g.fillStyle = 'rgba(255,210,63,0.18)';
      g.fillRect(14, y, LIST_W - 4, ROW_H - 2);
    }
    g.textAlign = 'left';
    g.font = `bold 12px ${FONT_TITLE}`;
    g.fillStyle = sel ? '#ffd23f' : '#aab';
    g.fillText(String(i + 1), 22, y + 15);
    g.font = `${sel ? 'bold ' : ''}13px ${FONT_KR}`;
    g.fillStyle = e.isSuper ? '#7cffb2' : '#fff';
    g.fillText((e.isSuper ? '★ ' : '') + e.move.name, 40, y + 15);
    g.fillStyle = '#9ab';
    g.font = `12px ${FONT_KR}`;
    g.fillText(tokens(e).join(' '), 180, y + 15);
    if (e.successes > 0) {
      g.textAlign = 'right';
      g.fillStyle = '#7cffb2';
      g.fillText(`✔ ${e.successes}`, 12 + LIST_W - 10, y + 15);
    }
  });

  // ── 선택한 기술 상세 ──
  const e = guide.current;
  const dx = 12 + LIST_W + 10;
  const dw = 340;
  panel(g, dx, TOP, dw, listH);
  g.textAlign = 'left';
  g.font = `bold 16px ${FONT_KR}`;
  g.fillStyle = e.isSuper ? '#7cffb2' : '#fff';
  g.fillText((e.isSuper ? '★ ' : '') + e.move.name, dx + 12, TOP + 24);

  // 커맨드 칸: 시범 중에는 지금 입력 중인 칸에 불이 들어온다
  const tk = tokens(e);
  const size = e.isSuper ? 32 : 40;
  const gap = 6;
  tk.forEach((t, k) => {
    const x = dx + 12 + k * (size + gap);
    const y = TOP + 36;
    const lit = guide.demoActive && guide.demoStep === k;
    const done = guide.demoActive && guide.demoStep > k;
    g.fillStyle = lit ? '#ffd23f' : done ? 'rgba(255,210,63,0.35)' : 'rgba(255,255,255,0.1)';
    g.fillRect(x, y, size, size);
    g.strokeStyle = lit ? '#fff' : 'rgba(255,255,255,0.3)';
    g.lineWidth = 2;
    g.strokeRect(x, y, size, size);
    g.textAlign = 'center';
    g.fillStyle = lit ? '#111' : '#fff';
    g.font = `900 ${k === tk.length - 1 ? size * 0.5 : size * 0.62}px ${FONT_TITLE}`;
    g.fillText(t, x + size / 2, y + size * 0.72);
  });

  g.textAlign = 'left';
  g.font = `12px ${FONT_KR}`;
  g.fillStyle = '#dde';
  const desc = e.move.desc ?? '';
  wrap(g, desc, dw - 24)
    .slice(0, 2)
    .forEach((l, i) => g.fillText(l, dx + 12, TOP + 98 + i * 16));

  g.fillStyle = '#889';
  g.font = `11px ${FONT_KR}`;
  const legend = e.isSuper
    ? 'P = 펀치 (F·G)  ·  게이지 MAX 필요  ·  강P+강K 동시로도 발동'
    : 'P = 펀치 (F·G)   K = 킥 (V·B)';
  g.fillText(legend, dx + 12, TOP + listH - 26);
  g.fillText('→ = 상대 쪽 방향   ·   Space: 시범 보기   ·   Tab: 가이드 숨기기', dx + 12, TOP + listH - 10);

  if (guide.demoActive) {
    const pulse = 0.6 + 0.4 * Math.sin(m.phaseFrame * 0.25);
    g.globalAlpha = pulse;
    g.textAlign = 'right';
    g.font = `900 13px ${FONT_KR}`;
    g.fillStyle = '#ffd23f';
    g.fillText('▶ 시범 중', dx + dw - 10, TOP + 22);
    g.globalAlpha = 1;
  }

  // 성공 표시
  if (guide.successFlash > 0 && guide.lastSuccess) {
    g.globalAlpha = Math.min(1, guide.successFlash / 20);
    g.textAlign = 'center';
    g.font = `900 34px ${FONT_TITLE}`;
    g.lineWidth = 7;
    g.lineJoin = 'round';
    g.strokeStyle = '#000';
    const cx = SCREEN_W / 2;
    const cy = TOP + listH + 42;
    g.strokeText('SUCCESS!', cx, cy);
    g.fillStyle = '#7cffb2';
    g.fillText('SUCCESS!', cx, cy);
    g.font = `bold 15px ${FONT_KR}`;
    g.lineWidth = 4;
    g.strokeText(guide.lastSuccess.move.name, cx, cy + 22);
    g.fillStyle = '#fff';
    g.fillText(guide.lastSuccess.move.name, cx, cy + 22);
    g.globalAlpha = 1;
  }
}

/** 오른쪽 끝: P1의 최근 입력 기록 (최신이 위) */
function drawInputHistory(g: CanvasRenderingContext2D, m: Match): void {
  const rows = m.fighters[0].input.recent(14);
  const x = SCREEN_W - 70;
  const w = 58;
  panel(g, x, TOP, w, 24 + rows.length * 18);
  g.textAlign = 'center';
  g.font = `bold 11px ${FONT_KR}`;
  g.fillStyle = '#ffd23f';
  g.fillText('입력', x + w / 2, TOP + 16);
  rows.forEach((r, i) => {
    const y = TOP + 36 + i * 18;
    g.globalAlpha = 1 - i / 18;
    g.textAlign = 'left';
    g.font = `900 14px ${FONT_TITLE}`;
    g.fillStyle = r.dir === 5 ? '#667' : '#fff';
    g.fillText(ARROW[r.dir], x + 6, y);
    const b: string[] = [];
    if (r.held & BTN.LP) b.push('P');
    if (r.held & BTN.HP) b.push('P!');
    if (r.held & BTN.LK) b.push('K');
    if (r.held & BTN.HK) b.push('K!');
    g.font = `bold 10px ${FONT_TITLE}`;
    g.fillStyle = '#ffd23f';
    g.fillText(b.join(''), x + 22, y);
  });
  g.globalAlpha = 1;
}

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}
