#!/bin/zsh
# 사용: run.sh <캐릭터id> [실행 이름]   (sprites-work/batch/runs/<실행 이름>/request.json 이 있어야 함)
set -u
C=$1; N=${2:-$1}; G=${0:A:h:h:h}; R=$G/sprites-work/batch/runs/$N/run
SG=${SPRITE_GEN:-$HOME/.codex/skills/sprite-gen/.venv/bin/sprite-gen}  # 전용 CLI만 쓴다
B=$G/public/sprites/$C/idle_0.png
cd $G/sprites-work/batch/runs/$N
$SG workflow --kind sprite --base-image $B --motion-method gpt-rows --confirmed-access codex > workflow.json
[ -f $R/sprite-request.json ] || $SG prepare --out-dir $R --character-id $C --base-image $B --request $G/sprites-work/batch/runs/$N/request.json > prepare.log 2>&1 || { echo "prepare 실패"; exit 1; }
$SG gen-set --run-dir $R --provider codex --model gpt-5.6-sol --concurrency 3 > gen.log 2>&1
echo "gen-set exit $?"
$SG extract --run-dir $R > extract.log 2>&1; echo "extract exit $?"
$SG compose-atlas --run-dir $R > atlas.log 2>&1; echo "atlas exit $?"
$SG compose-gif --run-dir $R --out-dir $R/previews > gif.log 2>&1; echo "gif exit $?"
$SG inspect --run-dir $R > inspect.log 2>&1; echo "inspect exit $?"
