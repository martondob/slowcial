const DEFAULTS = {
    enabled: true,
    gapMode: "1",
    scopeToMain: true
  };
  
  function buildCss({ enabled, gapMode, scopeToMain }) {
    if (!enabled) return "";
  
    const allowed = new Set(["1", "1.5", "2"]);
    const mode = allowed.has(String(gapMode)) ? String(gapMode) : "1";
  
    const gap = (Number(mode) * 100) + "vh";
  
    const selector = scopeToMain
      ? "main article > div:first-child"
      : "article > div:first-child";
  
    return `${selector} { margin-bottom: ${gap} !important; }`;
  }
  
  async function apply() {
    const settings = await browser.storage.sync.get(DEFAULTS);
  
    const css = buildCss(settings);
  
    let style = document.getElementById("slowcial-style");
  
    if (!style) {
      style = document.createElement("style");
      style.id = "slowcial-style";
      document.head.appendChild(style);
    }
  
    style.textContent = css;
  }
  
  apply();
  
  browser.storage.onChanged.addListener(apply);