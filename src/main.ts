import { unlockAudio } from './audio/sfx';
import { FRAME_MS, SCREEN_H, SCREEN_W } from './core/constants';
import { renderGallery } from './debug/gallery';
import { Match, type MatchMode } from './game/match';
import { anyAttackKeyPressed, endInputFrame, initKeyboard, keyPressed, readPlayerInput } from './input/devices';
import { FONT_KR, FONT_TITLE } from './render/hud';
import { Renderer } from './render/renderer';
import { drawStage } from './render/stage';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const g = canvas.getContext('2d')!;

const params = new URLSearchParams(location.search);
if (params.has('gallery')) {
  renderGallery(g, params.get('gallery') || '');
} else {
  startGame();
}

function startGame(): void {
  initKeyboard();
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio);

  let match: Match | null = null;
  let renderer = new Renderer(g);
  let menuIndex = 0;
  const MENU: { mode: MatchMode; label: string }[] = [
    { mode: 'versus', label: '2P 대전' },
    { mode: 'training', label: '트레이닝 (혼자 연습)' },
  ];

  const begin = (mode: MatchMode) => {
    const showBoxes = renderer.showBoxes;
    match = new Match(mode);
    renderer = new Renderer(g);
    renderer.showBoxes = showBoxes;
  };

  /** 고정 60fps 로직 1프레임 */
  const step = () => {
    if (keyPressed('F1')) renderer.showBoxes = !renderer.showBoxes;
    if (!match) {
      if (keyPressed('KeyW') || keyPressed('ArrowUp')) menuIndex = (menuIndex + MENU.length - 1) % MENU.length;
      if (keyPressed('KeyS') || keyPressed('ArrowDown')) menuIndex = (menuIndex + 1) % MENU.length;
      if (keyPressed('Digit1')) begin('versus');
      else if (keyPressed('Digit2')) begin('training');
      else if (keyPressed('Enter') || keyPressed('Space') || anyAttackKeyPressed(0)) begin(MENU[menuIndex].mode);
    } else {
      if (keyPressed('Escape')) {
        match = null;
      } else {
        if (match.mode === 'training') {
          if (keyPressed('F2')) match.cycleDummyMode();
          if (keyPressed('KeyR')) match.resetPositions();
        }
        if (match.phase === 'matchEnd' && match.phaseFrame > 60 && (anyAttackKeyPressed(0) || anyAttackKeyPressed(1))) {
          begin(match.mode);
        }
        match!.update(readPlayerInput(0), readPlayerInput(1));
        renderer.consume(match!.events);
      }
    }
    endInputFrame();
  };

  const drawTitle = () => {
    drawStage(g);
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.textAlign = 'center';
    g.font = `900 72px ${FONT_TITLE}`;
    g.lineWidth = 10;
    g.lineJoin = 'round';
    g.strokeStyle = '#000';
    g.strokeText('B-BOY FIGHTER', SCREEN_W / 2, 110);
    g.fillStyle = '#ffd23f';
    g.fillText('B-BOY FIGHTER', SCREEN_W / 2, 110);

    MENU.forEach((item, i) => {
      const sel = i === menuIndex;
      g.font = `bold ${sel ? 28 : 24}px ${FONT_KR}`;
      g.fillStyle = sel ? '#fff' : '#889';
      g.fillText(`${sel ? '▶ ' : ''}${i + 1}. ${item.label}`, SCREEN_W / 2, 175 + i * 40);
    });

    g.font = `15px ${FONT_KR}`;
    g.fillStyle = '#dde';
    const lines = [
      'P1  이동 WASD   ·   약P F  강P G  약K V  강K B',
      'P2  이동 방향키  ·   약P K  강P L  약K ,  강K .',
      '게임패드: X 약P · Y 강P · A 약K · B 강K',
      '',
      '윈드밀 ↓↘→+P   ·   에어플레어 ↓↘→+K   ·   헤드스핀 →↓↘+P (대공)',
      '프리즈 반격 ↓↙←+P   ·   스와이프 킥 ↓↙←+K (중단)',
      '파워무브 콤보 (게이지 MAX) ↓↘→↓↘→+P 또는 강P+강K 동시',
      '',
      '가드: 뒤로 (서서 가드) / 뒤아래 (앉아 가드)',
      'F1 판정 박스 보기   ·   ESC 메뉴',
    ];
    lines.forEach((l, i) => g.fillText(l, SCREEN_W / 2, 280 + i * 22));
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
    if (match) renderer.draw(match);
    else drawTitle();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
