# Packing refinement — 15 October 2026

## Changes

- Compact item cards keep packing controls visible; bag assignment, needed/owned controls and notes are available in an expandable Details & quantities section.
- Section shortcuts jump directly to inventory, shopping and suggestions with keyboard focus and reduced-motion support.
- Quantity buttons have44×44px targets at390,768 and1440px widths.
- Inline quantity updates now use the local packing update path, preserving the mounted traveler, expanded details and input focus. This corrects a remaining full-app save/render call.
- Suitcase preview defaults to the bag with the most packed units, instead of an empty checked bag. Explicit bag selection takes priority.
- Outfit suggestions now cover all seven outfits, open the review section and report when existing suggestions already cover the outfit.
- Bag weights show two decimal places. Singular missing-weight copy is corrected.
- SVG item flight animation uses setAttribute for its class, fixing an animation-enabled error that the earlier paused-motion tests did not exercise.
- Unowned cards lead to the shopping list. Pack/unpack toggles correctly when all owned units are packed, even if more units are still needed.

## Executed verification

- npm run check and npm run build passed.
- Regression cases cover outfit-specific recommendations for each of seven outfits, local-save options, partially owned unpacking, automatic/explicit bag preview, quantity limits, legacy migration and trip isolation.
- Browser at390/768/1440: one renderer, no legacy inventory duplication, no horizontal overflow, minimum visible quantity target44px.
- With ambient motion On, Pack+ preserved the hero's SVG identity and produced no console error. Own+ retained expanded details and saved notes; owned increased while packed did not.
- Category filter retained keyboard focus after update. Section shortcuts focus their section label. Outfit suggestion disclosure opened automatically.
- QA writes used the existing isolated127.0.0.3 origin. No user public inventory was edited.

[Mobile inventory](mobile-inventory.jpg) · [Layout results](layout-results.json) · [Console](console.json)

No real-device performance or OS reduced-motion emulation is claimed. The previously documented device-local storage limitations still apply.
