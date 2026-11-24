// YouTube Shorts Auto Scroll: page-world part.
//
// Runs in the page's own JavaScript world ("world": "MAIN") because it needs YouTube's
// internal Shorts sequence and its in-app navigation event, which an isolated content
// script cannot reach. The on/off state comes from content.js through a data attribute.
//
// Shorts loop forever, so the video "ended" event never fires. We listen to "timeupdate"
// instead: it keeps firing in background tabs, where timers are throttled.

(() => {
  const END_THRESHOLD_SECONDS = 0.4;
  let lastSkippedPath = null;
  let lastTime = 0;

  const isEnabled = () => document.documentElement.dataset.shortsAutoscroll === "on";
  const isShortsPage = () => location.pathname.startsWith("/shorts/");
  const currentVideoId = () => location.pathname.split("/")[2];

  // The next Short's navigation command from YouTube's own Shorts sequence.
  function nextShortCommand() {
    const shorts = document.querySelector("ytd-shorts");
    const sequence = shorts?.__data?.shortsProcessedSequence || shorts?.__data?.shortsSequence || [];
    const index = sequence.findIndex((e) => e?.command?.reelWatchEndpoint?.videoId === currentVideoId());
    return index >= 0 ? sequence[index + 1]?.command : null;
  }

  function goNext() {
    const nextButton = document.querySelector("#navigation-button-down button");

    // In a visible tab, use YouTube's own button so the usual scroll animation plays.
    if (!document.hidden && nextButton) {
      nextButton.click();
      return;
    }

    // In a background tab the button does nothing, because YouTube waits for a repaint
    // that never happens. Its in-app navigation event still works there.
    const command = nextShortCommand();
    if (command) {
      document.querySelector("ytd-shorts").dispatchEvent(
        new CustomEvent("yt-navigate", { bubbles: true, composed: true, detail: { endpoint: command } })
      );
      return;
    }

    nextButton?.click();
  }

  document.addEventListener(
    "timeupdate",
    (event) => {
      const video = event.target;
      if (!(video instanceof HTMLVideoElement) || !isEnabled() || !isShortsPage()) return;
      if (!video.duration || video.paused) return;

      const path = location.pathname;
      const nearEnd = video.currentTime >= video.duration - END_THRESHOLD_SECONDS;
      // Safety net: if we missed the last fraction of a second, catch the loop restart.
      const looped = lastTime > video.duration - 1.5 && video.currentTime < 1;
      lastTime = video.currentTime;

      if ((nearEnd || looped) && lastSkippedPath !== path) {
        lastSkippedPath = path;
        goNext();
      }
    },
    true
  );
})();
