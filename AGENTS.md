# AGENTS.md — AI 에이전트 공통 안내

이 저장소를 작업하는 **모든 AI 에이전트**(Codex, Claude Code 등)가 따르는 기본 구성입니다.
Codex는 이 파일을, Claude Code는 `CLAUDE.md`를 먼저 읽습니다. 두 파일의 규칙은 같습니다.
사람용 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)입니다.

## 1. 프로젝트 한눈에

- **DANCE BATTLE**: 춤 동작이 기술이 되는 2D 격투 게임 (8개 장르 캐릭터, 로컬 2P + 연습 모드)
- TypeScript + Vite + Canvas 2D, 테스트는 Vitest. 그림 도구는 Python 3 + Pillow
- 게임 로직(60fps 고정, 결정론)과 그리기(`src/render/`)가 분리되어 있다

| 문서                                               | 내용                                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)       | 코드 구조                                                                                             |
| [docs/CHARACTER_GUIDE.md](docs/CHARACTER_GUIDE.md) | 캐릭터·기술 데이터 만드는 법                                                                          |
| [docs/SPRITES.md](docs/SPRITES.md)                 | 그림(스프라이트) 규격과 sprite-gen 일괄 생성                                                          |
| [docs/WORKTREE.md](docs/WORKTREE.md)               | 여러 에이전트가 동시에 작업하는 법                                                                    |
| [docs/design/](docs/design/)                       | 기획서: GAME_DESIGN, DANCE_REFERENCE(장르 동작 기준), CHARACTER_PLAYBOOK, INPUT_REFERENCE, FRAME_DATA |

## 2. 시작하기 전에 (필수)

1. **자기 작업 폴더에서 일한다.** 다른 에이전트와 같은 폴더를 쓰지 않는다.
   ```bash
   zsh scripts/worktree.sh add <에이전트-이름> <브랜치> [기준 브랜치]
   cd ../GameProject-wt/<에이전트-이름>
   source .worktree.env    # PORT, GAME_URL
   ```
2. 브랜치 이름: `feat/` `fix/` `art/` `balance/` `docs/` `refactor/` 로 시작한다.
3. 맡은 범위(3절) 밖의 파일은 고치지 않는다. 꼭 필요하면 작업 보고에 적는다.

## 3. 역할과 맡는 범위

| 역할                      | 브랜치                     | 고치는 곳                                                                             | 고치지 않는 곳                                       |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **개발** (게임 로직·연출) | `feat/` `fix/` `refactor/` | `src/`, `scripts/`, 테스트, 관련 문서                                                 | `public/sprites/`의 그림 (manifest 이름 정리는 가능) |
| **디자인** (그림)         | `art/`                     | `public/sprites/`, `public/assets/`, `sprites-work/`(작업 폴더), `docs/design/LOG.md` | `src/`                                               |
| **기획·문서**             | `docs/`                    | `docs/`, `README.md`                                                                  | `src/`, `public/`                                    |
| **밸런스**                | `balance/`                 | 각 캐릭터 `index.ts`·`moves.ts`의 숫자                                                | 기술 구조·새 시스템                                  |

디자인 작업 지시는 [docs/design/TASKS.md](docs/design/TASKS.md)에 있다.

## 4. 코드 규칙

- 작업을 마치면 **`npm run check`** (타입 + 포맷 + 결정론 + 테스트)를 통과시킨다. 포맷은 `npm run format`.
- 게임 로직(`src/game`, `src/fighter`, `src/characters`, `src/anim`, `src/core`, `src/input/inputBuffer.ts`, `src/training/guide.ts`)에서는 `Math.random()`, `Date.now()`, `performance.now()`를 쓰지 않는다. 시간은 프레임 수로 센다.
- 로직은 렌더러를 몰라야 한다. 연출이 필요하면 `GameEvent`를 보낸다.
- 새 기술 동작은 `fighter.ts`에 기술 id로 분기하지 말고 `MoveDef` 필드로 표현한다. 기술은 `src/characters/builders.ts` 도우미로 만들고, 필살기에는 `desc`를 단다.
- 새 규칙이나 시스템에는 `src/game/match.test.ts`에 테스트를 추가한다.
- **기술 동작은 그 장르의 실제 춤 동작에서 온다.** 기준은 [docs/design/DANCE_REFERENCE.md](docs/design/DANCE_REFERENCE.md) 맨 위 "확정 구성". 일반적인 펀치·킥을 새로 만들지 않는다.
- 주석과 문서는 한국어, 코드 이름은 영어.
- 커밋 메시지: `종류: 내용` (예: `feat: 타겟 콤보 추가`).

## 5. 그림 규칙

- 640×640, 투명 배경, 발밑 기준점 (320, 580), 오른쪽을 본다. 게임에는 **WebP**(품질 90)로 넣는다.
- 결과는 먼저 `sprites-work/`에 두고, `python3 scripts/check_sprites.py <id> --dir <폴더>`와 `python3 scripts/contact_sheet.py <id> <동작…> --dir <폴더>`로 확인한 뒤 `public/sprites/`로 옮긴다.
- sprite-gen은 **전용 CLI만** 쓴다: `~/.codex/skills/sprite-gen/.venv/bin/sprite-gen` (전역 python이나 PATH의 sprite-gen 금지). 모델은 `--model gpt-5.6-sol`.
- 모델(캐릭터 생김새)·크기의 기준은 각 캐릭터의 `idle_0`이다.

## 6. 확인 방법

```bash
npm run dev -- --port $PORT --strictPort          # 이 작업 폴더 전용 개발 서버
GAME_URL=$GAME_URL npm run shots -- krump/sLP      # 기술 프레임 찍기 → shots/
node scripts/look.mjs "gallery=lineup"             # 외형
node scripts/spritegen/moves.mjs && python3 scripts/spritegen/frame_data.py   # 프레임 표 다시 만들기
```

## 7. 작업 보고 (끝날 때)

작업을 마치면 아래를 남긴다 (PR 설명 또는 사용자에게 보고):

- 브랜치와 커밋 목록
- 바꾼 것 / 일부러 바꾸지 않은 것
- `npm run check` 결과 (실패했으면 그대로)
- 다른 에이전트가 알아야 할 것 (공용 파일을 고쳤는지, 공유 폴더 `sprites-ref`·`sprites-work`를 덮어썼는지)
