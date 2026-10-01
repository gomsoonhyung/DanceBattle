import { displayFrame } from '../anim/pose';
import { CHARACTERS } from '../characters';
import { SCREEN_H, SCREEN_W } from '../core/constants';
import type { MatchMode } from '../game/match';
import { keyPressed, menu } from '../input/devices';
import { ASSET, image } from '../render/assets';
import { FONT_KR, FONT_TITLE } from '../render/hud';
import { loadSprites, SPRITE, spriteFor } from '../render/sprites';
import { drawStage } from '../render/stage';

type Page = 'press' | 'menu' | 'controls';

const MENU: { id: MatchMode | 'controls'; label: string }[] = [
  { id: 'versus', label: '2P 대전' },
  { id: 'training', label: '트레이닝 (혼자 연습)' },
  { id: 'controls', label: '조작법' },
];

/** 비트 간격 (프레임): 120BPM */
const BEAT = 30;

/**
 * 시작 화면: 조명이 훑는 무대 + 튀어 들어오는 로고 + 8명이 줄지어 춤추는 라인업.
 * PRESS START → 메뉴 → (조작법)
 */
export class TitleScreen {
  private page: Page = 'press';
  private index = 0;
  private frame = 0;
  private pageFrame = 0;

  constructor(skipPress = false) {
    void loadSprites(CHARACTERS, ['idle']);
    if (skipPress) this.page = 'menu';
  }

  /** 선택한 모드를 돌려준다 (아직 고르는 중이면 null) */
  update(): MatchMode | null {
    this.frame++;
    this.pageFrame++;
    const m = [menu(0), menu(1)];
    const confirm = m.some((x) => x.confirm) || keyPressed('Enter') || keyPressed('Space');
    const back = m.some((x) => x.cancel) || keyPressed('Escape');

    switch (this.page) {
      case 'press':
        if (confirm || this.anyKey()) this.go('menu');
        return null;
      case 'menu': {
        if (m.some((x) => x.up)) this.index = (this.index + MENU.length - 1) % MENU.length;
        if (m.some((x) => x.down)) this.index = (this.index + 1) % MENU.length;
        for (let i = 0; i < MENU.length; i++) if (keyPressed(`Digit${i + 1}`)) return this.choose(i);
        if (confirm) return this.choose(this.index);
        if (back) this.go('press');
        return null;
      }
      case 'controls':
        if (confirm || back) this.go('menu');
        return null;
    }
  }

  private anyKey(): boolean {
    return ['KeyF', 'KeyG', 'KeyV', 'KeyB', 'KeyK', 'KeyL'].some((k) => keyPressed(k));
  }

  private choose(i: number): MatchMode | null {
    this.index = i;
    const id = MENU[i].id;
    if (id === 'controls') {
      this.go('controls');
      return null;
    }
    return id;
  }

  private go(p: Page): void {
    this.page = p;
    this.pageFrame = 0;
  }

  draw(g: CanvasRenderingContext2D): void {
    drawStage(g);
    g.fillStyle = 'rgba(8,4,20,0.72)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    this.drawSpotlights(g);
    if (this.page === 'controls') {
      this.drawControls(g);
      return;
    }
    this.drawLineup(g);
    this.drawLogo(g);
    if (this.page === 'press') this.drawPress(g);
    else this.drawMenu(g);
  }

  /** 무대 조명 두 줄기가 좌우로 훑는다 */
  private drawSpotlights(g: CanvasRenderingContext2D): void {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const beams: [number, string][] = [
      [0, 'rgba(255,80,200,0.16)'],
      [Math.PI, 'rgba(80,200,255,0.16)'],
    ];
    for (const [phase, color] of beams) {
      const sway = Math.sin(this.frame * 0.02 + phase) * 0.45;
      const top = { x: SCREEN_W / 2 + Math.sin(phase) * 300, y: -40 };
      const len = SCREEN_H + 120;
      const a = Math.PI / 2 + sway;
      const spread = 0.16;
      const grad = g.createLinearGradient(top.x, top.y, top.x + Math.cos(a) * len, top.y + Math.sin(a) * len);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(top.x, top.y);
      g.lineTo(top.x + Math.cos(a - spread) * len, top.y + Math.sin(a - spread) * len);
      g.lineTo(top.x + Math.cos(a + spread) * len, top.y + Math.sin(a + spread) * len);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  /** 로고: 처음에 튀어 들어오고, 그 뒤로는 비트마다 살짝 커졌다 작아진다 */
  private drawLogo(g: CanvasRenderingContext2D): void {
    const t = Math.min(1, this.frame / 24);
    const pop = t < 1 ? 0.4 + 0.6 * easeOutBack(t) : 1;
    const beat = 1 + 0.035 * Math.max(0, 1 - (this.frame % BEAT) / 8);
    const s = pop * beat;
    const logo = image(ASSET.logo);
    g.save();
    g.translate(SCREEN_W / 2, 118);
    g.scale(s, s);
    if (logo) {
      const w = 600;
      const h = (w * logo.height) / logo.width;
      g.drawImage(logo, -w / 2, -h / 2, w, h);
    } else {
      g.textAlign = 'center';
      g.font = `900 76px ${FONT_TITLE}`;
      g.lineWidth = 12;
      g.lineJoin = 'round';
      g.strokeStyle = '#000';
      g.strokeText('DANCE BATTLE', 0, 26);
      g.fillStyle = '#ffd23f';
      g.fillText('DANCE BATTLE', 0, 26);
    }
    g.restore();
  }

  /** 8명이 한 줄로 서서 대기 춤을 춘다 (교체 그림이 없으면 건너뜀) */
  private drawLineup(g: CanvasRenderingContext2D): void {
    const floor = SCREEN_H - 18;
    const scale = 0.62;
    const step = SCREEN_W / CHARACTERS.length;
    CHARACTERS.forEach((c, i) => {
      // 한 명씩 시간차를 두고 무대로 들어온다
      const enter = Math.min(1, Math.max(0, (this.frame - 10 - i * 4) / 16));
      if (enter <= 0) return;
      const x = step * (i + 0.5);
      const f = displayFrame(c.anims.idle, this.frame + i * 7);
      const sp = spriteFor(c.id, 'idle', f, 0);
      g.save();
      g.globalAlpha = enter;
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.beginPath();
      g.ellipse(x, floor + 2, 34, 6, 0, 0, Math.PI * 2);
      g.fill();
      if (sp) {
        const w = SPRITE.width * scale;
        const h = SPRITE.height * scale;
        const lift = (1 - enter) * 30;
        // 화면 가운데를 향해 선다
        const facing = x < SCREEN_W / 2 ? 1 : -1;
        g.translate(x, floor + lift);
        g.scale(facing, 1);
        g.drawImage(sp.img, -SPRITE.anchorX * scale, -SPRITE.anchorY * scale, w, h);
      }
      g.restore();
    });
  }

  private drawPress(g: CanvasRenderingContext2D): void {
    if (Math.floor(this.frame / 24) % 2) return;
    g.textAlign = 'center';
    g.font = `900 30px ${FONT_TITLE}`;
    g.lineWidth = 8;
    g.lineJoin = 'round';
    g.strokeStyle = '#000';
    g.strokeText('PRESS START', SCREEN_W / 2, 262);
    g.fillStyle = '#fff';
    g.fillText('PRESS START', SCREEN_W / 2, 262);
    g.font = `14px ${FONT_KR}`;
    g.fillStyle = '#ccd';
    g.fillText('Enter · Space · 약P', SCREEN_W / 2, 286);
  }

  private drawMenu(g: CanvasRenderingContext2D): void {
    g.textAlign = 'center';
    MENU.forEach((item, i) => {
      const sel = i === this.index;
      const y = 226 + i * 40;
      if (sel) {
        g.fillStyle = 'rgba(255,210,63,0.18)';
        g.fillRect(SCREEN_W / 2 - 170, y - 26, 340, 36);
      }
      g.font = `bold ${sel ? 26 : 22}px ${FONT_KR}`;
      g.fillStyle = sel ? '#fff' : '#99a';
      g.fillText(`${sel ? '▶ ' : ''}${item.label}`, SCREEN_W / 2, y);
    });
    g.font = `13px ${FONT_KR}`;
    g.fillStyle = '#aab';
    g.fillText('↑↓ 고르기 · 약P 결정 · 강P 뒤로', SCREEN_W / 2, 226 + MENU.length * 40);
  }

  private drawControls(g: CanvasRenderingContext2D): void {
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(40, 24, SCREEN_W - 80, SCREEN_H - 48);
    g.textAlign = 'center';
    g.font = `900 30px ${FONT_TITLE}`;
    g.fillStyle = '#ffd23f';
    g.fillText('조작법', SCREEN_W / 2, 64);

    const col = (x: number, title: string, lines: string[]) => {
      g.textAlign = 'left';
      g.font = `bold 17px ${FONT_KR}`;
      g.fillStyle = '#7cffb2';
      g.fillText(title, x, 104);
      g.font = `14px ${FONT_KR}`;
      g.fillStyle = '#eef';
      lines.forEach((l, i) => g.fillText(l, x, 130 + i * 22));
    };
    col(70, '키 배치', [
      'P1  이동 W A S D',
      '      약P F · 강P G · 약K V · 강K B',
      'P2  이동 방향키',
      '      약P K · 강P L · 약K , · 강K .',
      '게임패드  X 약P · Y 강P · A 약K · B 강K',
      '',
      '방향 표기 (오른쪽을 볼 때)',
      '   7 8 9      ↖ ↑ ↗',
      '   4 5 6  =  ← · →',
      '   1 2 3      ↙ ↓ ↘',
      '예) 236P = ↓↘→ + P',
    ]);
    col(500, '기본 기술', [
      '대시 / 백대시      → → / ← ←',
      '가드              뒤로 (서서) · 뒤아래 (앉아서)',
      '하단은 앉아서, 중단(점프 공격 등)은 서서 막는다',
      '잡기              붙어서 약P + 약K (가드 불가)',
      '잡기 풀기         잡히는 순간 약P + 약K',
      '빠른 기상         넘어진 순간 아무 버튼',
      '',
      '콤보: 약 → 약 → 필살기 / 강공격 → 필살기',
      '초필살기: 게이지 MAX에서 236236P 또는 강P+강K',
      '캐릭터별 기술표: 캐릭터 선택 화면 · 트레이닝',
      'F1 판정 박스 · ESC 메뉴',
    ]);
    g.textAlign = 'center';
    g.font = `14px ${FONT_KR}`;
    g.fillStyle = '#aab';
    g.fillText('약P · 강P · ESC 돌아가기', SCREEN_W / 2, SCREEN_H - 40);
  }
}

function easeOutBack(t: number): number {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
