import type { CharacterDef } from '../../fighter/types';
import { GIRLS_HIPHOP_MOVES } from './moves';
import * as A from './poses';

export const HIPHOP_GIRL: CharacterDef = {
  id: 'hiphopgirl',
  name: 'HIPHOP GIRL',
  maxHealth: 950,
  look: {
    headwear: 'ponytail',
    build: 0.9,
    palettes: [
      { main: '#ff4fa3', back: '#b0306e', cap: '#8d5a3b', skin: '#f1c9a5', shoe: '#ffffff', accent: '#ffffff' },
      { main: '#b388ff', back: '#6f4bc0', cap: '#ffcf6b', skin: '#c68b5e', shoe: '#ffffff', accent: '#ff4fa3' },
    ],
  },
  profile: {
    title: '걸스힙합 · 테크닉형',
    desc: '골반 웨이브와 헤어 플립으로 흔들고, 느리게 떠다니는 하트 키스로 상대를 묶어 둔다.',
    power: 3,
    speed: 4,
    range: 3,
  },
  anims: { ...A.common, idle: A.idle, walkF: A.walkF, walkB: A.walkB, crouch: A.crouch, win: A.win },
  moves: GIRLS_HIPHOP_MOVES,
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
  },
  specials: [
    { motion: 'dp', button: 'K', move: 'turnKick' },
    { motion: 'qcf', button: 'P', move: 'hairFlip' },
    { motion: 'qcf', button: 'K', move: 'hipBump' },
    { motion: 'qcb', button: 'P', move: 'blowKiss' },
  ],
  super: 'spotlight',
  walkF: 3.6,
  walkB: 3.0,
  jumpV: 16.5,
  jumpVX: 4.5,
};
