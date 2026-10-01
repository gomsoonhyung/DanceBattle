import type { CharacterDef } from '../../fighter/types';
import { moveTable, grab, tune } from '../builders';
import { NORMAL_IDS } from '../common';
import { WAACKING_MOVES } from './moves';
import { WAACKING_COMMAND } from './command';
import * as A from './poses';

export const WAACKER: CharacterDef = {
  id: 'waacker',
  name: 'WAACKER',
  maxHealth: 900,
  look: {
    headwear: 'bun',
    build: 0.9,
    outfit: { top: 'longsleeve', bottom: 'wide', earrings: true },
    palettes: [
      {
        main: '#e040fb',
        pants: '#2a2238',
        hair: '#3b2418',
        cap: '#3b2418',
        skin: '#f1c9a5',
        shoe: '#ffffff',
        accent: '#ffd23f',
      },
      {
        main: '#00e5c0',
        pants: '#f0f0f0',
        hair: '#6d3b1f',
        cap: '#6d3b1f',
        skin: '#c68b5e',
        shoe: '#ffffff',
        accent: '#ffd23f',
      },
    ],
  },
  profile: {
    title: '왁킹 · 연타형',
    desc: '팔을 채찍처럼 휘두르는 빠른 연타와 긴 리치. 포즈로 게이지를 모아 초필살기를 자주 노린다.',
    power: 2,
    speed: 4,
    range: 4,
  },
  anims: { ...A.common, idle: A.idle, walkF: A.walkF, walkB: A.walkB, crouch: A.crouch, win: A.win },
  moves: tune(
    tune(
      { ...WAACKING_MOVES, ...moveTable(WAACKING_COMMAND), throw: grab({ id: 'throw', name: '암 롤', base: A.STAND }) },
      NORMAL_IDS,
      {
        reach: 1.3,
        damage: 0.8,
      },
    ),
    ['cLK', 'cHK'],
    { damage: 0.6 },
  ),
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
    throw: 'throw',
    command: [{ dir: 6, button: 'LP', move: 'longWhip' }],
  },
  specials: [
    { motion: 'dp', button: 'P', move: 'highWhip' },
    { motion: 'qcf', button: 'P', move: 'poseWave' },
    { motion: 'qcf', button: 'K', move: 'twirl' },
    { motion: 'qcb', button: 'P', move: 'strikeAPose' },
  ],
  super: 'divaFinale',
  walkF: 3.5,
  walkB: 2.9,
  jumpV: 16,
  jumpVX: 4.3,
};
