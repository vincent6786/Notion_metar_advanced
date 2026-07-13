---
name: data-sources-and-fallbacks
description: Load when a specific data panel (METAR/TAF, NOTAM, D-ATIS, frequencies, AWOS, SIGMET, map layers, ATC audio) is empty/wrong while others work, when an upstream provider changes its API, or before adding a new external data source to the app.
---

# Data Sources & Fallback Chains

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.
External providers are the #1 outage source for this app. Each chain below lists order,
code location, and the known failure mode of each link.

## METAR / TAF / station / nearby / search
`/api/weather` → AVWX (`avwx.rest`), 9-key rotation, 9 s timeout (weather.js:170).
No alternate provider — when all keys are exhausted/failing, the client shows the
provider-down card and serves stale caches. Key state: `POST /api/api-stats`.
Types map at weather.js:272-279 (`station|metar|taf|notam|near|search`); note the
`notam` type exists here but the app uses `/api/notam` instead for NOTAMs.

## NOTAMs
`/api/notam` (root `notam.js` — see architecture-contract Invariant 2 for the routing
question) → US (ICAO `K*`/`P*`): FAA AIM form-POST (AIM = FAA's NOTAM portal,
notams.aim.faa.gov; notam.js:28-58), fallback AWC JSON (AWC = NOAA Aviation Weather
Center, aviationweather.gov; notam.js:76-92); non-US: AWC only. Both normalized to
`{traditional, notamNumber, startDate, endDate, icaoLocation, source}` so
`renderNotams()` (starts core.js:2453) is source-agnostic — keep new sources inside
that shape. AIM is the fragile link (undocumented form contract); AWC is the stable
one. Response is CDN-cacheable 5 min (`s-maxage=300`, notam.js:117).

## SIGMET / AIRMET
Client-direct, no proxy, no key: `aviationweather.gov/api/data/airsigmet?format=json
&bbox=…` fetched from the browser (core.js:2632), cached 10 min under
`cache_sigairmet_<lat>_<lon>` (core.js:2633, 2638). US coverage only — non-US airports
get a regional-authority link table instead (ICAO-prefix map, core.js:2582+: ANWS
Taiwan, JMA Japan, KMA Korea, …) with checked-at timestamp and manual refresh. An
empty SIGMET panel for a non-US airport is by design; for a US airport, test the AWC
URL directly in a browser.

## D-ATIS (US only, by design)
`/api/atis` → 1) `atis.info/api/<ICAO>` (7 s timeout) → 2) `datis.clowd.io/api/<ICAO>`
(7 s) → 3) on both failing, HTTP 200 with `{error, detail, _diag}` and the **client**
renders the fallback card: atis.guru popup (user's IP, not Vercel's) + voice ATIS
frequency from the local DB (app.js:1841-1900). Non-US "unavailable" is correct
behavior. Do not reorder without reading failure-archaeology #2 — every other
arrangement was already tried and died. Both sources share one response shape
(`shapeClowdResponse`, atis.js:91-119); if atis.info changes shape, the parser falls
through to clowd.io and Vercel logs carry a body snippet (atis.js:201-203).

## Airport frequencies (3-layer)
1) Built-in `FREQ_DB` — `public/airportfrequencies.js`, ~8,300 airports,
   `lookupFrequencies()` at line 8348; 2) AVWX station record; 3) AWC. Merge/fallback
logic in core.js:2261+ and core.js:3885+. The built-in DB is generated from OurAirports
CSV — regeneration procedure `user-must-provide` (no generator script exists in-repo).

## AWOS (KMHR only)
`/api/awos` → `http://kmhr.awosnet.com/text.php` (**plain HTTP**, awos.js:3), response
is HTML restyled by string-injecting CSS (awos.js:11-80). Brittle by construction:
breaks if awosnet changes markup, and mixed-content rules mean the *proxy* is the only
way this can load at all. Client: `app.js:2074`.

## Live ATC audio
Taiwan airports: hardcoded `streamConfigs` URLs to `stream.twatc.net` (core.js:2767+),
played directly by the browser (no proxy). Everything else: LiveATC search link.
`/api/stream` (LiveATC proxy, whitelist stream.js:4-8) has **no frontend caller** —
orphan. Unlike `/api/notam`, its file is correctly in `api/` with a matching rewrite;
it's unverified on deploy only because nothing has ever called it. If you revive it,
add it to sw.js API_ROUTES (it's absent) and think twice before letting the SW touch
an infinite audio stream at all.
Offline-feed detection: 15 s stall timer, core.js:2820-2852.

## Meteogram / winds aloft / location detail
Open-Meteo, fetched **directly from the client** (no backend proxy, no key, not
rate-limited by us). Single batched request per airport — keep it batched; the +MORE
panel fields were deliberately added to the same call (commit `994aaeb`,
v4.7.12/4.7.13 notes) to avoid a second request.

## Map layers / traffic
Windy iframe embed (no API key) and ADS-B Exchange iframe for traffic — both are
third-party embeds controlled by URL parameters only; nothing to debug server-side.
X-Frame-Options risk is theirs to change; `/api/check-frame` (SSRF-guarded HEAD probe,
check-frame.js) exists to test embeddability of arbitrary URLs before iframing —
the in-app browser uses it at app.js:2144.

## Adding a new source — the gate

**Trigger:** any new `fetch()` to a domain not listed above.
**Steps:** (1) decide proxy vs client-direct: proxy only if you need to hide a key,
normalize shape, or add the access gate; client-direct if the provider is
CORS-friendly and free (Open-Meteo precedent). (2) If proxied: full three-registry
route setup + gate/rate-limit preamble (architecture-contract Invariant 1). (3) If
iframed: check `X-Frame-Options` first via `/api/check-frame` — v5.2.0's blank-iframe
release shipped because nobody probed atis.guru. (4) Add a timeout shorter than the
service worker's 18 s API timeout (sw.js:101). (5) Normalize to an existing render
shape rather than adding a renderer.
**Done when:** the panel degrades to a labeled fallback (not a spinner) when your new
source is blackholed — test by pointing its hostname at a dead IP in /etc/hosts or
DevTools request blocking.

---
Re-verify: `grep -n "atis.info\|clowd.io" api/atis.js | head -4 && grep -n "awosnet\|aviationweather" api/awos.js notam.js | head -4`
