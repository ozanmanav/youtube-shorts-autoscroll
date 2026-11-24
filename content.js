// YouTube Shorts Auto Scroll
// Shorts loop forever, so the video "ended" event never fires.
// Instead we watch the active video and move to the next Short right before it ends.

const END_THRESHOLD_SECONDS = 0.4;
const POLL_INTERVAL_MS = 250;

let enabled = true;
let lastSkippedPath = null;

chrome.storage.local.get({ enabled: true }, (data) => {
  enabled = data.enabled;
  renderButton();
});

function isShortsPage() {
  return location.pathname.startsWith("/shorts/");
}

function getActiveVideo() {
  return (
    document.querySelector("ytd-reel-video-renderer[is-active] video") ||
    document.querySelector("#shorts-player video") ||
    document.querySelector("ytd-shorts video")
  );
}

function goNext() {
  const nextBtn = document.querySelector("#navigation-button-down button");
  if (nextBtn) {
    nextBtn.click();
    return;
  }
  // Fallback: simulate the ArrowDown key
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", keyCode: 40, bubbles: true })
  );
}

setInterval(() => {
  if (!enabled || !isShortsPage()) return;
  const video = getActiveVideo();
  if (!video || !video.duration || video.paused) return;

  const path = location.pathname;
  if (video.currentTime >= video.duration - END_THRESHOLD_SECONDS && lastSkippedPath !== path) {
    lastSkippedPath = path;
    goNext();
  }
}, POLL_INTERVAL_MS);

// Small on-page toggle button
function renderButton() {
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
    btn.addEventListener("click", () => {
      enabled = !enabled;
      chrome.storage.local.set({ enabled });
      renderButton();
    });
    document.body.appendChild(btn);
  }
  btn.textContent = enabled ? "Auto Scroll: ON" : "Auto Scroll: OFF";
  btn.style.background = enabled ? "#cc0000" : "#555";
  btn.style.display = isShortsPage() ? "block" : "none";
}

// YouTube is a SPA: show/hide the button on every in-app navigation
document.addEventListener("yt-navigate-finish", renderButton);
