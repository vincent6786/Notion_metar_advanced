# METAR GO — Skill Library Manifest

Authored 2026-07-12 against repo state `64468bd` (v5.4.3, 2026-07-04), full history
(761 commits on main) unshallowed and mined. Every command/path/line cited in these
skills was checked against the working tree; production-runtime claims that could not
be checked are marked `unverified` or `user-must-provide` in place. Residual doubts:
`UNCERTAINTY.md`.

Reviewed 2026-07-13 by three independent fresh-context passes (factual re-verification
of 55+ citations / 37 hashes / all commands; doctrine/consistency; zero-context
usability). All BLOCKING and IMPORTANT findings were applied — notably: the vercel.json
rewrite demoted from "required registry" to convention (it's absent for two working
routes), the version bump corrected from four to five synchronized lines, the
keep-alive guard identifier corrected to `_keepAliveTimer`, and the live swipe
threshold corrected to 40 px (the 80 px code is dead). Unresolved review items:
UNCERTAINTY.md U9–U11.

| Skill | One line | Evidence behind it |
|---|---|---|
| architecture-contract | The 8 invariants that hold this no-framework PWA together (route registries, the five version lines, timeout ordering, shared global scope, Redis namespace, fail-open, PROD_HOST). | Code inspection of all 11 api files + sw.js + index.html; incidents v4.7.11, v4.7.3; misplaced-file precedents `6e57263`, `592e932`. |
| build-and-env | Rebuild from zero, the real env-var set, and a table of README claims proven false. | `grep process.env` across api/; `git log --all` proving bump.js/.github never existed; node --check run this session. |
| service-worker-and-caching | Four cache layers, five incident-derived rules; the repo's biggest incident cluster. | Fix commits `d06ce79`, `8b99f19`, `08a1d37`, `e7717e2`; live API_ROUTES gaps verified in sw.js:38-46. |
| rate-limits-and-keys | Budget chain from AVWX keys to client backoff; every knob mapped to the June-2026 429 storm that created it. | Commits `a6af2a5`, `5c00d09`, `30ca5cc`, `335bd16` (rationale quoted verbatim); current constants verified in weather.js/app.js. |
| debugging-playbook | Ten symptom→triage entries, each anchored to a solved (or still-open) incident with its fix hash. | v4.7.x/v4.9.7/v5.x fix commits; open bugs confirmed present at `64468bd` (audio rebuild, API_ROUTES gaps, dead status.keys branch). |
| failure-archaeology | Dead ends and silent reverts: upload-era regressions (proven twice via git -S/-L), the four-stage atis.guru saga, backwards version renumbering, stranded fixes on unmerged branches. | `git log -L/-S` on core.js; commits `196ab63`→`949bedc`; `d11f3ea`, `9c1c83c`→`913292e`; `32065f1`; branch ancestry checks. |
| release-and-versioning | The manual four-string bump procedure (no automation exists) and version discipline rules. | Model commit `64468bd`; repeat-failure commits `93d225a`, `7202006`, `13b2d6f`, `60b5f27`; empty `git tag`. |
| access-admin-and-maintenance | Gate mechanics, admin traps with incident history, maintenance mode's two bypasses and its cleartext-passcode edge. | access.js/status.js/maintenance.html line reads; fixes `955ebc6`, `b6306b9`, `592e932`. |
| frontend-platform-quirks | iOS PWA scar tissue: canvas-on-hidden-tab, fixed-position modals, safe-area/scroll-lock, gesture arbitration, storage purge recovery, audio-vs-DOM-rebuild. | Fix commits `44aaf14`, `a0eea46`, `12b0e50`, `fc8c6c7`, `ceb636d`, `00b1945`; patterns verified at cited lines. |
| data-sources-and-fallbacks | Per-panel provider chains with each link's known failure mode, plus the gate for adding a new source. | All api/ proxies read in full; fallback orders verified in atis.js/notam.js/core.js; orphan `/api/stream` confirmed caller-less. |
| validation-and-qa | Evidence tiers T0–T3 for a repo with no tests, the pre-commit grep gates, and the manual smoke flows with pass signals. | node --check run clean this session; each grep gate derived from a historical regression class documented in the other skills. |

## Reading order for a fresh session

1. `architecture-contract` (always)
2. The skill matching your task type (table above / frontmatter descriptions)
3. `failure-archaeology` before attempting anything previously tried
4. `validation-and-qa` before claiming done

## Standing caveats

- Production (`metar-advanced.vercel.app`) returned 403 to this session's server-side
  probes — every deployed-behavior claim is code-inferred unless marked otherwise.
- README.md must not be treated as evidence (see build-and-env).
- Volatile facts (line numbers, constants) are stamped `64468bd`; re-verify with each
  skill's last-line command after any upstream commit.
