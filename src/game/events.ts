/** 게임 로직 → 렌더러/사운드로 전달되는 일회성 이벤트 */
export type GameEvent =
  | { type: 'hit'; x: number; y: number; heavy: boolean; attacker: 0 | 1 }
  | { type: 'block'; x: number; y: number; heavy: boolean }
  | { type: 'counter'; x: number; y: number }
  | { type: 'super'; player: 0 | 1; name: string }
  | { type: 'ko' }
  | { type: 'announce'; text: string };
