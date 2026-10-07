#!/bin/zsh
# 에이전트(또는 사람)마다 따로 쓰는 작업 폴더(git worktree)를 만들고 지운다. 자세한 설명: docs/WORKTREE.md
#
#   zsh scripts/worktree.sh add <이름> <브랜치> [기준 브랜치]   새 작업 폴더 + 새 브랜치 (기준 기본값: 지금 브랜치)
#   zsh scripts/worktree.sh add <이름> <있는 브랜치>             이미 있는 브랜치를 작업 폴더로
#   zsh scripts/worktree.sh list                                  작업 폴더 목록과 개발 서버 포트
#   zsh scripts/worktree.sh remove <이름>                         작업 폴더 지우기 (브랜치는 남는다)
#
# 작업 폴더 위치: 저장소 옆 ../GameProject-wt/<이름>
# 각 폴더에 .worktree.env 를 만들어 개발 서버 포트(PORT)와 검사 스크립트 주소(GAME_URL)를 따로 준다.
set -eu

ROOT=$(git rev-parse --show-toplevel)
MAIN=$(git -C "$ROOT" worktree list --porcelain | head -1 | sed 's/^worktree //')
WT_DIR="$(dirname "$MAIN")/$(basename "$MAIN")-wt"
cmd=${1:-}

# 쓰고 있지 않은 포트 중 5174부터 차례로 (5173은 원래 폴더용)
next_port() {
  local p=5174
  while grep -qs "^PORT=$p\$" "$WT_DIR"/*/.worktree.env; do p=$((p + 1)); done
  echo $p
}

case "$cmd" in
  add)
    name=${2:?이름이 필요합니다}
    branch=${3:?브랜치가 필요합니다}
    base=${4:-$(git -C "$ROOT" branch --show-current)}
    dir="$WT_DIR/$name"
    mkdir -p "$WT_DIR"
    if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$branch"; then
      git -C "$ROOT" worktree add "$dir" "$branch"
    else
      git -C "$ROOT" worktree add -b "$branch" "$dir" "$base"
    fi
    # node_modules 는 원래 폴더 것을 같이 쓴다 (설치 시간 절약). package.json을 바꾸는 작업이면 지우고 npm ci
    [ -e "$dir/node_modules" ] || ln -s "$MAIN/node_modules" "$dir/node_modules"
    # git이 관리하지 않는 그림 작업 폴더도 원래 폴더 것을 같이 쓴다
    for d in sprites-ref sprites-work; do
      [ -e "$dir/$d" ] || { [ -d "$MAIN/$d" ] && ln -s "$MAIN/$d" "$dir/$d"; }
    done
    port=$(next_port)
    printf 'PORT=%s\nGAME_URL=http://localhost:%s\n' "$port" "$port" > "$dir/.worktree.env"
    echo ""
    echo "✅ $dir  (브랜치 $branch, 개발 서버 포트 $port)"
    echo "   cd $dir"
    echo "   npm run dev -- --port $port --strictPort"
    echo "   export GAME_URL=http://localhost:$port   # shots·export-sprites 등 검사 스크립트용"
    ;;
  list)
    git -C "$ROOT" worktree list
    for f in "$WT_DIR"/*/.worktree.env(N); do
      echo "$(basename "$(dirname "$f")"): $(grep '^PORT=' "$f")"
    done
    ;;
  remove)
    name=${2:?이름이 필요합니다}
    dir="$WT_DIR/$name"
    # 링크는 먼저 지운다 (원래 폴더의 node_modules 등이 지워지지 않도록)
    for d in node_modules sprites-ref sprites-work; do [ -L "$dir/$d" ] && rm "$dir/$d"; done
    rm -f "$dir/.worktree.env"
    git -C "$ROOT" worktree remove "$dir"
    echo "✅ 지움: $dir (브랜치는 남아 있습니다. 필요 없으면 git branch -d <브랜치>)"
    ;;
  *)
    sed -n 2,10p "$0"
    exit 1
    ;;
esac
