#!/usr/bin/env python3
"""
public/sprites/<캐릭터>/ 의 스프라이트를 규격대로 검사한다.

  python3 scripts/check_sprites.py krump
  python3 scripts/check_sprites.py krump --ref sprites-ref/krump   (참고 그림 폴더를 직접 지정)

검사 항목 (❌ = 게임에서 문제가 됨, ⚠️ = 확인 필요)
  ❌ manifest.json 이 없거나 형식이 틀림, 적힌 파일이 없음
  ❌ 640×640 이 아님, 투명 배경이 아님
  ⚠️ 300KB 초과
  ⚠️ 참고 그림과 비교해 발밑 높이 ±6px, 가로 중심 ±25px, 키 ±15%, 앞쪽 끝(주먹·발끝) ±20px 를 벗어남
  ⚠️ 한 동작의 일부 프레임만 들어 있음 (참고 그림 manifest 기준)

필요: Python 3 + Pillow
"""

import argparse
import json
import os
import sys

from PIL import Image

SIZE = 640
ALPHA_MIN = 16
MAX_KB = 300


def bbox(img):
    return img.getchannel("A").point(lambda a: 255 if a >= ALPHA_MIN else 0).getbbox()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("char")
    ap.add_argument("--ref", help="참고 그림 폴더 (기본: docs/design/reference/<캐릭터> 또는 sprites-ref/<캐릭터>)")
    args = ap.parse_args()

    base = f"public/sprites/{args.char}"
    ref_dir = args.ref
    if not ref_dir:
        for d in (f"docs/design/reference/{args.char}", f"sprites-ref/{args.char}"):
            if os.path.isdir(d):
                ref_dir = d
                break

    errors, warns = [], []
    try:
        manifest = json.load(open(f"{base}/manifest.json"))
        frames = manifest["frames"]
    except FileNotFoundError:
        sys.exit(f"❌ {base}/manifest.json 이 없습니다")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        sys.exit(f"❌ manifest.json 형식 오류: {e}")

    for key, entry in frames.items():
        for slot in ("p1", "p2"):
            name = entry.get(slot)
            if not name:
                if slot == "p1":
                    errors.append(f"{key}: p1 파일 이름이 없습니다")
                continue
            path = f"{base}/{name}"
            if not os.path.exists(path):
                errors.append(f"{key}: {name} 파일이 없습니다")
                continue
            img = Image.open(path)
            if img.size != (SIZE, SIZE):
                errors.append(f"{name}: 크기 {img.size[0]}×{img.size[1]} (640×640 이어야 함)")
            img = img.convert("RGBA")
            corners = [img.getpixel(p)[3] for p in [(0, 0), (SIZE - 1, 0), (0, SIZE - 1), (SIZE - 1, SIZE - 1)]]
            if max(corners) > 0:
                errors.append(f"{name}: 배경이 투명하지 않습니다 (모서리 알파 {max(corners)})")
            kb = os.path.getsize(path) / 1024
            if kb > MAX_KB:
                warns.append(f"{name}: {kb:.0f}KB (목표 {MAX_KB}KB 이하)")
            ref_path = f"{ref_dir}/{name.replace('_p2.png', '.png')}" if ref_dir else None
            if ref_path and os.path.exists(ref_path):
                a, b = bbox(img), bbox(Image.open(ref_path).convert("RGBA"))
                if a and b:
                    dy = a[3] - b[3]
                    dx = (a[0] + a[2]) / 2 - (b[0] + b[2]) / 2
                    hr = (a[3] - a[1]) / max(1, b[3] - b[1])
                    if abs(dy) > 6:
                        warns.append(f"{name}: 발밑이 참고 그림보다 {dy:+d}px")
                    if abs(dx) > 25:
                        warns.append(f"{name}: 가로 중심이 참고 그림보다 {dx:+.0f}px")
                    if not 0.85 <= hr <= 1.15:
                        warns.append(f"{name}: 키가 참고 그림의 {hr * 100:.0f}%")
                    # 앞쪽(오른쪽) 끝: 주먹·발끝이 참고 그림보다 멀리 뻗으면 공격 판정과 어긋난다
                    reach = a[2] - b[2]
                    if abs(reach) > 20:
                        more = "더 멀리 뻗음" if reach > 0 else "덜 뻗음"
                        warns.append(f"{name}: 앞쪽 끝이 참고 그림보다 {abs(reach)}px {more} (공격 판정과 어긋날 수 있음)")

    # 동작 일부만 교체되었는지
    ref_manifest = f"{ref_dir}/manifest.json" if ref_dir else None
    if ref_manifest and not os.path.exists(ref_manifest):
        ref_manifest = f"{ref_dir}/manifest.example.json"
    if ref_manifest and os.path.exists(ref_manifest):
        ref_frames = json.load(open(ref_manifest))["frames"]
        anims = {k.rsplit("_", 1)[0] for k in frames}
        for anim in sorted(anims):
            need = {k for k in ref_frames if k.rsplit("_", 1)[0] == anim}
            missing = sorted(need - set(frames), key=lambda k: int(k.rsplit("_", 1)[1]))
            if missing:
                warns.append(f"{anim}: 일부 프레임이 빠졌습니다 ({', '.join(missing)})")

    print(f"{args.char}: 프레임 {len(frames)}개 검사 (참고 그림: {ref_dir or '없음'})")
    for e in errors:
        print("❌", e)
    for w in warns:
        print("⚠️ ", w)
    if not errors and not warns:
        print("✅ 모두 규격에 맞습니다")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
