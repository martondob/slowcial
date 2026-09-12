# Slowcial

<p align="center">
  <img src="assets/slowcial-logo.png" alt="Slowcial logo" width="144" height="144">
</p>

**An experimental Firefox extension that inserts viewport-sized space between Instagram posts to interrupt automatic infinite scrolling.**

Slowcial does not block social media. It changes the geometry of the feed: configurable gaps (`1×` / `1.5×` / `2×` viewport height) between posts, plus a session intent flow (motivation, soft targets, brakes) and a lightweight widget for progress.

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
| Durable settings via `browser.storage.sync` | Working |
| Session intent setup (motivation + post/time targets + breaks) | Working |
| Counts the post already on screen when the session starts | Working |
| Soft brake reminders with motivation | Working |
| Soft bound-hit after the Nth post (before the next can hook) | Working |
| Extend reopens setup; counters continue; new targets add on top | Working |
| Bound dialog freezes feed scroll + keeps IG muted state coherent | Working |
| End session from bound dialog closes the Instagram tab | Working |
| Session widget: progress vs targets + motivation | Working |
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
    → Start session → storage.local intent + count current post
    → inject session widget (progress + motivation)
    → scroll/resize (+ interval) → centered-article detection
    → WeakSet dedupe → viewed count → soft brakes
    → on Nth post: watch leave / next peek → bound overlay
      → mute restore-safe + scroll freeze
      → Extend → setup again (additive targets)
      → End session → close tab (via background)
    → visibility/focus → pause/resume active session timer
  → popup UI writes gap/enable settings
  → browser.storage.sync (gaps + intent defaults)
  → storage.onChanged → re-apply (without rewinding live counters)
  → MutationObserver → rehydrate if SPA removes injected nodes
```

**Interesting frontend problems this touches:**

1. **Augmenting a hostile/moving DOM** — Instagram is an SPA; article nodes come and go. Spacing uses targeted selectors rather than rewriting the feed.
2. **Idempotent lifecycle** — style tag + widget/overlays are upserted by ID; removal is watched once; storage listeners and scroll handlers attach once.
3. **Counting without double-counting** — centered / most-visible article heuristic + `WeakSet` + `data-slowcial-viewed`, including the opening post.
4. **Bound timing without the next-post hook** — interrupt when the Nth post leaves view or the next post peeks, and freeze scroll while deciding.
5. **Session intent vs durable prefs** — live run in `storage.local` (cleared on browser startup); gap/defaults in `storage.sync`.
6. **Active-time clock** — elapsed accumulates only while the tab is visible/focused.
7. **Media mute hygiene** — bound forces mute, then restores prior mute state (never forces unmuted over IG’s muted default).
8. **Minimal privileges** — `storage` + `https://www.instagram.com/*` only. No telemetry, no content upload, no account APIs.

---

## Repository layout

```
extension/          Firefox MV3 add-on (load this folder)
  manifest.json
  background.js     Startup session clear + close-tab on End session
  content.js        Feed spacing + session intent / widget / overlays
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
- [ ] Counter shows `1` on the post already visible at Start
- [ ] Session widget shows progress vs targets and truncated motivation
- [ ] Break every N shows motivation reminder; Continue resumes
- [ ] After the Nth post, bound appears before the next post can hook
- [ ] Bound dialog freezes scrolling; videos stay muted unless user unmuted
- [ ] Extend reopens setup (motivation blank; targets prefilled as “more”)
- [ ] Continuing from Extend keeps counters and adds the new targets
- [ ] End session from bound closes the Instagram tab
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

- Capture portfolio screenshots / short GIF (setup, gap, bound/extend)
- Optional: account / preference sync for motivation defaults across devices
- Optional: extract pure helpers (gap CSS, duration format, dedupe) for unit tests
- Optional: Chrome MV3 pass once Firefox path is stable

---

## Privacy

Slowcial stores local extension settings (`enabled`, gap mode, widget minimized, intent defaults) in `storage.sync`, and the active session intent (motivation, counters) in `storage.local` until browser startup clears it. It does not collect browsing content, scrape posts, or phone home.

---

## CV / portfolio one-liner

> *Slowcial — experimental Firefox extension that injects viewport-scaled spacing into Instagram feeds and frames each visit with a session intent (motivation, soft targets, brakes), tracking focused time only while the tab is active; a small study in third-party DOM augmentation, SPA lifecycle hygiene, and intentional interaction friction.*
