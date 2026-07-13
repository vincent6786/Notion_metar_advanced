---
name: architecture-contract
description: Load FIRST for any change to this repo. Specifically triggered when about to add/rename/move any file, add an API endpoint, add a fetch() call, touch version strings, or when a change "works locally" but you haven't checked the routing/caching registries. Also load when you see a global function called from a different file than where it's defined and wonder if that's safe.
---

# Architecture Contract — METAR GO

Facts verified against repo at commit `64468bd` (v5.4.3, 2026-07-04); verified 2026-07-12.

This is a **vanilla-JS PWA on Vercel serverless**. No bundler, no framework, no modules,
no tests, no CI. Every invariant below is enforced by nothing except you.

## Invariant 1 — An API endpoint has two load-bearing registries plus one convention

Adding endpoint `/api/foo` requires:

1. **Load-bearing:** `api/foo.js` — the serverless function (must live in `api/`, NOT
   repo root). Vercel auto-routes `api/*.js` to `/api/foo` without any config —
   proven by `/api/atis` and `/api/my-usage`, which have **no vercel.json entry** yet
   ship and work (the whole v5.x D-ATIS feature and the usage chip run through them).
2. **Load-bearing:** `public/sw.js` `API_ROUTES` array (lines 38–46) — otherwise the
   service worker treats GET responses from your endpoint as a **static asset and
   caches them cache-first forever** (until the next CACHE_VERSION bump). See
   `cacheFirstStatic()` sw.js:138.
3. **Convention:** a `vercel.json` rewrite `{ "source": "/api/foo", "destination":
   "/api/foo.js" }`. Seven of nine routes have one; it appears redundant for files in
   `api/` (exact production routing semantics `unverified` — see UNCERTAINTY U1/U9).
   Add it for consistency, but its absence does not mean a route is broken.

**Trigger (observed state):** you created or renamed a file under `api/`, or added a
`fetch('/api/...')` anywhere in `public/`.

**Steps:** touch 1 and 2 always, 3 for consistency; if the route serves per-user or
time-sensitive data, also copy the CORS + access-gate + rate-limit preamble from
`api/atis.js:13–81` (imports, constants, `setCors`, `validateAccessCode`,
`checkRateLimit` — the cleanest current copy of the pattern).

**Done when:** the function file is under `api/` and the path prefix is in sw.js
`API_ROUTES`, verified by `ls api/foo.js && grep -n "/api/foo" public/sw.js`. Full
runtime proof (second request hits network, not SW cache, in DevTools) is a T3 check —
only possible against the production hostname; if you cannot drive a browser there,
record that part as `unverified` per validation-and-qa and ask the user to confirm.

**Negative example (this bug is live in the repo today):** `/api/atis`, `/api/my-usage`,
`/api/check-frame`, and `/api/stream` are absent from `API_ROUTES`, so within one SW
cache generation the D-ATIS pane and the usage chip can serve frozen responses. The
implied reasoning (reconstructed, not quoted) is "the route works when I test it" — it
does, on the *first* request; the staleness only appears on the second visit.

**Positive example:** `/api/weather` — file in `api/`, sw.js:39 entry, vercel.json:3
rewrite: all three registries aligned.

## Invariant 2 — Serverless code lives in `api/`, frontend code lives in `public/`. Root is not a deploy target

`notam.js` sits at the **repo root** (uploaded via GitHub web UI, commit `6e57263`),
while `vercel.json:10` rewrites `/api/notam` → `/api/notam.js`. There is no
`api/notam.js` and never has been (`git log --all -- api/notam.js` is empty). Vercel
only builds functions from `api/` (by default — a dashboard-level root-directory or
functions override could change this; see UNCERTAINTY U1). Whether production NOTAMs actually work could not be
verified from this session (deployment returns 403 to non-browser fetches —
`unverified`); treat `/api/notam` as suspect until you check the deployed endpoint in a
browser: `https://metar-advanced.vercel.app/api/notam?station=KMHR`.

Precedent for this exact mistake class: `public/settings.js` was a misplaced duplicate
of `api/settings.js` and was deleted in security-fix commit `592e932`.

**Done when:** every file with `export default async function handler` lives under
`api/`, and nothing under `public/` or root imports `@upstash/redis`.

## Invariant 3 — Version strings are five synchronized lines

| Location | Content today |
|---|---|
| `public/index.html:15` | `window.APP_VERSION = '5.4.3'` |
| `public/index.html:110` | `TRAINING EDITION · v5.4.3` (launch screen; pre-JS fallback, overwritten at runtime by `initVersionLabels`, core.js:130) |
| `public/sw.js:6` | `CACHE_VERSION = 'metar-go-v5.4.3'` |
| `public/core.js:6` | `version: window.APP_VERSION \|\| '5.4.3'` (the string fallback) |
| `public/core.js:7` | `WHATS_NEW.title: 'METAR GO — v5.4.3'` |

`bump.js` and the `bump-version.yml` GitHub Action described in README.md **do not
exist and never have** (`git log --all -- bump.js .github` is empty). Bumping is
manual. Full procedure: see skill `release-and-versioning`.

## Invariant 4 — Timeout ordering: client-visible timeout > server upstream timeout

The SW API fetch timeout (`sw.js:101`, 18000 ms) must stay **longer** than the longest
backend upstream timeout (AVWX 9000 ms at `api/weather.js:170`; ATIS 7000 ms at
`api/atis.js:183,235`). When this was inverted (SW 8 s < AVWX 9 s), the SW timed out
first and silently served stale cached METARs as status-200 "fresh" data — incident
v4.7.11, commit `e7717e2`. If you raise any backend timeout past 18 s, raise sw.js:101
first, in the same commit.

## Invariant 5 — All scripts share one global scope

`index.html` loads classic scripts in this order (index.html:82, 3823–3829):
`init.js` → inline SW-registration block → `core.js` → `app.js` → Leaflet CDN →
`airport-db.js` → `airportfrequencies.js` → `metar-db.js` → `tools-extension.js`.

- Top-level `let/const/function` in one file is callable from any later file
  (e.g. `lookupFrequencies` defined `airportfrequencies.js:8348`, called from
  `app.js:1857` and `core.js:2261`). Cross-file callers defensively use
  `typeof fn === 'function'` guards — keep doing that, because load order and CDN
  failures make any later symbol optional.
- `gc-tools-extension.patch.js` is **never loaded at runtime** — it is an
  integration-notes file whose patch was already applied (`gcInitMap` exists in
  `tools-extension.js:753`). Do not "fix" index.html by adding it; you would
  double-define `calculateGreatCircle`.

## Invariant 6 — Fail-open on Redis, fail-closed on nothing user-facing

Every Redis-dependent gate returns "allow" when Redis errors: access validation
(`api/weather.js:66`, `api/atis.js:54`), rate limiting (`weather.js:99`), PIN limit
(`settings.js:44`). This is deliberate ("don't block real users"). Preserve it: a new
gate that fails **closed** on a Redis outage takes the entire app down for everyone,
which is a worse failure than briefly unmetered traffic.

## Invariant 7 — Redis key namespace (Upstash)

All keys are flat strings. Observed namespace (grep-verified across `api/`):

```
efb:users:<CODE>                      user record {name, created, active}
efb:users:_registry                   SET of all codes
efb:users:<CODE>:calls:<YYYY-MM-DD>   per-user daily counter (48 h TTL)
efb:ratelimit:user:<CODE>:<date:HH>   per-code hourly bucket (2 h TTL)
efb:ratelimit:ip:<ip>:<date:HH>       per-IP hourly bucket (2 h TTL)
efb:validatelimit:<ip>:<date:HH>      access-code validate attempts (2 h TTL)
efb:pinlimit:<ip>:<date:HH>           settings-PIN attempts (1 h TTL)
efb:<pin>:<key>                       cloud setting (365 d rolling TTL)
efb:<pin>:_registry                   SET of that PIN's keys
efb:<pin>:_lastUpdated                ISO timestamp
efb:config:hidden_tools               array of hidden tool ids
efb:api_events                        LIST, last 200 anomaly events, 48 h TTL
avwx:usage:<YYYY-MM-DD>:keyN          per-AVWX-key daily counter
avwx:total:<YYYY-MM-DD>               aggregate daily counter
avwx:rr:<YYYY-MM-DD>                  round-robin pointer
```

Keys prefixed `_` under a PIN are reserved (`settings.js:136` rejects them). If you add
a key family, extend this table in the same PR.

## Invariant 8 — The production hostname is a hardcoded constant

`public/index.html:18`: `PROD_HOST = 'metar-advanced.vercel.app'`. Any other hostname
(preview deploys, localhost) is treated as **staging**: the service worker is
unregistered (`index.html:3773`), a staging banner shows, and What's New always
re-displays (`app.js:2994–3002`). If the production domain ever changes, this constant
must change or production will run in staging mode with no offline support.

---
Re-verify: `grep -n "5\.4\.3" public/index.html public/sw.js public/core.js && grep -c "api/" vercel.json && ls api/`
