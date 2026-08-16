# Manual verification

Run against a logged-in Instagram account in Firefox with the temporary add-on loaded from `extension/manifest.json`.

## Spacing

1. Enable Slowcial, set gap to `1×`, reload Instagram home.
2. Confirm visible empty viewport between consecutive posts.
3. Switch to `2×` in the popup without reload — gaps should grow.
4. Disable — margins should disappear; page remains usable.

## Session widget

1. Widget visible bottom-right on Instagram.
2. Scroll until a new post is vertically centered — count increments once per article.
3. Minimize — chip collapses; reload page — stays minimized.
4. Navigate Instagram (profile → home) — only one widget/style tag present.

## Failure modes to accept (document, don’t panic)

- Reels-only or explore layouts may not match `main article` selectors.
- If Meta renames structure, spacing may no-op; widget should still mount.
