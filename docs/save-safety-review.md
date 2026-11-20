# Save/reopen invariant review

This patch closes a gap between form-level acceptance and startup validation. A destination move previously could leave a booking pointing to an expense on another trip, causing the next load to reject the saved dataset. Imported activity and journal trip links also needed to follow the destination.

## Changes

- Validate proposed device data at the existing save boundary before writing it.
- Restore the last durable dataset in place on validation failure, retain editable form fields and display a persistent notice.
- Preserve records and amounts when a move invalidates booking/expense associations. Require confirmation before unlinking those associations; cancelling writes nothing.
- Include journal and imported activity trip links in destination and trip-deletion migrations.
- Bind coordinate responses to their original live form and original query. Abort on close, time out stalled requests and reject invalid coordinates.

## Tests

`npm run check` includes 13 additional model/save-boundary tests. `npm run test:release` includes the new save/reopen and lookup lifecycle suite in Chromium, Firefox and WebKit. Screenshots and structured results are emitted as `artifacts/release-*`.

The server and release-container checks remain unchanged. This patch does not deploy a hosting service, add accounts/cloud storage, or certify physical iPhone/Safari behavior. The validated archive remains a release candidate for the existing device-local product scope.
