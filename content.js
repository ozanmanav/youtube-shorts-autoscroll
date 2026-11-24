// YouTube Shorts Auto Scroll
// Shorts videoları loop'ta oynar, "ended" event'i gelmez.
// Bu yüzden aktif videoyu izleyip sona yaklaşınca sonraki Short'a geçiyoruz.

let enabled = true;
let lastSkippedSrc = null;

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
  // Yedek yol: klavyede aşağı ok
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", keyCode: 40, bubbles: true })
  );
}

setInterval(() => {
  if (!enabled || !isShortsPage()) return;
  const video = getActiveVideo();
  if (!video || !video.duration || video.paused) return;

  const id = location.pathname;
  if (video.currentTime >= video.duration - 0.4 && lastSkippedSrc !== id) {
    lastSkippedSrc = id;
    goNext();
  }
}, 250);

// Sayfada küçük açma/kapama butonu
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

// YouTube SPA, sayfa değişince butonu göster/gizle
document.addEventListener("yt-navigate-finish", renderButton);
