import type { CharacterDef } from '../../fighter/types';
import { POPPING_MOVES } from './moves';
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
  anims: { ...A.common, idle: A.idle, walkF: A.walkF, walkB: A.walkB, crouch: A.crouch, win: A.win },
  moves: POPPING_MOVES,
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
  },
  specials: [
    { motion: 'dp', button: 'P', move: 'popUpper' },
    { motion: 'qcf', button: 'P', move: 'wave' },
    { motion: 'qcf', button: 'K', move: 'animationDash' },
    { motion: 'qcb', button: 'P', move: 'robot' },
  ],
  super: 'electricBoogaloo',
  walkF: 3.2,
  walkB: 2.7,
  jumpV: 15.5,
  jumpVX: 4.0,
};
