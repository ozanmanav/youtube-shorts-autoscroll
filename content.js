// YouTube Shorts Auto Scroll: extension-world part.
// Owns the saved on/off state, the on-page button and the keyboard shortcut.
// The actual scrolling happens in main.js, which reads the state from a data attribute.

let enabled = true;

chrome.storage.local.get({ enabled: true }, (data) => {
  enabled = data.enabled;
  renderButton();
});

// Keep every open tab in sync when the setting changes anywhere
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.enabled) return;
  enabled = changes.enabled.newValue;
  renderButton();
});

function isShortsPage() {
  return location.pathname.startsWith("/shorts/");
}

function toggle() {
  chrome.storage.local.set({ enabled: !enabled });
}

// Keyboard shortcut: Alt+S toggles auto scroll (ignored while typing)
document.addEventListener("keydown", (e) => {
  if (!isShortsPage() || !e.altKey || e.code !== "KeyS") return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName))) return;
  e.preventDefault();
  toggle();
});

// Small on-page toggle button
function renderButton() {
  document.documentElement.dataset.shortsAutoscroll = enabled ? "on" : "off";
  let btn = document.getElementById("shorts-autoscroll-toggle");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "shorts-autoscroll-toggle";
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 9999,
      padding: "8px 12px",
      border: "none",
      borderRadius: "20px",
      color: "#fff",
      fontSize: "14px",
      cursor: "pointer",
    });
    btn.title = "Toggle auto scroll (Alt+S)";
    btn.addEventListener("click", toggle);
    document.body.appendChild(btn);
  }
  btn.textContent = enabled ? "Auto Scroll: ON" : "Auto Scroll: OFF";
  btn.style.background = enabled ? "#cc0000" : "#555";
  btn.style.display = isShortsPage() ? "block" : "none";
}

// YouTube is a SPA: show/hide the button on every in-app navigation
document.addEventListener("yt-navigate-finish", renderButton);
