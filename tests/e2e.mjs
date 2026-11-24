// End-to-end check against the real YouTube Shorts page.
// Loads the unpacked extension into Chromium, jumps each Short to its last second
// and verifies that the extension moves on, and that it stays put when turned off.
//
//   npm install && npx playwright install chromium && npm test
//
// Set HEADED=1 to watch it run. Needs a network connection to youtube.com.

import { chromium } from "playwright";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const extensionPath = resolve(import.meta.dirname, "..");
const profile = mkdtempSync(join(tmpdir(), "shorts-autoscroll-"));

const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium",
  headless: !process.env.HEADED,
  viewport: { width: 1280, height: 800 },
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    "--autoplay-policy=no-user-gesture-required",
    "--mute-audio",
  ],
});

let failed = false;
const check = (ok, message) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${message}`);
  if (!ok) failed = true;
};

const jumpToEnd = (page) =>
  page.evaluate(() => {
    const v =
      document.querySelector("ytd-reel-video-renderer[is-active] video") ||
      document.querySelector("#shorts-player video");
    if (!v) return false;
    v.play();
    v.currentTime = Math.max(0, v.duration - 1.5);
    return true;
  });

const urlChanged = (page, from, timeout) =>
  page.waitForFunction((prev) => location.href !== prev, from, { timeout }).then(() => true, () => false);

try {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker", { timeout: 10000 }).catch(() => null));
  check(!!worker, "background service worker (toolbar toggle) is running");

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://www.youtube.com/shorts", { waitUntil: "domcontentloaded" });

  const consent = page.getByRole("button", { name: /Accept all|Reject all/ }).first();
  if (await consent.isVisible({ timeout: 3000 }).catch(() => false)) await consent.click();

  const toggle = page.locator("#shorts-autoscroll-toggle");
  await toggle.waitFor({ timeout: 20000 });
  check((await toggle.textContent()) === "Auto Scroll: ON", "toggle button is visible and ON by default");

  for (let i = 1; i <= 2; i++) {
    const before = page.url();
    check(await jumpToEnd(page), `found the active Short video (#${i})`);
    check(await urlChanged(page, before, 10000), `moved to the next Short when #${i} ended`);
    await page.waitForTimeout(2000);
  }

  await page.mouse.click(5, 400);
  await page.keyboard.press("Alt+KeyS");
  await page.waitForTimeout(500);
  check((await toggle.textContent()) === "Auto Scroll: OFF", "Alt+S turns auto scroll OFF");

  const before = page.url();
  await jumpToEnd(page);
  check(!(await urlChanged(page, before, 4000)), "stays on the same Short while OFF");
} finally {
  await context.close();
}

process.exit(failed ? 1 : 0);
