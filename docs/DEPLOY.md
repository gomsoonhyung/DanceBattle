# 개발 · 시험 배포 나누기

개발 중인 게임과, 사람들에게 보여 줄 **시험 배포판**을 나눠서 동시에 띄워 보는 방법입니다.

## 1. 구성

|        | 개발                                                          | 시험 배포                                                 |
| ------ | ------------------------------------------------------------- | --------------------------------------------------------- |
| 브랜치 | `develop` (작업 브랜치들이 여기로 합쳐짐)                     | `release`                                                 |
| 폴더   | `~/GameProject` (각 에이전트는 `~/GameProject-wt/…`)          | `~/GameProject-deploy` (**고치지 않는 폴더**)             |
| 실행   | `npm run dev` → http://localhost:**5173** (작업 폴더는 5174~) | `zsh scripts/deploy.sh serve` → http://localhost:**4173** |
| 방식   | 개발 서버 (저장하면 바로 바뀜)                                | 실제 배포처럼 빌드한 결과(`dist/`)를 띄움                 |
| 캐릭터 | 8명 전부                                                      | `.env.release`에 적은 캐릭터만 (지금: **B-BOY**)          |

```
feat/… art/… fix/…  ──합치기──▶  develop  ──promote──▶  release  ──serve──▶  localhost:4173
                                  (5173에서 개발)          (GitHub)          (배포 폴더)
```

## 2. 처음 한 번

```bash
zsh scripts/deploy.sh setup      # ~/GameProject-deploy 를 만들고 release 브랜치를 붙인다
```

## 3. 시험 배포판 올리기

```bash
zsh scripts/deploy.sh promote            # develop → release (기본). 다른 브랜치면: promote art/roster-full
zsh scripts/deploy.sh serve              # release를 받아 와 빌드하고 4173에 띄운다 (Ctrl+C로 끔)
```

- `promote`는 **앞으로 감기(fast-forward)만** 한다. release에서 따로 커밋한 게 있으면 멈추고 알려 준다. 배포 폴더에서는 고치지 않는다.
- `serve`는 GitHub의 release를 먼저 받아 온다(pull). 다른 컴퓨터에서 promote 한 것도 반영된다.
- 개발 서버(5173)와 배포판(4173)을 **동시에** 켜 두고 비교할 수 있다.

검사 스크립트를 배포판에 돌리려면: `GAME_URL=http://localhost:4173 node scripts/play.mjs`

## 4. 공개할 캐릭터 정하기

배포판에 나오는 캐릭터는 저장소의 `.env.release` 한 줄로 정한다.

```bash
VITE_ROSTER=bboy                  # B-BOY만
VITE_ROSTER=bboy,krump,locker     # 세 명 (적은 순서대로 나온다)
VITE_ROSTER=                      # 비우면 8명 전부
```

- 바꾼 뒤 develop에 커밋 → `promote` → `serve`.
- 코드는 그대로이고 **보이는 캐릭터만** 바뀐다. 그래서 develop과 release의 코드가 갈라지지 않는다.
- 개발 서버에서 미리 보기: http://localhost:5173/?roster=bboy

| id           | 캐릭터      |
| ------------ | ----------- |
| `waacker`    | WAACKER     |
| `krump`      | KRUMPER     |
| `hiphopper`  | HIPHOPPER   |
| `hiphopgirl` | HIPHOP GIRL |
| `locker`     | LOCKER      |
| `househead`  | HOUSE HEAD  |
| `popper`     | POPPER      |
| `bboy`       | B-BOY       |

## 5. 확인 목록 (시험 배포 전에)

- [ ] develop에서 `npm run check` 통과
- [ ] `promote` 후 `serve` 로 4173에서 타이틀 → 선택 → 대전 → 연습 모드가 다 되는지
- [ ] 공개한 캐릭터의 그림이 다 나오는지 (코드로 그린 인형이 섞여 보이지 않는지)
