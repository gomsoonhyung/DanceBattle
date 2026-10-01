import { unlockAudio } from './audio/sfx';
import { FRAME_MS, RENDER_SCALE, SCREEN_H, SCREEN_W } from './core/constants';
import { renderGallery } from './debug/gallery';
import { CHARACTERS } from './characters';
import type { CharacterDef } from './fighter/types';
import { Match, type MatchMode } from './game/match';
import { endInputFrame, initKeyboard, keyPressed, menu, pollMenu, readPlayerInput } from './input/devices';
import { Renderer } from './render/renderer';
import { drawGuide } from './render/guideHud';
import { preloadAssets } from './render/assets';
import { loadSprites } from './render/sprites';
import { SelectScreen } from './screens/select';
import { TitleScreen } from './screens/title';
import { TrainingGuide } from './training/guide';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const g = canvas.getContext('2d')!;
// 게임 좌표(960×540)로 그리면 실제로는 2배 해상도로 그려지도록
canvas.width = SCREEN_W * RENDER_SCALE;
canvas.height = SCREEN_H * RENDER_SCALE;
g.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);

const params = new URLSearchParams(location.search);
if (params.has('gallery')) {
  renderGallery(g, params.get('gallery') || '', params.get('char') || '');
} else {
  startGame();
}

type Screen =
  | { kind: 'title'; title: TitleScreen }
  | { kind: 'select'; select: SelectScreen }
  | { kind: 'match'; match: Match; renderer: Renderer; guide: TrainingGuide | null };

function startGame(): void {
  initKeyboard();
  preloadAssets(CHARACTERS.map((c) => c.id));
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio);

  let screen: Screen = { kind: 'title', title: new TitleScreen() };
  let showBoxes = false;
  let lastChars: [CharacterDef, CharacterDef] | undefined;
  const toTitle = () => {
    screen = { kind: 'title', title: new TitleScreen(true) };
  };

  const toSelect = (mode: MatchMode) => {
    screen = { kind: 'select', select: new SelectScreen(mode, lastChars) };
  };

  const toMatch = (mode: MatchMode, chars: [CharacterDef, CharacterDef]) => {
    lastChars = chars;
    void loadSprites(chars); // 교체 그림이 있으면 불러온다 (불러오는 동안은 코드로 그린 캐릭터)
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
        const mode = screen.title.update();
        if (mode) toSelect(mode);
        break;
      }
      case 'select': {
        const r = screen.select.update();
        if (r === 'back') toTitle();
        else if (r) toMatch(screen.select.mode, r);
        break;
      }
      case 'match': {
        const { match, renderer, guide } = screen;
        if (keyPressed('Escape')) {
          toTitle();
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
    else screen.title.draw(g);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
