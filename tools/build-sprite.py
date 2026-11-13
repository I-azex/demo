#!/usr/bin/env python3
"""Собирает SVG-спрайт из assets/stickers/*.svg и вставляет в index.html."""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STICKERS = os.path.join(ROOT, "assets", "stickers")
INDEX = os.path.join(ROOT, "index.html")
START = "<!-- ICON SPRITE (generated) -->"
END = "<!-- /ICON SPRITE -->"

symbols = []
for path in sorted(glob.glob(os.path.join(STICKERS, "*.svg"))):
    name = os.path.splitext(os.path.basename(path))[0]
    with open(path, "r", encoding="utf-8") as fh:
        src = fh.read()
    m = re.search(r"<svg\b([^>]*)>(.*?)</svg>", src, re.S | re.I)
    if not m:
        print(f"skip (no svg): {name}", file=sys.stderr)
        continue
    attrs, inner = m.group(1), m.group(2)
    vb = re.search(r'viewBox\s*=\s*"([^"]+)"', attrs)
    viewbox = vb.group(1) if vb else "0 0 120 120"
    inner = inner.strip()
    symbols.append(
        f'<symbol id="st-{name}" viewBox="{viewbox}">{inner}</symbol>'
    )
    print(f"ok: st-{name}")

sprite = (
    START
    + "\n"
    + '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true" focusable="false">\n'
    + "\n".join(symbols)
    + "\n</svg>\n"
    + END
)

with open(INDEX, "r", encoding="utf-8") as fh:
    html = fh.read()
if START not in html or END not in html:
    print("markers not found in index.html", file=sys.stderr)
    sys.exit(1)
html = re.sub(
    re.escape(START) + r".*?" + re.escape(END),
    lambda _m: sprite,
    html,
    flags=re.S,
)
with open(INDEX, "w", encoding="utf-8") as fh:
    fh.write(html)
print(f"done: {len(symbols)} symbols")
