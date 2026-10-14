# Living Pixel Passport — audit and implementation plan

Audited 14 October 2026: repository, all ten feature pages in the local browser, and existing public deployment configuration. Phone widths are the primary design target. Existing version 1 browser data and stable record IDs must survive this release.

## Page audit and priorities

| Page / issue | Improvement | Visual | UX | Usefulness | Complexity | Priority |
|---|---|---|---|---|---|---|
| Home: detailed but static background, baked-in train and cat, no action feedback | Independent seasonal layers, fixed railway, moving train, particles, companion dialogue | High | High | Medium | High | 1 |
| Settings: no season, wardrobe or ambient-motion preferences | Deterministic auto season, persistent manual override, wardrobe, pause control | Medium | High | High | Low | 1 |
| Ski: saved plan does not create an itinerary stop or ledger estimate | Explicit linked destination and estimate controls, idempotent links, real suggestions | High | High | High | High | 1 |
| Itinerary: activities are flat rows with edit-only completion | Expandable diary entries, completion control, transport preview, trip progress | High | High | High | Medium | 2 |
| Map: accurate pins and selection card; routes lack a playback control | Status pin motion, saved-stop route preview with moving transport, visit progress | High | High | High | Medium | 2 |
| Packing: attractive slots but bag selection buried in a select | Touch bag tabs, suitcase readiness, seasonal suggestions, packing feedback | High | High | High | Medium | 2 |
| Quests: useful suggestions and XP, completion lacks visible response | Completed stamp, contextual celebration, distinct completed section | High | High | Medium | Low | 2 |
| Budget: truthful conversions, static category bars, no monthly view | Accessible category filtering, monthly estimated/actual timeline, threshold dialogue | Medium | High | High | Medium | 2 |
| Bookings: useful editing and empty state; presentation is generic | Ticket microinteractions and companion guidance without inventing reservations | Medium | Medium | Medium | Low | 3 |
| Journal: photos and genuine country stamps exist, cards are static | Scrapbook transitions, visited-stop timeline, animated stamp unlock | High | Medium | Medium | Low | 3 |
| All pages: independent CSS effects, limited motion lifecycle | Shared tokens; offscreen/hidden pause; reduced motion; modal focus handling | High | High | High | Medium | 1 |

The core CRUD forms, calendar, activity/destination reordering, multi-currency ledger, real map and local backups work. Do not replace them or seed fake activity, booking, quest, spending or visited records. Generic emoji remnants and oversized blank areas should be reduced using the established atlas and compact phone layouts.

## Creative feature assessment

| Feature | User value | Visual impact | Complexity | Dependencies | Performance | Decision |
|---|---|---|---|---|---|---|
| Persistent seasonal scene and wardrobe | Personalizes the planner predictably | High | Medium | Profile preferences, local art | Small assets + paused CSS/canvas | Implement |
| Contextual companion dialogue | Explains the effect of real actions | High | Medium | State-diff event bridge | Event driven, no per-frame React updates | Implement |
| Journey preview on saved coordinates | Makes route order easier to inspect | High | Medium | MapLibre, existing destinations | One marker RAF only during playback | Implement |
| Readiness shortcuts from ski plan | Reduces duplicate planning work | High | Medium | Linked destination + estimate IDs | Negligible | Implement with explicit controls |
| Monthly spending comparison | Helps distinguish actual costs from estimates | Medium | Medium | Recorded rates and expense dates | Static accessible chart | Implement |
| Timeline of visited stops | Useful memory index | Medium | Low | Genuine visited records | Negligible | Implement |
| Packing coverage by bag | Shows what remains before departure | Medium | Low | Existing bag/status fields | Negligible | Implement |
| Departure-day checklist preset | Useful when packing and bookings are ready | Medium | Medium | User acceptance and recurrence rules | Negligible | Proposal; would change task workflow |
| Day/night override | Pleasant personalization | Medium | Medium | Art variants, accessibility review | Small | Proposal for later |
| Weather-reactive scene | Helps contextualize conditions | High | High | Reliable forecast + chosen location, cache | Network/battery cost | Proposal; keep existing on-demand weather |
| Sound effects | Optional ambience | Medium | Medium | Original audio, mute/accessibility controls | Audio battery cost | Proposal for later |
| Planning canvas | Flexible discovery | High | High | New data model, gestures, undo | Potentially significant | Requires approval before implementation |

## Verification gates

Build and syntax checks; state-link/deduplication tests; existing data migration compatibility; phone layouts at 360/390/430 and desktop; keyboard/form navigation; preference persistence; actual quest/packing/activity/stamp feedback; saved-coordinate route playback; reduced-motion and hidden/offscreen lifecycle. Perform two refinement passes, publish to the existing public site, and document remaining limitations honestly.
