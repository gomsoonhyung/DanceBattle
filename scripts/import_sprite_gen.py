#!/usr/bin/env python3
"""
sprite-gen 실행 결과(한 동작 줄)를 게임 스프라이트 규격으로 옮긴다.

  python3 scripts/import_sprite_gen.py <실행 폴더> <상태> <캐릭터id> --frames 0,4,7,11
      → sprites-work/sg/<캐릭터id>/<동작>_<프레임>.png + manifest.json

규칙
  - 크기: 줄의 첫 칸(--ref-index, 기본 0)에 대기 자세를 함께 그리게 하고, 그 칸의 키를
    채택된 public/sprites/<id>/idle_0.png 의 키에 맞춘 배율을 나머지 칸에 똑같이 준다.
    (배율을 직접 주려면 --scale. 첫 칸이 없으면 --ref-index -1 과 함께 --scale 이 필요)
  - 위치: 같은 이름의 참고 그림(sprites-ref/<id>/<동작>_<프레임>.png)에 맞춘다.
    바닥에 선 프레임은 발밑 높이와 발밑(아래쪽 20%)의 가로 무게중심을, 공중 프레임은 아래 끝 높이와
    몸 전체의 가로 무게중심을 참고 그림과 같게 놓는다. 참고 그림이 없으면 대기 그림의 발밑에 맞춘다.
  - 가로·세로 같은 배율로만 줄이고 늘인다.
  - 결과는 sprites-work/ 에만 쓴다. 검사(check_sprites.py, contact_sheet.py) 후에 public/sprites/ 로 옮긴다.

필요: Python 3 + Pillow
"""

import argparse
import json
import os
import sys

from PIL import Image

SIZE = 640
ALPHA_MIN = 16


def bbox(img):
    return img.getchannel("A").point(lambda a: 255 if a >= ALPHA_MIN else 0).getbbox()


def foot_x(img, part=0.2):
    """아래쪽 part 비율 알파의 가로 무게중심 (이미지 좌표). part=1 이면 몸 전체."""
    b = bbox(img)
    top = b[3] - max(1, round((b[3] - b[1]) * part))
    a = img.getchannel("A").crop((b[0], top, b[2], b[3]))
    total = sx = 0
    w, h = a.size
    px = a.load()
    for y in range(h):
        for x in range(w):
            v = px[x, y]
            if v >= ALPHA_MIN:
                total += v
                sx += v * x
    return b[0] + sx / total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir")
    ap.add_argument("state", help="sprite-gen 상태 이름")
    ap.add_argument("char")
    ap.add_argument("--anim", help="게임 동작 id (기본: 상태 이름)")
    ap.add_argument("--frames", required=True, help="게임 표시 프레임 번호, 쉼표로 구분 (예: 0,4,7,11)")
    ap.add_argument("--ref-index", type=int, default=0, help="대기 자세가 그려진 칸 번호 (없으면 -1)")
    ap.add_argument("--scale", type=float, help="배율을 직접 지정")
    ap.add_argument("--ref-dir", help="위치를 맞출 참고 그림 폴더 (기본: sprites-ref/<캐릭터>)")
    ap.add_argument("--out", help="출력 폴더 (기본: sprites-work/<캐릭터id>)")
    args = ap.parse_args()

    anim = args.anim or args.state
    keys = [int(f) for f in args.frames.split(",")]
    src_dir = os.path.join(args.run_dir, "frames", args.state)
    count = len([n for n in os.listdir(src_dir) if n.startswith("frame-") and n.endswith(".png") and n.count(".") == 1])
    src = [Image.open(os.path.join(src_dir, f"frame-{i}.png")).convert("RGBA") for i in range(count)]

    idle = Image.open(f"public/sprites/{args.char}/idle_0.png").convert("RGBA")
    ib = bbox(idle)

    ref = src[args.ref_index] if args.ref_index >= 0 else None
    poses = [img for i, img in enumerate(src) if i != args.ref_index]
    if len(poses) != len(keys):
        sys.exit(f"❌ 프레임 수가 다릅니다: sprite-gen {len(poses)}장 (대기 칸 제외), --frames {len(keys)}개")

    if args.scale:
        scale = args.scale
    elif ref is not None:
        rb = bbox(ref)
        scale = (ib[3] - ib[1]) / (rb[3] - rb[1])
    else:
        sys.exit("❌ 대기 칸이 없으면 --scale 이 필요합니다")
    print(f"배율 {scale:.3f}  (대기 키 {ib[3] - ib[1]}px)")

    ref_dir = args.ref_dir or f"sprites-ref/{args.char}"
    rip = os.path.join(ref_dir, "idle_0.png")
    ref_idle = Image.open(rip).convert("RGBA") if os.path.exists(rip) else idle
    out_dir = args.out or f"sprites-work/sg/{args.char}"
    os.makedirs(out_dir, exist_ok=True)
    man_path = os.path.join(out_dir, "manifest.json")
    manifest = json.load(open(man_path)) if os.path.exists(man_path) else {"frames": {}}

    for key, img in zip(keys, poses):
        b = bbox(img)
        part = img.crop(b)
        part = part.resize((max(1, round(part.width * scale)), max(1, round(part.height * scale))), Image.LANCZOS)
        # 맞출 대상: 참고 그림 (없으면 대기 그림)
        rp = os.path.join(ref_dir, f"{anim}_{key}.png")
        target = Image.open(rp).convert("RGBA") if os.path.exists(rp) else idle
        tb = bbox(target)
        grounded = tb[3] >= ib[3] - 8
        share = 0.2 if grounded else 1.0
        # 참고 그림이 자기 대기 그림에서 움직인 만큼만 실제 대기 그림에서 옮긴다 (코드 그림과 AI 그림의 자세 차이를 지운다)
        shift = foot_x(target, share) - foot_x(ref_idle, share)
        left = round(foot_x(idle, share) + shift - (foot_x(img, share) - b[0]) * scale)
        top = tb[3] - part.height
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(part, (left, top))  # 빈 판이라 그대로 붙여도 투명도가 유지된다 (밖으로 나간 부분은 잘림)
        if left < 0 or top < 0 or left + part.width > SIZE:
            print(f"  ⚠️ {anim}_{key}: 640×640 밖으로 나간 부분이 잘림")
        name = f"{anim}_{key}.png"
        canvas.save(os.path.join(out_dir, name), optimize=True)
        manifest["frames"][f"{anim}_{key}"] = {"p1": name}
        nb = bbox(canvas)
        print(f"  {name}: 키 {nb[3] - nb[1]}px, 가로 {nb[0]}~{nb[2]}, 발밑 {nb[3]}")

    with open(man_path, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"✅ {out_dir}/ 에 {len(keys)}장")


if __name__ == "__main__":
    main()
