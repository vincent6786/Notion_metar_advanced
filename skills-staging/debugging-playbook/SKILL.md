---
name: debugging-playbook
description: Load when handed a symptom report for this app — stuck "Loading…", stale weather, 429s, blank D-ATIS, dead ATC audio, launch-screen hang, empty NOTAM panel, admin list empty, lost settings on iPhone, blank canvas after tab switch — and you need the triage path that matches a previously-solved incident instead of rediscovering it.
---

# Debugging Playbook — symptom → triage

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.
Each entry is backed by a real fixed (or still-open) incident; commit hashes cite the fix.

## S1. Weather shown is stale but no error/banner appears
History: v4.7.8 `8b99f19`, v4.7.10 `08a1d37`, v4.7.11 `e7717e2`.
1. Check the JSON in DevTools for `_stale`/`_offline` flags and `X-SW-Offline` header
   → service worker served cache (see `service-worker-and-caching`, Rule 1/4).
2. Check `localStorage['cache_/api/weather?...']` timestamp → 5-min secureFetch cache.
3. Confirm `Cache-Control: no-store` on the response (weather.js:282) — if missing,
   someone regressed the v4.7.10 CDN fix.
Done when: you can name the layer (SW-API / localStorage / CDN) that served the bytes.

## S2. Dashboard cards stuck on "Loading…" or all erroring at once
History: v4.9.7 `3596531` (surfaced errors), v5.0.4–v5.0.6 (429 storm).
1. Open console: `[Multi] Refreshing N airports (concurrency 2)` — if N is large,
   suspect budget; check response bodies for `{error: 'Rate limit exceeded (user|ip)'}`.
2. Check `efb:api_events` via admin panel / `POST /api/api-stats {action:'events'}` for
   `exhausted`/`rotation` events.
3. Per-card red ERROR state exists since v4.9.7 — if cards sit on Loading with no error
   state, the failure is *before* fetch (JS exception; check console) not a network one.
Done when: classified as budget (429), pool exhaustion (AVWX), or client exception.

## S3. App hangs on launch screen after a deploy
History: v4.7.3 `d06ce79` (stale SW served old core.js).
1. Ask: did the deploy bump `CACHE_VERSION` (sw.js:6)? If no — that's the bug.
2. Confirm via DevTools → Application → Cache Storage: cache name vs deployed version.
3. Remedy: ship a version-bump commit (all four strings, see `release-and-versioning`);
   users recover on next load without clearing site data.
Also check `/api/status` reachability — the splash awaits it (app.js:2975-2982), though
a failed fetch resolves `{maintenance:false}` so status alone shouldn't hang it.

## S4. D-ATIS pane shows "unavailable" for a US airport
History: whole v5.1.x–v5.3.0 saga; see `failure-archaeology` before "fixing" sources.
1. The backend answers 200 even on failure with `detail` and `_diag.tried[]`
   (atis.js:158-166) listing each source, HTTP status, and ms. Read that first.
2. Sources tried in order: atis.info → datis.clowd.io (both US-only FAA mirrors).
   Non-US airports (RCTP etc.): "unavailable" is **correct behavior** — the client
   fallback card with atis.guru popup + voice frequency is the designed outcome.
3. If both sources fail for a major US field (KJFK): test them directly —
   `curl https://atis.info/api/KJFK` and `https://datis.clowd.io/api/KJFK` — from a
   machine, not Vercel (Vercel egress is what atis.guru blocked; clowd.io is
   documented Vercel-friendly at atis.js:7-11, atis.info inferred as its successor
   per atis.js:169-172).
4. Remember `/api/atis` is missing from sw.js API_ROUTES — a stale cached "unavailable"
   can stick for a whole cache generation (open bug, see UNCERTAINTY.md).

## S5. Live ATC audio never plays, or stops by itself
1. Never plays + spinner → offline Icecast feed; the 15-s stall detector (v5.4.3
   `00b1945`, core.js:2820-2852) should flip to "Feed currently offline · Try LiveATC".
   If it doesn't, check that the injected audio elements still match the
   `container.querySelectorAll('audio')` + `nextElementSibling` structure it assumes.
2. **Stops mid-listen during auto-refresh → KNOWN OPEN BUG.** The audio section DOM is
   rebuilt on every data refresh, killing playback. A one-commit fix
   (`_audioSectionIcao` guard, skip rebuild for same airport) exists UNMERGED on
   `origin/claude/fix-atc-playback-refresh-QyRE8` (commit `a17fd40`). Prefer it over
   re-deriving, but the branch predates later main changes (including the v5.4.3
   stall detector in the same function): review `git diff main...a17fd40` against
   current `core.js` and verify per validation-and-qa before merging — do not merge
   solely because it exists.
3. Stream sources are hardcoded per-airport in `streamConfigs` (core.js:2767+),
   TWATC.net for Taiwan. `/api/stream` (LiveATC proxy, whitelist of 3 URLs,
   stream.js:4-8) has **zero frontend callers** today — orphan endpoint.

## S6. NOTAM panel empty
1. Endpoint sanity: `https://<deploy>/api/notam?station=KMHR` in a browser. Suspect
   routing first: the function file sits at repo **root** (`notam.js`) while
   vercel.json:10 rewrites to `/api/notam.js` — see `architecture-contract` Invariant 2.
   Production behavior `unverified` from this session (deploy 403s server-side probes).
2. If routing is fine: US (ICAO K*/P*) goes AIM first — FAA's NOTAM portal,
   notams.aim.faa.gov — with AWC fallback (NOAA Aviation Weather Center,
   aviationweather.gov) (notam.js:105-115); check Vercel logs for `[NOTAM] AIM failed`.
3. The AIM contract is a fragile undocumented form-POST (notam.js:28-56); if AIM changed fields,
   the AWC fallback should still populate — an empty panel usually means both failed
   or the route 404s.

## S7. Admin panel user list empty or actions silently no-op
History: v4.8.8 `955ebc6` (surface real error), `b6306b9` (registry code overwrite),
v4.5.0 drawer fixes.
1. Wrong `API_ADMIN_PASSWORD` → 401 → check the on-page error line (it shows real
   errors since 955ebc6).
2. List filters out records with no `name` (access.js:131) — a corrupt user record
   vanishes silently; inspect `efb:users:_registry` vs individual `efb:users:<CODE>`.
3. Settings ⚙ quick-stats label reading "✅ Active" with no counts is **normal**:
   core.js:1141-1153 expects `data.keys` from `/api/status`, which never returns it
   (status.js returns only maintenance/adminCode/env) — dead branch, not your bug.

## S8. iPhone user lost all settings / PIN
History: iOS 7-day storage purge; recovery built in `Storage.init` (core.js:294-319).
1. Expected path: localStorage purged → IndexedDB copy restores mode+PIN, console
   logs `✅ Session recovered from IndexedDB`.
2. If both were purged (long-unused PWA): data is gone locally — restore via cloud PIN
   (Settings → Cloud Backup). Keep-alive rewrites keys every 23 h (core.js:322-332);
   note it currently stacks intervals if `setMode` runs after init (lost guard —
   see `failure-archaeology`).
3. Cloud-restore clobber: on `online` event, `cloudRestoreAll()` runs
   (app.js:2398-2401) and can overwrite changes made while offline — known constraint,
   documented in README's Known Constraints, still unfixed.

## S9. Canvas (wind rose / meteogram) blank after switching tabs — iOS Safari
Draws issued while the canvas was `display:none` are discarded on iOS. The codebase
defers redraws 50–120 ms after tab switch (app.js:1605-1607, 1748). If you add a canvas,
copy that pattern; if a canvas is blank, verify its redraw is scheduled *after* the tab
became visible, not merely after data arrived.

## S10. 403 on every API call for one user
`secureFetch` treats any 403 as revoked access: wipes the stored code and shows the
gate (core.js:1664-1668). Check whether the user's code was actually revoked
(`efb:users:<CODE>.active === false`) before debugging networking; also remember gate
enforcement is entirely off unless `ACCESS_GATE_ENABLED === 'true'`.

---
Re-verify: `grep -n "_diag\|Try LiveATC\|concurrency 2\|recovered from IndexedDB" public/core.js public/app.js api/atis.js | head -6`
