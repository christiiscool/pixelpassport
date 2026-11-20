# Pixel Passport release procedure

## Supported product scope

This release is a **single-browser, device-local travel planner**. It has no account system, server-side trip database, collaboration, document upload service or automatic cloud backups. Those require separate architecture and acceptance criteria. Browser data can be lost when users clear site storage, use private browsing or change origins. Export backups regularly.

Third-party providers supply map JavaScript/CSS (unpkg), map tiles and location lookup (OpenStreetMap/Nominatim), weather (Open-Meteo), exchange rates (open.er-api.com) and fonts (Google Fonts). They receive ordinary network request metadata and relevant queries/coordinates. Core trips and packing do not wait for the map CDN. An open offline session can continue using loaded records; fresh offline installation/loading is not promised.

## Local and deployment commands

```sh
npm ci
npm run build
npm run check
node scripts/check-server.mjs
PORT=4173 HOST=0.0.0.0 node server.mjs
```

The Node server uses only built-in modules at runtime. Serve it behind a trusted HTTPS reverse proxy. Set `ENABLE_HSTS=1` only after HTTPS is correctly configured for the final hostname. Do not trust arbitrary forwarded headers as proof of TLS. `/healthz` reports application process health, not external provider health.

```sh
docker build -t pixelpassport:release .
docker run --read-only --cap-drop=ALL --security-opt=no-new-privileges \
  -e PORT=4173 -p 4173:4173 pixelpassport:release
```

The runtime image runs as the unprivileged Node user. It does not contain development dependencies, source artwork or repository metadata. Rebuild the image for base-image security updates. Record the resulting image digest in the deployment record; the Docker base tag is intentionally a maintained Node 22 line, not a guarantee of bit-identical container images over time.

## Release gates

The quality workflow runs the full configured Chromium workflow suites and model tests. The production-readiness workflow additionally checks locked dependencies, HTTP security behavior, Chromium/Firefox/WebKit release scenarios, navigation/dialog accessibility, and a real non-root container boot. Only after these pass does it emit `validated-release-candidate` with an archive, commit and SHA-256 checksum.

Playwright WebKit is automated engine coverage, **not** a test on a physical iPhone or branded Safari. Perform a final native-device review on the intended iPhone/iPad and desktop browsers before a broad public rollout.

## Publish and smoke-test

1. Review the PR and download a backup of any existing personal travel data.
2. Choose the final hostname and hosting platform. Browser storage is scoped to origin: a preview URL and production URL do not share records. Import the exported backup on the final origin.
3. Deploy the validated archive or image without rebuilding from an unreviewed branch. Do not serve repository root; only `dist` is public.
4. Configure HTTPS and the same CSP/security headers provided by the Node server. Static hosting does not automatically execute `server.mjs`; equivalent host headers must be configured and tested separately.
5. On the deployed origin, check `/healthz`, response headers, main-page load, onboarding, create/edit/reload, backup export/import, map fallback and all actual provider requests. Verify rate units and metadata, not merely HTTP 200.
6. Run uptime monitoring against `/healthz`, retain release checksums and record a rollback target. Do not log itinerary contents or backup files to analytics.

No domain, cloud credential, hosting account, monitoring service or actual production deployment is configured by this PR. A green CI run is a release-candidate gate, not certification of a live service.

## Rollback

Keep the previous artifact/image digest. Roll back the deployed code atomically at the same origin. Never reset or overwrite localStorage during rollback. When a stored dataset cannot be validated, the startup recovery screen preserves its raw bytes and offers download/import instead of reseeding. Test restoration with copies, not the only copy of a user's plans.

## Security constraints

CSP disallows inline JavaScript handlers, framing and plugins; inline styles remain required by the current React/illustration design. Map code is version-pinned but still supplied by a CDN. Map/weather/FX outages are tolerated by the UI, not controlled by this application. Authentication, encrypted multi-user storage, audit retention and provider SLAs are outside this local-first release scope.
