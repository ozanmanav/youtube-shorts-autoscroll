<p align="center">
  <img src="icons/icon128.png" width="96" alt="YouTube Shorts Auto Scroll icon">
</p>

<h1 align="center">YouTube Shorts Auto Scroll</h1>

<p align="center">
  A tiny, privacy-friendly Chrome extension that moves to the next YouTube Short when the current one ends.<br>
  No tracking, no ads, no account. About 100 lines of plain JavaScript you can read in two minutes.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/manifest-v3-brightgreen.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/browser-Chrome%20%7C%20Edge%20%7C%20Brave-orange.svg" alt="Chromium browsers">
</p>

---

## Why

YouTube Shorts loop the same video forever. If you are cooking, working out or just want hands-free
watching, you have to keep swiping. This extension does the swipe for you, right as each Short ends.

## Features

- **Hands-free:** jumps to the next Short just before the current one finishes.
- **One-click toggle:** an ON/OFF button in the bottom-right corner of the Shorts page.
- **Keyboard shortcut:** `Alt + S` turns auto scroll on or off.
- **Remembers your choice** between sessions.
- **Respects you:** does nothing when the video is paused or the tab is in the background.
- **Private by design:** only runs on `youtube.com`, the only permission is `storage`, no network requests.

## Install

### Option 1: Download a release (easiest)

1. Open the [Releases](https://github.com/ozanmanav/youtube-shorts-autoscroll/releases) page and download the latest `.zip`.
2. Unzip it.
3. Go to `chrome://extensions` and turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.

### Option 2: From source

```bash
git clone https://github.com/ozanmanav/youtube-shorts-autoscroll.git
```

Then follow steps 3 and 4 above and select the cloned folder.

Works in any Chromium-based browser: Chrome, Edge, Brave, Opera, Arc, Vivaldi.

## Usage

1. Open any Short, for example [youtube.com/shorts](https://www.youtube.com/shorts).
2. Watch. When a Short ends, the next one starts automatically.
3. Use the button in the bottom-right corner or `Alt + S` to pause auto scroll.

## How it works

Shorts play in a loop, so the browser never fires an `ended` event. The content script checks the
active video a few times per second. When playback reaches the last fraction of a second, it clicks
YouTube's own "next" button (falling back to an `ArrowDown` key press). All logic lives in
[`content.js`](content.js).

## Troubleshooting

| Problem | Fix |
| --- | --- |
| The button does not appear | Refresh the Shorts page after installing or updating the extension. |
| It does not move to the next Short | YouTube may have changed its page layout. Please [open an issue](https://github.com/ozanmanav/youtube-shorts-autoscroll/issues). |
| `Alt + S` does nothing | Click on the video once so the page has focus, then try again. |

## Contributing

Issues and pull requests are welcome. Keep it small and dependency-free.

## Türkçe

YouTube Shorts'ta video bitince otomatik olarak bir sonrakine geçen küçük bir Chrome eklentisi.
Kurmak için [Releases](https://github.com/ozanmanav/youtube-shorts-autoscroll/releases) sayfasından
zip'i indir, `chrome://extensions` sayfasında **Developer mode**'u aç ve **Load unpacked** ile klasörü seç.
Sağ alttaki butonla ya da `Alt + S` ile açıp kapatabilirsin.

## License

[MIT](LICENSE)
