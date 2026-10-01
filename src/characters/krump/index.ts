import type { CharacterDef } from '../../fighter/types';
import { moveTable, grab, tune } from '../builders';
import { NORMAL_IDS } from '../common';
import { KRUMP_MOVES } from './moves';
import { KRUMP_COMMAND } from './command';
import * as A from './poses';

export const KRUMP: CharacterDef = {
  id: 'krump',
  name: 'KRUMPER',
  maxHealth: 1150,
  look: {
    headwear: 'headband',
    build: 1.25,
    outfit: { top: 'tank', bottom: 'baggy', facePaint: true, wristbands: true },
    palettes: [
      {
        main: '#ff7a1a',
        pants: '#3a3a44',
        hair: '#141414',
        cap: '#ff2d2d',
        skin: '#8d5a3b',
        shoe: '#ffffff',
        accent: '#ff2d2d',
      },
      {
        main: '#8a5cff',
        pants: '#3b4a33',
        hair: '#3b2418',
        cap: '#ffffff',
        skin: '#e8b894',
        shoe: '#ffffff',
        accent: '#ffffff',
      },
    ],
  },
  profile: {
    title: '크럼프 · 파워형',
    desc: '느리지만 한 방이 무겁다. 슈퍼아머 돌진과 가드 불가 체스트 팝으로 압박하고, 바닥 충격파로 견제한다.',
    power: 5,
    speed: 2,
    range: 3,
  },
  anims: {
    ...A.common,
    idle: A.idle,
    walkF: A.walkF,
    walkB: A.walkB,
    crouch: A.crouch,
    win: A.win,
  },
  moves: tune(
    { ...KRUMP_MOVES, ...moveTable(KRUMP_COMMAND), throw: grab({ id: 'throw', name: '체스트 범프', base: A.STAND }) },
    NORMAL_IDS,
    {
      startup: 1,
      reach: 0.9,
      damage: 1.15,
    },
  ),
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
    throw: 'throw',
    command: [{ dir: 6, button: 'HP', move: 'hammerSwing' }],
  },
  specials: [
    { motion: 'dp', button: 'P', move: 'burstUpper' },
    { motion: 'qcf', button: 'P', move: 'stompWave' },
    { motion: 'qcf', button: 'K', move: 'burstRush' },
    { motion: 'qcb', button: 'P', move: 'chestPop' },
    { motion: 'qcb', button: 'K', move: 'jumpStomp' },
  ],
  super: 'killOff',
  walkF: 2.5,
  walkB: 2.0,
  jumpV: 15,
  jumpVX: 3.8,
  dash: { frames: 18, speed: 6 },
  backdash: { frames: 18, speed: 5, invuln: 6 },
};
