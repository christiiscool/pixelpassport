# Visual asset inventory

Audit: 143 visual assets in `dist/assets` and `source-art`. Dimensions and format were checked programmatically; the character and postcard sheets were inspected visually. The homepage retains its existing illustrated landscape.

## Findings and decisions

- Character action and companion atlases have visible red edge debris and inconsistent cell gutters. Registered viewports prevent neighboring full sprites, but edge cleanup or redrawing remains necessary for perfect pixel consistency. The homepage keeps the existing registered traveler and companion artwork.
- Legacy landscape bitmaps and the four-panel postcard sheet should stay within their intended crop. They are retained on secondary pages; the existing homepage landscape is retained for visual consistency.
- SVG icons are grid-based vectors without embedded raster images. They can scale cleanly and remain the inventory controls.
- Several destination cards still use a generic Alpine fallback. Those need city-specific art in a later art pass; avoid presenting that fallback as the destination itself.

## Shipped assets

| Asset | Geometry | Assessment | Decision |
| --- | --- | --- | --- |
| `alpine-train.webp` | 2048 × 768; RGB | flattened illustration | retain on secondary pages; replace where layered motion is needed |
| `animations/sparkle.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `avatars/traveler-actions.webp` | 1536 × 1024; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `avatars/traveler-map.webp` | 1199 × 1312; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `avatars/traveler-outfits.webp` | 1536 × 1024; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `avatars/traveler-poses.webp` | 1536 × 1024; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `avatars/traveler-views.webp` | 2172 × 724; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `backgrounds/parchment-grain.svg` | 0 0 96 96 | native vector | retain as crisp grid vector |
| `characters/blonde-actions.webp` | 1086 × 1448; RGBA | atlas; edge debris visible | registered crop now; clean/redraw fringes |
| `characters/blonde-wardrobe.webp` | 1209 × 1301; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `characters/blonde-winter.png` | 1024 × 1536; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `characters/brunette-actions.webp` | 1086 × 1448; RGBA | atlas; edge debris visible | registered crop now; clean/redraw fringes |
| `characters/brunette-wardrobe.webp` | 1199 × 1312; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `characters/brunette-winter.png` | 1024 × 1536; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `characters/companions.webp` | 1086 × 1448; RGBA | atlas; edge debris visible | registered crop now; clean/redraw fringes |
| `characters/mochi-grey.webp` | 1536 × 1024; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |
| `companions/cat.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `decorations/floral-atlas.webp` | 1536 × 1024; RGBA | multi-cell sheet | use explicit crop only; extract individual frames for animation |
| `decorations/floral-corner.svg` | 0 0 80 80 | native vector | retain as crisp grid vector |
| `destinations/europe-postcards.webp` | 1254 × 1254; RGB | multi-cell sheet | use explicit crop only; extract individual frames for animation |
| `destinations/finland.webp` | 1254 × 1254; RGB | standalone postcard | retain within original aspect ratio |
| `destinations/paris.webp` | 1254 × 1254; RGB | standalone postcard | retain within original aspect ratio |
| `destinations/rome.webp` | 1254 × 1254; RGB | standalone postcard | retain within original aspect ratio |
| `destinations/st-gallen.webp` | 1254 × 1254; RGB | standalone postcard | retain within original aspect ratio |
| `food/food.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/adapter.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/bookings.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/boots.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/bottle.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/budget.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/bus.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/calendar.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/camera.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/car.svg` | 0 0 32 24 | native vector | retain as crisp grid vector |
| `icons/cat.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/charging-cable.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/clock.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/cloud.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/compass.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/daypack.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/electronics.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/ferry.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/flower.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/food.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/gloves.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/goggles.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/hat.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/headphones.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/heart.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/helmet.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/home.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/hotel.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/jacket.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/journal.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/laundry.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/map.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/medicines.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/mountain.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/neck-pillow.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/packing.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/pants.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/passport.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/pin.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/plane.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/raincoat.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/scarf.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/settings.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/ski-jacket.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/ski-pants.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/ski-socks.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/ski.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/snow.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/socks.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/stamp.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/star.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/suitcase.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/sunscreen.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/sweater.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/tasks.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/thermals.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/toiletries.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/toothbrush.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/train.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/travel-inventory-atlas.webp` | 1536 × 1024; RGBA | multi-cell sheet | use explicit crop only; extract individual frames for animation |
| `icons/trips.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/umbrella.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `icons/wallet.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `landscapes/alpine-train.webp` | 2048 × 768; RGB | flattened illustration | retain on secondary pages; replace where layered motion is needed |
| `maps/pin.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/boots.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/electronics.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/gloves.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/goggles.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/helmet.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/inventory-clean.png` | 1536 × 1024; RGBA | multi-cell sheet | use explicit crop only; extract individual frames for animation |
| `packing/jacket.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/pants.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/suitcase.svg` | 0 0 64 72 | native vector | retain as crisp grid vector |
| `packing/sweater.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/thermals.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `packing/toiletries.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `skiing/alpine-resort.webp` | 1774 × 887; RGB | flattened illustration | retain on secondary pages; replace where layered motion is needed |
| `stamps/stamp.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `transport/bus.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `transport/ferry.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `transport/plane.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `transport/train.svg` | 0 0 32 32 | native vector | retain as crisp grid vector |
| `travel-companion.webp` | 1199 × 1312; RGBA | standalone raster | retain at source size or smaller |
| `ui/notebook-divider.svg` | 0 0 480 18 | native vector | retain as crisp grid vector |
| `ui/ribbon.svg` | 0 0 128 42 | native vector | retain as crisp grid vector |
| `world/mountains.webp` | 2172 × 724; RGBA | flattened illustration | retain on secondary pages; replace where layered motion is needed |
| `world/packing-lakeshore.webp` | 1774 × 887; RGB | flattened illustration | retain on secondary pages; replace where layered motion is needed |
| `world/seasons.webp` | 1774 × 887; RGBA | multi-cell sheet | use explicit crop only; extract individual frames for animation |
| `world/tab-settings.webp` | 1672 × 941; RGB | flattened illustration | retain on secondary pages; replace where layered motion is needed |
| `world/traveler.webp` | 1536 × 1024; RGBA | sprite sheet | use registered cells; audit edge pixels before enlarging |

## Source art

| Asset | Geometry | Decision |
| --- | --- | --- |
| `source-art/alpine-train.png` | 2048 × 768; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/avatars/traveler-actions.png` | 1536 × 1024; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/avatars/traveler-map.png` | 1199 × 1312; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/avatars/traveler-outfits.png` | 1536 × 1024; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/avatars/traveler-poses.png` | 1536 × 1024; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/avatars/traveler-views.png` | 2172 × 724; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/characters/blonde-actions.png` | 1086 × 1448; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/characters/blonde-reference.png` | 1448 × 1086; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/characters/blonde-wardrobe.png` | 1209 × 1301; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/characters/brunette-actions.png` | 1086 × 1448; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/characters/brunette-wardrobe.png` | 1199 × 1312; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/characters/companions.png` | 1086 × 1448; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/characters/mochi-grey.png` | 1536 × 1024; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/decorations/floral-atlas.png` | 1536 × 1024; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/destinations/europe-postcards.png` | 1254 × 1254; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/destinations/finland.png` | 1254 × 1254; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/destinations/paris.png` | 1254 × 1254; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/destinations/rome.png` | 1254 × 1254; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/destinations/st-gallen.png` | 1254 × 1254; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/icons/travel-inventory-atlas.png` | 1536 × 1024; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/landscapes/alpine-train.png` | 2048 × 768; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/skiing/alpine-resort.png` | 1774 × 887; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/travel-companion.png` | 1199 × 1312; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/world/mountains.png` | 2172 × 724; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/world/packing-lakeshore.png` | 1774 × 887; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/world/seasons.png` | 1774 × 887; RGBA | Keep as the editable original; export only the needed cells. |
| `source-art/world/tab-settings.png` | 1672 × 941; RGB | Keep as the editable original; export only the needed cells. |
| `source-art/world/traveler.png` | 1536 × 1024; RGBA | Keep as the editable original; export only the needed cells. |
