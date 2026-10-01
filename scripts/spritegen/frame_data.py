#!/usr/bin/env python3
"""
기술 데이터로 프레임 데이터 표를 만든다 → docs/design/FRAME_DATA.md
  node scripts/spritegen/moves.mjs        (개발 서버 필요: sprites-work/batch/moves.json)
  python3 scripts/spritegen/frame_data.py

유불리 계산: 마지막으로 닿는 타격 프레임 + 경직 − 기술 전체 길이.
(타격 정지는 양쪽이 같이 멈추므로 빠진다. 다운시키는 기술은 '다운')
"""

import json

D = json.load(open("sprites-work/batch/moves.json"))
ORDER = ["krump", "waacker", "hiphopper", "hiphopgirl", "locker", "househead", "popper", "bboy"]
LEVEL = {"mid": "상단", "low": "하단", "overhead": "중단"}
MOTION = {"qcf": "236", "qcb": "214", "dp": "623"}
NORMAL_INPUT = [
    ("stand", "LP", "약P"), ("stand", "HP", "강P"), ("stand", "LK", "약K"), ("stand", "HK", "강K"),
    ("crouch", "LP", "2약P"), ("crouch", "HP", "2강P"), ("crouch", "LK", "2약K"), ("crouch", "HK", "2강K"),
]


def frames(mv):
    hits = mv["hits"]
    if hits:
        a, b = hits[0]["frames"][0], hits[-1]["frames"][1]
        active = f"{a}" if len(hits) == 1 else f"{a}~{b} ({len(hits)}타)"
        return a, hits[0]["frames"][1] - hits[0]["frames"][0] + 1, mv["total"] - b, active
    for key in ("projectile", "grab"):
        if mv.get(key):
            f = mv[key]["frame"]
            return f, 1, mv["total"] - f, f"{f} ({'장풍' if key == 'projectile' else '잡기'})"
    return None, None, None, "-"


def advantage(mv, stun_key):
    hits = mv["hits"]
    if not hits or mv.get("air"):
        return "-"  # 점프 공격은 착지 높이에 따라 달라서 계산하지 않는다
    last = hits[-1]
    if stun_key == "hitstun" and (last.get("knockdown") or last.get("launch")):
        return "다운"
    if stun_key == "blockstun" and last.get("unblockable"):
        return "가드 불가"
    v = last["frames"][0] + last[stun_key] - mv["total"]
    return f"{'+' if v > 0 else ''}{v}"


def props(mv):
    out = []
    hits = mv["hits"]
    levels = sorted({LEVEL[h["level"]] for h in hits}, key=["상단", "중단", "하단"].index)
    if levels:
        out.append("·".join(levels))
    if mv.get("projectile"):
        p = mv["projectile"]
        out.append(f"장풍 {LEVEL[p['hit']['level']]}" + (" 되돌아옴" if p.get("returnAfter") else ""))
    if any(h.get("unblockable") for h in hits):
        out.append("가드 불가")
    if mv.get("invuln"):
        out.append(f"무적 {mv['invuln'][0]}~{mv['invuln'][1]}")
    if mv.get("armor"):
        out.append("아머")
    if mv.get("counter"):
        out.append("반격")
    if mv.get("meterGain"):
        out.append(f"게이지 +{mv['meterGain']['amount']}")
    if mv.get("cancelWindow"):
        out.append("캔슬")
    if mv.get("chainInto"):
        out.append("체인→" + ",".join(mv["chainInto"]))
    return " · ".join(out)


def row(inp, mv):
    a, act, rec, active = frames(mv)
    dmg = sum(h["damage"] for h in mv["hits"]) or (mv.get("projectile") or {}).get("hit", {}).get("damage") or (mv.get("grab") or {}).get("damage") or "-"
    return f"| {inp} | {mv['name']} | {a or '-'} | {active if mv['hits'] and len(mv['hits']) > 1 else (act or '-')} | {rec if rec is not None else '-'} | {dmg} | {advantage(mv, 'blockstun')} | {advantage(mv, 'hitstun')} | {props(mv)} |"


lines = [
    "# 프레임 데이터",
    "",
    "> `scripts/spritegen/frame_data.py`가 기술 데이터에서 자동으로 만든 표입니다. 손으로 고치지 마세요.",
    "> 숫자는 프레임(1/60초). **발생** = 판정이 처음 나오는 프레임, **빈틈** = 판정이 끝난 뒤 다시 움직일 수 있을 때까지.",
    "> **가드 시 / 맞을 시** = 상대보다 몇 프레임 먼저 움직이는지 (+ 유리, − 불리). 연습 모드 화면 위의 '유불리'로 실제 값을 볼 수 있습니다.",
    "",
]
for cid in ORDER:
    c = D[cid]
    m = c["moves"]
    lines += [f"## {c['name']} — {c['title']}", ""]
    dash = c.get("dash") or {"frames": 16, "speed": 7}
    lines += [f"체력 {c['maxHealth']} · 걷기 {c['walkF']}/{c['walkB']} · 대시 {dash['frames']}f × {dash['speed']}", ""]
    lines += ["| 입력 | 기술 | 발생 | 지속 | 빈틈 | 데미지 | 가드 시 | 맞을 시 | 성질 |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    n = c["normals"]
    for kind, btn, label in NORMAL_INPUT:
        lines.append(row(label, m[n[kind][btn]]))
    lines.append(row("점프 약", m[n["airLight"]]))
    lines.append(row("점프 강", m[n["airHeavy"]]))
    for cmd in n.get("command", []):
        lines.append(row(f"{cmd['dir']}{cmd['button'].replace('LP', '약P').replace('HP', '강P').replace('LK', '약K').replace('HK', '강K')}", m[cmd["move"]]))
    if n.get("throw"):
        lines.append(row("약P+약K", m[n["throw"]]))
    for sp in c["specials"]:
        lines.append(row(f"{MOTION[sp['motion']]}{sp['button']}", m[sp["move"]]))
    lines.append(row("236236P", m[c["super"]]))
    lines.append("")

open("docs/design/FRAME_DATA.md", "w").write("\n".join(lines))
print("docs/design/FRAME_DATA.md")
