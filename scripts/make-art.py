#!/usr/bin/env python3
"""Redraws the organisation logos as 1-bit dither.

    python3 scripts/make-art.py

Six brands' colour schemes sitting on little white tiles was the one thing on
the page still speaking its own language. Each mark becomes a white-on-
transparent PNG that the page uses as a CSS mask, so it is painted in the ink
colour around it and follows the hour with everything else.

The portrait is not processed here. It is Bruce's own dithered photograph,
used exactly as it came, with only a CSS colour filter over it.

Needs python3 with Pillow — the same Pillow scripts/og-image.sh already uses.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LOGO_OUT = ROOT / "public" / "logos" / "dither"

# `size` is the long side in pixels — the size the page draws it at, so the
# browser never resamples the dither. The numbers are tuned by eye rather than
# shared, because a round seal and a wordmark with the same long side do not
# carry the same weight: the seal reads far heavier, so it is set smaller.
# `invert` says which end of the source is the ink; most are dark on white.
LOGOS = {
    "agai": dict(src="public/logos/agai.webp", size=34),
    "convoloo": dict(src="public/logos/convoloo.webp", size=32),
    "cmu": dict(src="public/images/cmu-seal.webp", size=34),
    "ucsd": dict(src="public/images/ucsd-seal.webp", size=32, gamma=1.05),
    "helport": dict(src="public/logos/helport.webp", size=86),
    "bosch": dict(src="public/logos/bosch.webp", size=78),
    "franklin-templeton": dict(src="public/logos/franklin-templeton.webp", size=84),
}


def trim_white(im):
    """Drop the white margin baked into most of these files."""
    from PIL import ImageChops
    bg = Image.new("L", im.size, 255)
    box = ImageChops.difference(im.convert("L"), bg).point(lambda v: 255 if v > 18 else 0).getbbox()
    return im.crop(box) if box else im


def make_logo(src, long_side, dest, invert=True, gamma=0.78):
    from PIL import ImageOps

    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        flat = Image.new("RGB", im.size, (255, 255, 255))
        im = im.convert("RGBA")
        flat.paste(im, mask=im.split()[-1])
        im = flat
    im = trim_white(im.convert("RGB"))

    w, h = im.size
    scale = long_side / max(w, h)
    size = (max(1, round(w * scale)), max(1, round(h * scale)))

    # on a dark page the ink is whatever should glow; for a dark-on-white mark
    # that means flipping it first
    grey = ImageOps.autocontrast(im.convert("L"), cutoff=2)
    if invert:
        grey = ImageOps.invert(grey)
    grey = grey.resize(size, Image.LANCZOS)
    # a touch of extra contrast, or mid-greys dither into an even speckle that
    # reads as noise rather than as a mark
    grey = ImageOps.autocontrast(grey, cutoff=1).point(lambda v: min(255, int((v / 255) ** gamma * 255)))

    bits = grey.convert("1")  # Pillow error-diffuses here by default
    out = Image.new("RGBA", size, (255, 255, 255, 0))
    out.putalpha(bits.convert("L"))
    out.paste((255, 255, 255), (0, 0), bits.convert("L"))
    out.save(dest, optimize=True)
    return size


def main():
    LOGO_OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in LOGOS.items():
        src = ROOT / spec["src"]
        if not src.exists():
            print(f"art: skipping {name} — no {spec['src']}")
            continue
        w, h = make_logo(src, spec["size"], LOGO_OUT / f"{name}.png",
                         invert=spec.get("invert", True), gamma=spec.get("gamma", 0.78))
        print(f"art: public/logos/dither/{name}.png — {w}×{h}, 1-bit")


if __name__ == "__main__":
    main()
