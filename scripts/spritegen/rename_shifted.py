#!/usr/bin/env python3
"""
기술 수치(발생 등)를 바꿔 키 포즈 프레임 번호가 바뀌었을 때, 이미 있는 그림의 이름을 새 번호로 옮긴다.

  cp sprites-work/batch/anims.json sprites-work/batch/anims_before.json   # 바꾸기 전에
  (기술 수정)
  node scripts/spritegen/list.mjs                                          # 바꾼 뒤 목록
  python3 scripts/spritegen/rename_shifted.py sprites-work/batch/anims_before.json

- 키 포즈 수가 같으면 순서대로 옮긴다
- 수가 달라졌으면 (끝 프레임이 밀린 만큼 뺀) 가장 가까운 옛 그림을 쓴다 (한 장이 두 번 쓰일 수 있음)
- 옛 그림이 다 있는 동작만 옮긴다. 먼저 public/sprites 를 백업해 두면 안전하다
"""

import json
import os
import sys

old = json.load(open(sys.argv[1]))
new = json.load(open("sprites-work/batch/anims.json"))
moved = 0
for c in new:
    o = {a["anim"]: a["frames"] for a in old.get(c, [])}
    d = f"public/sprites/{c}"
    mp = f"{d}/manifest.json"
    if not os.path.exists(mp):
        continue
    man = json.load(open(mp))
    fr = man["frames"]
    for a in new[c]:
        an, nfs = a["anim"], a["frames"]
        ofs = o.get(an)
        if not ofs or ofs == nfs or not all(f"{an}_{f}" in fr for f in ofs):
            continue
        shift = nfs[-1] - ofs[-1]

        def src(nf):
            if len(nfs) == len(ofs):
                return ofs[nfs.index(nf)]
            if nf == 0:
                return 0
            return min(ofs, key=lambda of: abs(of - (nf - shift)))

        imgs = {of: open(f"{d}/{fr[f'{an}_{of}']['p1']}", "rb").read() for of in ofs}
        for of in ofs:
            os.remove(f"{d}/{fr[f'{an}_{of}']['p1']}")
            del fr[f"{an}_{of}"]
        for nf in nfs:
            name = f"{an}_{nf}.png"
            open(f"{d}/{name}", "wb").write(imgs[src(nf)])
            fr[f"{an}_{nf}"] = {"p1": name}
        moved += 1
    json.dump(man, open(mp, "w"), indent=2, ensure_ascii=False)
    open(mp, "a").write("\n")
print(f"옮긴 동작 {moved}개")
