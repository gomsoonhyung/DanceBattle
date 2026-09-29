import { unlockAudio } from './audio/sfx';
import { FRAME_MS, SCREEN_H, SCREEN_W } from './core/constants';
import { renderGallery } from './debug/gallery';
import type { CharacterDef } from './fighter/types';
import { Match, type MatchMode } from './game/match';
import { endInputFrame, initKeyboard, keyPressed, menu, pollMenu, readPlayerInput } from './input/devices';
import { FONT_KR, FONT_TITLE } from './render/hud';
import { Renderer } from './render/renderer';
import { drawStage } from './render/stage';
import { drawGuide } from './render/guideHud';
import { SelectScreen } from './screens/select';
import { TrainingGuide } from './training/guide';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const g = canvas.getContext('2d')!;

const params = new URLSearchParams(location.search);
if (params.has('gallery')) {
  renderGallery(g, params.get('gallery') || '', params.get('char') || '');
} else {
  startGame();
}

type Screen =
  | { kind: 'title' }
  | { kind: 'select'; select: SelectScreen }
  | { kind: 'match'; match: Match; renderer: Renderer; guide: TrainingGuide | null };

function startGame(): void {
  initKeyboard();
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio);

  let screen: Screen = { kind: 'title' };
  let menuIndex = 0;
  let showBoxes = false;
  let lastChars: [CharacterDef, CharacterDef] | undefined;
  const MENU: { mode: MatchMode; label: string }[] = [
    { mode: 'versus', label: '2P 대전' },
    { mode: 'training', label: '트레이닝 (혼자 연습)' },
  ];

  const toSelect = (mode: MatchMode) => {
    screen = { kind: 'select', select: new SelectScreen(mode, lastChars) };
  };

  const toMatch = (mode: MatchMode, chars: [CharacterDef, CharacterDef]) => {
    lastChars = chars;
    const renderer = new Renderer(g);
    renderer.showBoxes = showBoxes;
    const guide = mode === 'training' ? new TrainingGuide(chars[0]) : null;
    screen = { kind: 'match', match: new Match(mode, chars), renderer, guide };
  };

  /** 고정 60fps 로직 1프레임 */
  const step = () => {
    pollMenu();
    if (keyPressed('F1')) {
      showBoxes = !showBoxes;
      if (screen.kind === 'match') screen.renderer.showBoxes = showBoxes;
    }

    switch (screen.kind) {
      case 'title': {
        const m0 = menu(0);
        const m1 = menu(1);
        if (m0.up || m1.up) menuIndex = (menuIndex + MENU.length - 1) % MENU.length;
        if (m0.down || m1.down) menuIndex = (menuIndex + 1) % MENU.length;
        if (keyPressed('Digit1')) toSelect('versus');
        else if (keyPressed('Digit2')) toSelect('training');
        else if (keyPressed('Enter') || keyPressed('Space') || m0.confirm || m1.confirm) toSelect(MENU[menuIndex].mode);
        break;
      }
      case 'select': {
        const r = screen.select.update();
        if (r === 'back') screen = { kind: 'title' };
        else if (r) toMatch(screen.select.mode, r);
        break;
      }
      case 'match': {
        const { match, renderer, guide } = screen;
        if (keyPressed('Escape')) {
          screen = { kind: 'title' };
          break;
        }
        if (match.mode === 'training') {
          if (keyPressed('F2')) match.cycleDummyMode();
          if (keyPressed('KeyR')) match.resetPositions();
        }
        if (guide) {
          if (keyPressed('Tab')) guide.visible = !guide.visible;
          for (let i = 0; i < 9; i++) if (keyPressed(`Digit${i + 1}`)) guide.select(i);
          if (keyPressed('Space')) guide.startDemo(match);
        }
        if (match.phase === 'matchEnd' && match.phaseFrame > 60) {
          const m = [menu(0), menu(1)];
          if (m.some((x) => x.confirm)) {
            toMatch(match.mode, match.chars);
            break;
          }
          if (m.some((x) => x.cancel)) {
            toSelect(match.mode);
            break;
          }
        }
        // 시범 중에는 가이드가 P1 대신 입력한다
        const p1Input = guide?.nextInput() ?? readPlayerInput(0);
        match.update(p1Input, readPlayerInput(1));
        guide?.observe(match);
        renderer.consume(match.events);
        break;
      }
    }
    endInputFrame();
  };

  const drawTitle = () => {
    drawStage(g);
    g.fillStyle = 'rgba(0,0,0,0.78)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.textAlign = 'center';
    g.font = `900 72px ${FONT_TITLE}`;
    g.lineWidth = 10;
    g.lineJoin = 'round';
    g.strokeStyle = '#000';
    g.strokeText('DANCE BATTLE', SCREEN_W / 2, 120);
    g.fillStyle = '#ffd23f';
    g.fillText('DANCE BATTLE', SCREEN_W / 2, 120);

    MENU.forEach((item, i) => {
      const sel = i === menuIndex;
      g.font = `bold ${sel ? 28 : 24}px ${FONT_KR}`;
      g.fillStyle = sel ? '#fff' : '#889';
      g.fillText(`${sel ? '▶ ' : ''}${i + 1}. ${item.label}`, SCREEN_W / 2, 200 + i * 42);
    });

    g.font = `15px ${FONT_KR}`;
    g.fillStyle = '#dde';
    const lines = [
      'P1  이동 WASD   ·   약P F  강P G  약K V  강K B',
      'P2  이동 방향키  ·   약P K  강P L  약K ,  강K .',
      '게임패드: X 약P · Y 강P · A 약K · B 강K',
      '',
      '가드: 뒤로 (서서 가드) / 뒤아래 (앉아 가드)',
      '초필살기: 그루브 게이지 MAX에서 ↓↘→↓↘→ + P 또는 강P+강K',
      '캐릭터별 기술표는 캐릭터 선택 화면에서 볼 수 있습니다',
      '',
      'F1 판정 박스 보기   ·   ESC 메뉴',
    ];
    lines.forEach((l, i) => g.fillText(l, SCREEN_W / 2, 310 + i * 22));
  };

  let acc = 0;
  let last = performance.now();
  const frame = (now: number) => {
    acc += Math.min(now - last, 100);
    last = now;
    while (acc >= FRAME_MS) {
      step();
      acc -= FRAME_MS;
    }
    if (screen.kind === 'match') {
      screen.renderer.draw(screen.match);
      if (screen.guide) drawGuide(g, screen.guide, screen.match);
    } else if (screen.kind === 'select') screen.select.draw(g);
    else drawTitle();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
