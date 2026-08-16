const DEFAULTS = {
    enabled: true,
    gapMode: "1",
    scopeToMain: true,
    counterMinimized: false
  };
  
  const STYLE_ID = "slowcial-style";
  const WIDGET_ID = "slowcial-session-widget";
  const VIEWED_ATTR = "data-slowcial-viewed";
  
  let sessionStart = Date.now();
  let viewedCount = 0;
  let viewedArticles = new WeakSet();
  let feedScanInterval = null;
  let timerInterval = null;
  let removeWatchObserver = null;
  let settingsChangeListenerAttached = false;
  let scanListenersAttached = false;
  
  function buildCss({ enabled, gapMode, scopeToMain }) {
    const allowed = new Set(["1", "1.5", "2"]);
    const mode = allowed.has(String(gapMode)) ? String(gapMode) : "1";
    const gap = (Number(mode) * 100) + "vh";
  
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
        z-index: 2147483647;
        width: 220px;
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
  
      #${WIDGET_ID}.slowcial-hidden {
        opacity: 0;
        transform: translateY(8px);
        pointer-events: none;
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
        font-size: 22px;
        line-height: 1;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
  
      .slowcial-footer {
        font-size: 11px;
        line-height: 1.3;
        color: rgba(30, 30, 28, 0.52);
        padding-top: 2px;
      }
  
      .slowcial-minimized .slowcial-titlewrap,
      .slowcial-minimized .slowcial-grid,
      .slowcial-minimized .slowcial-footer {
        display: none;
      }
  
      .slowcial-minimized .slowcial-actions {
        width: 100%;
        justify-content: center;
      }
  
      @media (max-width: 640px) {
        #${WIDGET_ID} {
          right: 12px;
          bottom: 12px;
          width: 200px;
        }
      }
    `;
  }
  
  async function getSettings() {
    return browser.storage.sync.get(DEFAULTS);
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
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    }
  
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }
  
  async function setMinimizedState(minimized) {
    await browser.storage.sync.set({ counterMinimized: minimized });
  }
  
  async function createOrUpdateWidget() {
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
              <button
                class="slowcial-iconbtn"
                id="slowcial-minimize-btn"
                type="button"
                aria-label="Minimize session counter"
                title="Minimize"
              >
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
  
          <div class="slowcial-footer">
            Viewport gaps between posts.
          </div>
        </div>
      `;
  
      document.body.appendChild(widget);
  
      const minimizeBtn = widget.querySelector("#slowcial-minimize-btn");
      if (minimizeBtn) {
        minimizeBtn.addEventListener("click", async () => {
          const nextMinimized = !widget.classList.contains("slowcial-minimized");
          widget.classList.toggle("slowcial-minimized", nextMinimized);
          updateMinimizeIcon(widget, nextMinimized);
          await setMinimizedState(nextMinimized);
        });
      }
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
      btn.setAttribute("aria-label", "Expand session counter");
      btn.setAttribute("title", "Expand");
    } else {
      icon.innerHTML = `<path d="M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`;
      btn.setAttribute("aria-label", "Minimize session counter");
      btn.setAttribute("title", "Minimize");
    }
  }
  
  function updateWidgetValues() {
    const viewedEl = document.getElementById("slowcial-viewed-count");
    const timeEl = document.getElementById("slowcial-session-time");
  
    if (viewedEl) {
      viewedEl.textContent = String(viewedCount);
    }
  
    if (timeEl) {
      timeEl.textContent = formatDuration(Date.now() - sessionStart);
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
  
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        continue;
      }
  
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
    const article = getCurrentCenteredArticle();
    if (!article) return;
  
    if (viewedArticles.has(article)) return;
  
    viewedArticles.add(article);
    article.setAttribute(VIEWED_ATTR, "1");
    viewedCount += 1;
    updateWidgetValues();
  }
  
  function startFeedScanning() {
    if (feedScanInterval) {
      clearInterval(feedScanInterval);
    }
  
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
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  
    updateWidgetValues();
  
    timerInterval = setInterval(() => {
      updateWidgetValues();
    }, 1000);
  }
  
  async function apply() {
    const settings = await getSettings();
    const css = buildCss(settings);
    upsertStyle(css);
    await createOrUpdateWidget();
  }
  
  function watchForWidgetRemoval() {
    if (removeWatchObserver) return;
  
    removeWatchObserver = new MutationObserver(() => {
      const widget = document.getElementById(WIDGET_ID);
      const style = document.getElementById(STYLE_ID);
  
      if (!widget || !style) {
        apply().catch(() => {});
      }
    });
  
    removeWatchObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  
  function listenForSettingChanges() {
    if (settingsChangeListenerAttached) return;
  
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") return;
  
      if (
        changes.enabled ||
        changes.gapMode ||
        changes.scopeToMain ||
        changes.counterMinimized
      ) {
        apply().catch(() => {});
      }
    });
  
    settingsChangeListenerAttached = true;
  }
  
  async function init() {
    await apply();
    startFeedScanning();
    startTimer();
    watchForWidgetRemoval();
    listenForSettingChanges();
  }
  
  init().catch(console.error);