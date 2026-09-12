const SESSION_KEY = "sessionIntent";

// Approximate session storage: clear active intent when the browser starts.
// (storage.session is not reliably available to content scripts in Firefox.)
async function clearActiveSession() {
  try {
    await browser.storage.local.remove(SESSION_KEY);
  } catch (error) {
    console.error("Slowcial: failed to clear session intent", error);
  }
}

browser.runtime.onStartup.addListener(() => {
  clearActiveSession();
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "closeActiveTab") return;
  const tabId = sender.tab?.id;
  if (tabId == null) return;
  browser.tabs.remove(tabId).catch((error) => {
    console.error("Slowcial: tabs.remove failed", error);
  });
});
