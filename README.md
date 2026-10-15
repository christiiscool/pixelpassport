# Pixel Passport

**Every journey is an adventure.** A phone-first illustrated travel planner for a January–May 2027 European exchange.

## Run locally

Requires Node.js 18 or newer. The checked-in `dist/` output can be served directly. To edit and rebuild the React dashboard, install dependencies first:

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:4173`. Run `npm run check` to validate JavaScript syntax.

## What works

- Ten planning sections plus a living asset gallery at `#style-guide`, with phone bottom navigation and an illustrated menu drawer.
- A React dashboard and reusable visual components in `src/dashboard.jsx`, including character avatars, destination postcards, inventory slots, progress bars, quest cards, and passport stamps.
- Original scenery, city postcards, character expression/action/outfit sheets, a shaded inventory icon atlas, and floral decorations. The asset catalog is in `dist/assets/manifest.json`; optimized WebP delivery copies are in `dist/assets/`, with the original PNGs retained in `source-art/`.
- Draft trips and destinations with coordinates, order, dates, notes, and status. The map uses MapLibre and OpenStreetMap tiles. A new destination immediately appears on the map.
- Activity ideas and day plans with dates, times, estimated costs, categories, status, booking links, and drag reordering.
- Packing Adventure inventory with separate needed/owned/packed quantities, per-trip shopping and winter/ski suggestions, illustrated gear icons and character wardrobe access. User-entered luggage limits are per trip, not fabricated airline allowances; the page flags overweight bags and supports CSV export. Packed-weight totals explicitly flag items missing weight estimates.
- Quest board with due dates, priority, categories, recurrence, XP, and suggestions linked to planned destinations or ski plans.
- Estimated, committed, and actual expenses with original currency, saved conversion rate, budget totals, category chart, and CSV export. Bookings can reference an expense without counting it twice.
- Booking vault, ski planner, journal photos under 1 MB, and country stamps unlocked by marking a destination visited.
- Current weather via Open-Meteo, place coordinates via Nominatim, and live exchange rates via open.er-api.com when reachable.
- Browser-local persistence, JSON export/import, and reset in Settings.

All initial destinations and trips are **drafts**. No booking confirmations, prices, or exact city dates are fabricated.

## Storage and privacy

Records and small journal photos are stored in this browser's `localStorage`, not synchronized across devices. Clearing site data removes them. Export a JSON backup from Settings when moving devices. The public app does not publish these browser-local records. The existing `pixel-passport-v1` storage key and record IDs are preserved.

Map tiles, geocoding, weather, fonts, and exchange rates use public third-party services. Their availability depends on the network. The UI retains saved records if those calls fail. No secret keys are embedded in client code.

## Database and authentication setup

Supabase is **not connected in this release**. To add synchronized storage and authentication, create a Supabase project, enable email authentication, and create tables for `trips`, `destinations`, `activities`, `tasks`, `packing_items`, `expenses`, `bookings`, `ski_trips`, and `journal_entries`. Use UUID primary keys, `user_id` ownership, foreign keys for relationships, and row-level security policies scoped to `auth.uid()`. Store uploaded documents and larger photos in a private Supabase Storage bucket. Add server-side API routes for write validation and file handling; keep the service-role key in server environment variables only. Migrate existing JSON backups by preserving their stable IDs. Until that backend is implemented, keep the app labeled demo mode.

## Deployment

This repository is configured for OpenAI Sites with `.openai/hosting.json`, using `dist/` as a static directory. Rebuild the component bundle with `npm run build` before publishing source changes. The app can also be deployed to another static host with output directory `dist`.

## Current limits

The dashboard uses React; the existing editing pages and local data layer retain their established JavaScript implementation. MapLibre runs from a CDN. Ski plans can create a new mapped itinerary stop after a coordinate lookup, or link to an existing stop. Booking document uploads, long-term cloud photo storage, snow reports, shared syncing, and richer itinerary calendar controls need a backend or further work. Destination deletion explicitly confirms removal of its activities; other linked records are retained and detached.

## Living world upgrade

- Seasonal Alpine layers, an independent pixel train on a fixed bridge, cloud drift, pixel particles, restrained parallax, water accents and lantern glow. Canvas animation stops outside the viewport or when the document is hidden; CSS motion has shared tokens and honors reduced motion.
- Reusable React scene, companion, cat, dialogue, stamp, map-pin, modal and achievement components in `src/world.jsx`. The workshop at `#style-guide` previews seasons, character states, outfits, map pins and effects without changing records.
- Settings retain manual season, wardrobe and ambient pause preferences. Automatic seasons derive from a selected destination arrival, then the trip departure month, with a deterministic winter fallback.
- Activity diary disclosures keep their expanded state during completion, calendar/list/timeline transitions use the same motion tokens, and transport entries link to the saved route preview.
- Packing bag tabs and readiness, actual quest XP feedback, genuine visited-country unlocks and a scrapbook footprint timeline.
- Interactive category filtering and monthly estimated/actual expense charts use saved conversion amounts. Unconverted and undated costs remain clearly identified.
- Ski destination creation and cost linking are explicit form controls. Linked estimates carry `sourceSkiId`, a cost-part key and a signature; subsequent saves preserve edited, actual, committed and removed ledger entries. Clearing a ski cost does not silently delete an expense. Equipment and tasks are suggestions until accepted.

Audit and feature proposals: `docs/interactive-upgrade-audit.md`. Original asset prompts: `scripts/living-art-prompts.md`. Functional gates: `npm run check`.

## Travelers, companions and the atlas

- New visitors choose a brunette or blonde traveler, an independent grey cat or white puppy, and one of six outfits, then review their choices. Returning profiles receive an additive migration and skip onboarding. The original storage key, record IDs and travel arrays remain intact.
- Wardrobe choices save immediately and update every character island, including the optional map traveler. Both characters have distinct signature and outfit artwork. The wardrobe is available from the page toolbar, map and Settings.
- Reusable character components live in `src/avatar-system.jsx`; shared motion lifecycle in `src/motion.jsx`; validation and migration in `src/avatar-model.mjs`. Independent transparent sprites are registered and clipped with SVG viewports, preserving aspect ratio and feet alignment. Original PNGs and the supplied blonde reference remain in `source-art/characters/`.
- The real MapLibre map supports place search, discovery at selected coordinates, editable trip or wishlist additions, saved favorites and illustrated destination cards. Dates, notes, activity counts and estimates come from saved records. Selecting a pin cancels delayed map discovery results.
- Planning, trip preview and visited modes persist with map filters. The optional selected traveler is labeled **Planning preview** and never marks a visit. Explicit visited actions unlock country stamps; Undo restores the prior status.
- Journey playback follows saved non-wishlist stops in order. Plane, train, bus and car symbols are selectable preview illustrations. Connections remain labeled approximate because verified routing geometry and journey times are unavailable. Stop journey and Settings animation preferences control playback.
- Phone layouts use a horizontal illustrated wardrobe, compact map header and collapsible journey controls. The scene pause button was removed at the user's request; ambient animation remains configurable in Settings.
- Tap the traveler to wave, read a map or take a photograph; tap the selected pet to play or walk beside the traveler. Dialogue reacts immediately. Tap the Alpine landscape for drifting seasonal petals, a breeze and passing birds. These interactions are temporary and do not alter travel records; reduced-motion settings suppress their animation.
- Each planning tab has its own illustrated background and gentle page tint: Trips railway station, Map cartographer’s desk, Packing Alpine lakeshore, Quests flower courtyard, Budget ledger desk, Bookings ticket office, Ski snowy resort, Journal lakeside cafe, Settings attic studio. Home retains its seasonal animated Alpine scene. Backgrounds preserve their aspect ratio; ambient light and particles stop offscreen and respect reduced motion.

Artwork prompts and paths: `scripts/character-art-prompts.md`. Browser verification and screenshots: `docs/character-map-verification.md`.
