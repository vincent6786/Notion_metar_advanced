# Uncertainty Log

Items the skill library could not resolve from the repo alone, as of 2026-07-12 at
`64468bd`. Each needs either the user or a deployed-environment check to close.
(Reviewer-added items appear at the bottom after the staged-review pass.)

## U1. Does `/api/notam` actually work in production?
The function file is at repo root (`notam.js`); `vercel.json:10` targets
`/api/notam.js`; no `api/notam.js` exists or ever has. By Vercel's documented
conventions this should 404, yet multiple commits treat the NOTAM feature as working
(e.g. `8f696ed`). Possible explanations: the Vercel project has a root-directory or
functions override configured in the dashboard, or the feature silently falls back /
fails in production. **Close by:** opening
`https://metar-advanced.vercel.app/api/notam?station=KMHR` in a browser
(this session's server-side probes got 403 at the edge). If it 404s, the fix is
`git mv notam.js api/notam.js` (plus nothing else — rewrite already matches).

Related (doctrine-review finding): the vercel.json rewrites appear **redundant** for
files already in `api/` — `/api/atis` and `/api/my-usage` have no rewrite entries yet
demonstrably shipped as working features. Exact production routing semantics remain
unverified; skills now treat `api/` placement + sw.js API_ROUTES as the load-bearing
registries and the rewrite as convention.

## U2. Why did production 403 this session's probes?
`/api/status` (no auth required in code) returned 403 via two different fetch paths.
Could be Vercel Deployment Protection, a WAF rule, or the sandbox egress proxy.
Deployed-behavior verification (evidence tier T3 — see validation-and-qa) is
therefore unavailable from agent sessions until the user confirms how they access the
deployment.

## U3. Are the sw.js API_ROUTES gaps causing live staleness?
Four routes are missing from `API_ROUTES`: `/api/atis`, `/api/my-usage`,
`/api/check-frame`, `/api/stream` — all get cache-first treatment by code reading
(`/api/stream` has no callers, so only the first three have user impact).
Real-world impact depends on SW cache hit patterns we can't observe.
The fix (add them to `API_ROUTES` + bump CACHE_VERSION) is cheap and safe either way;
flagged as open bug in skills but intentionally NOT applied (repo read-only mandate).

## U4. Deploy pipeline assumption
"Push to main → Vercel auto-deploys" is inferred (vercel.json present, no CI, commit
cadence consistent with it). The Vercel project's linked branch and any dashboard
settings (root directory, install command, protection) are user-must-provide.

## U5. Which package.json does Vercel use for functions?
Root and `api/package.json` both pin `@upstash/redis ^1.28.0`, so it currently cannot
matter. If dependencies ever diverge, resolve which one the build actually reads
before trusting either.

## U6. FREQ_DB regeneration
`public/airportfrequencies.js` is generated from OurAirports CSV per README, but no
generator script exists in-repo. Updating the frequency DB requires the user's
original tooling or writing a new generator.

## U7. `ACCESS_HOURLY_LIMIT` etc. — deployed values unknown
Skills cite code defaults (1000/600/60/30, AVWX_DAILY_LIMIT 4000). Actual Vercel env
values may differ; the admin panel or `/api/my-usage` reveal the effective limits at
runtime.

## U8. `_atisLoadedFor` vs stale-cache interaction
`loadAtisFor` (app.js:1765-1770) skips refetch per airport per session, AND
`/api/atis` may be SW-cached (U3), AND secureFetch adds a 5-min localStorage layer.
Which layer explains any given "stuck D-ATIS" report is scenario-dependent; the
debugging-playbook S4 ordering is the best-effort triage, not a proof.

---

# Reviewer-added items (staged-review pass, 2026-07-13)

## U9. Vercel rewrite semantics
See the addendum under U1: rewrites appear redundant for `api/*.js` files (two routes
work without them), but this is inference from feature history, not a routing test.

## U10. Platform-behavior claims are commit-derived
iOS canvas-discard (Q1), ITP localStorage purge (Q5), and X-Frame-Options behavior are
asserted from this repo's fix history and browser documentation knowledge, not
re-verified on devices in this session. Skills now carry inline labels to that effect.

## U11. Dead code inventory (candidates for cleanup, not applied — repo read-only)
- `handleSwipe()` + `swipeThreshold = 80` (app.js:3042-3044): defined, never called;
  the live detector is the IIFE at app.js:3086+ (MIN_DIST 40).
- `/api/stream` (api/stream.js): zero frontend callers.
- `public/gc-tools-extension.patch.js`: integration notes for an already-applied
  patch; never loaded; still precached by sw.js:23.
- sw.js:18 precaches `/settings.js`, deleted from public/ in 592e932.
- core.js:1141-1153: unreachable `data.keys` branch (status.js never returns keys).
- index.html:782 hardcoded `v4.8.6` (runtime-overwritten; cosmetic).
