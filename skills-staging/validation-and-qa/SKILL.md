---
name: validation-and-qa
description: Load before claiming any change to this repo is "done" or "verified", when writing a commit that touches public/ or api/, or when reviewing someone else's diff here. Defines what counts as evidence in a repo with zero tests, zero CI, and a safety-relevant domain (pilots make go/no-go calls on this data).
---

# Validation & QA — evidence standards for a test-less repo

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.

## Ground rules

1. **There is no test suite, linter, or CI.** Any statement like "tests pass" is
   fabrication by definition. The only mechanical gates are `node --check` and greps.
2. **Domain stakes:** this app feeds real student-pilot weather decisions. The
   worst defect class is *silently wrong/stale data rendered as fresh* (it has
   happened: v4.7.8/10/11). "It renders something" is never sufficient evidence for
   weather-path changes — you must show the data's freshness/provenance.
3. **Claim only what you ran.** The provable tier list is below; state your tier.

## Evidence tiers (state which one your verification reached)

- **T0 — parse:** `for f in api/*.js notam.js public/*.js; do node --check "$f" || echo "FAIL $f"; done`
  (whole repo passes at `64468bd`; a new FAIL is yours).
- **T1 — static contract greps:** the checklist below; catches the three historical
  regression classes (version drift, route registry gaps, timeout inversion).
- **T2 — local runtime:** `npx vercel dev` with real env (`user-must-provide`) — can
  verify api/ handlers and UI logic, but **cannot** verify service-worker behavior
  (SW disabled on non-production hostnames, index.html:18-23).
- **T3 — deployed runtime:** the only tier that verifies SW/caching, and the only
  one that verifies `/api/notam` routing. Preview deploys still skip the SW; full
  verification exists **only on `metar-advanced.vercel.app`**. Be explicit when a
  claim needs T3 and you only reached T2.

## Pre-commit checklist (T1) — run all that apply

```bash
# 1. Parse gate (always)
for f in api/*.js notam.js public/*.js; do node --check "$f" || echo "FAIL $f"; done

# 2. Version strings in sync (if you bumped or touched public/)
#    (grep -P is GNU-only; on BSD/macOS extract the version by hand)
grep -rn "$(grep -oP "APP_VERSION = '\K[^']+" public/index.html)" \
  public/index.html public/sw.js public/core.js
# expect 5 hits: index.html:15 + :110, sw.js:6, core.js:6 (fallback) + :7 (title)

# 3. Route registries (if you added/renamed an endpoint)
R=foo; ls api/$R.js && grep -n "/api/$R" public/sw.js   # both load-bearing
grep -n "/api/$R" vercel.json  # convention only — absence here is NOT breakage
                               # (/api/atis and /api/my-usage ship without entries)

# 4. Timeout ordering (if you touched any timeout)
grep -n 18000 public/sw.js; grep -n 9000 api/weather.js; grep -n 7000 api/atis.js

# 5. No secrets/backends leaked into public/ (precedent: deleted public/settings.js)
grep -rln "upstash\|KV_REST" public/ && echo "LEAK" || echo "clean"
```

## Manual smoke flows (T2/T3) — the app's load-bearing paths

Run the subset your diff touches; each lists its pass signal:

1. **Single-airport load:** enter `RCTP` → METAR+TAF render; console free of
   exceptions; `[AVWX] Using Key #N` visible in Vercel logs (T3).
2. **Dashboard:** enable multi-dashboard, ≥3 airports → console shows
   `[Multi] Refreshing N airports (concurrency 2)`; no card stuck on Loading; error
   cards (if any) show reasons.
3. **Freshness proof (weather-path changes):** load, note METAR time, wait past the
   5-min client cache, reload — network tab must show a real `/api/weather` hit
   (not SW cache, not localStorage) and `Cache-Control: no-store` on the response.
4. **Offline degradation:** DevTools offline → reload → offline banner + aged data
   badge, not a white screen (T3 only — needs SW).
5. **Cloud sync round-trip:** set a PIN, change theme, open second browser profile,
   restore by PIN → theme arrives.
6. **Access gate (if touched):** with gate on, bogus code → 403 + gate re-shown;
   valid code → data.
7. **iOS canvas (if any canvas/tab code touched):** Safari responsive mode → switch
   tabs away/back → wind rose and meteogram re-render (Q1 in
   frontend-platform-quirks).

## Review standards for someone else's diff

- Reject "aligned code to README" changes outright unless independently verified —
  README is a known-false source (build-and-env table).
- Any diff that rebuilds DOM containing `<audio>`, changes `CACHE_VERSION` handling,
  or adds `Promise.all` over network calls: require the specific counter-evidence
  from the matching skill (debugging-playbook S5; service-worker-and-caching Rule 3;
  the "cost every new fetch in per-hour terms" rule in rate-limits-and-keys,
  respectively).
- Wholesale file replacements (upload-style diffs): run
  `git diff --stat` and demand per-hunk intent — this repo's regressions historically
  arrive exactly this way (failure-archaeology #1).

**Done-definition for "verified":** you can name the tier, paste the command/flow you
ran, and paste its observed output. Anything less, write `unverified` — that word is
respected here; invented verification is how a cockpit app kills trust.

---
Re-verify: `for f in api/*.js notam.js public/*.js; do node --check "$f" || echo "FAIL $f"; done; echo PARSE-OK`
