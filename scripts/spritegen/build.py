#!/usr/bin/env python3
"""
캐릭터 하나의 빠진 동작을 sprite-gen 요청 파일로 만든다.
  python3 scripts/spritegen/build.py hiphopper [동작...] [--redo] [--run 실행이름]
  → sprites-work/batch/runs/<id>/request.json, plan.json
한 줄 = [대기 칸] + 표시 프레임 최대 5장. 긴 동작은 여러 줄로 나눈다.
"""

import json
import os
import sys

from PIL import Image

ROOT = "sprites-work/batch"  # 참고 데이터·실행 폴더 (저장소에 올리지 않음)
CHAR = ""  # 지금 만드는 캐릭터 (잡기 설명에 쓴다)
# 장르의 실제 기본기로 쓴 동작 설명 (docs/design/DANCE_REFERENCE.md). 있으면 자동 설명보다 먼저 쓴다
DANCE = json.load(open(os.path.join(os.path.dirname(__file__), "dance_moves.json")))
MAX_POSES = 5
UNIT = 2  # 게임 단위 → 640 그림 px
ALPHA_MIN = 16

LOOK = {
    "krump": "krump dancer: red headband, orange tank top, dark gray baggy pants, red wristbands, face paint, white sneakers",
    "waacker": "slim waacking dancer: hair in a high bun, tight long-sleeve magenta top, flared wide dark pants, earrings",
    "hiphopper": "hip-hop dancer: yellow bucket hat, oversized green hoodie, gold chain, blue baggy denim jeans, white sneakers",
    "hiphopgirl": "girls hip-hop dancer: ponytail, pink crop top, beige cargo pants, hoop earrings, white sneakers",
    "locker": "locking dancer: big apple cap, yellow shirt with a big collar, suspenders, knee-length pants, striped knee socks",
    "househead": "house dancer: beanie with a pom-pom, light blue short-sleeve tee, dark track pants, wristbands",
    "popper": "popping dancer: fedora, white suit with a red tie, white gloves",
    "bboy": "b-boy breaker: backwards baseball cap, red track jacket, dark track pants with side stripes",
}
STYLE = {
    "krump": "Krump style: aggressive chest pops, heavy stomps, powerful arm swings",
    "waacker": "Waacking style: fast whip-like arm swings from the shoulder, elegant sharp posing",
    "hiphopper": "Hip-hop style: bouncy groove, loose relaxed swagger",
    "hiphopgirl": "Girls hip-hop style: sharp, confident, hair and hip accents",
    "locker": "Locking style: sharp points, wrist rolls, sudden locked freezes, playful",
    "househead": "House style: quick footwork, jacking chest bounce, light on the feet",
    "popper": "Popping style: stiff robotic hits, sharp pops, strobing precise angles",
    "bboy": "Breaking style: toprock, power moves on the floor, freezes",
}
WIN = {
    "krump": "victory: aggressive chest pop and a fierce stomp",
    "hiphopper": "victory: swagger bounce, then tipping the bucket hat with one hand",
    "hiphopgirl": "victory: hair flip, ending with a hand-on-hip confident pose",
    "locker": "victory: big laugh, points at the viewer, then a locked freeze pose",
    "househead": "victory: jacking chest bounce with arms open, celebrating",
    "popper": "victory: robotic arm wave across the body, ending in a frozen robot pose",
    "bboy": "victory: b-boy stance, ending with arms crossed and chin up",
    "waacker": "victory: elegant waacking pose with one arm high",
}
# 잡기: 상대와 함께 추는 짧은 파트너 동작 (상대는 그리지 않는다)
THROW = {
    "krump": "shoving the opponent away with a powerful chest bump",
    "waacker": "wrapping an arm around the opponent and spinning them away with an elegant arm roll",
    "hiphopper": "a swaggering shoulder shove that knocks the opponent down",
    "hiphopgirl": "bumping the opponent away with a hip toss",
    "locker": "grabbing the wrist, spinning the opponent around and locking",
    "househead": "hooking the opponent's leg with a foot and sweeping them",
    "popper": "grabbing and blasting the opponent away with an electric pop",
    "bboy": "grabbing and spinning the opponent around once before tossing",
}

# 공통 동작: 프레임 순서대로 한 줄씩
COMMON = {
    "dash": [
        "starting a forward dash: crouching forward, ready to burst",
        "dashing forward fast, body leaning forward, running stride",
        "dashing forward, legs in a long running stride",
        "end of the dash, landing on the front foot",
    ],
    "backdash": [
        "starting a back dash: crouching slightly",
        "hopping backward, body leaning back, feet off the floor",
        "in the air moving backward, leaning back",
        "landing from the back hop",
        "back in a low stance after the back dash",
    ],
    "prejump": ["knees slightly bent, starting to crouch before a jump", "deep crouch, ready to spring upward"],
    "jump": [
        "airborne rising, knees tucked up, arms up in guard",
        "airborne, knees tucked high",
        "airborne at the peak, tight tuck",
        "airborne falling, legs starting to extend down",
        "airborne just before landing, legs extended downward",
    ],
    "land": ["landing: knees bent absorbing the impact", "rising back up toward fighting stance"],
    "hitStand": [
        "standing fighting stance",
        "hit in the face: head snapped back, torso recoiling backward to the left, arms flung",
        "recovering from the hit, still leaning back",
        "almost back to fighting stance",
    ],
    "hitCrouch": [
        "crouching low",
        "hit while crouching: head and torso snapped back to the left",
        "recovering in the crouch",
        "almost back to the crouch",
    ],
    "blockStand": ["standing guard: both forearms raised in front of the face and chest, braced"],
    "blockCrouch": ["crouching guard: crouched low, both forearms raised in front of the face"],
    "airHit": [
        "launched backward through the air by a hit, body tilted back, head toward the left, limbs flailing",
        "flying backward in the air, body nearly horizontal",
        "falling flat onto the back, body horizontal just above the floor, head to the left",
    ],
    "knockdown": [
        "lying flat on the back on the floor, head to the left, feet to the right",
        "lying on the back, slight bounce",
        "lying still on the back on the floor",
    ],
    "getup": [
        "lying flat on the back on the floor, head to the left",
        "starting to get up: lifting the shoulders and knees",
        "rolling up to a sitting position",
        "coming up onto the feet in a low squat",
        "low crouch, pushing up",
        "half standing",
        "standing back in fighting stance",
        "standing in fighting stance",
    ],
}


def bbox(img):
    return img.getchannel("A").point(lambda a: 255 if a >= ALPHA_MIN else 0).getbbox()


def head_low(img, box):
    """B-boy 모자(노란색)가 그림 아래쪽 절반에 있으면 거꾸로 선 자세 (누운 자세는 빼고)."""
    if box[3] - box[1] < (box[2] - box[0]) * 0.9:
        return False
    px = img.load()
    ys = [y for y in range(box[1], box[3], 2) for x in range(box[0], box[2], 2)
          if px[x, y][3] > 200 and px[x, y][0] > 200 and px[x, y][1] > 170 and px[x, y][2] < 120]
    return len(ys) > 20 and sum(ys) / len(ys) > (box[1] + box[3]) / 2


def height_word(y):
    """게임 단위 높이 → 말 (선 키 약 190)."""
    r = y / 190
    for lim, w in ((0.12, "floor level"), (0.3, "shin/knee height"), (0.5, "thigh/waist height"),
                   (0.68, "stomach/chest height"), (0.88, "shoulder/face height"), (1.1, "head height")):
        if r < lim:
            return w
    return "above the head"


def limb(move_id, desc):
    if move_id.endswith("LP") or move_id.endswith("HP"):
        return "arm/fist"
    if move_id.endswith("LK") or move_id.endswith("HK"):
        return "leg/foot"
    return None


def direction(box, airborne, anti_air, level="mid"):
    """판정 상자 모양으로 공격 방향을 말로."""
    if airborne and box["y"] <= 20:
        return "striking DOWNWARD below the body (a stomp/drop attack aimed at the floor in front)"
    if anti_air:
        return "striking UPWARD high above the head (anti-air rising attack), the limb raised high"
    if box["y"] == 0:
        return "a LOW strike along the floor"
    if level == "overhead":
        return "an OVERHEAD strike chopping DOWNWARD from above the head onto the opponent in front (axe-kick / hammer motion)"
    return "the attack is fully extended forward toward the RIGHT"


def frame_phase(f, g, mv, airborne=False):
    """표시 프레임 f (다음 표시 프레임 g 전까지) 가 기술의 어느 순간인지."""
    hits = mv.get("hits") or []
    pj = mv.get("projectile")
    if pj:
        if g <= pj["frame"]:
            return "wind-up before releasing a projectile (do NOT draw the projectile)"
        if f <= pj["frame"] + 4:
            return (f"RELEASE: arm/hand thrust forward toward the RIGHT at {height_word(pj['y'])}, "
                    f"as if launching a projectile (do NOT draw the projectile)")
        return "recovery after the release, returning toward stance"
    if mv.get("counter"):
        c = mv["counter"]
        return "holding a still freeze pose (counter stance)" if c["from"] <= f <= c["to"] else "moving into / out of the freeze pose"
    if mv.get("grab"):
        gf = mv["grab"]["frame"]
        if g <= gf:
            return "THROW: reaching forward with both hands to grab the opponent (do NOT draw the opponent)"
        return f"THROW: {THROW.get(CHAR, 'tossing the opponent')} (do NOT draw the opponent)"
    if mv.get("meterGain"):
        return "striking a confident show-off dance pose (no attack)"
    if not hits:
        return None
    for i, h in enumerate(hits):
        a, b = h["frames"]
        if f <= b and g > a:
            box = h["box"]
            top, bot = box["y"] + box["h"], box["y"]
            reach = box["x"] + box["w"]
            n = f" (hit {i + 1} of {len(hits)})" if len(hits) > 1 else ""
            anti_air = "대공" in mv.get("desc", "") or mv.get("id") == "cHP"
            return (f"STRIKE{n}: {direction(box, airborne, anti_air, h.get('level', 'mid'))}, striking area from "
                    f"{height_word(bot)} to {height_word(top)}, reaching about {reach * UNIT}px in front of the body center")
    if g <= hits[0]["frames"][0]:
        if hits[0].get("level") == "overhead" and not airborne:
            return "wind-up: raising the striking leg or arms HIGH above the head, ready to chop down"
        return "wind-up / startup before the strike"
    if f > hits[-1]["frames"][1]:
        return "recovery after the last strike, returning toward stance"
    return "between strikes: pulling back and chambering the next strike"


def main():
    args = sys.argv[1:]
    run_name = None
    if "--run" in args:
        i = args.index("--run")
        run_name = args[i + 1]
        del args[i:i + 2]
    redo = "--redo" in args  # 이미 들어간 동작도 다시 만든다 (지정한 동작만)
    args = [a for a in args if a != "--redo"]
    char, only = args[0], args[1:]
    global CHAR
    CHAR = char
    anims = {a["anim"]: a["frames"] for a in json.load(open(f"{ROOT}/anims.json"))[char]}
    moves = json.load(open(f"{ROOT}/moves.json"))[char]["moves"]
    have = set() if redo else set(json.load(open(f"public/sprites/{char}/manifest.json"))["frames"])
    ref_idle = Image.open(f"sprites-ref/{char}/idle_0.png").convert("RGBA")
    ib = bbox(ref_idle)
    ih, iw = ib[3] - ib[1], ib[2] - ib[0]

    states, plan = {}, {}
    for anim, frames in anims.items():
        if only and anim not in only:
            continue
        missing = [f for f in frames if f"{anim}_{f}" not in have]
        # 대기·걷기는 직접 지정했을 때만 다시 만든다 (모든 그림의 크기·정체성 기준이라서)
        base_anim = anim in ("idle", "walkF", "walkB", "crouch")
        if not missing or (base_anim and anim not in only) or anim in ("unclePoint", "animationDash"):
            continue
        mv = moves.get(anim, {})
        all_frames = frames
        total = mv.get("total") or (all_frames[-1] + 4)
        chunks = [missing[i:i + MAX_POSES] for i in range(0, len(missing), MAX_POSES)]
        for ci, chunk in enumerate(chunks):
            state = anim if len(chunks) == 1 else f"{anim}-{ci + 1}"
            lines = []
            for n, f in enumerate(chunk):
                idx = all_frames.index(f)
                g = all_frames[idx + 1] if idx + 1 < len(all_frames) else total
                rimg = Image.open(f"sprites-ref/{char}/{anim}_{f}.png").convert("RGBA")
                rb = bbox(rimg)
                h_pct = round((rb[3] - rb[1]) / ih * 100)
                w_pct = round((rb[2] - rb[0]) / iw * 100)
                lift = ib[3] - rb[3]
                ground = "feet on the floor" if lift < 8 else f"AIRBORNE, lowest point about {lift}px above the floor"
                if anim in COMMON:
                    what = COMMON[anim][min(idx, len(COMMON[anim]) - 1)]
                elif anim == "win":
                    what = f"{WIN[char]} (step {idx + 1} of {len(all_frames)})"
                else:
                    what = frame_phase(f, g, mv, lift >= 8) or f"step {idx + 1} of {len(all_frames)} of the move"
                    lb = limb(anim, mv.get("desc", ""))
                    if lb and what.startswith("STRIKE"):
                        what += f", using the {lb}"
                if char == "bboy" and head_low(rimg, rb):
                    ground = "UPSIDE DOWN breaking power move: head/shoulders/hands on the floor, legs up in the air"
                lines.append(f"Frame {n + 2}: {what}; {ground}; silhouette about {h_pct}% of standing height and {w_pct}% of standing width.")
            dance = DANCE.get(char, {}).get(anim)
            if dance:
                head = f"Dance move for a fighting game: {dance}"
                if len(chunks) > 1:
                    head += f" This row is part {ci + 1} of {len(chunks)} of the move."
                    if ci > 0:
                        head += " It CONTINUES from the previous part: do NOT restart the move from the wind-up."
            elif anim in COMMON or anim == "win":
                head = f"Common fighting-game animation '{anim}'."
            else:
                kind = {"s": "standing", "c": "crouching", "j": "jumping (airborne)"}.get(anim[0], "") if anim[1:] in ("LP", "HP", "LK", "HK", "L", "H") else "special move"
                head = f"Fighting-game {kind} attack '{mv.get('name', anim)}'" + (f": {mv['desc']}" if mv.get("desc") else "") + "."
                if len(chunks) > 1:
                    head += f" This row is part {ci + 1} of {len(chunks)} of the move."
                    if ci > 0:
                        head += " It CONTINUES from the previous part: do NOT restart the move from the wind-up."
            action = (
                f"Side view, the character faces RIGHT in every frame, exactly like the reference. "
                f"Frame 1 is an exact copy of the attached reference idle pose at the same size: it is only a scale reference. "
                f"{head} {STYLE[char]}. " + " ".join(lines) +
                f" Keep the {LOOK[char]} exactly as in the reference, the same body size and proportions in every frame. "
                f"No effects, no motion lines, no projectiles, no shadows."
            )
            states[state] = {"frames": len(chunk) + 1, "fps": 8, "loop": False, "action": action}
            plan[state] = {"anim": anim, "frames": chunk}

    run = f"{ROOT}/runs/{run_name or char}"
    os.makedirs(run, exist_ok=True)
    json.dump({"cell": {"width": 1024, "height": 1024, "safe_margin_x": 40, "safe_margin_y": 40}, "states": states},
              open(f"{run}/request.json", "w"), indent=1, ensure_ascii=False)
    json.dump(plan, open(f"{run}/plan.json", "w"), indent=1)
    print(f"{char}: {len(states)}줄, {sum(len(p['frames']) for p in plan.values())}장")


if __name__ == "__main__":
    main()
