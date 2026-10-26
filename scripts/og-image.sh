#!/usr/bin/env bash
# Re-shoots the share preview (public/og.jpg): the closed notebook on the desk,
# exactly as the built site draws it. Run after changing the cover or the desk.
#
#   npm run build && bash scripts/og-image.sh
#
# Needs Google Chrome and python3 with Pillow. Headless Chrome gives the page
# 87px less height than the window it's asked for, so the window is taller than
# 630 and the shot is cropped back to 1200×630 afterwards — from the top, which
# sips can't do (it only crops from the centre).
set -euo pipefail

cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=4173
WORK="$(mktemp -d)"
trap 'kill "$SERVER" 2>/dev/null || true; rm -rf "$WORK"' EXIT

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory out >/dev/null 2>&1 &
SERVER=$!
disown "$SERVER"   # no "Terminated" notice when the trap stops it
for _ in $(seq 20); do curl -sf "http://127.0.0.1:$PORT/" >/dev/null && break; sleep 0.25; done

# ?still keeps the book shut (no hand) and skips every transition
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run \
  --user-data-dir="$WORK/profile" --force-device-scale-factor=2 \
  --window-size=1200,717 --virtual-time-budget=8000 \
  --screenshot="$WORK/shot.png" "http://127.0.0.1:$PORT/?still" >/dev/null 2>&1

python3 - "$WORK/shot.png" public/og.jpg <<'PY'
import sys
try:
    from PIL import Image
except ImportError:
    sys.exit('og-image: needs Pillow (python3 -m pip install pillow)')
src, dst = sys.argv[1:]
shot = Image.open(src).convert('RGB')                       # 2400 × 1434, at 2×
shot.crop((0, 0, 2400, 1260)).resize((1200, 630), Image.LANCZOS) \
    .save(dst, 'JPEG', quality=88, optimize=True, progressive=True)
PY
echo "public/og.jpg updated"
