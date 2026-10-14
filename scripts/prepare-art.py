"""Create web delivery copies; keep the original generated PNGs unchanged."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / "dist" / "assets"
originals = root / "source-art"
total_original = total_web = 0
replacements = []
for source in originals.rglob("*.png"):
    relative = source.relative_to(originals)
    target = (assets / relative).with_suffix(".webp")
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image.save(target, "WEBP", quality=92, method=6)
    total_original += source.stat().st_size
    total_web += target.stat().st_size
    replacements.append(("assets/" + relative.as_posix(), target.relative_to(root / "dist").as_posix()))
for relative in ["dist/app.js", "dist/styles.css", "dist/storybook.js", "dist/storybook.css", "dist/reference-dashboard.css", "src/dashboard.jsx", "dist/assets/manifest.json"]:
    path = root / relative
    text = path.read_text(encoding="utf-8")
    for original, delivery in replacements:
        text = text.replace(original, delivery)
    path.write_text(text, encoding="utf-8")
print(f"Web delivery art: {total_web / 1024 / 1024:.1f} MB (original PNGs: {total_original / 1024 / 1024:.1f} MB)")
