#!/usr/bin/env python3
"""
public/sprites/ 의 PNG 그림을 WebP(품질 90)로 바꾸고 manifest를 고친다. PNG는 지운다.
  python3 scripts/spritegen/to_webp.py            (모든 캐릭터)
  python3 scripts/spritegen/to_webp.py krump      (한 캐릭터)
PNG의 약 4분의 1 크기이고, 투명한 가장자리도 눈으로는 차이가 없다.
"""

import glob
import json
import os
import sys

from PIL import Image

QUALITY = 90
chars = sys.argv[1:] or sorted(os.path.basename(d) for d in glob.glob("public/sprites/*") if os.path.isdir(d))
before = after = 0
for c in chars:
    d = f"public/sprites/{c}"
    mp = f"{d}/manifest.json"
    man = json.load(open(mp))
    for e in man["frames"].values():
        for slot in ("p1", "p2"):
            n = e.get(slot)
            if not n or not n.endswith(".png"):
                continue
            src = f"{d}/{n}"
            dst = src[:-4] + ".webp"
            if os.path.exists(src):
                Image.open(src).save(dst, "WEBP", quality=QUALITY, method=4)
                before += os.path.getsize(src)
                after += os.path.getsize(dst)
                os.remove(src)
            elif not os.path.exists(dst):
                continue  # 둘 다 없으면 건드리지 않는다
            e[slot] = n[:-4] + ".webp"  # 중간에 끊겼다 다시 돌려도 이어서 된다
    json.dump(man, open(mp, "w"), indent=2, ensure_ascii=False)
    open(mp, "a").write("\n")
    print(f"{c}: 완료")
print(f"{before / 1e6:.1f}MB → {after / 1e6:.1f}MB")
