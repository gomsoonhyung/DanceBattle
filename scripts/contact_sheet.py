#!/usr/bin/env python3
"""
스프라이트 비교 시트: 채택된 대기 그림(idle_0)을 맨 앞에 두고 여러 동작을 한 줄씩 나란히 놓는다.
대기 그림의 머리 꼭대기와 발밑에 기준선을 그어, 동작끼리 크기·비율·옷차림이 튀는 프레임을 눈으로 찾기 쉽게 한다.

  python3 scripts/contact_sheet.py locker walkF walkB crouch      → shots/sheet_locker.png
  python3 scripts/contact_sheet.py krump --all                     → 모든 동작

필요: Python 3 + Pillow
"""

import argparse
import json
import os

from PIL import Image, ImageDraw

CELL = 150  # 칸 크기 (px)
CROP = (80, 120, 560, 600)  # 640×640 중 캐릭터가 있는 영역 (정사각형이라 줄여도 비율이 그대로)


def bbox(img):
    return img.getchannel("A").point(lambda a: 255 if a >= 16 else 0).getbbox()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("char")
    ap.add_argument("anims", nargs="*")
    ap.add_argument("--all", action="store_true", help="manifest의 모든 동작")
    args = ap.parse_args()

    base = f"public/sprites/{args.char}"
    frames = json.load(open(f"{base}/manifest.json"))["frames"]
    by_anim = {}
    for k in frames:
        by_anim.setdefault(k.rsplit("_", 1)[0], []).append(k)
    anims = list(by_anim) if args.all or not args.anims else args.anims
    rows = [(a, sorted(by_anim.get(a, []), key=lambda k: int(k.rsplit("_", 1)[1]))) for a in anims]
    rows = [(a, ks) for a, ks in rows if ks]

    idle = Image.open(f"{base}/{frames['idle_0']['p1']}").convert("RGBA") if "idle_0" in frames else None
    cols = 1 + max(len(ks) for _, ks in rows)
    sy = CELL / (CROP[3] - CROP[1])  # 줄이는 배율
    out = Image.new("RGBA", (cols * CELL, len(rows) * (CELL + 18)), (34, 30, 48, 255))
    d = ImageDraw.Draw(out)

    guide = None
    if idle:
        b = bbox(idle)
        guide = ((b[1] - CROP[1]) * sy, (b[3] - CROP[1]) * sy)  # 대기 그림의 머리 꼭대기, 발밑

    for r, (anim, keys) in enumerate(rows):
        y0 = r * (CELL + 18)
        cells = ([("idle_0 REF", idle)] if idle else []) + [
            (k, Image.open(f"{base}/{frames[k]['p1']}").convert("RGBA")) for k in keys
        ]
        for c, (name, img) in enumerate(cells):
            tile = img.crop(CROP).resize((CELL, CELL), Image.LANCZOS)
            out.alpha_composite(tile, (c * CELL, y0))
            d.text((c * CELL + 3, y0 + CELL + 2), name, fill=(255, 210, 63) if c == 0 else (220, 220, 230))
        if guide:
            for gy, color in ((guide[0], (124, 255, 178)), (guide[1], (255, 90, 90))):
                d.line([(0, y0 + gy), (cols * CELL, y0 + gy)], fill=color, width=1)
        d.text((cols * CELL - 60, y0 + 3), anim, fill=(255, 255, 255))

    os.makedirs("shots", exist_ok=True)
    path = f"shots/sheet_{args.char}.png"
    out.save(path)
    print(f"✅ {path}  (초록 선 = 대기 그림의 머리 꼭대기, 빨간 선 = 발밑)")


if __name__ == "__main__":
    main()
