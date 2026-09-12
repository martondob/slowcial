const DEFAULTS = {
  enabled: true,
  gapMode: "1",
  scopeToMain: true,
  counterMinimized: false,
  intentDefaults: {
    targetPosts: 20,
    targetMinutes: 15,
    breakEvery: 5
  }
};

const STYLE_ID = "slowcial-style";
const WIDGET_ID = "slowcial-session-widget";
const OVERLAY_ID = "slowcial-overlay";
const VIEWED_ATTR = "data-slowcial-viewed";
const MOTIVATION_MAX = 140;

/** @type {"none" | "setup" | "brake" | "bound"} */
let activeOverlay = "none";
/** @type {object | null} */
let sessionIntent = null;
let viewedCount = 0;
let viewedArticles = new WeakSet();
let activeMs = 0;
let runningSince = null;
let feedScanInterval = null;
let timerInterval = null;
let removeWatchObserver = null;
let settingsListenerAttached = false;
let scanListenersAttached = false;
let focusListenersAttached = false;
let persistClockTimer = null;
/** Article that completed the post target; bound waits until it leaves focus. */
let pendingBoundArticle = null;
/** After refresh, if we already passed the post target, fire bound on next check. */
let forcePostBound = false;
let feedMutedByBound = false;
let feedMuteObserver = null;

function buildCss({ enabled, gapMode, scopeToMain }) {
  const allowed = new Set(["1", "1.5", "2"]);
  const mode = allowed.has(String(gapMode)) ? String(gapMode) : "1";
  const gap = Number(mode) * 100 + "vh";

  // Keep the pre-intent selector — this is what worked before.
  const selector = scopeToMain
    ? "main article > div:first-child"
    : "article > div:first-child";

  const spacingCss = enabled
    ? `${selector} { margin-bottom: ${gap} !important; }`
    : "";

  return `
    ${spacingCss}

    #${WIDGET_ID} {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483646;
      width: 240px;
      max-width: calc(100vw - 24px);
      box-sizing: border-box;
      border-radius: 18px;
      background: rgba(246, 246, 244, 0.92);
      color: rgba(30, 30, 28, 0.92);
      border: 1px solid rgba(60, 60, 56, 0.10);
      box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.08),
        0 2px 8px rgba(0, 0, 0, 0.04);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
      transition:
        transform 160ms ease,
        opacity 160ms ease,
        width 160ms ease,
        border-radius 160ms ease,
        box-shadow 160ms ease;
    }

    #${WIDGET_ID}.slowcial-minimized {
      width: 54px;
      border-radius: 999px;
    }

    .slowcial-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px 14px 12px;
    }

    .slowcial-minimized .slowcial-card {
      padding: 10px;
      gap: 0;
    }

    .slowcial-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .slowcial-titlewrap {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .slowcial-title {
      font-size: 14px;
      line-height: 1.1;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .slowcial-subtitle {
      font-size: 11px;
      line-height: 1.2;
      color: rgba(30, 30, 28, 0.58);
      margin-top: 2px;
    }

    .slowcial-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .slowcial-iconbtn {
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 999px;
      background: rgba(30, 30, 28, 0.06);
      color: rgba(30, 30, 28, 0.72);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 120ms ease, transform 120ms ease;
    }

    .slowcial-iconbtn:hover {
      background: rgba(30, 30, 28, 0.10);
    }

    .slowcial-iconbtn:active {
      transform: scale(0.96);
    }

    .slowcial-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .slowcial-stat {
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(60, 60, 56, 0.06);
      padding: 12px 12px 10px;
    }

    .slowcial-label {
      font-size: 11px;
      line-height: 1.2;
      color: rgba(30, 30, 28, 0.56);
      margin-bottom: 6px;
    }

    .slowcial-value {
      font-size: 18px;
      line-height: 1.05;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .slowcial-footer {
      font-size: 11px;
      line-height: 1.35;
      color: rgba(30, 30, 28, 0.52);
      padding-top: 2px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .slowcial-endbtn {
      appearance: none;
      border: 0;
      border-radius: 10px;
      padding: 8px 10px;
      background: rgba(30, 30, 28, 0.06);
      color: rgba(30, 30, 28, 0.72);
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .slowcial-endbtn:hover {
      background: rgba(30, 30, 28, 0.10);
    }

    .slowcial-minimized .slowcial-titlewrap,
    .slowcial-minimized .slowcial-grid,
    .slowcial-minimized .slowcial-footer,
    .slowcial-minimized .slowcial-endbtn {
      display: none;
    }

    .slowcial-minimized .slowcial-actions {
      width: 100%;
      justify-content: center;
    }

    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      background: rgba(20, 20, 18, 0.42);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      font-family: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: rgba(30, 30, 28, 0.92);
    }

    #${OVERLAY_ID} .slowcial-panel {
      width: min(420px, 100%);
      border-radius: 20px;
      background: rgba(246, 246, 244, 0.96);
      border: 1px solid rgba(60, 60, 56, 0.10);
      box-shadow:
        0 24px 60px rgba(0, 0, 0, 0.18),
        0 4px 16px rgba(0, 0, 0, 0.06);
      padding: 22px 22px 18px;
      box-sizing: border-box;
    }

    #${OVERLAY_ID} .slowcial-panel-kicker {
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #3d6b5a;
      margin: 0 0 8px;
    }

    #${OVERLAY_ID} .slowcial-panel-title {
      margin: 0 0 8px;
      font-size: 22px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    #${OVERLAY_ID} .slowcial-panel-copy {
      margin: 0 0 16px;
      font-size: 14px;
      line-height: 1.45;
      color: rgba(30, 30, 28, 0.62);
    }

    #${OVERLAY_ID} .slowcial-motivation-hero {
      margin: 0 0 14px;
      padding: 14px 14px 12px;
      border-radius: 14px;
      background: rgba(61, 107, 90, 0.10);
      border: 1px solid rgba(61, 107, 90, 0.16);
      font-size: 16px;
      line-height: 1.4;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    #${OVERLAY_ID} .slowcial-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    #${OVERLAY_ID} .slowcial-field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }

    #${OVERLAY_ID} label {
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: rgba(30, 30, 28, 0.55);
    }

    #${OVERLAY_ID} input,
    #${OVERLAY_ID} textarea,
    #${OVERLAY_ID} select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(60, 60, 56, 0.14);
      border-radius: 12px;
      background: #fff;
      color: rgba(30, 30, 28, 0.92);
      font: inherit;
      font-size: 14px;
      padding: 10px 12px;
    }

    #${OVERLAY_ID} textarea {
      min-height: 72px;
      resize: vertical;
      line-height: 1.4;
    }

    #${OVERLAY_ID} input:focus,
    #${OVERLAY_ID} textarea:focus,
    #${OVERLAY_ID} select:focus {
      outline: 2px solid #3d6b5a;
      outline-offset: 1px;
    }

    #${OVERLAY_ID} .slowcial-error {
      margin: -4px 0 12px;
      font-size: 12px;
      color: #8a3b32;
      min-height: 16px;
    }

    #${OVERLAY_ID} .slowcial-progress-line {
      margin: 0 0 16px;
      font-size: 13px;
      color: rgba(30, 30, 28, 0.58);
    }

    #${OVERLAY_ID} .slowcial-panel-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 4px;
    }

    #${OVERLAY_ID} .slowcial-btn {
      appearance: none;
      border: 0;
      border-radius: 12px;
      padding: 10px 14px;
      font: inherit;
      font-size: 13px;
      font-weight: 650;
      cursor: pointer;
    }

    #${OVERLAY_ID} .slowcial-btn-primary {
      background: #3d6b5a;
      color: #f7f8f6;
    }

    #${OVERLAY_ID} .slowcial-btn-primary:hover {
      background: #355f50;
    }

    #${OVERLAY_ID} .slowcial-btn-secondary {
      background: rgba(30, 30, 28, 0.06);
      color: rgba(30, 30, 28, 0.78);
    }

    #${OVERLAY_ID} .slowcial-btn-secondary:hover {
      background: rgba(30, 30, 28, 0.10);
    }

    @media (max-width: 640px) {
      #${WIDGET_ID} {
        right: 12px;
        bottom: 12px;
        width: 210px;
      }

      #${OVERLAY_ID} .slowcial-field-row {
        grid-template-columns: 1fr;
      }
    }
  `;
}

async function getSettings() {
  return browser.storage.sync.get(DEFAULTS);
}

async function getSessionIntent() {
  try {
    const result = await browser.storage.local.get("sessionIntent");
    return result.sessionIntent || null;
  } catch (error) {
    console.error("Slowcial: session read failed", error);
    return sessionIntent;
  }
}

async function setSessionIntent(intent) {
  sessionIntent = intent;
  try {
    await browser.storage.local.set({ sessionIntent: intent });
  } catch (error) {
    console.error("Slowcial: session write failed", error);
  }
}

async function clearSessionIntent() {
  sessionIntent = null;
  viewedCount = 0;
  activeMs = 0;
  runningSince = null;
  viewedArticles = new WeakSet();
  pendingBoundArticle = null;
  forcePostBound = false;
  unmuteFeedMedia();
  try {
    await browser.storage.local.remove("sessionIntent");
  } catch (error) {
    console.error("Slowcial: session clear failed", error);
  }
}

function hydrateFromIntent(intent) {
  sessionIntent = intent;
  viewedCount = intent?.viewedCount || 0;
  activeMs = intent?.activeMs || 0;
  runningSince = intent?.runningSince ?? null;
  viewedArticles = new WeakSet();
  pendingBoundArticle = null;
  forcePostBound = false;

  for (const article of getFeedArticles()) {
    if (article.getAttribute(VIEWED_ATTR) === "1") {
      viewedArticles.add(article);
    }
  }

  // After refresh: recover "waiting for Nth post to leave focus" if needed.
  if (
    intent &&
    !intent.boundHitShown &&
    intent.targetPosts != null &&
    viewedCount >= intent.targetPosts
  ) {
    const centered = getCurrentCenteredArticle();
    if (
      viewedCount === intent.targetPosts &&
      centered &&
      viewedArticles.has(centered) &&
      isArticleInFocus(centered)
    ) {
      pendingBoundArticle = centered;
    } else {
      forcePostBound = true;
    }
  }
}

function getActiveMs() {
  if (runningSince == null) return activeMs;
  return activeMs + Math.max(0, Date.now() - runningSince);
}

function schedulePersistClock() {
  if (persistClockTimer) return;
  persistClockTimer = setTimeout(() => {
    persistClockTimer = null;
    persistClockState().catch(() => {});
  }, 400);
}

async function persistClockState() {
  if (!sessionIntent) return;
  await setSessionIntent({
    ...sessionIntent,
    activeMs,
    runningSince,
    viewedCount
  });
}

async function persistIntentPatch(patch) {
  if (!sessionIntent) return;
  await setSessionIntent({
    ...sessionIntent,
    ...patch,
    activeMs,
    runningSince,
    viewedCount
  });
}

function isTabActive() {
  return document.visibilityState === "visible" && document.hasFocus();
}

function pauseActiveClock() {
  if (runningSince == null) return;
  activeMs += Math.max(0, Date.now() - runningSince);
  runningSince = null;
  schedulePersistClock();
}

function resumeActiveClock() {
  if (!sessionIntent) return;
  if (runningSince != null) return;
  if (!isTabActive()) return;
  runningSince = Date.now();
  schedulePersistClock();
}

function syncClockToFocus() {
  if (!sessionIntent) return;
  if (isTabActive()) resumeActiveClock();
  else pauseActiveClock();
}

function upsertStyle(cssText) {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
  }
  style.textContent = cssText;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function formatProgressPosts() {
  if (!sessionIntent?.targetPosts) return String(viewedCount);
  return `${viewedCount} / ${sessionIntent.targetPosts}`;
}

function formatProgressTime() {
  const elapsed = formatDuration(getActiveMs());
  if (!sessionIntent?.targetMinutes) return elapsed;
  return `${elapsed} / ${sessionIntent.targetMinutes}m`;
}

function truncateMotivation(text, max = 72) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function progressSummaryText() {
  const parts = [];
  if (sessionIntent?.targetPosts) {
    parts.push(`${viewedCount} / ${sessionIntent.targetPosts} posts`);
  } else {
    parts.push(`${viewedCount} posts`);
  }
  if (sessionIntent?.targetMinutes) {
    parts.push(`${formatDuration(getActiveMs())} / ${sessionIntent.targetMinutes}m`);
  } else {
    parts.push(formatDuration(getActiveMs()));
  }
  return parts.join(" · ");
}

function removeOverlay() {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) existing.remove();
  activeOverlay = "none";
}

function ensureOverlayRoot() {
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    document.body.appendChild(overlay);
  }
  return overlay;
}

async function showSetupOverlay() {
  activeOverlay = "setup";
  const settings = await getSettings();
  const defaults = settings.intentDefaults || DEFAULTS.intentDefaults;
  const overlay = ensureOverlayRoot();

  overlay.innerHTML = `
    <div class="slowcial-panel" role="dialog" aria-modal="true" aria-labelledby="slowcial-setup-title">
      <p class="slowcial-panel-kicker">Slowcial</p>
      <h2 class="slowcial-panel-title" id="slowcial-setup-title">Set this session</h2>
      <p class="slowcial-panel-copy">Name a reason outside the feed, then pick a soft bound. Breaks will remind you.</p>

      <div class="slowcial-field">
        <label for="slowcial-motivation">Motivation</label>
        <textarea id="slowcial-motivation" maxlength="${MOTIVATION_MAX}" placeholder="What else matters right now?"></textarea>
      </div>

      <div class="slowcial-field-row">
        <div class="slowcial-field">
          <label for="slowcial-target-posts">Target posts</label>
          <input id="slowcial-target-posts" type="number" min="1" max="500" step="1" value="${defaults.targetPosts ?? ""}" placeholder="e.g. 20">
        </div>
        <div class="slowcial-field">
          <label for="slowcial-target-minutes">Max minutes</label>
          <input id="slowcial-target-minutes" type="number" min="1" max="240" step="1" value="${defaults.targetMinutes ?? ""}" placeholder="e.g. 15">
        </div>
      </div>

      <div class="slowcial-field">
        <label for="slowcial-break-every">Break every</label>
        <select id="slowcial-break-every">
          <option value="">Off</option>
          <option value="3">3 posts</option>
          <option value="5">5 posts</option>
          <option value="10">10 posts</option>
        </select>
      </div>

      <p class="slowcial-error" id="slowcial-setup-error"></p>

      <div class="slowcial-panel-actions">
        <button type="button" class="slowcial-btn slowcial-btn-primary" id="slowcial-start-session">Start session</button>
      </div>
    </div>
  `;

  const breakSelect = overlay.querySelector("#slowcial-break-every");
  if (breakSelect && defaults.breakEvery) {
    breakSelect.value = String(defaults.breakEvery);
  }

  overlay.querySelector("#slowcial-start-session").addEventListener("click", () => {
    startSessionFromForm().catch(console.error);
  });

  overlay.querySelector("#slowcial-motivation")?.focus();
}

function parseOptionalPositiveInt(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) return null;
  return Math.floor(num);
}

async function startSessionFromForm() {
  const motivationEl = document.getElementById("slowcial-motivation");
  const postsEl = document.getElementById("slowcial-target-posts");
  const minutesEl = document.getElementById("slowcial-target-minutes");
  const breakEl = document.getElementById("slowcial-break-every");
  const errorEl = document.getElementById("slowcial-setup-error");

  const motivation = String(motivationEl?.value || "").trim();
  const targetPosts = parseOptionalPositiveInt(postsEl?.value);
  const targetMinutes = parseOptionalPositiveInt(minutesEl?.value);
  const breakRaw = String(breakEl?.value || "").trim();
  const breakEvery = breakRaw ? parseOptionalPositiveInt(breakRaw) : null;

  if (!motivation) {
    if (errorEl) errorEl.textContent = "Add a short motivation to start.";
    motivationEl?.focus();
    return;
  }

  if (motivation.length > MOTIVATION_MAX) {
    if (errorEl) errorEl.textContent = `Keep motivation under ${MOTIVATION_MAX} characters.`;
    return;
  }

  if (!targetPosts && !targetMinutes) {
    if (errorEl) errorEl.textContent = "Set a post target, a time limit, or both.";
    return;
  }

  viewedArticles = new WeakSet();
  viewedCount = 0;
  activeMs = 0;
  runningSince = isTabActive() ? Date.now() : null;
  pendingBoundArticle = null;
  forcePostBound = false;
  unmuteFeedMedia();

  await setSessionIntent({
    motivation,
    targetPosts,
    targetMinutes,
    breakEvery,
    startedAt: Date.now(),
    activeMs: 0,
    runningSince,
    viewedCount: 0,
    lastBreakAt: 0,
    boundHitShown: false
  });

  await browser.storage.sync.set({
    intentDefaults: {
      targetPosts: targetPosts ?? DEFAULTS.intentDefaults.targetPosts,
      targetMinutes: targetMinutes ?? DEFAULTS.intentDefaults.targetMinutes,
      breakEvery: breakEvery ?? DEFAULTS.intentDefaults.breakEvery
    }
  });

  removeOverlay();
  await createOrUpdateWidget();
  startFeedScanning();
  startTimer();
}

function showBrakeOverlay() {
  if (!sessionIntent) return;
  activeOverlay = "brake";
  const overlay = ensureOverlayRoot();

  overlay.innerHTML = `
    <div class="slowcial-panel" role="dialog" aria-modal="true" aria-labelledby="slowcial-brake-title">
      <p class="slowcial-panel-kicker">Break</p>
      <h2 class="slowcial-panel-title" id="slowcial-brake-title">Pause a second</h2>
      <p class="slowcial-motivation-hero">${escapeHtml(sessionIntent.motivation)}</p>
      <p class="slowcial-progress-line">${escapeHtml(progressSummaryText())}</p>
      <div class="slowcial-panel-actions">
        <button type="button" class="slowcial-btn slowcial-btn-primary" id="slowcial-brake-continue">Continue</button>
      </div>
    </div>
  `;

  overlay.querySelector("#slowcial-brake-continue").addEventListener("click", () => {
    dismissBrake().catch(console.error);
  });
}

async function dismissBrake() {
  await persistIntentPatch({ lastBreakAt: viewedCount });
  removeOverlay();
}

function muteFeedMedia() {
  feedMutedByBound = true;
  for (const el of document.querySelectorAll("video, audio")) {
    el.muted = true;
    try {
      el.volume = 0;
    } catch {
      // ignore read-only volume edge cases
    }
  }

  if (feedMuteObserver) return;
  feedMuteObserver = new MutationObserver(() => {
    if (!feedMutedByBound) return;
    for (const el of document.querySelectorAll("video, audio")) {
      el.muted = true;
      try {
        el.volume = 0;
      } catch {
        // ignore
      }
    }
  });
  feedMuteObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function unmuteFeedMedia() {
  feedMutedByBound = false;
  if (feedMuteObserver) {
    feedMuteObserver.disconnect();
    feedMuteObserver = null;
  }
  for (const el of document.querySelectorAll("video, audio")) {
    // Leave muted=false; IG may remute for autoplay policies.
    try {
      if (el.volume === 0) el.volume = 1;
    } catch {
      // ignore
    }
    el.muted = false;
  }
}

function isArticleInFocus(article) {
  if (!article || !article.isConnected) return false;
  const rect = article.getBoundingClientRect();
  const center = window.innerHeight / 2;
  return rect.top <= center && rect.bottom >= center;
}

function showBoundOverlay() {
  if (!sessionIntent) return;
  activeOverlay = "bound";
  muteFeedMedia();
  const overlay = ensureOverlayRoot();

  overlay.innerHTML = `
    <div class="slowcial-panel" role="dialog" aria-modal="true" aria-labelledby="slowcial-bound-title">
      <p class="slowcial-panel-kicker">Bound reached</p>
      <h2 class="slowcial-panel-title" id="slowcial-bound-title">You hit your limit</h2>
      <p class="slowcial-motivation-hero">${escapeHtml(sessionIntent.motivation)}</p>
      <p class="slowcial-progress-line">${escapeHtml(progressSummaryText())}</p>
      <p class="slowcial-panel-copy">Extend for a little more, or end the session. <strong>End session closes this tab.</strong></p>
      <div class="slowcial-panel-actions">
        <button type="button" class="slowcial-btn slowcial-btn-secondary" id="slowcial-bound-end">End session</button>
        <button type="button" class="slowcial-btn slowcial-btn-primary" id="slowcial-bound-extend">Extend</button>
      </div>
    </div>
  `;

  overlay.querySelector("#slowcial-bound-end").addEventListener("click", () => {
    endSession({ closeTab: true }).catch(console.error);
  });
  overlay.querySelector("#slowcial-bound-extend").addEventListener("click", () => {
    extendSession().catch(console.error);
  });
}

async function extendSession() {
  if (!sessionIntent) return;

  const patch = { boundHitShown: false };
  if (sessionIntent.targetPosts != null && viewedCount >= sessionIntent.targetPosts) {
    patch.targetPosts = sessionIntent.targetPosts + 10;
  }
  if (
    sessionIntent.targetMinutes != null &&
    getActiveMs() >= sessionIntent.targetMinutes * 60 * 1000
  ) {
    patch.targetMinutes = sessionIntent.targetMinutes + 5;
  }

  if (patch.targetPosts == null && patch.targetMinutes == null) {
    if (sessionIntent.targetPosts != null) patch.targetPosts = sessionIntent.targetPosts + 10;
    if (sessionIntent.targetMinutes != null) {
      patch.targetMinutes = sessionIntent.targetMinutes + 5;
    }
  }

  pendingBoundArticle = null;
  forcePostBound = false;
  await persistIntentPatch(patch);
  unmuteFeedMedia();
  removeOverlay();
  updateWidgetValues();
}

async function endSession({ closeTab = false } = {}) {
  pauseActiveClock();
  unmuteFeedMedia();
  pendingBoundArticle = null;
  forcePostBound = false;
  removeOverlay();
  await clearSessionIntent();

  const widget = document.getElementById(WIDGET_ID);
  if (widget) widget.remove();

  if (closeTab) {
    try {
      await browser.runtime.sendMessage({ type: "closeActiveTab" });
    } catch (error) {
      console.error("Slowcial: failed to close tab", error);
      const settings = await getSettings();
      if (settings.enabled) await showSetupOverlay();
    }
    return;
  }

  const settings = await getSettings();
  if (settings.enabled) {
    await showSetupOverlay();
  }
}

function maybeShowBrake() {
  if (!sessionIntent?.breakEvery) return;
  if (activeOverlay !== "none") return;
  if (viewedCount <= 0) return;
  if (viewedCount % sessionIntent.breakEvery !== 0) return;
  if (viewedCount === sessionIntent.lastBreakAt) return;
  // Don't steal the gap between target post and the next one.
  if (
    sessionIntent.targetPosts != null &&
    viewedCount === sessionIntent.targetPosts
  ) {
    return;
  }
  showBrakeOverlay();
}

function maybeShowBoundHit() {
  if (!sessionIntent) return;
  if (sessionIntent.boundHitShown) return;
  if (activeOverlay === "setup" || activeOverlay === "brake") return;

  const timeHit =
    sessionIntent.targetMinutes != null &&
    getActiveMs() >= sessionIntent.targetMinutes * 60 * 1000;

  let postsHit = false;
  if (sessionIntent.targetPosts != null) {
    if (forcePostBound || viewedCount > sessionIntent.targetPosts) {
      // Past the target post (or recovered after refresh already past it).
      postsHit = true;
    } else if (
      viewedCount >= sessionIntent.targetPosts &&
      pendingBoundArticle &&
      !isArticleInFocus(pendingBoundArticle)
    ) {
      // Nth post left viewport center — gap before N+1.
      postsHit = true;
    }
  }

  if (!postsHit && !timeHit) return;

  forcePostBound = false;
  pendingBoundArticle = null;
  persistIntentPatch({ boundHitShown: true }).catch(() => {});
  showBoundOverlay();
}

async function createOrUpdateWidget() {
  if (!sessionIntent) return;

  const settings = await getSettings();
  let widget = document.getElementById(WIDGET_ID);

  if (!widget) {
    widget = document.createElement("div");
    widget.id = WIDGET_ID;
    widget.innerHTML = `
      <div class="slowcial-card">
        <div class="slowcial-topbar">
          <div class="slowcial-titlewrap">
            <div class="slowcial-title">Slowcial</div>
            <div class="slowcial-subtitle">session</div>
          </div>
          <div class="slowcial-actions">
            <button class="slowcial-iconbtn" id="slowcial-minimize-btn" type="button" aria-label="Minimize" title="Minimize">
              <svg id="slowcial-minimize-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="slowcial-grid">
          <div class="slowcial-stat">
            <div class="slowcial-label">Posts viewed</div>
            <div class="slowcial-value" id="slowcial-viewed-count">0</div>
          </div>
          <div class="slowcial-stat">
            <div class="slowcial-label">Session time</div>
            <div class="slowcial-value" id="slowcial-session-time">0m 00s</div>
          </div>
        </div>
        <div class="slowcial-footer" id="slowcial-motivation-footer"></div>
        <button type="button" class="slowcial-endbtn" id="slowcial-end-session">End session</button>
      </div>
    `;
    document.body.appendChild(widget);

    widget.querySelector("#slowcial-minimize-btn").addEventListener("click", async () => {
      const next = !widget.classList.contains("slowcial-minimized");
      widget.classList.toggle("slowcial-minimized", next);
      updateMinimizeIcon(widget, next);
      await browser.storage.sync.set({ counterMinimized: next });
    });

    widget.querySelector("#slowcial-end-session").addEventListener("click", () => {
      endSession().catch(console.error);
    });
  }

  widget.classList.toggle("slowcial-minimized", !!settings.counterMinimized);
  updateMinimizeIcon(widget, !!settings.counterMinimized);
  updateWidgetValues();
}

function updateMinimizeIcon(widget, minimized) {
  const icon = widget.querySelector("#slowcial-minimize-icon");
  const btn = widget.querySelector("#slowcial-minimize-btn");
  if (!icon || !btn) return;

  if (minimized) {
    icon.innerHTML = `<path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`;
    btn.setAttribute("aria-label", "Expand");
    btn.setAttribute("title", "Expand");
  } else {
    icon.innerHTML = `<path d="M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`;
    btn.setAttribute("aria-label", "Minimize");
    btn.setAttribute("title", "Minimize");
  }
}

function updateWidgetValues() {
  const viewedEl = document.getElementById("slowcial-viewed-count");
  const timeEl = document.getElementById("slowcial-session-time");
  const footerEl = document.getElementById("slowcial-motivation-footer");

  if (viewedEl) viewedEl.textContent = formatProgressPosts();
  if (timeEl) timeEl.textContent = formatProgressTime();
  if (footerEl) {
    footerEl.textContent = sessionIntent
      ? truncateMotivation(sessionIntent.motivation)
      : "Viewport gaps between posts.";
  }
}

function getFeedArticles() {
  const scoped = document.querySelectorAll("main article");
  if (scoped.length > 0) return Array.from(scoped);
  return Array.from(document.querySelectorAll("article"));
}

function getCurrentCenteredArticle() {
  const articles = getFeedArticles();
  if (articles.length === 0) return null;

  const viewportCenter = window.innerHeight / 2;
  let bestArticle = null;
  let bestDistance = Infinity;

  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;

    if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
      return article;
    }

    const articleCenter = rect.top + rect.height / 2;
    const distance = Math.abs(articleCenter - viewportCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestArticle = article;
    }
  }

  return bestArticle;
}

function countCurrentArticle() {
  if (!sessionIntent) return;
  if (activeOverlay === "setup") return;

  const article = getCurrentCenteredArticle();

  // Bound check runs even when the centered article was already counted,
  // so we can fire after the Nth post leaves focus (before N+1).
  if (article && !viewedArticles.has(article) && activeOverlay === "none") {
    viewedArticles.add(article);
    article.setAttribute(VIEWED_ATTR, "1");
    viewedCount += 1;

    if (
      sessionIntent.targetPosts != null &&
      viewedCount === sessionIntent.targetPosts
    ) {
      pendingBoundArticle = article;
    }

    schedulePersistClock();
    updateWidgetValues();
    maybeShowBrake();
  }

  maybeShowBoundHit();
}

function startFeedScanning() {
  if (feedScanInterval) clearInterval(feedScanInterval);

  countCurrentArticle();

  if (!scanListenersAttached) {
    let ticking = false;
    const onMove = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        countCurrentArticle();
        ticking = false;
      });
    };
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove, { passive: true });
    scanListenersAttached = true;
  }

  feedScanInterval = setInterval(() => {
    countCurrentArticle();
  }, 1200);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  updateWidgetValues();
  timerInterval = setInterval(() => {
    updateWidgetValues();
    maybeShowBoundHit();
  }, 1000);
}

function attachFocusListeners() {
  if (focusListenersAttached) return;

  const onFocusChange = () => {
    syncClockToFocus();
    updateWidgetValues();
    maybeShowBoundHit();
  };

  document.addEventListener("visibilitychange", onFocusChange);
  window.addEventListener("focus", onFocusChange);
  window.addEventListener("blur", onFocusChange);
  focusListenersAttached = true;
}

function restoreActiveOverlay() {
  if (activeOverlay === "setup") {
    showSetupOverlay().catch(() => {});
    return;
  }
  if (activeOverlay === "brake") {
    showBrakeOverlay();
    return;
  }
  if (activeOverlay === "bound") {
    showBoundOverlay();
  }
}

async function apply() {
  const settings = await getSettings();
  upsertStyle(buildCss(settings));

  if (!settings.enabled) {
    removeOverlay();
    document.getElementById(WIDGET_ID)?.remove();
    return;
  }

  const intent = await getSessionIntent();
  if (!intent) {
    document.getElementById(WIDGET_ID)?.remove();
    await showSetupOverlay();
    return;
  }

  hydrateFromIntent(intent);
  syncClockToFocus();
  await createOrUpdateWidget();

  if (intent.boundHitShown) {
    showBoundOverlay();
  } else if (activeOverlay !== "none") {
    restoreActiveOverlay();
  } else {
    maybeShowBoundHit();
  }
}

function watchForWidgetRemoval() {
  if (removeWatchObserver) return;

  removeWatchObserver = new MutationObserver(() => {
    const style = document.getElementById(STYLE_ID);
    const widget = document.getElementById(WIDGET_ID);
    const overlay = document.getElementById(OVERLAY_ID);

    const needsStyle = !style;
    const needsWidget = !!sessionIntent && activeOverlay !== "setup" && !widget;
    const needsOverlay = activeOverlay !== "none" && !overlay;

    if (needsStyle || needsWidget || needsOverlay) {
      apply().catch(() => {});
    }
  });

  removeWatchObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function listenForSettingChanges() {
  if (settingsListenerAttached) return;

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
      // Gap updates must stay snappy and independent of session/widget work.
      if (changes.gapMode || changes.scopeToMain || changes.enabled) {
        getSettings()
          .then((settings) => {
            upsertStyle(buildCss(settings));
          })
          .catch(() => {});
      }

      if (
        changes.enabled ||
        changes.gapMode ||
        changes.scopeToMain ||
        changes.counterMinimized
      ) {
        apply()
          .then(async () => {
            const settings = await getSettings();
            if (settings.enabled && sessionIntent) {
              startFeedScanning();
              startTimer();
              syncClockToFocus();
            }
          })
          .catch((error) => {
            console.error("Slowcial: apply after settings change failed", error);
          });
      }
    }

    if (areaName === "local" && changes.sessionIntent) {
      const next = changes.sessionIntent.newValue || null;
      if (!next) return;
      hydrateFromIntent(next);
      updateWidgetValues();
    }
  });

  settingsListenerAttached = true;
}

async function init() {
  // Listeners first so a session-storage failure can't brick gap updates.
  attachFocusListeners();
  listenForSettingChanges();
  watchForWidgetRemoval();

  await apply();

  const settings = await getSettings();
  if (settings.enabled && sessionIntent) {
    startFeedScanning();
    startTimer();
    syncClockToFocus();
  }
}

init().catch(console.error);
