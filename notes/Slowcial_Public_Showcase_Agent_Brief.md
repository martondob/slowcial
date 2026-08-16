# Slowcial — Publish & Showcase Readiness Brief

## Mission

Prepare the existing **Slowcial** project for credible public presentation as a portfolio project, especially for senior frontend-engineering applications.

The objective is **not** to expand Slowcial into a large finished product. The objective is to make the current concept and implementation easy to understand, easy to run, visually coherent, technically credible, and valuable as evidence of frontend/product engineering ability.

Treat **showcase value, clarity, stability, and finish** as higher priority than adding features.

## Project context

Slowcial is an experimental browser extension that introduces intentional friction and visual space into infinite social-media feeds, initially focused on Instagram Reels.

The product idea is to interrupt automatic consumption patterns without turning the experience into a wellness or meditation product. The visual/product tone should feel broadly accessible to developers and ordinary social-media users of different ages and backgrounds: calm and deliberate, but not "wuwu", therapeutic, moralising, childish, or overly decorative.

Known/previously intended characteristics include:

- Firefox-first browser extension.
- Initial target: Instagram Reels.
- Feed-spacing presets such as `1x`, `1.5x`, and `2x`.
- Enable/disable control.
- Main-feed scoping.
- Session information such as elapsed time and viewed-item count.
- DOM/feed handling using browser APIs such as `MutationObserver` and `IntersectionObserver` where appropriate.
- Lightweight state/storage; previous work considered `storage.sync`.
- Product concept: create **space and friction**, rather than block social media outright.

Do not assume every item above still exists or is correctly implemented. Inspect the repository and distinguish **current reality** from prior intention.

## Why this work is being done

Slowcial should function as a compact portfolio case study showing that its author can:

- design and implement frontend behaviour rather than only static pages;
- work directly with browser APIs and dynamic DOMs;
- reason about performance and lifecycle behaviour on mutation-heavy pages;
- build small reusable UI/state systems;
- translate an unusual product idea into a restrained interaction model;
- prototype rapidly while retaining engineering discipline;
- make deliberate UI/UX decisions;
- document architecture and trade-offs clearly.

A hiring manager should be able to understand the project in **30-60 seconds**, then go deeper if interested.

## First task: inspect before changing

Before implementation:

1. Inspect the complete repository structure and current git state.
2. Identify the current extension architecture, build tooling, manifest version, target browser(s), permissions, storage model, content scripts, UI components, observers, styles and tests.
3. Run the existing development/build/test workflow if one exists.
4. Identify broken, stale, dead, prototype-only or misleading pieces.
5. Summarise the smallest set of changes that would make the project **demo-ready and portfolio-ready**.

Do not rewrite the project just because a different stack would be fashionable. Preserve working architecture unless there is a concrete reason to change it.

## Definition of "showcase ready"

Aim for the following outcome.

### 1. The extension actually works

Produce one coherent, demonstrable flow on the currently supported Instagram/Reels UI:

- extension can be installed locally without obscure manual repair;
- enable/disable state works;
- at least one meaningful spacing/friction mode works reliably;
- settings survive page/navigation behaviour where expected;
- observers/listeners do not obviously multiply or leak during normal navigation;
- UI does not visibly corrupt the host page;
- failure on unsupported/changed markup is graceful rather than catastrophic.

If Instagram markup has changed, update selectors/behaviour conservatively and document the fragility inherent in augmenting a third-party DOM.

### 2. Repository presentation is excellent

Create or substantially improve the root `README.md` so it immediately communicates:

1. **What Slowcial is** — one clear sentence.
2. **Why it exists** — concise product motivation.
3. **What it currently does** — only implemented behaviour.
4. **A visual demonstration** — hero screenshot, short GIF/video reference, or both if practical.
5. **How it works technically** — short architectural overview.
6. **Interesting frontend problems** — dynamic DOM observation, visibility tracking, deduplication/state, performance, browser-extension constraints, etc., but only where supported by the code.
7. **How to run it locally** — minimal reproducible setup.
8. **Current status / limitations** — transparent and concise.
9. **Roadmap** — only a small near-term list; do not imply promised production features.

The README should read like a strong engineering case study, not startup marketing copy.

### 3. Visual identity is coherent

Retain or refine the existing Slowcial identity rather than inventing a completely unrelated visual language.

Desired characteristics:

- clean;
- deliberate;
- slightly subversive;
- visually memorable without becoming loud;
- not neon-pink, "mindfulness retreat", psychedelic-wellness, or infantilised;
- suitable for a technical portfolio.

Prior visual thinking used the idea of **two feed/reel blocks separated by space** as the logo concept. Reuse this if it still fits the repository/assets.

Focus on typography, spacing, hierarchy and restrained interaction polish before decorative illustration.

### 4. Add a lightweight showcase surface

If the repository architecture makes it reasonable, create a very small project/landing page that can be deployed statically (for example through GitHub Pages or another static host).

It should contain roughly:

- Slowcial name + short proposition;
- one strong visual/demo;
- "the problem";
- "the experiment";
- 3-5 concise technical highlights;
- current status;
- repository/source link **only if publication of the source is intended**.

Do not spend substantial time building a marketing website. One polished page is enough.

If a standalone showcase page would complicate the extension repository unnecessarily, prefer an excellent README and a `/docs` or similarly isolated static presentation.

### 5. Make screenshots/demo assets portfolio-quality

Create a small set of reproducible visual assets showing the extension rather than generic mockups.

Ideal minimum:

- extension/settings UI;
- feed with Slowcial enabled;
- comparison or obvious illustration of the inserted spacing/friction behaviour.

Avoid exposing personal account information, private messages, identifying user data, session tokens or browser chrome containing sensitive information.

### 6. Repository hygiene

Before calling the project publish-ready:

- remove accidental secrets and local credentials;
- confirm `.gitignore` is adequate;
- remove generated junk and obsolete debug files;
- remove misleading abandoned files where safe;
- make scripts and dependency versions understandable;
- ensure build output is not committed unless intentionally required;
- make naming and folder structure understandable to an outside engineer;
- ensure the default branch builds/runs from documented instructions;
- add basic project metadata where useful.

Do **not** make the repository public, change licensing, publish to an extension store, or deploy to a public domain automatically unless explicitly authorised. Prepare those steps and report what is ready.

## Testing and engineering quality

Do not create a huge testing programme solely for portfolio optics. Add tests where they prove the core mechanics and are cheap to maintain.

Prioritise testing around logic such as:

- deduplication of discovered feed items;
- state/settings behaviour;
- calculation/application of spacing modes;
- viewed-item/session counting if present;
- cleanup/idempotency of observers or injected UI where feasible.

If browser-level automated testing is already present, repair/use it. If not, only add Playwright/WebExtension automation if it materially improves confidence without becoming the project itself.

Document meaningful manual verification steps for behaviour that depends on Instagram's live UI.

## Architecture/documentation expectations

Where useful, add a short architecture section or diagram explaining a flow such as:

`Instagram DOM -> content script -> discovery/observer layer -> item state -> Slowcial behaviour/UI -> extension storage`

Use the architecture actually present after inspection rather than forcing this exact model.

Explicitly document interesting trade-offs, particularly:

- observing a third-party application whose DOM can change;
- avoiding repeated mutation handling;
- lifecycle/cleanup during SPA navigation;
- separating detection logic from presentation behaviour;
- keeping injected behaviour minimally invasive;
- privacy: Slowcial should not require collection of browsing/content data for analytics merely to demonstrate the concept.

## Portfolio framing

Use language suitable for a senior frontend-engineering portfolio.

Good framing:

> An experimental browser extension exploring whether small changes to feed interaction and spacing can make infinite scrolling less automatic.

Technical framing should emphasize implementation and reasoning, for example:

- browser extension architecture;
- dynamic DOM observation;
- visibility/intersection tracking;
- UI injection and isolation;
- state persistence;
- SPA navigation resilience;
- performance-conscious event handling;
- interaction prototyping.

Avoid unsupported claims such as proven behavioural-health outcomes, measured addiction reduction, large user numbers, production reliability, or cross-browser support that has not actually been demonstrated.

## Scope discipline

Do **not** let this task turn into:

- a complete product rewrite;
- Chrome + Safari + mobile support;
- authentication/backend work;
- subscriptions/payments;
- analytics infrastructure;
- an elaborate design system;
- a large marketing site;
- speculative AI features;
- a broad social-network blocker.

Those can remain roadmap items if relevant.

The desirable outcome is a **small project that feels finished at its current scope**.

## Deliverables

At completion, provide:

1. A concise audit of the starting repository.
2. The implemented changes.
3. A working local build/install path.
4. Updated `README.md`.
5. Any lightweight showcase page/assets that were justified.
6. Tests or documented verification for the key behaviour.
7. A `SHOWCASE_STATUS.md` (or equivalent final note) stating:
   - what is demonstrably working;
   - what remains experimental;
   - any known Instagram/browser fragility;
   - whether the repository is technically safe to make public;
   - exact remaining manual steps for public deployment/publication.
8. A short suggested CV/portfolio description of Slowcial based strictly on what is now implemented.

## Decision rule

Whenever choosing between **another feature** and **making the existing project easier to understand, run, trust, or demonstrate**, choose the latter.

The finished repository should communicate: **this developer can take an unusual frontend idea, reason about the browser deeply, and turn a prototype into a clean, presentable engineering artifact.**
