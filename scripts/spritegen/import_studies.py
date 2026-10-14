#!/usr/bin/env python3
"""
Codex 모션 연구 그림을 여러 장르의 게임 기술로 옮긴다 (비보이는 손으로 맞춘 import_bboy_studies.py).

  git archive art/locking-basics public/assets/motion-studies | tar -x -C /tmp/ms2
  node scripts/spritegen/moves.mjs                       # 기술 시간표 (개발 서버 필요)
  python3 scripts/spritegen/import_studies.py /tmp/ms2/public/assets/motion-studies [캐릭터…]

배치 규칙 (scripts/spritegen/study_plans.json)
  - 한 번 하는 기술: 연구의 '강조 순간'(accent 이름이 들어간 단계) 그림이 그 기술의 첫 판정 프레임에 오도록,
    앞 단계는 시작~판정 사이에, 뒤 단계는 판정이 끝난 뒤~끝 사이에 고르게 놓는다. 마지막은 그 캐릭터 대기 그림.
    (판정이 없는 기술은 장풍이 나가는 프레임이나 게이지가 차는 프레임이 강조 순간)
  - 반복 동작(loop): 그림을 loop 길이에 고르게.
  - 타격 프레임·데미지는 바꾸지 않는다. 그림만 바꾼다.
결과: public/sprites/<id>/<동작>_<프레임>.webp, manifest, src/characters/<폴더>/studies.json
"""

import json
import os
import shutil
import sys

ROOT = sys.argv[1]
ONLY = sys.argv[2:]
PLANS = json.load(open(os.path.join(os.path.dirname(__file__), "study_plans.json")))
MOVES = json.load(open("sprites-work/batch/moves.json"))
FOLDER = {"krump": "krump", "waacker": "waacking", "hiphopper": "hiphop", "hiphopgirl": "girlshiphop",
          "househead": "house", "popper": "popping", "bboy": "bboy", "locker": "locking"}


def phases(study_dir, sid):
    """연구 단계 [(시간, 그림)]. 처음과 끝의 대기 그림은 뺀다 (게임에서는 그 캐릭터의 대기 그림을 쓴다)"""
    man = json.load(open(os.path.join(study_dir, "manifest.json")))
    s = next(x for x in man["studies"] if x["id"] == sid)
    out = []
    for p in s["phases"]:
        f = p.get("file") or man["frames"][f"{sid}_{p['at']}"]["p1"]
        out.append((p["at"], f, p["label"]))
    while out and out[0][1].startswith("idle_"):
        out.pop(0)
    while out and out[-1][1].startswith("idle_"):
        out.pop()
    return out


def spread(n, a, b):
    """a~b 사이에 n개를 고르게 (정수)"""
    if n <= 0:
        return []
    if n == 1:
        return [a]
    return [round(a + (b - a) * i / (n - 1)) for i in range(n)]


for char, plan in PLANS.items():
    if char.startswith('_') or (ONLY and char not in ONLY):
        continue
    study_dir = os.path.join(ROOT, char)
    dst = f"public/sprites/{char}"
    man_path = f"{dst}/manifest.json"
    man = json.load(open(man_path))
    idle_file = man["frames"]["idle_0"]["p1"]
    out = {}
    for anim, p in plan.items():
        ph = phases(study_dir, p["study"])
        if p.get("loop"):
            L = p["loop"]
            keys = [[round(i * L / len(ph)), f] for i, (_, f, _l) in enumerate(ph)]
            shown = list(range(0, L, 4))
        else:
            mv = MOVES[char]["moves"][anim]
            T = mv["total"]
            if mv["hits"]:
                H = mv["hits"][0]["frames"][0]
                E = mv["hits"][-1]["frames"][1]
            else:
                H = (mv.get("projectile") or mv.get("meterGain") or {"frame": T // 3})["frame"]
                E = H + 6
            a = next(i for i, x in enumerate(ph) if p["accent"] in x[2])
            pre = spread(a, 0, max(0, H - 3))
            accent = H - 1  # 판정 H 프레임에 보이는 그림 = 애니메이션 프레임 H-1
            post = spread(len(ph) - a - 1, min(T - 6, E + 2), T - 6) if len(ph) - a - 1 else []
            times = pre + [accent] + post
            # 시간이 겹치지 않게 (앞에서부터 1씩 밀기)
            for i in range(1, len(times)):
                times[i] = max(times[i], times[i - 1] + 1)
            keys = [[t, f] for t, (_, f, _l) in zip(times, ph)]
            if keys[0][0] > 0:
                keys.insert(0, [0, None])  # 강조 순간이 첫 단계면 처음엔 대기 그림
            keys.append([max(T - 3, times[-1] + 1), None])  # 끝: 대기 그림
            shown = [t for t, _ in keys]
        # 예전 그림 지우기
        for k in [k for k in man["frames"] if k.rsplit("_", 1)[0] == anim]:
            fp = os.path.join(dst, man["frames"][k]["p1"])
            if os.path.exists(fp) and man["frames"][k]["p1"] != idle_file:
                os.remove(fp)
            del man["frames"][k]
        for f in shown:
            src = [k for k in keys if k[0] <= f][-1][1]
            name = f"{anim}_{f}.webp"
            if src is None:
                shutil.copy(os.path.join(dst, idle_file), os.path.join(dst, name))
            else:
                shutil.copy(os.path.join(study_dir, src), os.path.join(dst, name))
            man["frames"][f"{anim}_{f}"] = {"p1": name}
        out[anim] = {"loop": p.get("loop"), "keys": [{"f": t, "kind": "stand", "src": f or idle_file} for t, f in keys]}
        print(f"{char} {anim}: {p['study']} → {len(shown)}장, 키 {[t for t, _ in keys]}")
    json.dump(man, open(man_path, "w"), indent=2, ensure_ascii=False)
    open(man_path, "a").write("\n")
    path = f"src/characters/{FOLDER[char]}/studies.json"
    json.dump(out, open(path, "w"), indent=2, ensure_ascii=False)
    open(path, "a").write("\n")
