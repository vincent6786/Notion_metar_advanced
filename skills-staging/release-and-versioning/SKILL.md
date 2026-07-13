---
name: release-and-versioning
description: Load when preparing any commit that should reach users, when asked to "bump the version" or "release", when What's New didn't appear for users after a deploy, or when version strings disagree between index.html, sw.js, and core.js.
---

# Release & Versioning — the real (manual) procedure

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.

**There is no automation.** README's `bump.js` + `bump-version.yml` never existed in
any commit. There are no git tags (`git tag` is empty), no CI, no branch protection
visible in-repo. A release is: edit four strings, commit, push to `main`, Vercel
auto-deploys (`unverified` — see build-and-env).

## The five version-bearing lines (edit all in one commit)

1. `public/index.html:15` — `window.APP_VERSION = 'X.Y.Z';` ← the source of truth
2. `public/index.html:110` — launch screen `TRAINING EDITION · vX.Y.Z`
3. `public/sw.js:6` — `CACHE_VERSION = 'metar-go-vX.Y.Z'` ← this is what actually
   invalidates user caches; forgetting it means users keep old assets (incident
   v4.7.3, and repeat offenders `93d225a` "complete v4.7.12 version bump across all
   files", `7202006` "fix hardcoded launch screen version")
4. `public/core.js:6` — `version: window.APP_VERSION || 'X.Y.Z'` — the fallback
   string (only used if APP_VERSION is somehow unset, but it drifts visibly in greps)
5. `public/core.js:7` — `WHATS_NEW.title: 'METAR GO — vX.Y.Z'` (history shows the
   core.js pair drifts: `13b2d6f`, `60b5f27` are pure "align WHATS_NEW" chores)

Cosmetic note: index.html:110 and the hardcoded `v4.8.6` at index.html:782
(`helpVersionLabel`) are both overwritten at runtime by `initVersionLabels()`
(core.js:130-136) from APP_VERSION. They are pre-JS fallbacks — :110 is kept in the
bump by convention (model commit does it); :782 has been left stale for months and is
NOT part of the bump. Don't "fix" :782 as drift, and don't treat either as the source
of truth.

Model commit to copy: `git show 64468bd --stat` — exactly core.js + index.html + sw.js,
message `chore: bump to v5.4.3 + add What's New entry`.

## What's New rules

- `checkWhatsNew()` (core.js:57) shows the popup once per `WHATS_NEW.version`, keyed on
  `localStorage.efb_seen_version`. If you bump code versions but not the WHATS_NEW
  content, users see an **old** changelog under a new version number once, then never
  again — write the entry in the same commit.
- Keep entries user-facing (the file's existing entries are the tone reference).
- On staging hosts `efb_seen_version` is cleared every load (app.js:3001) so the popup
  always shows — that is intentional, not a bug report.

## Version discipline rules

**Trigger:** you are about to reuse, skip, or re-order a version number, or your change
is "too small to bump".

**Steps:**
- Any user-visible change to `public/` ⇒ at minimum a patch bump + CACHE_VERSION bump.
  Sub-patch suffixes have precedent for cache-only invalidations (`4.8.3a`, `4.8.3b`)
  but prefer a clean patch increment.
- Never renumber downwards or recycle a number: v4.9.0 was used for print preview,
  retracted to 4.8.1 (`32065f1`), then re-used for dashboard grouping — that single
  event permanently broke "version in commit message → point in history" mapping (see
  failure-archaeology #3).
- Commit message format in current use: `type: summary (vX.Y.Z)` with
  `feat|fix|chore` types.

**Done when:** `grep -rn "X\.Y\.Z" public/index.html public/sw.js public/core.js`
returns exactly the five expected lines with the new number (index.html:15 and :110,
sw.js:6, core.js:6 and :7), and grepping the previous number returns only the stale
cosmetic index.html:782 (see note above).

**Positive example:** `64468bd` (v5.4.3) — one commit, three files, five strings, plus
the What's New entry.
**Negative example:** v4.7.12's bump missed files on the first pass — per `93d225a`'s
own message, references were "missed in earlier commit" — producing
`fix: complete v4.7.12 version bump across all files` and one release window where
deployed files disagreed about their own version.

## Release checklist (copy into your working notes)

1. `node --check` all touched JS files.
2. Five version strings updated; WHATS_NEW entry written.
3. sw.js `API_ROUTES` / `STATIC_ASSETS` still match reality if you added routes/files.
4. `git show --stat` — sw.js present whenever public/ changed.
5. Push to `main`; verify the deployed hostname serves the new APP_VERSION
   (view-source on index.html line 15) and that a second reload picks up the new SW.
   (T3 step — needs a real browser on the production host; server-side probes get 403.
   If you can't do it, state the deploy is `unverified` and hand the user this exact
   check.)

---
Re-verify: `grep -n "APP_VERSION\|TRAINING EDITION" public/index.html | head -2 && sed -n '6p' public/sw.js && sed -n '6,7p' public/core.js`
