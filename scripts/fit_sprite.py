#!/usr/bin/env python3
"""
생성된 캐릭터 그림을 스프라이트 규격(640×640, 투명 배경, 발밑 기준점)에 맞춘다.

  python3 scripts/fit_sprite.py 생성그림.png public/sprites/krump/idle_0.png --ref docs/design/reference/krump/idle_0.png

하는 일
  1. 배경 지우기: 그림에 투명한 곳이 거의 없으면 네 모서리 색을 배경으로 보고 지운다 (단색 배경 권장, 예: #00FF00)
  2. 캐릭터만 잘라 내기
  3. 참고 그림(--ref)과 같은 키, 같은 발밑 높이, 같은 가로 중심으로 640×640에 배치
     (--ref가 없으면 키 380px, 발밑 y=580, 가로 중심 x=320)

필요: Python 3 + Pillow (pip install pillow)
"""

import argparse
import sys

from PIL import Image

SIZE = 640
DEFAULT_BOTTOM = 580
DEFAULT_CENTER = 320
DEFAULT_HEIGHT = 380
ALPHA_MIN = 16  # 이보다 옅은 픽셀은 캐릭터가 아닌 것으로 본다
MAX_KB = 300


def parse_hex(s):
    s = s.lstrip("#")
    return tuple(int(s[i : i + 2], 16) for i in (0, 2, 4))


def bbox(img):
    """알파가 ALPHA_MIN 이상인 영역 (left, top, right, bottom)"""
    return img.getchannel("A").point(lambda a: 255 if a >= ALPHA_MIN else 0).getbbox()


def remove_background(img, key, tol):
    """배경색 key 근처를 투명하게. tol 안쪽은 완전 투명, tol~1.8tol은 부드럽게."""
    px = img.load()
    w, h = img.size
    soft = tol * 1.8
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = ((r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2) ** 0.5
            if d < tol:
                px[x, y] = (r, g, b, 0)
            elif d < soft:
                px[x, y] = (r, g, b, int(a * (d - tol) / (soft - tol)))
    return img


def corner_color(img):
    w, h = img.size
    pts = [img.getpixel(p)[:3] for p in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]]
    return tuple(sum(c[i] for c in pts) // 4 for i in range(3))


def main():
    ap = argparse.ArgumentParser(description="생성 그림 → 스프라이트 규격")
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--ref", help="같은 프레임의 참고 그림 (키·위치를 맞춘다)")
    ap.add_argument("--key", default="auto", help="지울 배경색: auto(모서리 색) | #rrggbb | none")
    ap.add_argument("--tol", type=float, default=48, help="배경색 허용 범위 (기본 48)")
    ap.add_argument("--flip", action="store_true", help="캐릭터가 왼쪽을 보고 있으면 좌우 반전")
    args = ap.parse_args()

    img = Image.open(args.input).convert("RGBA")
    if args.flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)

    alpha = img.getchannel("A")
    transparent_ratio = sum(alpha.histogram()[:ALPHA_MIN]) / (img.width * img.height)
    if args.key != "none" and transparent_ratio < 0.05:
        key = corner_color(img) if args.key == "auto" else parse_hex(args.key)
        img = remove_background(img, key, args.tol)
        print(f"배경 지움: rgb{key}")

    box = bbox(img)
    if not box:
        sys.exit("❌ 캐릭터를 찾지 못했습니다 (전부 투명하거나 배경색과 같음)")
    char = img.crop(box)

    if args.ref:
        ref = Image.open(args.ref).convert("RGBA")
        rb = bbox(ref)
        target_h = rb[3] - rb[1]
        bottom = rb[3]
        center = (rb[0] + rb[2]) / 2
    else:
        target_h, bottom, center = DEFAULT_HEIGHT, DEFAULT_BOTTOM, DEFAULT_CENTER

    scale = target_h / char.height
    new_w = max(1, round(char.width * scale))
    new_h = max(1, round(char.height * scale))
    char = char.resize((new_w, new_h), Image.LANCZOS)

    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    left = round(center - new_w / 2)
    top = round(bottom - new_h)
    out.alpha_composite(char, (max(-new_w, left), max(-new_h, top)))
    if left < 0 or top < 0 or left + new_w > SIZE:
        print("⚠️ 캐릭터 일부가 640×640 밖으로 나갔습니다. 생성 그림의 여백이나 포즈를 확인하세요.")

    out.save(args.output, optimize=True)
    kb = round(open(args.output, "rb").seek(0, 2) / 1024)
    print(f"✅ {args.output}  크기 {new_w}×{new_h} (배율 {scale:.2f}), 발밑 y={bottom}, 가로 중심 x={round(center)}, {kb}KB")
    if kb > MAX_KB:
        print(f"⚠️ {kb}KB — 목표 {MAX_KB}KB 이하. 색 수를 줄이거나 디테일을 줄여 주세요.")


if __name__ == "__main__":
    main()
