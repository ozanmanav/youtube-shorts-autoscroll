// Toolbar icon: click to toggle auto scroll, badge shows the current state.

async function getEnabled() {
  const { enabled } = await chrome.storage.local.get({ enabled: true });
  return enabled;
}

function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? "#cc0000" : "#555555" });
  chrome.action.setTitle({ title: `Shorts Auto Scroll: ${enabled ? "ON" : "OFF"} (click to toggle)` });
}

chrome.action.onClicked.addListener(async () => {
  await chrome.storage.local.set({ enabled: !(await getEnabled()) });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.enabled) updateBadge(changes.enabled.newValue);
});

chrome.runtime.onStartup.addListener(async () => updateBadge(await getEnabled()));
chrome.runtime.onInstalled.addListener(async () => updateBadge(await getEnabled()));
