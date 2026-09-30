import type { CharacterDef } from '../../fighter/types';
import { LOCKING_MOVES } from './moves';
import * as A from './poses';

export const LOCKER: CharacterDef = {
  id: 'locker',
  name: 'LOCKER',
  maxHealth: 950,
  look: {
    headwear: 'applecap',
    build: 0.95,
    outfit: { top: 'collar', bottom: 'knickers', suspenders: true, stripedSocks: true },
    palettes: [
      {
        main: '#ffd23f',
        pants: '#2b2b35',
        hair: '#2b1b17',
        cap: '#ff3cac',
        skin: '#f1c9a5',
        shoe: '#ffffff',
        accent: '#ff3cac',
      },
      {
        main: '#2bd2ff',
        pants: '#3a2a1a',
        hair: '#141414',
        cap: '#ff8c1a',
        skin: '#a8703f',
        shoe: '#ffffff',
        accent: '#ff8c1a',
      },
    ],
  },
  profile: {
    title: '락킹 · 스피드형',
    desc: '빠른 발과 긴 포인트로 견제한다. 포인트 장풍은 높게 날아가서 앉으면 피할 수 있다.',
    power: 2,
    speed: 5,
    range: 4,
  },
  anims: {
    ...A.common,
    idle: A.idle,
    walkF: A.walkF,
    walkB: A.walkB,
    crouch: A.crouch,
    win: A.win,
  },
  moves: LOCKING_MOVES,
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
  },
  specials: [
    { motion: 'dp', button: 'P', move: 'jumpLock' },
    { motion: 'qcf', button: 'P', move: 'unclePoint' },
    { motion: 'qcf', button: 'K', move: 'scoobyRush' },
    { motion: 'qcb', button: 'P', move: 'wristTwirl' },
    { motion: 'qcb', button: 'K', move: 'kneeDrop' },
  ],
  super: 'lockAndPoint',
  walkF: 3.9,
  walkB: 3.1,
  jumpV: 16.5,
  jumpVX: 4.6,
};
