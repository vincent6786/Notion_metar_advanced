---
name: service-worker-and-caching
description: Load when changing sw.js, CACHE_VERSION, API_ROUTES, or any fetch timeout; when the app hangs on the launch screen after a deploy; or when triage (debugging-playbook S1) has identified a cache layer as the source of stale data. For a raw "stale weather" symptom report, start at debugging-playbook S1 — this skill is the deep dive. This repo's single largest incident cluster (v4.7.3 → v4.7.11) lives here.
---

# Service Worker & Cache Layers

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.

**Chasing a live staleness report?** Jump to "Debugging staleness — fastest triage
order" at the bottom (or debugging-playbook S1). The rules in between are for when you
are *changing* caching-related code.

## The four cache layers (know which one you're fighting)

1. **SW static cache** — `cacheFirstStatic()` (sw.js:138): cache-first, keyed by
   `CACHE_VERSION` (sw.js:6). Everything not matching `API_ROUTES` goes here,
   **including any `/api/*` route missing from that list**.
2. **SW API cache** — `networkFirstApi()` (sw.js:98): network-first with 18 s timeout;
   on failure serves stale copy with injected `_stale:true, _offline:true` flags and
   header `X-SW-Offline: true`.
3. **localStorage `cache_<endpoint>` entries** — `secureFetch` (core.js:1645):
   returns cached JSON if younger than 5 min (core.js:1651, `300000` — comment says
   10 min, comment is wrong); serves stale on *network* errors but not on 4xx/5xx
   (core.js:1716).
4. **CDN/browser HTTP cache** — neutralized for weather by `Cache-Control: no-store`
   (weather.js:282) and client `cache:'no-store'` (core.js:1661) after incident
   v4.7.10 (`08a1d37`).

## Incident-derived rules

### Rule 1: SW timeout must exceed every backend upstream timeout
**Trigger:** you are changing `sw.js:101` (18000), `api/weather.js:170` (9000), or
adding a backend fetch with its own timeout.
**Why:** v4.7.11 (`e7717e2`) — SW timeout (then 8 s) < AVWX timeout (9 s), so on slow
AVWX days the SW aborted first and returned cached METARs as HTTP 200. No error, no
banner, silently hours-old weather in a cockpit app.
**Steps:** keep the strict ordering SW (18 s) > backend upstream (9 s); if you touch
either, adjust both in the same commit; grep both numbers into the commit message.
**Done when:** `grep -n 18000 public/sw.js && grep -n 9000 api/weather.js` show the
ordering still holds (or your new, still-ordered values).

### Rule 2: every fresh-data route must be in `API_ROUTES` (sw.js:38–46)
**Trigger:** an endpoint returns correct data on first load and stale data on the next
visit; or DevTools Network shows "(ServiceWorker)" as the source for an `/api/` call
without a preceding network attempt.
**Steps:** add the path prefix to `API_ROUTES`; bump `CACHE_VERSION`; hard-reload twice
(first activates the new SW, second exercises it).
**Done when:** second-visit responses hit the network first. (T3 check — only provable
in a browser against the production hostname; if you can't, verify the grep-level state
`grep -n "/api/<route>" public/sw.js`, mark the runtime half `unverified`, and say so.)
**Known live gaps (as of v5.4.3):** `/api/atis`, `/api/my-usage`, `/api/check-frame`,
`/api/stream` are all missing — they get cache-first static treatment today.
**Negative example:** README once celebrated "all 6 API routes correctly routed"
(later "all 7"); routes added afterwards were forgotten. The reasoning pattern
(reconstructed, not quoted) is "the SW already handles /api/" — it handles *the listed
prefixes*, nothing else.

### Rule 3: any change a user must see requires a `CACHE_VERSION` bump
**Trigger:** you changed anything in `public/` and are about to commit.
**Why:** v4.7.3 (`d06ce79`) — a stale SW kept serving an old `core.js` whose boot
sequence deadlocked against the new `index.html`: app hung on the launch screen until
users manually cleared site data. Static assets are cache-first; without a version
bump, deployed HTML/JS may be mixed old/new indefinitely.
**Steps:** bump `sw.js:6` together with the other version strings (see
`release-and-versioning`); never ship a `public/` change with an unchanged
CACHE_VERSION.
**Done when:** `git show --stat HEAD` includes sw.js whenever it includes other
`public/` files (exception only when the diff contains zero functional bytes; when in
doubt, bump).
**Positive example:** `f4a6165` "chore: invalidate service worker cache (4.8.3a) for
button layout fix" — a pure cache bump commit shipped to force asset refresh.
**Negative example (reconstructed from the fix chain, not a quote):** shipping a UI
fix and assuming users will get it on next reload — v4.8.3a/v4.8.3b exist precisely
because two prior releases in a row failed to reach devices until the cache was bumped
again.

### Rule 4: respect the `_stale` / `_offline` contract
The SW injects `_cached_at`, `_stale`, `_offline` into cached API JSON (sw.js:107-121).
`secureFetch` checks these flags (core.js:1697-1705) and downgrades to its own
localStorage copy + offline banner. If you add a new client fetch path that bypasses
`secureFetch`, you must either route it through `secureFetch` or replicate the flag
check — otherwise SW-stale data renders as fresh (that is exactly incident v4.7.11's
failure mode reappearing one layer up).

### Rule 5: the SW precache list contains two intentional-looking mistakes — don't add more
`STATIC_ASSETS` (sw.js:11–35) still lists `/settings.js` (deleted from `public/` in
`592e932`) and `/gc-tools-extension.patch.js` (never loaded by index.html).
`Promise.allSettled` (sw.js:53) makes precache failures non-fatal, which is why nobody
noticed. When touching the list: remove entries for files you delete, and only add
files index.html actually loads.

## Debugging staleness — fastest triage order

1. Which layer? Check response for `_stale`/`_offline` (layer 2), check
   `localStorage` key `cache_<endpoint>` timestamp (layer 3), check DevTools →
   Application → Cache Storage names against `CACHE_VERSION` (layers 1–2).
2. On localhost the SW is **disabled by design** (staging detection,
   index.html:18–23, 3773) — you cannot reproduce SW bugs there; test against the
   production hostname or a temporarily edited `PROD_HOST` — never commit a PROD_HOST
   edit (architecture-contract Invariant 8).
3. Nuclear reset used by real users during v4.7.3: Safari/Chrome "clear site data".
   If your fix requires that, it is not a fix — bump `CACHE_VERSION` instead; the
   activate handler (sw.js:65-75) deletes all caches not matching the current name.

---
Re-verify: `sed -n '6p;38,46p;101p' public/sw.js && grep -n "300000\|no-store" public/core.js | head -4`
