import type { CharacterDef } from '../../fighter/types';
import { moveTable, grab } from '../builders';
import { HIPHOP_MOVES } from './moves';
import { HIPHOP_COMMAND } from './command';
import * as A from './poses';

export const HIPHOPPER: CharacterDef = {
  id: 'hiphopper',
  name: 'HIPHOPPER',
  maxHealth: 1000,
  look: {
    headwear: 'bucket',
    build: 1.1,
    outfit: { top: 'hoodie', bottom: 'baggy', chain: true },
    palettes: [
      {
        main: '#3ddc84',
        pants: '#2c3e8f',
        hair: '#141414',
        cap: '#ffd23f',
        skin: '#8d5a3b',
        shoe: '#ffffff',
        accent: '#ffd23f',
      },
      {
        main: '#ff9f1c',
        pants: '#4a4a55',
        hair: '#3b2418',
        cap: '#ffffff',
        skin: '#f1c9a5',
        shoe: '#ffffff',
        accent: '#ff3c3c',
      },
    ],
  },
  profile: {
    title: '힙합 · 리듬형',
    desc: '바운스로 리듬을 타며 러닝맨으로 파고들고, 크리스크로스로 뛰어들며 중단으로 흔든다. 로저 래빗으로 뒤로 빠지며 피한다.',
    power: 3,
    speed: 3,
    range: 3,
  },
  anims: { ...A.common, idle: A.idle, walkF: A.walkF, walkB: A.walkB, crouch: A.crouch, win: A.win },
  moves: {
    ...HIPHOP_MOVES,
    ...moveTable(HIPHOP_COMMAND),
    throw: grab({ id: 'throw', name: '스웨그 푸시', base: A.STAND }),
  },
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
    throw: 'throw',
    command: [{ dir: 6, button: 'LK', move: 'bounceStep' }],
  },
  specials: [
    { motion: 'dp', button: 'P', move: 'dougie' },
    { motion: 'qcf', button: 'P', move: 'runningManRush' },
    { motion: 'qcf', button: 'K', move: 'crissCross' },
    { motion: 'qcb', button: 'K', move: 'rogerRabbit' },
  ],
  super: 'cypherSwag',
  walkF: 3.3,
  walkB: 2.8,
  jumpV: 16,
  jumpVX: 4.2,
};
