---
name: access-admin-and-maintenance
description: Load when working on access codes / the access gate, the admin panel (admin.html or in-app), tool visibility toggles, maintenance mode, or when a user reports being locked out, or an admin action appears to succeed but changes nothing.
---

# Access Gate, Admin, and Maintenance Mode

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.

**User reports being locked out?** Start at debugging-playbook S10 (403 handling) and
the penalty-box note in rate-limits-and-keys; this skill covers the mechanics behind
both.

## Access gate — how requests are actually authorized

- Client sends `x-access-code` header on `secureFetch` calls (core.js:1656-1658).
- Enforcement happens **only** in `api/weather.js:251` and `api/atis.js:131`, and only
  when `ACCESS_GATE_ENABLED === 'true'` (exact string). `/api/notam`, `/api/awos`,
  `/api/check-frame`, `/api/stream`, `/api/my-usage` perform **no access check**
  (my-usage only reads the caller's own counters; the others are open proxies with
  their own guards — stream has a 3-URL whitelist, check-frame has an SSRF filter).
  If you add an expensive upstream to any ungated route, add the CORS + gate +
  rate-limit preamble from api/atis.js:13–81 (same range architecture-contract cites).
- Validation is **fail-open on Redis errors** (weather.js:64-67) — deliberate, keep it.
- Codes are normalized: uppercase, `[A-Z0-9-]` only, 4–20 chars (`sanitizeCode`,
  access.js:25-27). A user record is `{name, created, active}` at `efb:users:<CODE>`.
- On any 403, the client wipes the stored code and re-shows the gate (core.js:1664).

## Admin surfaces (two of them, one password)

Both `public/admin.html` (standalone) and the in-app admin section (core.js) drive
`POST /api/access` / `POST /api/api-stats` with `password: <API_ADMIN_PASSWORD>`.
Actions: `validate` (rate-limited 60/h/IP), `get_config` (public), then
password-gated: `set_config`, `create`, `list`, `update`, `revoke`, `restore`,
`delete` (access.js:59-185).

Traps with incident history:
- **Silent success:** drawer revoke/delete once closed the UI without checking the
  API response (fixed v4.5.0). Preserve the pattern: check `res.ok` + parse error
  before updating UI state.
- **List drops nameless users** (access.js:131 filters on `.name`) — a corrupt record
  is invisible in admin but still valid for the gate. Compare `efb:users:_registry`
  membership when a "deleted" user can still log in.
- **Registry code overwrite:** user-stored fields must not clobber the registry code in
  list responses — spread order fixed in `b6306b9` (access.js:126-128). Don't "clean
  up" that spread.
- Admin password is held in a module-scoped `_adminPasswordCache`, **not**
  `window._adminPwd` — the global was removed as an exposure in `592e932`. Don't
  reintroduce a global for convenience.

## Tool visibility config

`efb:config:hidden_tools` (array of tool ids) — read publicly via
`{action:'get_config'}` (tools-extension.js:4687), written via admin
`{action:'set_config'}`. Hiding a tool is a *display* toggle only; no server-side
enforcement exists or is needed (tools are client-side).

## Maintenance mode — the actual flow (and its two sharp edges)

Flow: set env `MAINTENANCE_MODE=true` → `/api/status` returns
`{maintenance:true, adminCode:<ADMIN_PASSCODE>, env}` (status.js:11-15) → app splash
redirects to `/maintenance.html` (app.js:2987-2990) → user may enter the passcode,
which sets `sessionStorage.admin_bypass='true'` and re-enters the app
(maintenance.html:513-519).

Sharp edges:
1. **`ADMIN_PASSCODE` is served in cleartext to every client while maintenance is on**
   (status.js:13 — maintenance.html compares client-side). It is a courtesy gate, not
   security. Never reuse a real secret (esp. not `API_ADMIN_PASSWORD`) as
   `ADMIN_PASSCODE`, and never extend this pattern to anything that matters.
2. The server-side bypass cookie `efb_bypass=<MAINTENANCE_BYPASS_KEY>` (status.js:6-9)
   has **no UI that sets it** — it's a manual/curl mechanism, independent of the
   sessionStorage bypass. Two bypasses, different layers; don't conflate them when
   debugging "maintenance won't turn off for me" (check both, plus the SW cache of
   `/api/status`).

## Known dead contract (don't chase it as a bug)

Settings ⚙ "API status" label code expects `data.keys` from `/api/status`
(core.js:1141-1153) but status.js has never returned key data — the usage-count branch
is unreachable; the label only ever shows Active/Maintenance. Either extend status.js
deliberately or leave it; do not "fix" the client to match a response that doesn't
exist.

---
Re-verify: `grep -n "ACCESS_GATE_ENABLED" api/*.js && grep -n "adminCode" api/status.js public/maintenance.html | head -4`
