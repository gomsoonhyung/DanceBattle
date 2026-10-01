# 참고 포즈 시트: python3 refsheet.py <캐릭터> <동작...>  → sprites-work/batch/ref_<캐릭터>_<첫동작>.png
import json, sys
from PIL import Image, ImageDraw
c, anims = sys.argv[1], sys.argv[2:]
A = {a['anim']: a['frames'] for a in json.load(open('sprites-work/batch/anims.json'))[c]}
C = 120
cols = max(len(A[a]) for a in anims)
out = Image.new('RGBA', (cols * C + 90, len(anims) * C), (40, 36, 56, 255))
d = ImageDraw.Draw(out)
for r, a in enumerate(anims):
    d.text((4, r * C + 4), a, fill='white')
    for i, f in enumerate(A[a]):
        im = Image.open(f'sprites-ref/{c}/{a}_{f}.png').convert('RGBA').crop((0, 40, 640, 680)).resize((C, C))
        out.alpha_composite(im, (90 + i * C, r * C))
        d.text((92 + i * C, r * C + 2), str(f), fill=(255, 210, 63))
out.save(f'sprites-work/batch/ref_{c}_{anims[0]}.png')
