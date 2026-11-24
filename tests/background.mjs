// Background-tab check against the real YouTube Shorts page.
//
// Playwright keeps every page "visible" on purpose, so it cannot reproduce a hidden tab.
// This test starts Playwright's Chromium directly and talks to it over the DevTools
// protocol, opens a second tab so the Shorts tab really goes to the background, and
// checks that the extension keeps moving to new Shorts.
//
//   npm run test:background
//
// A Chromium window opens for about a minute.

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const extensionPath = resolve(import.meta.dirname, "..");
const port = 9300 + Math.floor(Math.random() * 600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = spawn(
  chromium.executablePath(),
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "shorts-autoscroll-bg-"))}`,
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    "--autoplay-policy=no-user-gesture-required",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    "https://www.youtube.com/shorts",
  ],
  { stdio: "ignore" }
);

const http = (path, method = "GET") =>
  fetch(`http://127.0.0.1:${port}${path}`, { method }).then((r) => r.json());

let failed = false;
const check = (ok, message) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${message}`);
  if (!ok) failed = true;
};

try {
  let tab;
  for (let i = 0; i < 60 && !tab; i++) {
    await sleep(500);
    tab = (await http("/json/list").catch(() => [])).find((t) => t.type === "page" && t.url.includes("youtube"));
  }
  if (!tab) throw new Error("Chromium did not open YouTube");

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    pending.get(m.id)?.(m.result?.result?.value);
  };
  const evaluate = (expression) =>
    new Promise((r) => {
      pending.set(++id, r);
      ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, returnByValue: true } }));
    });

  const state = () =>
    evaluate(`(() => {
      const v = document.querySelector("#shorts-player video") || document.querySelector("ytd-shorts video");
      return { hidden: document.hidden, path: location.pathname, time: v?.currentTime ?? 0, duration: v?.duration ?? 0 };
    })()`);

  // Wait until the first Short is actually playing.
  for (let i = 0; i < 60 && !((await state())?.time > 1); i++) await sleep(500);
  const first = await state();
  check(first.time > 1, `first Short is playing (${first.path})`);

  // Skip most of it so the test does not wait for a whole Short, then hide the tab.
  await evaluate(`(() => { const v = document.querySelector("#shorts-player video"); v.currentTime = Math.max(0, v.duration - 8); })()`);
  await http("/json/new?about:blank", "PUT");
  await sleep(1000);
  check((await state()).hidden, "Shorts tab is in the background");

  // Wait for two automatic moves. Each later Short is shortened the same way.
  const seen = new Set([first.path]);
  const deadline = Date.now() + 90_000;
  while (seen.size < 3 && Date.now() < deadline) {
    await sleep(2000);
    const s = await state();
    if (!seen.has(s.path)) {
      seen.add(s.path);
      console.log(`      moved to ${s.path} while hidden=${s.hidden}`);
      await sleep(2000);
      await evaluate(`(() => { const v = document.querySelector("#shorts-player video"); if (v?.duration) v.currentTime = Math.max(0, v.duration - 8); })()`);
    }
  }
  check(seen.size >= 3, `kept scrolling in the background (${seen.size - 1} automatic moves)`);

  const last = await state();
  await sleep(2000);
  check((await state()).time !== last.time, "new Short is playing, not stuck");
  ws.close();
} finally {
  browser.kill();
}

process.exit(failed ? 1 : 0);
