# Recovery and data reliability review

This review-branch update adds failure states without changing the localStorage key, deploying a backend, or replacing the existing artwork.

## User-visible behavior

- Storage failure leaves the saved dataset intact, keeps an open form editable, and shows a persistent alert with a download of the last durable backup.
- Backup import validates IDs, real calendar dates, numeric ranges, quantities and foreign-key relationships before confirmation. Malformed or oversized files do not replace saved records. Restored selection uses the backup's selected trip when valid.
- Exchange-rate requests use a timeout, validate payloads and reject responses belonging to an outdated data object or base currency. Existing conversion records are never revalued by a refresh.
- The offline notice describes currently open plans only. It does not claim that a fresh offline load is supported.

## Validation commands

```sh
npm ci
npm run build
npm run check
npm install --no-save playwright@1.56.1
npx playwright install --with-deps chromium
npm run dev
# In a second shell:
npm run test:browser
```

The browser command runs Packing, Trips, Map/Bookings/Budget, and Recovery suites. Recovery scenarios intentionally simulate quota errors, invalid imports, HTTP failures, malformed rates, an out-of-order rate response and a connectivity change. Their screenshots and result files are uploaded by the quality workflow.

Simulated endpoint tests establish application behavior, not the current availability or accuracy of third-party services. Passing these checks does not establish that all browser/device combinations are bug-free.
