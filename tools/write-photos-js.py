import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
manifest = json.load(open(os.path.join(ROOT, "assets", "img", "manifest.json"), encoding="utf-8"))
CAP = {
 "cigarette.webp": "пять минут до звонка",
 "night-tram.webp": "трамвай в 23:40",
 "stairwell.webp": "наш подъезд. он был таким",
 "garages.webp": "гаражи. пахло бензином и свободой",
}
photos = []
for m in manifest:
    name = m["file"].split("/")[-1]
    m["caption"] = CAP.get(name, m.get("caption", ""))
    photos.append({
        "file": m["file"],
        "caption": m["caption"],
        "alt": m["alt"],
        "slot": m.get("slot", ""),
        "wall": m.get("wall", False),
        "title": m.get("title", ""),
        "creator": m.get("creator", ""),
        "license": m.get("license", ""),
        "licenseUrl": m.get("licenseUrl", ""),
        "sourceUrl": m.get("sourceUrl", ""),
    })
js = "/* ПОДЪЕЗД №9 — фотографии: автосгенерировано из assets/img/manifest.json */\n"
js += "window.NEFOR_PHOTOS = " + json.dumps(photos, ensure_ascii=False, indent=1) + ";\n"
open(os.path.join(ROOT, "assets", "js", "photos.js"), "w", encoding="utf-8").write(js)
print("written", len(photos))
