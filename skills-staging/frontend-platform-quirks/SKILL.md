---
name: frontend-platform-quirks
description: Load when adding or modifying a canvas, modal, audio element, gesture handler, or anything persistence-related in the frontend; when a component renders blank only on iPhone/iPad; when a modal is clipped or unscrollable on a notched phone; or when touch gestures fight each other (swipe vs scroll vs map pan).
---

# Frontend Platform Quirks — iOS PWA scar tissue

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.
Primary devices in the field: iPhone/iPad Safari as an installed PWA.

## Q1. iOS discards canvas draws issued while `display:none`

Every canvas here (wind rose, meteogram, crosswind compass, wind triangle) is inside a
tab pane that may be hidden at draw time. iOS Safari drops those draws (platform
behavior per this repo's fix history and README Known Constraints — not re-verifiable
from the repo itself).
**Pattern in force:** defer redraw 50–120 ms after the pane becomes visible —
`app.js:1605` (`drawMeteogram` +50 ms), `app.js:1607` (`drawWindRose` +50 ms),
`app.js:1748` (meteoCanvas2 +120 ms).
**Trigger:** you add a canvas, or a canvas is blank after tab switch on iOS only.
**Steps:** schedule the draw from the tab-switch handler with `setTimeout(…, ≥50)`;
draw from data cache (`meteoDataCache` pattern) so the redraw needs no refetch.
**Done when:** switching away and back to the tab on an iOS device (or Safari
responsive mode) re-renders the canvas every time. (Needs a device/macOS Safari; if
unavailable, verify the deferred-`setTimeout` pattern is present by grep, mark runtime
behavior `unverified`, and ask the user to spot-check on an iPhone.)

## Q2. `position:fixed` dies inside `display:none`/transformed ancestors

Formula modals are **direct children of `<body>`** for this reason (README Known
Constraints; verified pattern in index.html modal markup). New overlays: append to
body, never inside a tab pane. The toast implementation (app.js:753) also positions
against `env(safe-area-inset-bottom)` — copy it rather than hardcoding bottom offsets.

## Q3. Notch / safe-area / scroll-lock trio

Incident chain `44aaf14` (v4.8.5 scroll-lock + iOS PWA print), `a0eea46` (notch inset
in print preview), `12b0e50` (v5.0.2 What's New popup unscrollable → Got-it button
unreachable). Rules distilled:
- Any full-screen overlay needs `env(safe-area-inset-*)` padding AND an internal
  scroll container — test with content taller than the viewport before shipping.
- Lock background scroll while an overlay is open; unlock on close (v4.8.5 pattern).
- A modal whose confirm button can leave the viewport is a release blocker — users
  literally could not dismiss What's New in v5.0.1.

## Q4. Gesture arbitration: swipe-nav vs vertical scroll vs embedded maps

The live swipe detector is the IIFE at app.js:3086+: it commits at `MIN_DIST = 40` px
(app.js:3090) with an angle gate `ANGLE = 0.75` (must be more horizontal than ~37°,
app.js:3091,3130) and ignores gestures that begin as vertical scroll. Beware:
`handleSwipe()` at app.js:3042 with its 80 px `swipeThreshold` is **dead code — defined
but never called**; don't tune it expecting behavior to change. Two past regressions
define the contract:
- `fc8c6c7` (v5.0.3): tab-swipe hijacked **map pan** on the dashboard map — interactive
  embeds must be excluded from the swipe surface.
- `ceb636d`: MAP tab's layer bar needed horizontal scroll — horizontally scrollable
  strips inside a swipe surface must stop propagation or be exempted.
**Trigger:** adding any horizontally-interactive element (slider, map, carousel) to a
tab pane. **Done when:** panning/scrolling it never changes tabs on a touch device.

## Q5. Persistence: localStorage is disposable, IndexedDB is the anchor

iOS purges localStorage of infrequently-used PWAs (~7-day window under Safari's
Intelligent Tracking Prevention, ITP — platform behavior, not re-verifiable from the
repo). Architecture:
- Critical keys mirrored to IndexedDB (`EFB_DB`); `Storage.init` restores
  `efb_storage_mode` + `efb_cloud_pin` from IndexedDB when localStorage is empty
  (core.js:300-312, logs `✅ Session recovered from IndexedDB`).
- A 23 h keep-alive rewrite refreshes both stores (core.js:322-332). **Known
  regression:** the single-timer guard was lost to an upload commit — `setMode` after
  init stacks a second interval (harmless-ish, but restore the `_keepAliveTimer`
  clearInterval guard if you touch this; see failure-archaeology #1).
- Weather caches (`cache_*`) and trend history live in bare localStorage —
  intentionally disposable; don't promote them to IndexedDB.
- Anything the user would cry about losing must ALSO sync via the PIN cloud path
  (`Storage.set` with mode 'cloud', core.js:334-337).

## Q6. Audio elements vs DOM rebuilds

Injected `<audio>` (ATC streams, core.js:2796+) dies when its container is
re-innerHTML'd — this is live bug S5-2 (debugging-playbook), with a candidate fix
stranded on `claude/fix-atc-playback-refresh-QyRE8` (review and verify before merging
— see S5). Whatever lands: never rebuild a container holding a possibly-playing audio
element; diff the target airport first and skip identical rebuilds. The 15-s stall detector (core.js:2820-2852) assumes `audio` +
`nextElementSibling` fallback-div pairing — keep that DOM shape if you restyle.

## Q7. No framework = no lifecycle = defensive `typeof` guards

Cross-file calls guard with `typeof fn === 'function'` (e.g. app.js:1856,
core.js:2261) because script load order and CDN availability (Leaflet) are the only
"module system". Follow the convention; a bare cross-file call that throws during
partial load takes down the whole boot sequence, and there is no error boundary.

---
Re-verify: `grep -n "setTimeout(() => drawMeteogram\|setTimeout(() => { if (document.getElementById('rwySelect')" public/app.js && grep -n "recovered from IndexedDB" public/core.js`
