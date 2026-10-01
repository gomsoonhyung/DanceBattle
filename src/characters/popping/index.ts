import type { CharacterDef } from '../../fighter/types';
import { moveTable, grab, tune } from '../builders';
import { NORMAL_IDS } from '../common';
import { POPPING_MOVES } from './moves';
import { POPPING_COMMAND } from './command';
import * as A from './poses';

export const POPPER: CharacterDef = {
  id: 'popper',
  name: 'POPPER',
  maxHealth: 1000,
  look: {
    headwear: 'fedora',
    build: 1,
    outfit: { top: 'suit', bottom: 'slim', gloves: true, tie: true },
    palettes: [
      {
        main: '#f5f5f5',
        pants: '#f5f5f5',
        hair: '#141414',
        cap: '#e53935',
        skin: '#f1c9a5',
        shoe: '#e53935',
        accent: '#e53935',
      },
      {
        main: '#5c6bc0',
        pants: '#5c6bc0',
        hair: '#3b2418',
        cap: '#ffffff',
        skin: '#8d5a3b',
        shoe: '#ffffff',
        accent: '#ff4081',
      },
    ],
  },
  profile: {
    title: '팝핑 · 견제형',
    desc: '팔을 타고 흐르는 웨이브 장풍으로 견제하고, 로봇 동작은 아머로 버틴다. 애니메이션 대시는 잔상을 남기며 파고든다.',
    power: 3,
    speed: 3,
    range: 5,
  },
  anims: {
    ...A.common,
    backdash: A.backdash,
    idle: A.idle,
    walkF: A.walkF,
    walkB: A.walkB,
    crouch: A.crouch,
    win: A.win,
  },
  moves: tune(
    tune(
      { ...POPPING_MOVES, ...moveTable(POPPING_COMMAND), throw: grab({ id: 'throw', name: '팝 쇼크', base: A.STAND }) },
      ['sHP', 'sHK', 'cHP', 'cHK', 'jH'],
      { startup: 1 },
    ),
    NORMAL_IDS,
    { reach: 1.15 },
  ),
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
    throw: 'throw',
    command: [{ dir: 6, button: 'HP', move: 'electricPop' }],
  },
  specials: [
    { motion: 'dp', button: 'P', move: 'popUpper' },
    { motion: 'qcf', button: 'P', move: 'popShot' },
    { motion: 'qcf', button: 'K', move: 'wave' },
    { motion: 'qcb', button: 'K', move: 'slowWave' },
    { motion: 'qcb', button: 'P', move: 'robot' },
  ],
  super: 'electricBoogaloo',
  walkF: 3.0,
  walkB: 3.0,
  jumpV: 15.5,
  jumpVX: 4.0,
  dash: { frames: 16, speed: 8.5, invuln: 12, trail: true },
};
