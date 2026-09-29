// 모든 게임 로직은 60fps 고정 프레임 기준으로 동작한다.
export const FPS = 60;
export const FRAME_MS = 1000 / FPS;

export const SCREEN_W = 960;
export const SCREEN_H = 540;

// 월드 좌표: x는 오른쪽 +, y는 위쪽 + (지면 = 0)
export const STAGE_LEFT = 40;
export const STAGE_RIGHT = SCREEN_W - 40;
export const GROUND_SCREEN_Y = 470; // 지면이 그려지는 화면 y

export const GRAVITY = 0.9;
export const MAX_METER = 100;
export const ROUND_TIME = 99;
export const ROUNDS_TO_WIN = 2;

export const PUSHBOX_HALF_W = 26;
