import type { CharacterDef } from '../../fighter/types';
import { HOUSE_MOVES } from './moves';
import * as A from './poses';

export const HOUSE_HEAD: CharacterDef = {
  id: 'househead',
  name: 'HOUSE HEAD',
  maxHealth: 1000,
  look: {
    headwear: 'beanie',
    build: 1,
    palettes: [
      { main: '#29b6f6', back: '#1a6f99', cap: '#ff7043', skin: '#a8703f', shoe: '#ffffff', accent: '#ffffff' },
      { main: '#ffee58', back: '#b3a52a', cap: '#26a69a', skin: '#f1c9a5', shoe: '#ffffff', accent: '#ffffff' },
    ],
  },
  profile: {
    title: '하우스 · 풋워크형',
    desc: '쉴 새 없는 셔플 스텝으로 하단을 두드리고, 스케이트 슬라이드로 높은 공격 밑을 빠져나간다.',
    power: 2,
    speed: 5,
    range: 3,
  },
  anims: { ...A.common, idle: A.idle, walkF: A.walkF, walkB: A.walkB, crouch: A.crouch, win: A.win },
  moves: HOUSE_MOVES,
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
  },
  specials: [
    { motion: 'dp', button: 'K', move: 'loftSpin' },
    { motion: 'qcf', button: 'P', move: 'jackingWave' },
    { motion: 'qcf', button: 'K', move: 'shuffleStep' },
    { motion: 'qcb', button: 'K', move: 'skateSlide' },
  ],
  super: 'houseParty',
  walkF: 4.0,
  walkB: 3.2,
  jumpV: 15.5,
  jumpVX: 4.4,
};
