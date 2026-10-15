# Baseline scorecard — 15 October 2026

Scores are reviewer judgments, not automated measurements. Order: visual / function / ease / animation / mobile / integration. Captures and functional-results.json provide evidence. This file was recorded before implementation.

| Page | V | F | E | A | M | I | Evidence / main concern |
|---|---:|---:|---:|---:|---:|---:|---|
| Home | 8 | 7 | 8 | 8 | 7 | 6 | Alpine scene and populated panels; map calls all saved places planned; money rounding |
| Trips | 8 | 7 | 6 | 7 | 6 | 6 | Illustrated route cards; selected trip lost on reload; lengthy mobile scroll |
| Itinerary | 7 | 6 | 6 | 7 | 6 | 6 | Three views, completion; saved booking link omitted; drag-only ordering |
| World Map | 7 | 5 | 6 | 8 | 6 | 4 | Real geocoder/tiles and route preview; duplicate city pin resolves wrong trip record |
| Packing | 7 | 7 | 7 | 7 | 7 | 6 | Qty/weight/bags work; owned state lost when unpacking; empty frame |
| Quests | 7 | 6 | 7 | 8 | 7 | 6 | Completion/XP work; repeated completion duplicates recurrence; wrong buddy |
| Budget | 7 | 6 | 7 | 7 | 7 | 6 | Distinct stages/live FX; cents hidden; historic conversion changes on edits |
| Bookings | 7 | 7 | 7 | 6 | 7 | 6 | Creation/status/link work; no attachments; cancellation retains actual expense correctly |
| Ski | 8 | 7 | 7 | 7 | 7 | 8 | Linked destination and two estimates are idempotent; equipment suggestions |
| Journal / Passport | 8 | 8 | 7 | 8 | 7 | 7 | Photo create/edit/size validation; unique country stamp and visited undo |
| Settings / Wardrobe | 8 | 5 | 7 | 7 | 7 | 6 | Appearance/motion persist; backup validation too weak; false success on storage failure |
| Onboarding (4 steps) | 8 | 8 | 8 | 7 | 8 | 8 | Independent traveler/companion/outfit, review and reload completed |
| Style Guide | 7 | 7 | 7 | 7 | 6 | 6 | Asset gallery inspected; legacy art is intentional gallery content |

## Confirmed priorities

- P0: `save()` catches storage failure but callers continue and show Saved. Executed with actual function in Node VM and a throwing storage stub. Browser quota exhaustion not performed.
- P1: Map pins resolve destination by displayed city/country, picking first duplicate across trips. Reproduced in browser with Audit Swiss Journey St. Gallen pin opening Europe Exchange 2027.
- P1: Completing, reopening, completing weekly quest creates two same-date successors. Browser reproduced.
- P1: 25.50 SGD expense renders $26. Browser reproduced; formatter forces zero decimals.
- P1: Saved activity booking link inaccessible in expanded itinerary. Browser reproduced.
- P2: Quest buddy remains brunette with blonde profile; wrong enhancement selector.
- P2: Selected trip resets to first trip on reload. Browser reproduced.
- P2: Home map label counts wishlist places as planned. Source and rendered screenshot.
- P2: Empty packing frame wastes space. Screenshot.

## Source-established risks needing regression verification

- Backup checks arrays only, not profile/records/unique IDs; invalid imported state can replace valid data.
- Foreign-currency amount/rate is recalculated on unrelated edit, contradicting preserved historical rates.
- Unpacking a purchased item resets it to needed, discarding ownership.
- Expense deletion does not detach booking.expenseId.
- Forms allow a trip and a destination from another trip.

## Missing capabilities / opportunities

Trip archive/duplicate/travelers; true calendar grid; event end time, overlap/timezone modeling; interactive subtasks; per-trip financial summaries and inventory filters/templates; refunds; booking attachments; snow reports; notifications; cloud synchronization. These have no working controls and are not described as regression bugs. Current map is geographically correct raster cartography rather than the illustrated reference map. Generated environments are more painterly than the reference pixel sprites; remaining atlas edge artifacts and long mobile card feeds merit art/layout work.
