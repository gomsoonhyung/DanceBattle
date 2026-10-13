#!/bin/zsh
# 시험 배포: release 브랜치를 배포 폴더로 받아 와 배포판으로 빌드하고 4173 포트에 띄운다. 설명: docs/DEPLOY.md
#
#   zsh scripts/deploy.sh setup              배포 폴더 만들기 (../GameProject-deploy, release 브랜치)
#   zsh scripts/deploy.sh promote [브랜치]   개발 브랜치(기본 develop)를 release로 올리고 GitHub에 푸시
#   zsh scripts/deploy.sh serve              release를 받아 와(pull) 빌드하고 http://localhost:4173 에 띄우기
#   zsh scripts/deploy.sh status             배포 폴더가 어느 커밋인지
set -eu

ROOT=$(git rev-parse --show-toplevel)
MAIN=$(git -C "$ROOT" worktree list --porcelain | head -1 | sed 's/^worktree //')
DEPLOY="$(dirname "$MAIN")/$(basename "$MAIN")-deploy"
BRANCH=release
cmd=${1:-}

ensure() {
  [ -d "$DEPLOY" ] || { echo "배포 폴더가 없습니다. 먼저: zsh scripts/deploy.sh setup"; exit 1; }
}

case "$cmd" in
  setup)
    if [ -d "$DEPLOY" ]; then echo "이미 있습니다: $DEPLOY"; exit 0; fi
    if git -C "$MAIN" show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git -C "$MAIN" worktree add "$DEPLOY" "$BRANCH"
    else
      git -C "$MAIN" worktree add -b "$BRANCH" "$DEPLOY" develop
    fi
    ln -s "$MAIN/node_modules" "$DEPLOY/node_modules"
    echo "✅ $DEPLOY (브랜치 $BRANCH)"
    ;;
  promote)
    ensure
    src=${2:-develop}
    # 배포 폴더에서 작업 중인 변경이 있으면 멈춘다 (배포 폴더는 고치지 않는 곳)
    [ -z "$(git -C "$DEPLOY" status --porcelain)" ] || { echo "배포 폴더에 커밋 안 된 변경이 있습니다"; exit 1; }
    git -C "$DEPLOY" merge --ff-only "$src" || {
      echo "❌ $BRANCH 가 $src 의 앞쪽 기록이 아닙니다 (release에서 따로 커밋함). 직접 합쳐 주세요."; exit 1; }
    git -C "$DEPLOY" push -u origin "$BRANCH"
    echo "✅ $src → $BRANCH ($(git -C "$DEPLOY" log --oneline -1))"
    ;;
  serve)
    ensure
    cd "$DEPLOY"
    git fetch -q origin "$BRANCH" 2>/dev/null && git merge -q --ff-only "origin/$BRANCH" 2>/dev/null || true
    echo "배포판: $(git log --oneline -1)"
    npm run build:release
    echo "▶ http://localhost:4173  (끄려면 Ctrl+C)"
    npm run preview:release
    ;;
  status)
    ensure
    git -C "$DEPLOY" log --oneline -1
    git -C "$DEPLOY" status --short | head
    ;;
  *)
    sed -n 2,8p "$0"
    exit 1
    ;;
esac
