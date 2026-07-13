---
name: rate-limits-and-keys
description: Load when you see HTTP 429 anywhere (client console, Vercel logs, user report "rate limit exceeded"), when dashboard cards error out in bulk, when adding ANY new fetch to /api/weather or /api/atis, when AVWX keys appear exhausted early in the day, or when tuning ACCESS_HOURLY_LIMIT / IP_HOURLY_LIMIT / AVWX_DAILY_LIMIT.
---

# Rate Limits & AVWX Key Rotation

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.
AVWX (avwx.rest) is the external METAR/TAF provider — free-tier keys with per-key
daily caps. This entire subsystem is scar tissue from the v5.0.4 → v5.1.0 429 storm
(June 2026).

**First action for a live 429/exhaustion incident:** read the anomaly log —
`POST /api/api-stats` with `{action:'events', password:<API_ADMIN_PASSWORD>}` (the
password is a Vercel env var, not in the repo — ask the user, or use the admin panel).
Then classify by the tier named in the 429 body's error string. Only then tune knobs.

## The budget chain (outermost first)

```
AVWX free tier      9 keys × AVWX_DAILY_LIMIT (4000) per UTC day, round-robin
                    pointer avwx:rr:<date>; selection weather.js:143-162
per-access-code     ACCESS_HOURLY_LIMIT (1000)/UTC hour  — the real user budget
per-IP backstop     IP_HOURLY_LIMIT (600)/UTC hour       — anti-abuse only
client behavior     secureFetch 5-min localStorage cache; ≤2 retries on 429 with
                    Retry-After/backoff (core.js:1673-1686); dashboard pool
                    concurrency 2 (app.js:3500); dashboard refresh 20 min
                    (app.js:3288); D-ATIS fetched lazily only when pane opened
                    (app.js:1761-1769)
```

Every knob above exists because its absence caused a specific incident. Do not "tune"
one without knowing which incident it answers:

- **Parallel dashboard fetches → 429 storm.** v5.0.4 (`a6af2a5`): 16 airports ×3 calls
  fired ~48 simultaneous requests via `Promise.allSettled`. Fix: `_runPooled`
  (app.js:3487) at concurrency 4 → lowered to 2 in v5.0.5 (`5c00d09`).
- **Per-IP limiting punished multi-device users.** v5.1.0 (`335bd16`), verbatim from
  the commit: *"PC and iPad sharing a Wi-Fi network share one IP, so they competed for
  the same 200/hr budget."* Fix: primary bucket keyed by access code; IP kept only as
  backstop (600/hr). If you ever consider re-keying limits by IP "for simplicity" —
  that exact reasoning already failed in production.
- **5-min auto-refresh burned budget.** v5.0.6 (`30ca5cc`) slowed dashboard refresh to
  20 min; METAR validity is ~60 min, so 20 min loses nothing.

## Server-side mechanics you must not break

- **A single 429 from AVWX marks that key exhausted for the whole day**
  (weather.js:184-187 sets usage = DAILY_LIMIT). Deliberate: AVWX 429s mean the
  free-tier cap tripped; retrying that key wastes calls. Rotation then falls through
  remaining keys (weather.js:220-234).
- **Anomaly log:** every timeout/error/slow(>4 s)/rotation/exhausted event is pushed to
  Redis list `efb:api_events` (last 200, 48 h TTL) by `logApiEvent` (weather.js:110).
  Read it via `POST /api/api-stats {action:'events', password:<API_ADMIN_PASSWORD>}` or
  the in-app admin panel. **This is your first diagnostic stop for any weather-fetch
  incident** — check it before adding logging.
- **Penalty box semantics:** hourly buckets are `<date>:<HH>` UTC keys with 2 h TTL. A
  user who hits the cap stays blocked until the UTC hour rolls over — there is no
  reset call. Don't debug "why is this user still blocked after I raised the limit";
  the raise applies from the next hour bucket.
- **429 responses name the tier that fired** — the error string reads
  `Rate limit exceeded (user)` or `(ip)` (weather.js:264-267; the tier is embedded in
  the string, not a separate JSON field) — added in v5.1.0 explicitly for diagnosis.
  Read it from the response body before theorizing.

## Rules

### Rule: cost every new fetch in per-hour terms before adding it
**Trigger:** you are adding a `secureFetch`/`fetch` to any AVWX-backed route, or a new
periodic timer.
**Steps:** compute worst-case calls/hour = (airports tracked) × (calls per airport) ×
(refreshes per hour) and compare with ACCESS_HOURLY_LIMIT (1000) *and* the 9×4000/day
pool shared by **all** users. A tracked airport costs up to 3 calls (METAR + station +
TAF). Add new bulk work through `_runPooled(…, 2, …)`, never `Promise.all`.
**Done when:** your feature at 999 tracked airports (the actual cap, app.js ~3336)
stays under both budgets, or is lazily triggered like D-ATIS.
**Positive example:** the per-user usage chip polls `/api/my-usage` (reads existing
counters, costs zero AVWX calls) every 30 s (core.js:1128) — new UI, no new AVWX load.
**Negative example (reconstructed from the commit sequence, not a quote):** the
implied v5.0.x-era reasoning was "users won't add that many airports" — then the cap
was raised from 8 to 999 in `9aeef58` with no fetch-budget change, and the 429 storm
followed within days.

### Rule: keep client 429 handling idempotent per endpoint
`window.__sf429Attempts` (core.js:1674) tracks retries per endpoint URL and resets on
any non-429. If you add retry logic elsewhere, cap it (≤2) and honor `Retry-After` —
uncapped client retries against a per-hour bucket only deepen the penalty.

## Quota diagnosis one-liners

- Key pool state: `POST /api/api-stats {password}` → per-key usage/remaining.
- One user's consumption: `GET /api/my-usage` with `x-access-code` header.
- All keys exhausted symptom: weather.js throws "All API keys exhausted", client shows
  provider-down card; resets at midnight UTC. Verify against `avwx:usage:<today>:keyN`
  counters rather than assuming AVWX is down.

---
Re-verify: `grep -n "ACCESS_HOURLY_LIMIT\|IP_HOURLY_LIMIT\|DAILY_LIMIT" api/weather.js | head -5 && grep -n "_runPooled(multiAirports" public/app.js`
