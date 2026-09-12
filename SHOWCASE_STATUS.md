# Showcase status

Last updated: 2026-09-12

## Starting audit (before showcase pass)

| Area | Reality |
|---|---|
| Architecture | Flat MV3 Firefox extension: `content.js` + popup + `storage.sync` |
| Build tooling | None (load unpacked / temporary add-on) |
| Tests | None |
| README | Stub (version + gap list) |
| Visual identity | Session widget styled; popup was bare; no logo |
| Landing / docs site | None |
| Repo hygiene | No `.gitignore`; extension files at repo root |

Implemented behaviour already present then: gap CSS injection, enable flag, session timer + centered-article counting, minimize persistence, MutationObserver rehydrate, storage change listener.

## What is demonstrably working

- Temporary Firefox install from `extension/manifest.json` (Gecko 115+ for `storage.session`)
- Enable / disable spacing
- Gap modes `1` / `1.5` / `2` (viewport multiples)
- Settings persistence via `browser.storage.sync`
- Session intent setup overlay (motivation + post/time targets + break cadence)
- Soft brake overlays that resurface motivation every N posts
- Soft bound-hit overlay (Extend / End session)
- Session widget with progress vs targets + truncated motivation + End session
- Focus-aware timer: pauses while Instagram tab is hidden/unfocused
- Live intent + counters in `browser.storage.session`; numeric defaults in `storage.sync`
- Static showcase page under `docs/` (GitHub Pages source)
- Portfolio-oriented root `README.md`

## What remains experimental

- Instagram selector stability across Meta UI changes
- Main-feed scoping flag exists in defaults (`scopeToMain`) but is not exposed in the popup UI
- Viewed-count heuristic (centered article) is approximate, not a formal IntersectionObserver pipeline

## Known fragility

- Content script targets Instagram article structure; markup drift can silently reduce effectiveness
- SPA navigations rely on MutationObserver re-application; unusual Instagram routes may need selector tweaks
- Temporary add-ons do not survive Firefox restart
- Session intent clears when the browser session ends (`storage.session`)

## Safe to make public?

**Technically yes**, with caveats:

- No secrets in tree
- `.gitignore` covers env / web-ext artifacts
- Extension id is placeholder `slowcial@example.com` — change before AMO submission
- Confirm GitHub remote / personal URLs before advertising the repo
- Do **not** publish to AMO or a custom domain until explicitly authorised

## Remaining manual steps for publication

1. Capture 2–3 real screenshots / a short GIF (setup, feed with gap, brake/widget) — scrub personal data
2. Decide public repo visibility + license
3. Enable GitHub Pages from `/docs` (Settings → Pages → Deploy from branch → `/docs`)
4. Optional: replace placeholder gecko id before store packaging
5. Confirm Pages URL on the landing CTAs if needed

## Suggested CV blurb

Slowcial — experimental Firefox (MV3) extension that inserts viewport-scaled gaps into Instagram feeds and frames each visit with a session intent (motivation, soft targets, periodic brakes), tracking focused time only while the tab is active. Demonstrates third-party DOM augmentation, SPA-safe injection/lifecycle handling, `storage.sync`/`storage.session` split, and restrained product UX around intentional friction rather than blocking.
