#!/usr/bin/env bash
# Turns the card art dropped in assets_src/cards into the images the site uses:
# public/cards/<rank>-<suit>.webp, centre-cropped to a playing card's 5:7 and
# sized for the inspect view. Run it after adding or replacing any of them,
# then point that card's `img` in components/notebook/Cards.tsx at the file.
#
#   bash scripts/card-art.sh
#
# The prompts the art was made from are in assets_src/cards/PROMPTS.md.
# Needs python3 with Pillow.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p public/cards

python3 - assets_src/cards public/cards <<'PY'
import pathlib, re, sys
try:
    from PIL import Image
except ImportError:
    sys.exit('card-art: needs Pillow (python3 -m pip install pillow)')
src, dst = map(pathlib.Path, sys.argv[1:])
W, H = 600, 840                                  # 5:7, twice the size it's inspected at
done = 0
for f in sorted(src.iterdir()):
    if not re.fullmatch(r'(10|[2-9AJQK])-(spades|hearts|diamonds|clubs)\.(png|jpe?g|webp)', f.name, re.I):
        continue
    im = Image.open(f).convert('RGB')
    w, h = im.size
    if w / h > W / H:                            # too wide: trim the sides
        cw = round(h * W / H); im = im.crop(((w - cw) // 2, 0, (w + cw) // 2, h))
    else:                                        # too tall: trim top and bottom
        ch = round(w * H / W); im = im.crop((0, (h - ch) // 2, w, (h + ch) // 2))
    out = dst / (f.stem.lower() + '.webp')
    im.resize((W, H), Image.LANCZOS).save(out, 'WEBP', quality=82, method=6)
    print(f'{f.name} → {out}  ({out.stat().st_size // 1024} KB)')
    done += 1
print(f'card-art: {done} card(s) written' if done else 'card-art: nothing to do — no <rank>-<suit> images in ' + str(src))
PY
