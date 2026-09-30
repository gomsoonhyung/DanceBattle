import { displayFrame, evalAnim } from '../anim/pose';
import { sfx } from '../audio/sfx';
import { CHARACTERS, commandList } from '../characters';
import { GROUND_SCREEN_Y, SCREEN_H, SCREEN_W } from '../core/constants';
import type { CharacterDef } from '../fighter/types';
import type { MatchMode } from '../game/match';
import { keyPressed, menu } from '../input/devices';
import { FONT_KR, FONT_TITLE } from '../render/hud';
import { drawStage } from '../render/stage';
import { ASSET, image } from '../render/assets';
import { drawDancer } from '../render/dancer';
import { drawSprite, loadSprites, spriteFor } from '../render/sprites';

const SLOT_COLORS = ['#ff4d5e', '#4da3ff'];
const CARD_W = 108;
const CARD_H = 170;
const CARD_GAP = 6;
const CARD_TOP = 78;
const READY_DELAY = 45;

export type SelectResult = 'back' | [CharacterDef, CharacterDef] | null;

/**
 * 캐릭터 선택 화면.
 * 대전: P1/P2가 각자 고른다. 트레이닝: P1이 자기 캐릭터와 연습 상대를 차례로 고른다.
 */
export class SelectScreen {
  private cursor: [number, number];
  private ready: [boolean, boolean] = [false, false];
  private frame = 0;
  private readyTimer = 0;

  constructor(
    readonly mode: MatchMode,
    initial?: [CharacterDef, CharacterDef],
  ) {
    const idx = (c: CharacterDef) => Math.max(0, CHARACTERS.indexOf(c));
    this.cursor = initial ? [idx(initial[0]), idx(initial[1])] : [0, 1 % CHARACTERS.length];
    // 미리보기용: 대기·승리 그림만 불러 둔다 (전체 그림은 대전을 시작할 때)
    void loadSprites(CHARACTERS, ['idle', 'win']);
  }

  update(): SelectResult {
    this.frame++;
    if (keyPressed('Escape')) return 'back';

    if (this.ready[0] && this.ready[1]) {
      // 둘 다 결정한 뒤 잠깐은 취소할 수 있다
      if (this.mode === 'versus') {
        for (const p of [0, 1] as const) if (menu(p).cancel) this.unready(p);
      } else if (menu(0).cancel) {
        this.unready(1);
      }
      if (this.ready[0] && this.ready[1] && ++this.readyTimer >= READY_DELAY) {
        return [CHARACTERS[this.cursor[0]], CHARACTERS[this.cursor[1]]];
      }
      return null;
    }

    if (this.mode === 'versus') {
      this.control(0, 0);
      this.control(1, 1);
    } else {
      const slot = this.ready[0] ? 1 : 0;
      this.control(0, slot);
      // 트레이닝: 상대 선택 중에 취소하면 내 캐릭터 선택으로 돌아간다
      if (slot === 1 && menu(0).cancel) this.unready(0);
    }
    return null;
  }

  private unready(slot: 0 | 1): void {
    this.ready[slot] = false;
    this.readyTimer = 0;
  }

  /** player의 입력으로 slot의 커서를 움직인다 */
  private control(player: 0 | 1, slot: 0 | 1): void {
    const m = menu(player);
    const confirmKey = player === 0 && (keyPressed('Enter') || keyPressed('Space'));
    if (this.ready[slot]) {
      if (m.cancel) this.unready(slot);
      return;
    }
    const n = CHARACTERS.length;
    if (m.left) this.cursor[slot] = (this.cursor[slot] + n - 1) % n;
    if (m.right) this.cursor[slot] = (this.cursor[slot] + 1) % n;
    if (m.confirm || confirmKey) {
      this.ready[slot] = true;
      sfx.announce();
    }
  }

  // ── 그리기 ──────────────────────────────────────────────────────

  draw(g: CanvasRenderingContext2D): void {
    drawStage(g);
    g.fillStyle = 'rgba(8,6,18,0.78)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);

    g.textAlign = 'center';
    g.font = `900 34px ${FONT_TITLE}`;
    g.fillStyle = '#ffd23f';
    g.fillText('CHARACTER SELECT', SCREEN_W / 2, 52);

    const total = CHARACTERS.length * CARD_W + (CHARACTERS.length - 1) * CARD_GAP;
    const left = (SCREEN_W - total) / 2;
    CHARACTERS.forEach((c, i) => this.drawCard(g, c, i, left + i * (CARD_W + CARD_GAP)));

    for (const slot of [0, 1] as const) this.drawPanel(g, slot);

    g.font = `13px ${FONT_KR}`;
    g.fillStyle = '#aab';
    g.textAlign = 'center';
    const hint =
      this.mode === 'versus'
        ? 'P1  A/D 선택 · F 결정 · G 취소      P2  ←/→ 선택 · K 결정 · L 취소      ESC 뒤로'
        : 'P1이 내 캐릭터 → 연습 상대 순서로 고릅니다   ·   A/D 선택 · F 결정 · G 취소   ·   ESC 뒤로';
    g.fillText(hint, SCREEN_W / 2, SCREEN_H - 10);

    if (this.ready[0] && this.ready[1]) {
      g.font = `900 64px ${FONT_TITLE}`;
      g.lineWidth = 10;
      g.lineJoin = 'round';
      g.strokeStyle = '#000';
      g.strokeText('READY!', SCREEN_W / 2, 175);
      g.fillStyle = '#fff';
      g.fillText('READY!', SCREEN_W / 2, 175);
    }
  }

  private drawCard(g: CanvasRenderingContext2D, c: CharacterDef, i: number, x: number): void {
    const selected = ([0, 1] as const).filter((s) => this.cursor[s] === i);
    g.fillStyle = selected.length ? '#2a2440' : '#191526';
    g.fillRect(x, CARD_TOP, CARD_W, CARD_H);

    // 카드 안 캐릭터: 초상화 그림이 있으면 그림, 없으면 코드로 그린 대기 동작
    g.save();
    g.beginPath();
    g.rect(x, CARD_TOP, CARD_W, CARD_H);
    g.clip();
    const portrait = image(ASSET.portrait(c.id));
    if (portrait) {
      g.drawImage(portrait, x, CARD_TOP, CARD_W, CARD_H);
      // 이름이 잘 보이도록 아래쪽을 어둡게
      const shade = g.createLinearGradient(0, CARD_TOP + CARD_H - 40, 0, CARD_TOP + CARD_H);
      shade.addColorStop(0, 'rgba(10,8,20,0)');
      shade.addColorStop(1, 'rgba(10,8,20,0.85)');
      g.fillStyle = shade;
      g.fillRect(x, CARD_TOP + CARD_H - 40, CARD_W, 40);
    } else {
      g.translate(x + CARD_W / 2, CARD_TOP + CARD_H - 28);
      g.scale(0.56, 0.56);
      g.translate(0, -GROUND_SCREEN_Y);
      drawDancer(
        g,
        evalAnim(c.anims.idle, displayFrame(c.anims.idle, this.frame)),
        0,
        0,
        1,
        c.look,
        c.look.palettes[0],
      );
    }
    g.restore();

    g.font = `900 12px ${FONT_TITLE}`;
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.fillText(c.name, x + CARD_W / 2, CARD_TOP + CARD_H - 8);

    selected.forEach((s, k) => {
      const inset = k * 5;
      g.strokeStyle = SLOT_COLORS[s];
      g.lineWidth = 4;
      g.strokeRect(x + inset, CARD_TOP + inset, CARD_W - inset * 2, CARD_H - inset * 2);
      g.fillStyle = SLOT_COLORS[s];
      g.font = `900 14px ${FONT_TITLE}`;
      g.textAlign = s === 0 ? 'left' : 'right';
      const label = this.slotLabel(s) + (this.ready[s] ? ' ✔' : '');
      g.fillText(label, s === 0 ? x : x + CARD_W, CARD_TOP - 6);
    });
  }

  private slotLabel(slot: 0 | 1): string {
    if (slot === 0) return '1P';
    return this.mode === 'training' ? 'CPU' : '2P';
  }

  private drawPanel(g: CanvasRenderingContext2D, slot: 0 | 1): void {
    const c = CHARACTERS[this.cursor[slot]];
    const px = slot === 0 ? 20 : SCREEN_W / 2 + 10;
    const pw = SCREEN_W / 2 - 30;
    const top = 270;
    const bottom = SCREEN_H - 26;
    const color = SLOT_COLORS[slot];
    const active = this.mode === 'versus' || (slot === 0 ? !this.ready[0] : this.ready[0]);

    g.fillStyle = 'rgba(255,255,255,0.05)';
    g.fillRect(px, top, pw, bottom - top);
    g.fillStyle = color;
    g.fillRect(px, top, 5, bottom - top);
    g.globalAlpha = active || this.ready[slot] ? 1 : 0.45;

    // 큰 미리보기: 결정하면 승리 포즈
    const animId = this.ready[slot] ? 'win' : 'idle';
    const anim = c.anims[animId];
    const frame = displayFrame(anim, this.ready[slot] ? Math.min(this.frame, 40) : this.frame);
    g.save();
    g.translate(px + 75, bottom - 12);
    g.scale(0.82, 0.82);
    g.translate(0, -GROUND_SCREEN_Y);
    // 교체 그림(스프라이트)이 있으면 그림으로
    const sprite = spriteFor(c.id, animId, frame, slot);
    if (sprite) drawSprite(g, sprite.img, 0, 0, 1, null);
    else drawDancer(g, evalAnim(anim, frame), 0, 0, 1, c.look, c.look.palettes[slot]);
    g.restore();

    const tx = px + 150;
    const tw = pw - 160;
    g.textAlign = 'left';
    g.fillStyle = color;
    g.font = `900 13px ${FONT_TITLE}`;
    g.fillText(slot === 0 ? 'PLAYER 1' : this.mode === 'training' ? '연습 상대' : 'PLAYER 2', tx, top + 20);
    g.fillStyle = '#fff';
    g.font = `900 26px ${FONT_TITLE}`;
    g.fillText(c.name, tx, top + 48);
    g.font = `bold 14px ${FONT_KR}`;
    g.fillStyle = '#ffd23f';
    g.fillText(c.profile.title, tx, top + 68);

    g.font = `13px ${FONT_KR}`;
    g.fillStyle = '#dde';
    wrapText(g, c.profile.desc, tw)
      .slice(0, 2)
      .forEach((l, i) => g.fillText(l, tx, top + 88 + i * 17));

    const stats: [string, number][] = [
      ['파워', c.profile.power],
      ['속도', c.profile.speed],
      ['리치', c.profile.range],
    ];
    stats.forEach(([label, v], i) => {
      const sx = tx + i * 95;
      g.fillStyle = '#aab';
      g.fillText(label, sx, top + 132);
      for (let k = 0; k < 5; k++) {
        g.fillStyle = k < v ? color : '#333';
        g.fillRect(sx + 30 + k * 11, top + 122, 9, 11);
      }
    });

    g.font = `12px ${FONT_KR}`;
    commandList(c).forEach(([name, cmd], i) => {
      const y = top + 154 + i * 16;
      g.fillStyle = '#fff';
      g.fillText(name, tx, y);
      g.fillStyle = '#9ab';
      g.fillText(cmd, tx + 118, y);
    });
    g.globalAlpha = 1;
  }
}

function wrapText(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
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
