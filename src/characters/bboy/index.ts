import type { CharacterDef } from '../../fighter/types';
import { BBOY_MOVES } from './moves';
import * as A from './poses';

export const BBOY: CharacterDef = {
  id: 'bboy',
  name: 'B-BOY',
  maxHealth: 1000,
  look: {
    headwear: 'backcap',
    build: 1,
    outfit: { top: 'longsleeve', bottom: 'track', sideStripes: true },
    palettes: [
      {
        main: '#ff4d5e',
        pants: '#1f1f2b',
        hair: '#2b1b17',
        cap: '#ffd23f',
        skin: '#f1c9a5',
        shoe: '#ffffff',
        accent: '#ffffff',
      },
      {
        main: '#4da3ff',
        pants: '#2a2238',
        hair: '#1a1a1a',
        cap: '#7cffb2',
        skin: '#c68b5e',
        shoe: '#ffffff',
        accent: '#7cffb2',
      },
    ],
  },
  profile: {
    title: '브레이킹 · 올라운더',
    desc: '파워무브로 몰아붙이는 균형형. 하단 윈드밀과 중단 스와이프로 흔들고, 프리즈로 반격한다.',
    power: 3,
    speed: 3,
    range: 3,
  },
  anims: {
    idle: A.idle,
    walkF: A.walkF,
    walkB: A.walkB,
    crouch: A.crouch,
    prejump: A.prejump,
    jump: A.jump,
    land: A.land,
    hitStand: A.hitStand,
    hitCrouch: A.hitCrouch,
    blockStand: A.blockStand,
    blockCrouch: A.blockCrouch,
    airHit: A.airHit,
    knockdown: A.knockdown,
    getup: A.getup,
    win: A.win,
  },
  moves: BBOY_MOVES,
  normals: {
    stand: { LP: 'sLP', HP: 'sHP', LK: 'sLK', HK: 'sHK' },
    crouch: { LP: 'cLP', HP: 'cHP', LK: 'cLK', HK: 'cHK' },
    airLight: 'jL',
    airHeavy: 'jH',
  },
  // 우선순위 순서 (앞쪽이 먼저 검사됨)
  specials: [
    { motion: 'dp', button: 'P', move: 'headspin' },
    { motion: 'qcf', button: 'P', move: 'windmill' },
    { motion: 'qcf', button: 'K', move: 'airflare' },
    { motion: 'qcb', button: 'P', move: 'freeze' },
    { motion: 'qcb', button: 'K', move: 'swipe' },
  ],
  super: 'powerCombo',
  walkF: 3.4,
  walkB: 2.7,
  jumpV: 16,
  jumpVX: 4.2,
};
