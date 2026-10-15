# Pixel Passport — audit and packing repair

Date: 15 October 2026 (Singapore). Public project: pixel-passport-2027. Source baseline: ae3c069. Newer GitHub packing commits integrated: 7a9cd1f and e4c65c8. No existing records were reseeded. All write tests used a separate local QA origin, never the user's public inventory.

## Deployment diagnosis — established, not guessed

The live site was Sites **version 7**, source commit **ae3c069b230e2f3bdc56ab37421cdc9ac7a8954d**. GitHub main had advanced to **e4c65c8** with Packing Adventure v2.1.

The actual live DOM loaded app.js → dashboard-react.js → storybook.js → living-world.js → character-world.js. It did **not** reference packing-upgrade.js or packing-upgrade.css. It contained the legacy `.inventory` and `.suitcase-readiness`, and no `.packing-v2`. The old app.js packingPage ran; living-world.js injected the older suitcase panel. The server's app.js exactly matched version 7 source after line-ending normalization.

Direct requests for the absent packing-upgrade.js and .css returned **HTTP 200 text/html**, the SPA index fallback—not usable JS/CSS. This can hide a missing asset if one checks status code alone. No CSP exceptions or JavaScript errors were observed in the inspected live tab. Assets sent `public, max-age=0, must-revalidate`; no service-worker registration code was found in the application source. This was a publication mismatch; caching was not the demonstrated cause. Browser service-worker registrations were not independently enumerated.

Evidence: [original live capture](live-packing-before.jpg), [HTTP/source evidence](deployment-diagnosis.json), [baseline scorecard](BASELINE.md). GitHub pushes and Sites publication are separate actions; this repair uses the supported Sites archive/version/deployment flow.

## Implemented packing architecture

- `dist/packing-model.js`: authoritative, quantity-aware interpretation of legacy and current packing records; counts, synchronization and weights.
- `dist/packing-upgrade.js`: sole packing renderer, reusable item/bag/suitcase views and centralized actions. Core packingPage/packingForm are delegates. Legacy packing renderer and legacy enhancement injections were retired.
- Initial render runs once after the packing module registers. A missing module shows an error and keeps other planner pages usable.
- Inline quantity, purchase, bag, filter and undo operations persist once and update the packing region, keeping the traveler and navigation mounted. Search retains focus. Shared action binding uses a WeakSet to avoid duplicate listeners.
- Original `pixel-passport-v1` key, IDs, legacy quantities/status, notes and trip associations remain intact. Legacy migration is interpreted on read; mutations add ownedQty/packedQty and keep status compatible with the rest of the planner.

## What changed on the page

Compact Alpine lakeshore header, current trip/progress, selected traveler and independent companion, Change outfit shortcut; quantity-based overview; four bags with user-entered per-trip limits, unknown-weight notices and overweight flags; opening suitcase; illustrated compact inventory with Need/Own/Pack controls and inline bag selection; shopping list; search/category/status/bag filters, name/priority sorting; edit/delete/undo; trip-specific CSV export. Recommendations use actual trip destinations/dates/season, ski plans and skiing activities. Outfit suggestions require a separate action and user acceptance.

Packing cannot create ownership. Purchase increments owned only; packed never exceeds owned. Quantity cannot be reduced below owned. A blank allowance stays unknown; no airline allowance is invented.

## Artwork

The original atlas used irregular object bounds, causing neighboring fragments with uniform CSS cells. A cleaned alpha-transparent version was generated using the built-in image-generation tool. Packing uses explicit object-specific SVG viewports and clips around the complete isolated object, rather than the old uniform CSS sprite cells. The suitcase is a separate, detailed native pixel SVG. Existing clean standalone SVGs cover additional accessories. Images are consistently centered and padded; no emoji inventory art is used.

Assets: `dist/assets/packing/inventory-clean.png`, `dist/assets/packing/suitcase.svg`. The generation brief and provenance are in [artwork notes](ARTWORK.md). Distinct full-body Winter outfits were added for each traveler, separate from Skiing. The brunette keeps her pink beanie; the blonde keeps her floral straw hat. All seven requested outfit choices retain independently selected companions.

## Packing browser acceptance journey

Executed in a JS-rendering browser on an isolated local origin:

| Step | Result / evidence |
|---|---|
| New design / no duplicates | Exactly one `.packing-v2`; zero `.inventory`, `.suitcase-readiness`, or legacy packing checkboxes |
| Add and validation | Packed > owned rejected without closing form; corrected record saved |
| Partial quantities | QA ski socks:4 needed/2 owned/1 packed; Need+→5; Pack+→2 |
| Purchase | Bought one→3 owned, packed remains2 |
| Bag move | Moved same ID from checked to cabin luggage |
| Allowance / overweight | Saved0.1kg cabin limit;0.4kg measured packed estimate warns |
| Missing weights | Packed passport with blank weight explicitly reports one unweighed packed unit |
| Outfit | Switched Hiking→Winter/Skiing; three inventory records unchanged at that step |
| Suggestion | Ski jacket accepted explicitly with0 owned/0 packed; disappears from suggestions |
| Trip isolation | Family trip shows0 items; returning to Audit Swiss Journey restores the original records |
| Reload | Quantities, bag, limit, outfit and selected trip persisted |
| Export | Trip-specific packing CSV downloaded; quantities, bag and notes included |
| Search / filters / sort | Search returns one matching record; category and priority controls work |
| Delete / undo | Record removed then restored with same ID and quantities |
| Suitcase | Native disclosure opens/closes; contents reflect packed units |
| Responsive | 390,768,1440 viewport requests; no horizontal overflow, no duplicate legacy UI, no broken `<img>` elements |

Detailed executed cases: [functional results](functional-results.json). Screenshot measurements: [layout evidence](layout-evidence.json). Final1440px and390px main-page captures are full-page images from the actual public deployment. Populated QA captures and the768px tablet packing capture supplement them; some QA captures are viewport-only because the full-page API failed. Normal-height responsive measurements were taken separately. Native scrollbars reduce content width by15px during normal-height checks.

## Wider audit: scores before → after

Scores are reviewer judgments based on rendered pages, forms, integration tests and source review. They are not a benchmark or proof that every possible state passed. V=visual, F=functionality, E=ease, A=animation, M=mobile, I=integration; each /10. Unchanged scores mean that area was not substantially redesigned.

| Page | V | F | E | A | M | I |
|---|---|---|---|---|---|---|
| Home |8→8|7→8|8→8|8→8|7→7|6→8|
| Trips |8→8|7→8|6→7|7→7|6→7|6→7|
| Itinerary |7→7|6→7|6→7|7→7|6→7|6→7|
| World Map |7→7|5→8|6→7|8→8|6→7|4→8|
| Packing |7→9|7→9|7→8|7→8|7→8|6→9|
| Quests |7→8|6→8|7→7|8→8|7→7|6→8|
| Budget |7→7|6→8|7→7|7→7|7→7|6→8|
| Bookings |7→7|7→8|7→7|6→6|7→7|6→8|
| Ski |8→8|7→7|7→7|7→7|7→7|8→8|
| Journal / Passport |8→8|8→8|7→7|8→8|7→8|7→8|
| Settings / Wardrobe |8→8|5→8|7→8|7→7|7→8|6→8|
| Onboarding,4steps |8→8|8→8|8→8|7→7|8→8|8→8|
| Style Guide |7→7|7→7|7→7|7→7|6→6|6→6|

## Prioritized issue ledger

| Priority / page | Reproduction and actual vs expected | Root cause / implemented repair | Verification |
|---|---|---|---|
|P0 all writes|Throw on localStorage.setItem; app previously continued and said Saved; expected truthful failure and intact prior records|save swallowed errors. Durable snapshot now restores existing objects in place and throws a handled storage error; modal stays open with its draft|Actual save function executed in Node VM with quota stub; failed save rolls back and retry persists. Full browser quota exhaustion not performed|
|P0 Settings|Import object with array collections but invalid profile; insufficient validation could persist unusable state|Validated profile, collections, IDs, strings, numbers, coordinates and rates before replacement|Malformed UI upload rejected; exported valid QA backup imported successfully|
|P1 deployment/Packing|GitHub packing page newer than public legacy DOM|Version7 was never published from newer GitHub source. Integrated commits and explicit Sites publication required|Live diagnosis above; final public verification recorded separately|
|P1 Map|Filter Audit Swiss Journey, click its St Gallen pin; popup previously opened Europe Exchange record, Date TBD and0activities|Decorator resolved duplicate cities by title. Pins now carry and resolve stable destination ID|Browser retest opens correct trip, Feb1,2activities and correct ledger facts|
|P1 Quests|Complete→reopen→complete weekly quest created another identical next-week task|No recurrence identity/check. Successor now deduplicated by parent/date, with legacy matching, month-end clamp|Browser record count3→3; model weekly/month-end cases|
|P1 Budget|25.50 displayed26; expected exact cents|Formatters forced0 decimals. Core and React now retain up to2|Actual40.89 total =25.50+15.39, independent120 estimate; CSV export|
|P1 Itinerary|Saved booking URL absent from expanded train entry|New diary renderer omitted bookingLink. Added safe http/https link|Browser link href matches saved audit ticket|
|P1 Budget|Unrelated edit could replace historical FX with current rate|Conversion recomputed unconditionally. Unchanged amount/currency/base preserves recorded conversion; base change clears incompatible live rates|Executed conversion regression; changed amount recalculates|
|P1 form relations|Trip and destination from another trip could be submitted|No relation check; submission now rejects mismatched trip/destination/expense|Source-established validation; not every mismatch combination browser-tested|
|P2 Packing|Unpacking previously reset purchased item to needed|Ownership conflated with packed state. Quantity model keeps owned and packed separate|Browser purchase/partial/unpack and automated legacy migration tests|
|P2 Trips|Selected trip reset to first on refresh|Selection not stored. SelectedTripId now saved in profile|Browser reload retains audit trip|
|P2 Bookings|Deleting linked expense left expenseId dangling|Delete action now detaches booking link|Source repair; dedicated destructive browser retest not executed|
|P2 Quests|Brunette buddy with blonde selected|Wrong `.quest-buddy` selector corrected to `.quest-companion`|Rendered Flora buddy confirmed|
|P2 Journal|Populated journal card exceeded375px content width with ambient animation paused|A paused perspective entrance froze on its first frame. Entrance disabled for paused motion and phone view; image width bounded|Final responsive capture/measurement|
|P2/P3 UI|Duplicate favorites empty copy; mixed booking icon fallback; Home called wishlist places planned|Remove stale empty node; consistent ticket illustration; saved destinations label|DOM/source and screenshots|

Existing duplicate recurrence test records are preserved; the fix prevents further generation and does not guess which existing records a real user intended to delete.

## Cross-feature integration

Created Audit Swiss Journey; geocoded St Gallen with real coordinates; added transport and accommodation activities; completed one. Linked Audit Flumserberg ski plan to the same stop. Opt-in pass80/rental40 estimates stayed exactly two after repeat save. Ski packing suggestions appeared. Weekly lift-pass quest awarded25XP. Added actual train25.50SGD and meal10CHF; unavailable conversion was initially excluded with notice, then live rate refresh and explicit save converted it to15.39SGD. Linked train booking did not add a second expense. Cancellation kept actual spending, correctly avoiding an invented refund.

Map search added real Zurich coordinates. Booked/visited/undo, favorites, approximate route playback and selected outfit were exercised. The first pin test exposed wrong-record selection; it was corrected and retested against the right trip. Switzerland stamp remained unique for two visited Swiss stops, and Undo removed the extra stop XP. Reload and JSON round-trip retained records and uploaded journal image. Photo size rejection retained the previous image.

## Visual / animation audit

Rich tab-specific environments, warm Fraunces/Nunito, distinctive traveler/companion sprites, real map, quest noticeboard, cards and collectible stamps are established. Packing now uses a compact chapter, separate shopping treatment and colored inventory slots; the original blank beige frame is gone. The reference art is more uniformly pixelated and densely composed than some painterly generated scenes. Some non-packing shared atlas icons still merit individually registered bounds. A real geographic map is retained rather than pretending the concept-art map is accurate cartography.

Existing reusable motion includes train, clouds, water, seasonal particles, traveler/pet idles, route playback and milestones. Packing adds local item-to-bag motion, seal feedback, purchase feedback, progress fills and suitcase disclosure. Manual Paused preference survived reload. Motion code gates on manual preference and prefers-reduced-motion; device-level reduced-motion emulation and sustained frame-rate profiling were **not** executed. No performance score is claimed. The removed Pause Scene button remains removed.

## Checks and honest coverage limits

Executed: npm run build, npm run check (JS syntax, living model, avatar model, data safety and quantity model suites), CUA browser workflows, source/HTTP diagnosis, before/after captures and console inspection. This is a JS/JSX project; TypeScript checks are not applicable. Existing Playwright CI script is retained for GitHub CI; it was not run through a second local browser tool. No errors/warnings were recorded in the inspected final local console.

All ten main routes and Style Guide were rendered. All primary native form types and four onboarding steps were opened/captured at both baseline widths. CRUD and integration coverage is detailed per case, not a claim that every control and every possible combination passed. Destructive trip/destination cascades, all filter combinations, OS-level accessibility settings, real-device touch/pan, full offline/network-failure permutations and long-session storage stress remain unverified. Public browser state was inspected read-only; mutations stayed in isolated QA.

## Remaining capabilities and next phase

These are feature gaps, not controls falsely labeled broken: trip archive/duplicate/travelers; interactive subtask checkboxes; real calendar grid, event end times, overlap/timezone modeling; refunds; booking attachments; inventory templates; full trip-scoped budget summaries; ski snow reports; notifications; authentication/cloud synchronization. Winter and Skiing now have separate presets and artwork.

Next: real-phone accessibility and performance profiling; complete destructive cascade regression coverage; individually registered non-packing icon artwork; persistent undo/history and robust cloud backup before handling important real travel records; calendar/timezone and refund modeling. The app remains device-local and must not imply cloud sync or confirmed provider reservations.

## Screenshots

[Open the before/after gallery](gallery.html). Baseline main-page images mostly show seed/empty data. Final main-page images show the public deployment, while itinerary/tablet QA captures use the populated isolated journey. Different saved profiles/data appear across origins; these are evidence of layout/state handling, not identical-data visual diffs. Forms and onboarding baseline captures are included.

## Public publication verification

Sites version8 successfully published commit f7f70799fb3d1aeafd95940bd3dcbd489b0da931, matching GitHub main at publication. The final documentation update does not change runtime assets. The actual public URL was opened and reloaded after publication: one new renderer, zero legacy inventory/readiness/checkbox elements, correct JS/CSS content types, all checked runtime files byte-identical to the tested build after newline normalization, no broken images and no observed console warnings/errors. All eleven public routes were then captured full-page at1440px and390px. The live wardrobe exposes distinct Winter and Skiing options.

[Public full-page packing proof](public-packing-full.jpg) · [Public DOM](public-dom.json) · [Asset/source verification](public-assets.json) · [Public console](public-console.json) · [Original-record preservation](preservation-results.json).
