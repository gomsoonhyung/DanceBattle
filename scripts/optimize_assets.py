#!/usr/bin/env python3
"""
큰 무대·로고 PNG를 웹용 WebP로 바꾼다 (디자이너는 PNG로 넣고, 게임은 WebP를 쓴다).

  python3 scripts/optimize_assets.py

  public/assets/stage/<무대>/bg.png → bg.webp (품질 82)
  public/assets/ui/logo.png         → logo.webp (품질 90, 투명 유지)
변환한 PNG는 지운다 (원본은 git 기록과 디자이너 작업 폴더에 남아 있다).
"""

import glob
import os

from PIL import Image

targets = [(p, 82, False) for p in glob.glob("public/assets/stage/*/bg.png")]
if os.path.exists("public/assets/ui/logo.png"):
    targets.append(("public/assets/ui/logo.png", 90, True))

if not targets:
    print("변환할 PNG가 없습니다.")
for path, quality, alpha in targets:
    out = path[:-4] + ".webp"
    img = Image.open(path).convert("RGBA" if alpha else "RGB")
    img.save(out, "WEBP", quality=quality, method=6)
    before, after = os.path.getsize(path) / 1024, os.path.getsize(out) / 1024
    os.remove(path)
    print(f"✅ {path} → {out}  {before:.0f}KB → {after:.0f}KB")
