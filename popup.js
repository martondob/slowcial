const DEFAULTS = {
    enabled: true,
    gapMode: "1",
    scopeToMain: true
  };
  
  async function init() {
  
    const s = await browser.storage.sync.get(DEFAULTS);
  
    document.getElementById("enabled").checked = s.enabled;
    document.getElementById("gapMode").value = s.gapMode;
  
    document.getElementById("enabled").onchange = e => {
      browser.storage.sync.set({ enabled: e.target.checked });
    };
  
    document.getElementById("gapMode").onchange = e => {
      browser.storage.sync.set({ gapMode: e.target.value });
    };
  }
  
  init();