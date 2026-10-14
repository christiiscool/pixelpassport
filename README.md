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
- Packing inventory with quantities, bags, weights, statuses, and suggestions based on winter destinations and skiing.
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

The dashboard uses React; the existing editing pages and local data layer retain their established JavaScript implementation. MapLibre runs from a CDN. Ski plans should be linked to an existing destination to appear on the map. Booking document uploads, long-term cloud photo storage, snow reports, shared syncing, and richer itinerary calendar controls need a backend or further work. Destination deletion explicitly confirms removal of its activities; other linked records are retained and detached.
