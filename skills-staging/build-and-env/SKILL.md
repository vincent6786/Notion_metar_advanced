---
name: build-and-env
description: Load when setting up this repo from zero, when a command from README.md fails or a described file doesn't exist, when deciding how to run/preview the app locally, or when configuring Vercel/Upstash environment variables and the names in README don't match what the code reads.
---

# Build & Environment — rebuild from zero, and the pitfalls

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.

**Setting up locally right now?** Jump to "Rebuild from zero" below; read the README
table on the way back out.

## What this project actually is

- **No build step.** `public/` is served as-is; `api/*.js` become Vercel serverless
  functions. There is no bundler, transpiler, linter, or test runner anywhere in the
  repo. `npm install` at root installs exactly one dependency: `@upstash/redis`.
- **Two `package.json` files** (root and `api/`) both declare only `@upstash/redis`.
  The `api/package.json` (version string "3.8.0") appears to be a leftover; root is
  authoritative for `vercel dev`. `unverified`: which one Vercel's build actually
  resolves in production — both list the same dep, so it currently cannot matter.
- **Node 18+** required by README; this session verified all files parse under Node 22
  (`node --check` clean across `api/*.js`, `notam.js`, and all `public/*.js`).

## README.md is historical fiction in places — trust code, not README

README (self-labeled v4.8.6; code is v5.4.3) contains claims verified FALSE against
git history and the working tree:

| README claim | Reality |
|---|---|
| `bump.js` + GitHub Action `bump-version.yml` automate version bumps | Neither file has ever existed in any commit (`git log --all -- bump.js .github` → empty). Bumps are manual. |
| Flat project structure (`weather.js`, `core.js` at root) | Layout is `api/` + `public/` since the restructure. `notam.js` really is at root — but that's a defect, not the convention (see architecture-contract). |
| `gc-tools-extension_patch.js` | Actual filename is `gc-tools-extension.patch.js`, and it is documentation, not loaded code. |
| Dashboard: "up to 8 airports", refresh "every 5 minutes" | Cap is 999 (`app.js` ~3336, commit `9aeef58`), refresh is 20 min (`app.js:3288`, v5.0.6). |
| "10-minute client-side caching" | `secureFetch` threshold is 5 min (`core.js:1651`, `300000`) with a stale "< 10 min" comment. See failure-archaeology for why. |
| Env var `ADMIN_ACCESS_CODE` | Does not exist in code. |
| `IP_HOURLY_LIMIT=200` | Code default is 600 (`api/weather.js:31`). |

**Trigger (observed state):** you are about to follow a README instruction verbatim, or
cite README as evidence.
**Steps:** grep the code for the claim first.
**Done when:** the claim you rely on is confirmed by a file:line in the working tree.

## Environment variables — the set the code actually reads

Verified by `grep -rhoE "process\.env\.[A-Z_0-9]+" api/ notam.js` (2026-07-12):

```
KV_REST_API_URL, KV_REST_API_TOKEN      Upstash Redis (required by 6 of 11 functions)
AVWX_KEY_1 … AVWX_KEY_9                 AVWX bearer keys; ≥1 required or weather.js
                                        throws at cold start (weather.js:21-23)
AVWX_DAILY_LIMIT        default 4000    per-key daily cap
ACCESS_HOURLY_LIMIT     default 1000    per-access-code hourly budget
IP_HOURLY_LIMIT         default 600     per-IP hourly backstop
VALIDATE_HOURLY_LIMIT   default 60      access-code validate attempts/IP/hour
PIN_HOURLY_LIMIT        default 30      settings-PIN attempts/IP/hour
ACCESS_GATE_ENABLED     string 'true' enables the gate; anything else disables
API_ADMIN_PASSWORD                      admin panel + api-stats auth (access.js:8, api-stats.js:9)
ADMIN_PASSCODE          default 'admin' maintenance-bypass code shown/checked via /api/status
MAINTENANCE_MODE        string 'true'   maintenance redirect on
MAINTENANCE_BYPASS_KEY  default 'admin' value of the efb_bypass cookie (status.js:2)
ALLOWED_ORIGIN                          CORS allowlist; unset ⇒ '*' on every route
VERCEL_ENV              set by Vercel   'production' | 'preview' | 'development'
```

Note the trap: **`API_ADMIN_PASSWORD` (admin panel) and `ADMIN_PASSCODE` (maintenance
bypass) are different variables with different jobs.** README conflates them.

## Rebuild from zero

```bash
git clone <repo> && cd Notion_metar_advanced
npm install                    # @upstash/redis only
npx vercel dev                 # http://localhost:3000  (needs `vercel login` + linked
                               # project, or the env vars above in .env — user-must-provide)
```

Pitfalls, in the order you will hit them:

1. **No env vars → instant crash of `/api/weather`** at import time (throws when zero
   AVWX keys). Other routes degrade instead (fail-open on missing Redis).
2. **localhost is "staging"** (`index.html:18` PROD_HOST check): the service worker is
   deliberately unregistered, so you cannot reproduce SW/caching bugs on localhost by
   default. To test SW behavior you must serve on the production hostname or
   temporarily edit `PROD_HOST` — do not commit that edit.
3. **`ACCESS_GATE_ENABLED=true` without a seeded user** locks you out: create a code
   first via `POST /api/access {action:'create', code, name, password:<API_ADMIN_PASSWORD>}`
   or leave the gate off locally.
4. **Static assets referenced by absolute GitHub URLs** (`app-icon.png`, `plane.png` via
   `raw.githubusercontent.com` in sw.js:33-34 and manifest) — offline/first-paint tests
   on a network-isolated machine will show missing images; that's expected.
5. There is **no test command**. The only mechanical gate is
   `for f in api/*.js public/*.js notam.js; do node --check "$f" || echo "FAIL $f"; done`.

## Deploy reality

Deploy = push to `main`; Vercel Git integration auto-deploys (`unverified` — inferred
from vercel.json + commit cadence; no CI config exists in-repo. Confirm in the Vercel
dashboard — user-must-provide). There is no staging branch convention; previews come
from non-main hostnames which self-identify as staging in-app.

---
Re-verify: `grep -rhoE "process\.env\.[A-Z_0-9]+" api/ notam.js | sort -u && node --check api/weather.js`
