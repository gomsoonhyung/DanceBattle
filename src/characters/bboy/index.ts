import type { CharacterDef } from '../../fighter/types';
import { BBOY_MOVES } from './moves';
import * as A from './poses';

export const BBOY: CharacterDef = {
  id: 'bboy',
  name: 'B-BOY',
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
