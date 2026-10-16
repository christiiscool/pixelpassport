"""Extract the original painted icons from their irregular transparent atlas.

The illustrations do not fit a strict 6 x 4 grid: a few extend across cell
edges. These object bounds keep every outline while excluding its neighbours.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "dist/assets/icons/travel-inventory-atlas.webp"
OUTPUT = ROOT / "dist/assets/icons/painted"
BOUNDS = [
    (27, 27, 253, 283),    # home
    (285, 62, 486, 279),   # trips / packing
    (529, 79, 773, 268),   # map
    (808, 59, 979, 287),   # tasks
    (1019, 80, 1222, 277), # budget
    (1261, 79, 1510, 260), # bookings
    (22, 291, 244, 531),   # ski
    (265, 327, 520, 518),  # journal
    (550, 324, 736, 513),  # settings
    (761, 341, 1005, 499), # plane
    (1021, 327, 1256, 525),# train
    (1274, 336, 1522, 511),# camera
    (22, 533, 244, 752),   # jacket
    (281, 534, 464, 766),  # pants
    (509, 541, 730, 747),  # thermals
    (755, 552, 990, 747),  # boots
    (1018, 547, 1232, 744),# gloves
    (1264, 584, 1512, 724),# goggles
    (31, 768, 233, 982),   # helmet
    (270, 794, 496, 970),  # toiletries
    (526, 763, 827, 978),  # electronics
    (833, 775, 1017, 979), # passport
    (1100, 756, 1212, 986),# bottle
    (1319, 781, 1492, 971),# adapter
]


def main():
    atlas = Image.open(SOURCE).convert("RGBA")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for index, bounds in enumerate(BOUNDS):
        icon = atlas.crop(bounds)
        content = icon.getchannel("A").getbbox()
        if not content:
            raise ValueError(f"No visible pixels for icon {index}")
        icon = icon.crop(content)
        icon.thumbnail((232, 232), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (256, 256))
        canvas.alpha_composite(icon, ((256 - icon.width) // 2, (256 - icon.height) // 2))
        canvas.save(OUTPUT / f"{index:02}.webp", format="WEBP", lossless=True)


if __name__ == "__main__":
    main()
