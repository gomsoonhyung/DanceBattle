#!/usr/bin/env python3
"""
Codex 모션 연구(art/locking-basics 의 public/assets/motion-studies/bboy)의 브레이킹 그림을 게임 기술로 옮긴다.

  git archive art/locking-basics public/assets/motion-studies/bboy | tar -x -C /tmp/ms
  python3 scripts/spritegen/import_bboy_studies.py /tmp/ms/public/assets/motion-studies/bboy

하는 일
  1. 아래 PLAN(게임 동작 → [프레임, 연구 그림 키])대로 그림을 public/sprites/bboy/<동작>_<프레임>.webp 로 복사
  2. 그 동작의 예전 그림은 지운다
  3. src/characters/bboy/studies.json 에 프레임 시간을 적는다 → 게임이 그 시간에 맞춰 그림을 바꾼다 (중간 그림 없음)

연구 그림 키는 연구 manifest 의 frames 이름(예: 'windmillStudy_14') 이거나 파일 이름(예: 'indianStep_02.webp').
타격 프레임·데미지는 바꾸지 않는다 (각 기술의 hits 그대로). 그림만 연구 시간표에 맞춰 놓는다.
"""

import json
import os
import shutil
import sys

SRC = sys.argv[1]
DST = "public/sprites/bboy"
OUT = "src/characters/bboy/studies.json"

# 대기는 예전 그림(옆모습)을 쓴다 (2026-10-13 사용자 결정). 반복 동작(걷기)은 loop 길이를 준다. 4프레임마다 그림 이름이 필요하다 (LOOP_STEP)
PLAN = {
    "walkF": {"loop": 48, "keys": [[0, "shuffleTop_00.webp"], [8, "shuffleTop_01.webp"], [16, "shuffleTop_02.webp"],
                                   [24, "shuffleTop_03.webp"], [32, "shuffleTop_04.webp"], [40, "shuffleTop_01.webp"]]},
    "walkB": {"loop": 48, "keys": [[0, "kickSide_00.webp"], [8, "kickSide_01.webp"], [16, "kickSide_02.webp"],
                                   [24, "kickSide_03.webp"], [32, "kickSide_04.webp"], [40, "kickSide_05.webp"]]},
    # LP 탑록 크로스 스텝: 판정 5~7 = 열린 팔 강조
    "sLP": {"keys": [[0, "crossStep_4"], [3, "crossStep_8"], [5, "crossStep_12"], [9, "crossStep_19"], [12, "crossStep_24"]]},
    # LK 탑록 킥 스텝: 판정 7~9 = 낮은 킥
    "sLK": {"keys": [[0, "toprock_0"], [3, "toprock_5"], [7, "toprock_9"], [11, "toprock_12"], [16, "idle_0.webp"]]},
    # 2LK 한쪽 CC: 판정 6~8 = 다리 내보내기
    "cLK": {"keys": [[0, "cc_0"], [3, "cc_5"], [6, "cc_9"], [9, "cc_13"], [12, "cc_17"], [15, "cc_23"]]},
    # 3HK 고다운 → CC: 판정 22~25
    "sixStepSweep": {"keys": [[0, "goDownCC_0"], [3, "goDownCC_5"], [6, "goDownCC_20"], [9, "goDownCC_25"],
                              [12, "goDownCC_30"], [15, "goDownCC_35"], [18, "goDownCC_40"], [20, "goDownCC_45"],
                              [22, "goDownCC_49"], [26, "goDownCC_57"], [31, "goDownCC_63"]]},
    # 236P 윈드밀: 판정 9 / 16 / 23 / 30
    "windmill": {"keys": [[0, "goDown_00.webp"], [3, "goDown_01.webp"], [6, "windmillStudy_0"], [9, "windmillStudy_7"],
                          [13, "windmillStudy_14"], [16, "windmillStudy_21"], [20, "windmillLink_0"], [23, "windmillLink_1"],
                          [27, "windmillLink_2"], [30, "windmillLink_3"], [34, "windmillStudy_14"], [38, "windmillStudy_21"],
                          [42, "windmillStudy_28"]]},
    # 623P 투싸(2000): 무적 1~9, 판정 6 / 16 / 24
    "headspin": {"keys": [[0, "thousandStudy_4"], [3, "thousandStudy_16"], [6, "thousandStudy_36"], [11, "thousandStudy_48"],
                          [16, "thousandStudy_60"], [21, "thousandStudy_72"], [26, "thousandStudy_90"], [32, "thousandStudy_108"],
                          [38, "thousandStudy_118"], [44, "thousandStudy_126"]]},
    # 214P 베이비 프리즈: 반격 4~24 동안 정지 자세
    "freeze": {"keys": [[0, "babyFreeze_0"], [2, "babyFreeze_6"], [4, "babyFreeze_12"], [6, "babyFreeze_20"],
                        [28, "babyFreeze_38"], [32, "babyFreeze_44"], [35, "babyFreeze_50"]]},
    # 214K 스와입스: 판정 22 / 46 (다리가 위에서 넘어오는 두 순간, 중단). 한 주기 = 그림 14~61
    "swipe": {"keys": [[0, "idle_0.webp"], [2, "goDown_01.webp"], [6, "powerExit_04.webp"], [10, "swipeStudy_00.webp"],
                       [14, "swipeStudy_01.webp"], [17, "swipeReturn_00.webp"], [21, "swipeStudy_02.webp"], [28, "swipeStudy_03.webp"],
                       [32, "swipeStudy_04.webp"], [35, "swipeLeft_00.webp"], [38, "swipeFlight_00.webp"], [42, "swipeFlight_01.webp"],
                       [45, "swipeLeft_01.webp"], [52, "swipeLeft_02.webp"], [56, "swipeReturn_04.webp"], [59, "swipeStudy_00.webp"],
                       [62, "powerExit_04.webp"], [66, "powerExit_01.webp"], [72, "powerExit_02.webp"]]},
    # 623K 에어트랙: 판정 22 / 38 / 54, 마무리 69 (한 바퀴 = 그림 20~67)
    "airtrack": {"keys": [[0, "idle_0.webp"], [3, "airtrackA_00.webp"], [10, "airtrackA_01.webp"], [20, "airtrackA_02.webp"],
                          [28, "airtrackA_03.webp"], [36, "airtrackB_00.webp"], [44, "airtrackB_01.webp"], [52, "airtrackB_02.webp"],
                          [60, "airtrackB_03.webp"], [68, "airtrackB_04.webp"], [76, "powerExit_00.webp"], [82, "powerExit_02.webp"]]},
    # 초필 플레어 → 에어트랙: 판정 10~42 다단, 54~60 마무리
    "powerCombo": {"keys": [[0, "flareStudy_4"], [5, "flareStudy_16"], [10, "flareStudy_36"], [15, "flareStudy_48"],
                            [20, "flareStudy_60"], [25, "flareStudy_72"], [30, "flareStudy_84"], [35, "flareStudy_96"],
                            [40, "airtrackStudy_36"], [45, "airtrackStudy_48"], [50, "airtrackStudy_60"], [54, "airtrackStudy_72"],
                            [60, "airtrackStudy_84"], [66, "airtrackStudy_96"], [72, "airtrackStudy_108"],
                            [78, "airtrackStudy_118"], [86, "airtrackStudy_126"], [94, "airtrackStudy_136"]]},
}

# 그림 종류 → 코드 그림(그림을 못 불러올 때)용 자세 이름
def kind(file):
    if file.startswith(("indianStep", "shuffleTop", "kickSide", "crossStep", "toprock", "idle", "powerExit_01", "powerExit_02")):
        return "stand"
    if file.startswith(("babyFreeze", "thousand", "ninety", "flare", "airtrack", "windmill", "swipe", "orbit", "airturn")):
        return "power"
    return "low"


study = json.load(open(os.path.join(SRC, "manifest.json")))
frames = study["frames"]


def resolve(key):
    return key if key.endswith(".webp") else frames[key]["p1"]


man_path = f"{DST}/manifest.json"
man = json.load(open(man_path))
out = {}
for anim, plan in PLAN.items():
    keys = [[f, resolve(k)] for f, k in plan["keys"]]
    for f in os.listdir(DST):
        if f.rsplit("_", 1)[0] == anim and f.endswith(".webp"):
            os.remove(os.path.join(DST, f))
    for k in [k for k in man["frames"] if k.rsplit("_", 1)[0] == anim]:
        del man["frames"][k]
    if plan.get("loop"):
        shown = range(0, plan["loop"], 4)
    else:
        shown = [f for f, _ in keys]
    for f in shown:
        file = [k for k in keys if k[0] <= f][-1][1]
        name = f"{anim}_{f}.webp"
        shutil.copy(os.path.join(SRC, file), os.path.join(DST, name))
        man["frames"][f"{anim}_{f}"] = {"p1": name}
    out[anim] = {"loop": plan.get("loop"), "keys": [{"f": f, "kind": kind(file), "src": file} for f, file in keys]}
    print(f"{anim}: {len(list(shown))}장")

json.dump(man, open(man_path, "w"), indent=2, ensure_ascii=False)
open(man_path, "a").write("\n")
json.dump(out, open(OUT, "w"), indent=2, ensure_ascii=False)
open(OUT, "a").write("\n")
print(f"✅ {OUT}")
