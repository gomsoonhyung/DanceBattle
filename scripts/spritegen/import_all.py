#!/usr/bin/env python3
# 사용: import_all.py <캐릭터id> [실행 이름]  → sprites-work/sg/<id>/ 로 옮긴다
import json, subprocess, sys, os
c = sys.argv[1]
n = sys.argv[2] if len(sys.argv) > 2 else c
run = f"sprites-work/batch/runs/{n}/run"
plan = json.load(open(f"sprites-work/batch/runs/{n}/plan.json"))
bad = []
for state, p in plan.items():
    if not os.path.isdir(f"{run}/frames/{state}"):
        bad.append((state, "프레임 없음")); continue
    r = subprocess.run(["python3", "scripts/import_sprite_gen.py", run, state, c, "--anim", p["anim"],
                        "--frames", ",".join(map(str, p["frames"])), "--out", f"sprites-work/sg/{n}"], capture_output=True, text=True)
    if r.returncode:
        bad.append((state, (r.stdout + r.stderr).strip().splitlines()[-1]))
    else:
        print(state, r.stdout.splitlines()[0])
print("실패:", bad)
