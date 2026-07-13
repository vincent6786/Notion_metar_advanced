---
name: failure-archaeology
description: Load when git blame/log near your target lines shows an "Add files via upload" commit (assume fixes were silently reverted there), and before re-attempting anything previously tried: scraping/proxying a D-ATIS source, iframing a third-party site, "simplifying" rate limits, re-numbering versions, or overwriting files wholesale from outside git tooling.
---

# Failure Archaeology — dead ends, reverts, and why

Facts verified against repo at commit `64468bd` (v5.4.3); verified 2026-07-12.
761 commits on main; no `git revert` commits exist — regressions here happen
*silently*, mostly through one mechanism (see #1).

## 1. The "Add files via upload" era silently reverted fixes (twice, proven)

Early/mid history is dozens of GitHub-web-UI upload commits that overwrote the tree
with a local working copy. Two proven casualties, found via `git log -L` / `-S`:

- `secureFetch` cache threshold: fixed 5→10 min in `196ab63`, **reverted 10→5 min** by
  upload `949bedc`. Today the code is 5 min with a "< 10 min" comment — the comment is
  the fossil of the reverted fix (core.js:1650-1651).
- `Storage._startKeepAlive` interval-stacking guard (`_keepAliveTimer` —
  `if (this._keepAliveTimer) clearInterval(this._keepAliveTimer)`): added in `196ab63`,
  **wiped** by `949bedc`. Today `_startKeepAlive` (core.js:322) again stacks a new
  interval on every `setMode()` call after init — README still advertises "single
  timer, no stacking", which describes the deleted fix.

**Rule — trigger:** you're about to overwrite any file wholesale (web upload, copy from
another checkout, "restore from my laptop"), or blame shows `Add files via upload` near
your target lines.
**Steps:** `git diff` the incoming copy against HEAD before committing; for any hunk
that *removes* code you don't recognize, find the commit that added it (`git log -S`)
and read why.
**Done when:** the diff contains only intended changes.
**Negative example (the observed rationalization, reconstructed from the history):**
"uploading my current working copy is the fastest way to ship this one fix" — it
shipped the fix and unshipped two others, one of which (the cache threshold) had been a
named line-item in the v4.5.0 release notes.

## 2. The atis.guru saga — four dead ends before the working design

Chronology (June 2026, commits `f6fab2d` → `8f1c617`):
1. **Server-side scrape of atis.guru** (v5.1.1-.3): HTML parsing, FAA-combined layout
   handling — worked briefly.
2. **Header spoofing** (v5.1.5 `d11f3ea` "spoof a full real-browser fetch"): Cloudflare
   still 403'd **because it blocks Vercel egress IPs, not user agents** (recorded in
   atis.js:2-5). Dead end — do not retry with "better" headers.
3. **Iframe embed of atis.guru** (v5.2.0 `9c1c83c`): rendered blank — atis.guru ships
   `X-Frame-Options` (v5.2.1 `913292e` dropped it one release later).
4. **Working design** (v5.1.6→v5.3.0): backend proxies only JSON-friendly FAA mirrors
   (atis.info, then datis.clowd.io as fallback); atis.guru survives only as a popup
   opened by the *user's browser* (residential IP passes Cloudflare).

**Rule:** a third-party aviation-data site that 403s Vercel will not be defeated by
header changes; either find a documented JSON mirror to proxy, or hand the URL to the
client browser (popup — iframes die to X-Frame-Options; `/api/check-frame` exists to
probe that before embedding anything).

## 3. Version numbering went backwards once — don't trust tag-shaped commit messages

`9e03c86`/`382c0ad`/`77f8a15` shipped "v4.9.0 — print preview", then `32065f1` set the
version back to **4.8.1**, and 4.9.x was re-used weeks later for dashboard grouping.
Consequences that persist: commit messages claiming "v4.9.0" exist in two different
eras; `WHATS_NEW`-alignment chores (`13b2d6f`, `60b5f27`) repeatedly patched drift
afterwards. When doing history forensics, resolve a commit's real era by **date and
file content**, never by the version in its message.

## 4. Fixes stranded on unmerged branches (check before re-deriving)

- `origin/claude/fix-atc-playback-refresh-QyRE8` — `a17fd40`: guard that stops ATC
  audio DOM rebuild on auto-refresh. Bug still live on main (see debugging-playbook
  S5). One small commit; prefer it over rewriting, but it predates months of main
  changes — review its diff against current core.js and verify per validation-and-qa
  before merging; do not merge solely because it exists.
- `origin/claude/weather-forecast-comparison-rUXyr` — 3 commits whose equivalents were
  independently redone on main (`d06ce79`, `0d083c4`); nothing to salvage, historical
  only.
- `origin/main2` — pre-restructure legacy (`metarv39.html` era, Jan 2026). Never merge;
  archaeology only.
- All other `claude/*` remote branches are fully merged (verified with
  `git merge-base --is-ancestor`); they can be ignored.

## 5. README is a trailing indicator, not documentation

README self-describes v4.8.6 while the app is v5.4.3, documents automation that never
existed (bump.js / GitHub Action), an 8-airport cap that is now 999, a 5-minute refresh
that is now 20, and env names that don't match code. The failure mode it creates:
agents "fix" code to match README. Direction of trust is **code → README**, never the
reverse. (Full discrepancy table: `build-and-env`.)

## 6. The 2-month stall and the shape of this repo's regressions

Commit activity: intense Jan–Apr 2026, silent Apr 23–Jun 25, burst Jun 25–Jul 4
(the whole v5.x rate-limit + D-ATIS arc), nothing since Jul 4. Two implications:
(a) "recently touched" ≠ "recently verified" — most of the frontend predates the stall;
(b) regressions in this repo don't arrive as reverts, they arrive as **uploads,
re-numbered versions, and README drift**, so `git log --grep revert` finds nothing.
Use `git log -S '<code fragment>'` and `-L` on the exact lines instead.

---
Re-verify: `git log --oneline -S'_keepAliveTimer' --all && git log -1 --format='%h %s' origin/claude/fix-atc-playback-refresh-QyRE8`
