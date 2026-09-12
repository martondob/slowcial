# Slowcial

<p align="center">
  <img src="assets/slowcial-logo.png" alt="Slowcial logo" width="144" height="144">
</p>

**An experimental Firefox extension that inserts viewport-sized space between Instagram posts to interrupt automatic infinite scrolling.**

Slowcial does not block social media. It changes the geometry of the feed: configurable gaps (`1×` / `1.5×` / `2×` viewport height) between posts, plus a lightweight session widget for elapsed time and posts you’ve actually centered in view.

---

## Why it exists

Infinite feeds compress item-to-item distance until scrolling becomes reflexive. Most interventions either lock the site or frame the problem as wellness. This project tests a narrower frontend hypothesis: **keep the content, change the spacing**, and see whether deliberate friction is enough to surface intention again.

Built as a compact portfolio case study in browser-extension engineering — dynamic third-party DOMs, observer lifecycle, injected UI isolation, and restrained product UX.

---

## What it does today

| Capability | Status |
|---|---|
| Instagram feed spacing via injected CSS | Working |
| Gap presets: `1×`, `1.5×`, `2×` viewport | Working |
| Enable / disable from popup | Working |
| Settings via `browser.storage.sync` | Working |
| Session intent setup (motivation + targets + breaks) | Working |
| Soft brake reminders with motivation | Working |
| Soft bound-hit (extend / end) | Working |
| Session widget: progress vs targets | Working |
| Focus-aware session timer (pauses when tab hidden) | Working |
| Widget minimize + persist | Working |
| Firefox MV3 temporary install | Working |
| Chrome / Safari / store release | Not in scope yet |
| Account login / cross-device intent sync | Roadmap only |
| Multi-network adapters | Roadmap only |

> Honest scope: Instagram’s markup moves. Selectors are conservative and may need updates when Meta ships UI changes.

---

## How it works

```
Instagram DOM
  → content script (content.js)
    → inject / refresh spacing CSS
    → if enabled && no session intent → setup overlay
    → Start session → browser.storage.session intent
    → inject session widget (progress + motivation)
    → scroll/resize (+ interval) → centered-article detection
    → WeakSet dedupe → viewed count → soft brakes / bound-hit
    → visibility/focus → pause/resume active session timer
  → popup UI writes settings
  → browser.storage.sync (gaps + intent defaults)
  → storage.onChanged → re-apply
  → MutationObserver → rehydrate if SPA removes injected nodes
```

**Interesting frontend problems this touches:**

1. **Augmenting a hostile/moving DOM** — Instagram is an SPA; article nodes come and go. Spacing uses targeted selectors (`main article > div:first-child` when possible) rather than rewriting the feed.
2. **Idempotent lifecycle** — style tag + widget/overlays are upserted by ID; removal is watched once; storage listeners and scroll handlers attach once.
3. **Counting without double-counting** — centered article heuristic + `WeakSet` + `data-slowcial-viewed` attribute.
4. **Performance on scroll** — scroll/resize handlers coalesce through `requestAnimationFrame`; a low-frequency interval catches edge cases.
5. **Session intent vs durable prefs** — live run in `storage.session`; gap/defaults in `storage.sync` (seam for later cross-device prefs).
6. **Active-time clock** — elapsed accumulates only while the tab is visible/focused, matching how IG pauses video off-tab.
7. **Minimal privileges** — `storage` + `https://www.instagram.com/*` only. No telemetry, no content upload, no account APIs.

---

## Repository layout

```
extension/          Firefox MV3 add-on (load this folder)
  manifest.json
  content.js        Feed spacing + session widget
  popup.html|js     Gap + enable controls
  icons/            Toolbar PNGs derived from assets/slowcial-logo.png
assets/             Logo masters
docs/               GitHub Pages landing (not required to run the extension)
```

---

## Install locally (Firefox)

1. Clone this repo.
2. Open `about:debugging#/runtime/this-firefox`.
3. **Load Temporary Add-on…** → select `extension/manifest.json`.
4. Visit Instagram → open the Slowcial popup → pick a gap → scroll the home feed.

Temporary add-ons unload when Firefox restarts. That’s expected for this stage.

### Manual verification

- [ ] Popup enable toggle immediately adds/removes feed gaps
- [ ] Gap select switches between 1 / 1.5 / 2 viewport multiples
- [ ] With Slowcial enabled, setup overlay appears before counting
- [ ] Start session requires motivation + at least one target
- [ ] Session widget shows progress vs targets and truncated motivation
- [ ] Break every N shows motivation reminder; Continue resumes
- [ ] Hitting a target offers Extend / End session
- [ ] Switching away from the IG tab freezes session time; returning resumes
- [ ] Minimize state survives reload (storage.sync)
- [ ] Navigating within Instagram does not duplicate the widget
- [ ] Disabling leaves the host page usable (no broken layout)

---

## Current limitations

- Instagram-only; selectors can break when Meta changes markup
- Firefox-first; not packaged for AMO / Chrome Web Store yet
- Temporary-addon workflow only
- No automated browser tests against live Instagram (fragile + account-bound)

---

## Near-term roadmap

- Capture portfolio screenshots / short GIF of real spacing behaviour (incl. intent + brake)
- Optional: account / preference sync for motivation defaults across devices
- Optional: extract pure helpers (gap CSS, duration format, dedupe) for unit tests
- Optional: Chrome MV3 pass once Firefox path is stable

---

## Privacy

Slowcial stores local extension settings (`enabled`, gap mode, widget minimized, intent defaults) in `storage.sync`, and the active session intent (motivation, counters) in `storage.session` until the browser quits. It does not collect browsing content, scrape posts, or phone home.

---

## CV / portfolio one-liner

> *Slowcial — experimental Firefox extension that injects viewport-scaled spacing into Instagram feeds and tracks session visibility with content-script observers; a small study in third-party DOM augmentation, SPA lifecycle hygiene, and intentional interaction friction.*
