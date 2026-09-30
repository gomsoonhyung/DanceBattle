# 참여 가이드

DANCE BATTLE에 참여해 주셔서 고마워요! 이 문서는 함께 작업할 때 지키는 약속을 정리한 것입니다.
처음이라면 **1. 처음 설정** → **2. 작업 흐름**만 읽어도 바로 시작할 수 있어요.

## 1. 처음 설정

필요한 것: [Node.js](https://nodejs.org/) 20.19 이상 (권장 22), Git, Chrome

```bash
git clone https://github.com/gomsoonhyung/DanceBattle.git
cd DanceBattle
npm install
npm run dev        # http://localhost:5173 에서 실행
```

에디터는 VS Code를 추천합니다. **Prettier 확장**을 설치하고 "Format On Save"를 켜 두면 코드 스타일을 신경 쓸 필요가 없어요.

## 2. 작업 흐름

`main` 브랜치에는 직접 푸시하지 않고, **브랜치 → PR → 리뷰 → 머지** 순서로 작업합니다.

```bash
# 1) 항상 최신 main에서 시작
git switch main
git pull

# 2) 작업용 브랜치 만들기
git switch -c feat/popper-character

# 3) 작업하고 커밋 (여러 번 나눠도 OK)
git add -A
git commit -m "feat: 팝핑 캐릭터 기본 자세 추가"

# 4) 올리기 전에 검사
npm run check

# 5) 푸시하고 GitHub에서 Pull Request 만들기
git push -u origin feat/popper-character
```

PR을 만들면:

1. **CI**(자동 검사)가 타입 · 포맷 · 테스트 · 빌드를 확인합니다. 빨간 X가 뜨면 로그를 보고 고쳐서 다시 푸시하세요.
2. 리뷰어가 자동으로 지정됩니다. 리뷰 코멘트를 반영해서 같은 브랜치에 푸시하면 PR이 갱신돼요.
3. 승인되면 **Squash and merge**로 합칩니다. 머지한 브랜치는 삭제합니다.

> 작업을 시작하기 전에 **이슈**를 먼저 만들거나 기존 이슈에 "제가 할게요" 댓글을 남겨 주세요. 같은 걸 두 명이 만드는 일을 막을 수 있어요.

### 브랜치 이름

`종류/짧은-영어-설명` 형식으로 짓습니다.

| 종류        | 언제                        | 예시                                         |
| ----------- | --------------------------- | -------------------------------------------- |
| `feat/`     | 새 기능, 캐릭터, 기술, 화면 | `feat/popper-character`, `feat/throw-system` |
| `art/`      | 스프라이트 그림 추가·교체   | `art/krump-idle`                             |
| `fix/`      | 버그 수정                   | `fix/rush-passes-through-wall`               |
| `balance/`  | 데미지, 프레임, 판정 조정   | `balance/krump-chest-pop`                    |
| `docs/`     | 문서                        | `docs/move-guide`                            |
| `refactor/` | 동작은 그대로, 코드만 정리  | `refactor/split-renderer`                    |

### 커밋 메시지

`종류: 무엇을 했는지` 형식으로, 한국어로 써도 됩니다. 종류는 브랜치와 같고 `test`, `chore`(설정·의존성)를 더 씁니다.

```
feat: 락킹 초필살기 락 앤 포인트 추가
fix: 히트스톱 중 캔슬 입력이 사라지던 문제
balance: 체스트 팝 데미지 120 → 100
```

### 좋은 PR

- **작게, 한 가지 주제만.** "캐릭터 추가"와 "HUD 수정"은 따로 올려 주세요. 리뷰가 빨라지고 충돌도 줄어요.
- **스크린샷이나 짧은 영상**을 붙여 주세요. 동작이 바뀌는 PR은 코드만 봐서는 판단하기 어려워요.
- 밸런스 변경이라면 **바꾼 수치와 이유**를 적어 주세요.

## 3. 충돌을 줄이는 방법

- 캐릭터는 `src/characters/<캐릭터>/` 폴더 단위로 나뉘어 있어서, 서로 다른 캐릭터를 동시에 작업해도 거의 충돌하지 않아요.
- 아래 **공용 파일**을 바꿀 때는 이슈나 PR 설명에 미리 알려 주세요. 여러 사람이 동시에 고치면 충돌이 잘 납니다.
  - `src/fighter/types.ts` (데이터 형식), `src/fighter/fighter.ts` (상태 머신)
  - `src/game/combat.ts` (판정), `src/game/match.ts` (대전 진행)
  - `src/characters/index.ts` (캐릭터 목록)
- 오래 걸리는 작업은 중간중간 `git pull origin main` 으로 최신 내용을 받아 두세요.

## 4. 코드 규칙

- **포맷은 Prettier가 정합니다.** `npm run format` 한 번이면 끝. CI가 포맷도 검사해요.
- **주석과 문서는 한국어**로 씁니다. 코드 이름(변수, 함수)은 영어로.
- **게임 로직은 결정론적이어야 합니다.** 자세한 규칙은 [ARCHITECTURE.md](docs/ARCHITECTURE.md#결정론-규칙)를 보세요.
  요약: `src/game/`, `src/fighter/`, `src/characters/`, `src/input/inputBuffer.ts` 에서는 `Math.random()`, `Date.now()`, `performance.now()` 를 쓰지 않습니다.
- **로직과 그리기를 섞지 않습니다.** 게임 로직은 렌더러를 몰라야 해요. 로직에서 연출이 필요하면 `GameEvent`를 보내고 렌더러가 받아서 처리합니다.
- **기술은 데이터로 만듭니다.** 새 기술 때문에 `fighter.ts`에 `if (move.id === 'xxx')` 를 넣고 싶어지면, 대신 `MoveDef`에 필드를 추가하는 방향으로 가 주세요.
- **새 시스템에는 테스트를 붙입니다.** (장풍, 아머 같은 규칙) `src/game/match.test.ts` 에 예시가 많아요.

## 5. 테스트와 확인 도구

| 명령                                                             | 하는 일                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run check`                                                  | PR 전에 이것만 돌리면 됩니다 (타입 + 포맷 + 테스트)                            |
| `npm test` / `npm run test:watch`                                | 로직 테스트 (한 번 / 파일 저장할 때마다)                                       |
| `npm run format`                                                 | 코드 스타일 자동 정리                                                          |
| `npm run build`                                                  | 배포용 빌드                                                                    |
| `node scripts/export-sprites.mjs krump sHP`                      | 스프라이트 참고 그림 내보내기 → `sprites-ref/` ([SPRITES.md](docs/SPRITES.md)) |
| `python3 scripts/fit_sprite.py 생성.png 결과.png --ref 참고.png` | 생성한 그림을 스프라이트 규격에 맞추기                                         |
| `python3 scripts/check_sprites.py krump`                         | 넣은 스프라이트 검사                                                           |
| `npm run shots -- krump/stompWave`                               | 동작을 프레임별로 찍은 이미지를 `shots/`에 저장 (개발 서버가 켜져 있어야 함)   |

게임 안에서는:

- **F1**: 판정 박스 보기 (초록 = 맞는 판정, 빨강 = 공격 판정). 기술 이름과 현재 프레임도 표시됩니다.
- **트레이닝 모드**: 연습 상대 행동(서기/앉기/점프/자동 가드)을 F2로 바꿔 가며 테스트
- **갤러리**: `http://localhost:5173/?gallery&char=krump` (모든 동작 재생), `?gallery=stompWave&char=krump` (프레임별 나열)

## 6. 더 읽을거리

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): 코드 구조와 프레임마다 일어나는 일
- [docs/CHARACTER_GUIDE.md](docs/CHARACTER_GUIDE.md): 캐릭터·기술·포즈 만드는 법, 프레임 데이터 기준표
- [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md): 저장소 관리자용 GitHub 설정

모르는 게 있으면 편하게 이슈로 물어봐 주세요!
