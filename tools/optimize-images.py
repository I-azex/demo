#!/usr/bin/env python3
"""Пережимает фото сайта под реальные размеры показа и обновляет манифест."""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
MANIFEST = os.path.join(IMG, "manifest.json")

# file -> (макс. сторона, качество)
RULES = {
    "hero-stairs.webp": (1000, 78),
    "hero-match.webp": (1000, 78),
    "stairwell.webp": (1200, 74),
    "panelka.webp": (1200, 74),
    "lighter.webp": (1000, 76),
    "cigarette.webp": (1200, 74),
    "night-tram.webp": (1200, 74),
    "cassette.webp": (1200, 74),
    "garages.webp": (1200, 74),
    "streetlamp.webp": (1200, 74),
}

manifest = json.load(open(MANIFEST, encoding="utf-8"))
before = sum(os.path.getsize(os.path.join(IMG, m["file"].split("/")[-1])) for m in manifest)
for m in manifest:
    name = m["file"].split("/")[-1]
    if name not in RULES:
        continue
    path = os.path.join(IMG, name)
    limit, quality = RULES[name]
    im = Image.open(path).convert("RGB")
    if max(im.size) > limit:
        ratio = limit / max(im.size)
        im = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.LANCZOS)
    im.save(path, "WEBP", quality=quality, method=6)
    m["width"], m["height"] = im.width, im.height
    m["bytes"] = os.path.getsize(path)
    print(f'{name}: {im.width}x{im.height} {m["bytes"]//1024} KB')

with open(MANIFEST, "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=1)

after = sum(os.path.getsize(os.path.join(IMG, m["file"].split("/")[-1])) for m in manifest)
print(f"TOTAL: {before/1024:.0f} KB -> {after/1024:.0f} KB")
