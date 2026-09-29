import type { CharacterDef } from '../../fighter/types';
import { KRUMP_MOVES } from './moves';
import * as A from './poses';

export const KRUMP: CharacterDef = {
  id: 'krump',
  name: 'KRUMPER',
  maxHealth: 1100,
  look: {
    headwear: 'headband',
    build: 1.3,
    bareArms: true,
    palettes: [
      { main: '#ff7a1a', back: '#a34e0f', cap: '#ff2d2d', skin: '#8d5a3b', shoe: '#ffffff', accent: '#ff2d2d' },
      { main: '#8a5cff', back: '#57399e', cap: '#ffffff', skin: '#e8b894', shoe: '#ffffff', accent: '#ffffff' },
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
  moves: KRUMP_MOVES,
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
  },
  specials: [
    { motion: 'dp', button: 'P', move: 'burstUpper' },
    { motion: 'qcf', button: 'P', move: 'stompWave' },
    { motion: 'qcf', button: 'K', move: 'burstRush' },
    { motion: 'qcb', button: 'P', move: 'chestPop' },
  ],
  super: 'killOff',
  walkF: 2.7,
  walkB: 2.2,
  jumpV: 15,
  jumpVX: 3.8,
};
