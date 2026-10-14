# Living world verification — 14 October 2026

## Refinement pass 1

Inspected all ten page DOMs at 390 px. Corrected upcoming-postcard ordering so new planned ski stops appear on Home, added 44 px map-pin targets, labeled feature filters, removed the remaining ski-card mountain emoji, and paused route playback with an observer rather than running a hidden RAF loop. Train wheel baseline was measured against the fixed rail: both align within 1.5 CSS pixels.

## Refinement pass 2

Inspected the generated sprite alpha bounds and corrected frame registration with SVG viewports. Original artwork stays untouched; idle, blink, look and walk cells now share a centered feet baseline. Added visible Explorer levels and quest-to-level XP feedback. Kept diary disclosures open when completion rerenders the page. Added unique railway pattern IDs, native pixel bird shapes, deferred offscreen page rendering, and larger phone scene controls.

All ten pages checked at 360, 390, 430 and 1280 px: no document horizontal overflow, no missing image elements, phone navigation displayed only at phone widths, and appropriate scene heights. Dynamic SVG character and map-pin assets load successfully.

## Functional browser checks

Performed using the isolated `127.0.0.1` origin, preserving the user's `localhost` and published-site records:

- Chamonix geocoder returned a matching French place. Selecting it populated real coordinates.
- Saving the new ski plan created one linked itinerary stop and two opted-in estimated expenses (120 + 60 SGD). Saving it again retained one stop and two estimates. Existing actual spending stayed at 120 SGD.
- New mountain plan appeared in the dashboard and offered ski packing and quest suggestions.
- Monthly ledger selected February 2027 and displayed only its two estimated entries.
- Manual summer scene, city wardrobe and paused ambience persisted across navigation and reloads. The train had no running animation when paused.
- An activity was created, expanded, completed and reflected in trip progress and contextual companion feedback.
- Marking Chamonix visited unlocked France, displayed the stamp effect and produced the journal footprint timeline; genuine XP became 100. Completing the accepted ski quest made it 125.
- Accepted gloves disappeared from suggestions; packing them changed readiness from 50% to 100% and triggered suitcase feedback. Carry-on tab correctly showed an empty bag.
- Route preview followed three saved non-wishlist stops and finished at Chamonix. Selecting its map pin opened the correct illustrated destination sheet.
- Gallery changed season, resumed registered walk frames only when the avatar entered the viewport, and opened/closed the game-message modal.

## Code and model gates

`npm run check` and `npm run build` passed. Model checks cover automatic/manual seasons, valid saved coordinates, ski destination deduplication, estimate deduplication, conversion provenance, preservation of manual ledger edits/actual costs/deleted records, and genuine milestones. Existing storage key and IDs are retained; profile preferences are additive.

## Verification limits

The browser screenshot API repeatedly returned “Unable to capture screenshot” in this session. Raster screenshot comparisons of the complete app could not be performed. Refinement used direct asset inspection, browser layout bounds, computed animation state, accessibility trees and real control interactions. Reduced-motion behavior is implemented in CSS and React media-query listeners; the browser did not expose media emulation, so its system setting was not altered. No device-specific 60fps measurement is claimed. Live weather remains the existing on-demand Open-Meteo feature; no fabricated snow or forecast data was added.
