# git worktree로 여러 에이전트가 동시에 작업하기

한 저장소에서 **작업 폴더를 여러 개** 만들어, 에이전트(Claude Code, Codex 등)나 사람이 **서로 다른 브랜치를 동시에** 작업하는 방법입니다.
같은 폴더에서 둘이 작업하면 브랜치를 바꿀 때마다 서로의 파일이 뒤섞이지만, worktree를 쓰면 폴더가 따로라서 그럴 일이 없습니다.

## 1. 개념

```
~/GameProject/                      ← 원래 폴더 (main 또는 지금 브랜치)
~/GameProject-wt/
   ├─ claude-feat/                  ← Claude 작업 폴더  (브랜치 feat/xxx)
   ├─ codex-art/                    ← Codex 작업 폴더   (브랜치 art/xxx)
   └─ review/                       ← 리뷰용 폴더       (브랜치 review/xxx)
```

- 폴더마다 **브랜치가 하나씩** 붙습니다. 같은 브랜치를 두 폴더에서 동시에 열 수는 없습니다 (git이 막아 줍니다).
- 커밋·브랜치·원격(GitHub)은 **모두 공유**합니다. 한 폴더에서 커밋하면 다른 폴더에서도 `git log`로 바로 보입니다. `git fetch`도 한 번이면 됩니다.
- 파일만 따로입니다. 그래서 한 폴더의 작업 중인(커밋 전) 변경은 다른 폴더에 영향을 주지 않습니다.

## 2. 빠른 사용법 (도우미 스크립트)

원래 폴더(`~/GameProject`)에서:

```bash
# 새 작업 폴더 + 새 브랜치 (기준: 지금 브랜치. 다른 기준이면 마지막에 적기)
zsh scripts/worktree.sh add claude-feat feat/target-combo
zsh scripts/worktree.sh add codex-art art/krump-polish main

# 이미 있는 브랜치를 작업 폴더로
zsh scripts/worktree.sh add review art/roster-full

# 목록 (폴더·브랜치·개발 서버 포트)
zsh scripts/worktree.sh list

# 다 쓴 작업 폴더 지우기 (브랜치는 남는다)
zsh scripts/worktree.sh remove claude-feat
```

스크립트가 해 주는 것:

| 하는 일                                                          | 이유                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `../GameProject-wt/<이름>` 에 폴더를 만들고 브랜치를 붙인다      | 위치를 한 곳으로 모아 헷갈리지 않게                        |
| `node_modules`를 원래 폴더 것과 **링크로 공유**                  | 폴더마다 `npm install` 하지 않아도 바로 실행               |
| `sprites-ref`, `sprites-work`도 링크로 공유                      | git이 관리하지 않는 그림 작업 폴더라 새 폴더에는 없기 때문 |
| `.worktree.env`에 **개발 서버 포트**를 따로 정해 둔다 (5174부터) | 두 폴더가 동시에 `npm run dev`를 켜도 충돌하지 않게        |

## 3. 작업 폴더 안에서

```bash
cd ~/GameProject-wt/claude-feat
source .worktree.env                               # PORT, GAME_URL 을 불러온다
npm run dev -- --port $PORT --strictPort           # 이 폴더 전용 개발 서버
export GAME_URL                                    # 검사 스크립트(shots, export-sprites, spritegen)가 이 서버를 보게
npm run check                                      # 커밋 전 검사 (타입·포맷·결정론·테스트)
git add … && git commit -m "feat: …"
git push -u origin feat/target-combo
```

> 원래 폴더의 개발 서버는 5173입니다. 작업 폴더는 5174, 5175 … 를 씁니다.

## 4. 손으로 하는 방법 (스크립트 없이)

```bash
git worktree add -b feat/xxx ../GameProject-wt/xxx art/roster-full   # 새 브랜치로
git worktree add ../GameProject-wt/yyy art/roster-full               # 있는 브랜치로
cd ../GameProject-wt/xxx && npm ci                                   # 의존성 (또는 node_modules 링크)
git worktree list                                                    # 목록
git worktree remove ../GameProject-wt/xxx                            # 지우기
git worktree prune                                                   # 폴더를 그냥 지웠을 때 기록 정리
```

## 5. 주의할 점

| 상황                                                    | 이렇게                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **공유 폴더(`sprites-ref`, `sprites-work`)**            | 링크라서 **모든 작업 폴더가 같은 내용**을 봅니다. `export-sprites.mjs <id> <동작>`처럼 일부만 내보내면 그 캐릭터의 참고 그림 목록이 덮어써집니다. 그림 작업은 **한 번에 한 작업 폴더에서만** 하고, sprite-gen 실행 이름(`runs/<이름>`)은 작업 폴더마다 다르게 짓습니다 |
| `package.json`을 바꾸는 작업                            | 그 폴더의 `node_modules` 링크를 지우고 `npm ci`로 따로 설치합니다 (`rm node_modules && npm ci`)                                                                                                                                                                        |
| 같은 파일을 두 폴더에서 고침                            | 합칠 때 충돌합니다. 공용 파일(아래 6절)은 동시에 하나의 작업 폴더에서만 고칩니다                                                                                                                                                                                       |
| 원래 폴더에서 브랜치를 바꾸려는데 "already checked out" | 그 브랜치가 다른 작업 폴더에 열려 있습니다. 그 폴더에서 작업하거나 먼저 지웁니다                                                                                                                                                                                       |
| 작업 폴더를 Finder 등으로 그냥 지움                     | `git worktree prune`으로 기록을 정리합니다                                                                                                                                                                                                                             |
| `.worktree.env`                                         | git이 무시하는 파일입니다 (`.gitignore`). 커밋되지 않습니다                                                                                                                                                                                                            |

## 6. 동시에 고치면 충돌이 잘 나는 공용 파일

- `src/fighter/types.ts`, `src/fighter/fighter.ts`, `src/game/combat.ts`, `src/game/match.ts`
- `src/characters/index.ts`, `src/characters/builders.ts`, `src/characters/common.ts`
- `src/render/renderer.ts`, `src/main.ts`
- `public/sprites/<캐릭터>/manifest.json` (같은 캐릭터 그림을 둘이 동시에 넣을 때)

캐릭터별 폴더(`src/characters/<캐릭터>/`)와 문서는 나눠서 작업하면 거의 충돌하지 않습니다.

## 7. 끝나면

1. 작업 폴더에서 `npm run check` → 커밋 → 푸시 → GitHub에서 PR
2. PR이 합쳐지면 `zsh scripts/worktree.sh remove <이름>`
3. 필요 없는 브랜치는 `git branch -d <브랜치>` (원격은 `git push origin --delete <브랜치>`)
