#!/usr/bin/env python3
# 사용: publish.py <캐릭터id> [작업 폴더 이름]  → sprites-work/sg/<작업 폴더>/ 의 그림을 public/sprites/<id>/ 로 옮기고 manifest 에 추가
import json, os, shutil, sys, subprocess

from PIL import Image

WEBP_QUALITY = 90
c = sys.argv[1]
src, dst = f"sprites-work/sg/{sys.argv[2] if len(sys.argv) > 2 else c}", f"public/sprites/{c}"
work = json.load(open(f"{src}/manifest.json"))["frames"]
pm = f"{dst}/manifest.json"
man = json.load(open(pm))
added = 0
# 다시 만든 동작은 옛 프레임 목록을 먼저 지운다 (키 포즈 번호가 바뀌었을 수 있다)
import os
redone = {k.rsplit("_", 1)[0] for k in work}
for key in [k for k in man["frames"] if k.rsplit("_", 1)[0] in redone and k not in work]:
    f = f"{dst}/{man['frames'][key]['p1']}"
    if os.path.exists(f):
        os.remove(f)
    del man["frames"][key]
for key, e in work.items():
    # 게임에는 WebP로 넣는다 (PNG의 약 4분의 1 크기, 눈으로는 차이 없음)
    name = os.path.splitext(e["p1"])[0] + ".webp"
    old = man["frames"].get(key, {}).get("p1")
    if old and old != name and os.path.exists(f"{dst}/{old}"):
        os.remove(f"{dst}/{old}")
    Image.open(f"{src}/{e['p1']}").save(f"{dst}/{name}", "WEBP", quality=WEBP_QUALITY, method=6)
    if key not in man["frames"]:
        added += 1
    man["frames"][key] = {"p1": name}
json.dump(man, open(pm, "w"), indent=2, ensure_ascii=False)
subprocess.run(["npx", "prettier", "--write", pm], capture_output=True)
print(f"{c}: {added}장 추가, 전체 {len(man['frames'])}장")
