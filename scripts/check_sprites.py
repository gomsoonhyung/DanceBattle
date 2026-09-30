#!/usr/bin/env python3
"""
public/sprites/<캐릭터>/ 의 스프라이트를 규격대로 검사한다.

  python3 scripts/check_sprites.py krump
  python3 scripts/check_sprites.py krump --ref sprites-ref/krump   (참고 그림 폴더를 직접 지정)
  (기본: sprites-ref/<캐릭터> → docs/design/reference/<캐릭터> 순서로 찾음)

검사 항목 (❌ = 게임에서 문제가 됨, ⚠️ = 확인 필요)
  ❌ manifest.json 이 없거나 형식이 틀림, 적힌 파일이 없음
  ❌ 640×640 이 아님, 투명 배경이 아님, 본체와 떨어진 조각이 있음, 옷 색이 다른 프레임과 다름
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


def lower_cloth_color(img):
    """몸 아래쪽 45%의 어두운 옷감 평균 색 (피부·신발·외곽선 제외). 바지 색 일관성 검사용"""
    box = bbox(img)
    if not box:
        return None
    top = box[1] + (box[3] - box[1]) * 0.55
    px = img.load()
    rs = gs = bs = n = 0
    for y in range(int(top), max(int(top) + 1, box[3] - 12), 3):
        for x in range(box[0], box[2], 3):
            r, g, b, a = px[x, y]
            lum = (r + g + b) / 3
            if a > 200 and 25 < lum < 95 and abs(r - b) < 40:
                rs += r
                gs += g
                bs += b
                n += 1
    return (rs / n, gs / n, bs / n) if n >= 50 else None


def stray_pieces(img, grid=4, min_cells=3):
    """본체와 떨어진 조각 (격자로 생성한 그림을 잘라 낼 때 옆 칸이 딸려 온 경우 등).
    grid px 단위로 줄여서 덩어리를 찾고, 가장 큰 덩어리 말고 min_cells 칸 이상인 덩어리를 반환"""
    a = img.getchannel("A")
    w, h = a.size
    small = a.resize((w // grid, h // grid), Image.BOX).point(lambda v: 1 if v >= 24 else 0)
    sw, sh = small.size
    px = small.load()
    seen = [[False] * sh for _ in range(sw)]
    comps = []
    for x in range(sw):
        for y in range(sh):
            if px[x, y] and not seen[x][y]:
                stack, cells = [(x, y)], []
                seen[x][y] = True
                while stack:
                    cx, cy = stack.pop()
                    cells.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < sw and 0 <= ny < sh and px[nx, ny] and not seen[nx][ny]:
                            seen[nx][ny] = True
                            stack.append((nx, ny))
                comps.append(cells)
    comps.sort(key=len, reverse=True)
    out = []
    for c in comps[1:]:
        if len(c) >= min_cells:
            xs = [p[0] for p in c]
            ys = [p[1] for p in c]
            out.append((min(xs) * grid, min(ys) * grid, len(c) * grid * grid))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("char")
    ap.add_argument("--ref", help="참고 그림 폴더 (기본: docs/design/reference/<캐릭터> 또는 sprites-ref/<캐릭터>)")
    args = ap.parse_args()

    base = f"public/sprites/{args.char}"
    # 참고 그림은 여러 폴더에서 찾는다 (내보낸 최신 참고 그림 sprites-ref 가 우선)
    ref_dirs = [args.ref] if args.ref else [f"sprites-ref/{args.char}", f"docs/design/reference/{args.char}"]
    ref_dirs = [d for d in ref_dirs if os.path.isdir(d)]
    ref_dir = ", ".join(ref_dirs) if ref_dirs else None

    def ref_file(name):
        for d in ref_dirs:
            f = f"{d}/{name}"
            if os.path.exists(f):
                return f
        return None

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
            for x, y, area in stray_pieces(img):
                errors.append(f"{name}: 본체와 떨어진 조각 (x={x}, y={y}, 약 {area}px²). 격자를 잘라 낼 때 옆 칸이 딸려 온 것일 수 있습니다")
            kb = os.path.getsize(path) / 1024
            if kb > MAX_KB:
                warns.append(f"{name}: {kb:.0f}KB (목표 {MAX_KB}KB 이하)")
            ref_path = ref_file(name.replace("_p2.png", ".png"))
            if not ref_path:
                warns.append(f"{name}: 비교할 참고 그림이 없습니다 (node scripts/export-sprites.mjs {args.char} <동작> 으로 내보내기)")
            else:
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

    # 색 일관성: 프레임마다 바지(아래쪽 옷감) 색이 이 캐릭터의 대표 색에서 크게 벗어나지 않는지
    colors = {}
    for key, entry in frames.items():
        path = f"{base}/{entry.get('p1', '')}"
        if os.path.exists(path):
            c = lower_cloth_color(Image.open(path).convert("RGBA"))
            if c:
                colors[key] = c
    def tone(c):
        """밝기를 뺀 색조 (그림자로 어두워진 건 같은 색으로 본다)"""
        m = sum(c) / 3 or 1
        return [v / m for v in c]

    if len(colors) >= 5:
        med = [sorted(c[i] for c in colors.values())[len(colors) // 2] for i in range(3)]
        mt = tone(med)
        for key, c in sorted(colors.items()):
            dist = sum((a - b) ** 2 for a, b in zip(tone(c), mt)) ** 0.5
            if dist > 0.12:
                errors.append(
                    f"{key}: 아래쪽 옷 색이 다른 프레임과 다릅니다 (rgb{tuple(round(v) for v in c)} vs 대표 rgb{tuple(round(v) for v in med)}). 설정 그림의 색을 확인하세요"
                )

    # 동작 일부만 교체되었는지 (참고 그림 목록들을 합쳐서 비교)
    ref_frames = {}
    for d in ref_dirs:
        for mf in ("manifest.json", "manifest.example.json"):
            if os.path.exists(f"{d}/{mf}"):
                ref_frames.update(json.load(open(f"{d}/{mf}"))["frames"])
    if ref_frames:
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
