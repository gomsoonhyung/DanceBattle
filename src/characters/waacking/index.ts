import type { CharacterDef } from '../../fighter/types';
import { WAACKING_MOVES } from './moves';
import * as A from './poses';

export const WAACKER: CharacterDef = {
  id: 'waacker',
  name: 'WAACKER',
  maxHealth: 950,
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
  moves: WAACKING_MOVES,
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
  },
  specials: [
    { motion: 'dp', button: 'P', move: 'highWhip' },
    { motion: 'qcf', button: 'P', move: 'whipStorm' },
    { motion: 'qcf', button: 'K', move: 'waackWalk' },
    { motion: 'qcb', button: 'P', move: 'strikeAPose' },
  ],
  super: 'divaFinale',
  walkF: 3.5,
  walkB: 2.9,
  jumpV: 16,
  jumpVX: 4.3,
};
