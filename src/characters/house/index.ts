import type { CharacterDef } from '../../fighter/types';
import { moveTable, grab, tune } from '../builders';
import { NORMAL_IDS } from '../common';
import { HOUSE_MOVES } from './moves';
import { HOUSE_COMMAND } from './command';
import * as A from './poses';

export const HOUSE_HEAD: CharacterDef = {
  id: 'househead',
  name: 'HOUSE HEAD',
  maxHealth: 950,
  look: {
    headwear: 'beanie',
    build: 1,
    outfit: { top: 'tee', bottom: 'track', wristbands: true },
    palettes: [
      {
        main: '#29b6f6',
        pants: '#263238',
        hair: '#141414',
        cap: '#ff7043',
        skin: '#a8703f',
        shoe: '#ffffff',
        accent: '#ffffff',
      },
      {
        main: '#ffee58',
        pants: '#37474f',
        hair: '#3b2418',
        cap: '#26a69a',
        skin: '#f1c9a5',
        shoe: '#ffffff',
        accent: '#26a69a',
      },
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
  moves: tune(
    tune(
      { ...HOUSE_MOVES, ...moveTable(HOUSE_COMMAND), throw: grab({ id: 'throw', name: '풋 훅', base: A.STAND }) },
      NORMAL_IDS,
      {
        startup: -1,
        reach: 0.9,
      },
    ),
    ['cLK', 'cHK'],
    { damage: 1.2 },
  ),
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
    throw: 'throw',
    command: [{ dir: 3, button: 'LK', move: 'heelToe' }],
  },
  specials: [
    { motion: 'dp', button: 'K', move: 'loftSpin' },
    { motion: 'qcf', button: 'P', move: 'shuffle' },
    { motion: 'qcf', button: 'K', move: 'looseLegs' },
    { motion: 'qcb', button: 'K', move: 'skateSlide' },
  ],
  super: 'houseParty',
  walkF: 4.0,
  walkB: 3.2,
  jumpV: 15.5,
  jumpVX: 4.4,
  dash: { frames: 12, speed: 9.5 },
};
