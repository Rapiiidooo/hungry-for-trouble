import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const root = new URL("../", import.meta.url).pathname;
const out = new URL("../outputs/leaderboards/", import.meta.url);
await mkdir(out, { recursive: true });
const directory = await mkdtemp(path.join(os.tmpdir(), "hft-board-browser-"));
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: "0",
    LEADERBOARD_FILE: path.join(directory, "scores.json"),
  },
  stdio: ["ignore", "pipe", "pipe"],
});
const report = {
  checks: [],
  errors: [],
  fixture:
    "Disposable server/store and browser profiles. Only local unlocks, livery and personal-best fixtures are preloaded for alignment/reset. Shared scores come from real input and server verification.",
};
let browser, page;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Test server did not start")),
      10000,
    );
    server.once("error", reject);
    server.once("exit", (code) =>
      reject(new Error(`Test server exited ${code}`)),
    );
    server.stdout.on("data", (chunk) => {
      const url = /http:\/\/localhost:\d+/.exec(String(chunk))?.[0];
      if (url) {
        clearTimeout(timer);
        resolve(url);
      }
    });
  });
  browser = await puppeteer.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  page = await browser.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") report.errors.push(e.text());
  });
  const fixture = await page.evaluateOnNewDocument(() => {
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({ unlocked: 19, cleared: [9, 19] }),
    );
    localStorage.setItem(
      "hft-record-v1",
      JSON.stringify({ score: 85764, floor: 20 }),
    );
    localStorage.setItem("hft-gold-v1", "off");
    localStorage.setItem("hft-alias", "QA_CAMPAIGN");
    localStorage.setItem("hft-ui-test-other", "preserve");
  });
  const shot = (name) =>
    page.screenshot({ path: new URL(`${name}.png`, out).pathname });
  for (const [name, width, height, mobile] of [
    ["desktop", 1440, 900, false],
    ["phone", 390, 844, true],
    ["landscape", 844, 390, true],
  ]) {
    await page.setViewport({
      width,
      height,
      isMobile: mobile,
      hasTouch: mobile,
      deviceScaleFactor: 1,
    });
    await page.goto(base, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.__READY__);
    await page.mouse.move(width - 1, height - 1);
    const layout = await page.evaluate(() => {
      const rect = (id) =>
        document.querySelector(id).getBoundingClientRect().toJSON();
      return {
        backgrounds: ["#open-leaderboard", "#sound", "#open-settings"].map(
          (id) => getComputedStyle(document.querySelector(id)).backgroundColor,
        ),
        trophy: rect("#open-leaderboard"),
        settings: rect("#open-settings"),
        text: document.getElementById("menu").textContent,
        left: [
          "#menu h1",
          "#menu .lead",
          "#mission-goal",
          "#start",
          ".menu-secondary",
          "#best",
          "#gold-toggle",
        ]
          .map((id) => rect(id))
          .filter((r) => r.width > 0)
          .map((r) => r.x),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.equal(new Set(layout.backgrounds).size, 1);
    assert.ok(
      Math.max(...layout.left) - Math.min(...layout.left) < 1,
      JSON.stringify(layout.left),
    );
    assert.equal(layout.overflow, false);
    assert.ok(!layout.text.includes("CLEANUP ON AISLE EVERYWHERE"));
    assert.ok(layout.trophy.width >= 44 && layout.trophy.height >= 44);
    assert.ok(layout.settings.right < width && layout.settings.bottom < height);
    report[name] = layout;
    await shot(`home-${name}`);
    await page.click("#open-leaderboard");
    await page.waitForFunction(
      () => !document.getElementById("daily-start").disabled,
    );
    await shot(`daily-${name}`);
    await page.click("#board-general");
    await page.waitForFunction(() =>
      document
        .getElementById("daily-status")
        .textContent.startsWith("ALL TIME"),
    );
    assert.equal(await page.$eval("#daily-start", (el) => el.hidden), true);
    assert.equal(
      await page.$eval("#board-campaign-start", (el) => el.hidden),
      false,
    );
    await shot(`general-${name}`);
    await page.click("#daily-close");
  }
  report.checks.push(
    "Identical header backgrounds, aligned title contents, trophy access and both boards on desktop, phone and landscape",
  );
  await page.removeScriptToEvaluateOnNewDocument(fixture.identifier);
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await page.click("#open-settings");
  await page.click("#reset-save");
  await shot("reset-confirmation-phone");
  await page.click("#cancel-reset");
  await page.click("#settings-close");
  assert.match(await page.$eval("#best", (el) => el.textContent), /85,764/);
  await page.click("#open-settings");
  await page.click("#reset-save");
  await page.click("#confirm-reset");
  assert.match(
    await page.$eval("#settings-status", (el) => el.textContent),
    /save reset/,
  );
  await page.click("#settings-close");
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  assert.equal(await page.$eval("#gold-toggle", (el) => el.hidden), true);
  assert.match(await page.$eval("#best", (el) => el.textContent), /TEN AISLES/);
  assert.deepEqual(
    await page.evaluate(() => [
      localStorage.getItem("hft-alias"),
      localStorage.getItem("hft-ui-test-other"),
    ]),
    ["QA_CAMPAIGN", "preserve"],
  );
  await page.click("#open-route");
  assert.equal(
    await page.$$eval("#route-map button", (nodes) => nodes.length),
    10,
  );
  assert.equal(
    await page.$$eval("#route-map button:disabled", (nodes) => nodes.length),
    9,
  );
  await page.click("#route-close");
  report.checks.push(
    "Cancel preserves the save; confirmed reset survives reload and clears only progress, personal best and livery",
  );

  await page.setViewport({
    width: 1440,
    height: 900,
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
  });
  await page.goto(base, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#open-leaderboard");
  await page.click("#board-general");
  await page.click("#board-campaign-start");
  await page.waitForFunction(() => window.__GAME__?.briefing);
  await page.click("#briefing-continue");
  await page.keyboard.down("KeyW");
  await page.waitForFunction(() => window.__GAME__?.state === "lost", {
    timeout: 130000,
  });
  await page.keyboard.up("KeyW");
  const ended = await page.evaluate(() => window.__GAME__);
  assert.ok(ended.score > 0);
  await page.click("#submit-score");
  await page.waitForFunction(
    () =>
      document.getElementById("score-status").textContent.includes("VERIFIED"),
    { timeout: 15000 },
  );
  assert.match(
    await page.$eval("#score-status", (el) => el.textContent),
    /General rank: #1/,
  );
  report.run = {
    score: ended.score,
    floor: ended.floor,
    elapsed: ended.elapsed,
  };
  await shot("campaign-score-verified");

  const otherContext = await browser.createBrowserContext();
  const other = await otherContext.newPage();
  other.on("pageerror", (e) => report.errors.push(e.message));
  await other.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await other.goto(base, { waitUntil: "networkidle0" });
  await other.waitForFunction(() => window.__READY__);
  await other.click("#open-leaderboard");
  await other.waitForFunction(
    () => !document.getElementById("daily-start").disabled,
  );
  assert.match(
    await other.$eval("#leaderboard", (el) => el.textContent),
    /No scores yet/,
  );
  await other.click("#board-general");
  await other.waitForFunction(() =>
    document.getElementById("leaderboard").textContent.includes("QA_CAMPAIGN"),
  );
  assert.ok(
    (await other.$eval("#leaderboard", (el) => el.textContent)).includes(
      String(ended.score),
    ),
  );
  await other.screenshot({
    path: new URL("general-shared-phone.png", out).pathname,
  });
  await other.keyboard.press("ArrowLeft");
  assert.equal(
    await other.$eval("#board-daily", (el) => el.getAttribute("aria-selected")),
    "true",
  );
  await other.keyboard.press("End");
  await other.waitForFunction(() =>
    document.getElementById("leaderboard").textContent.includes("QA_CAMPAIGN"),
  );
  await sleep(500);
  assert.equal(
    await other.$eval("#board-general", (el) =>
      el.getAttribute("aria-selected"),
    ),
    "true",
  );
  await otherContext.close();
  await page.bringToFront();
  await page.click("#back-menu");
  await page.click("#open-settings");
  await page.click("#reset-save");
  await page.click("#confirm-reset");
  await page.click("#settings-close");
  await page.click("#open-leaderboard");
  await page.click("#board-general");
  await page.waitForFunction(() =>
    document.getElementById("leaderboard").textContent.includes("QA_CAMPAIGN"),
  );
  report.checks.push(
    "A real campaign score is replay-verified, visible in another browser, absent from Daily and retained after local reset; tab keyboard controls work",
  );
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  await page
    ?.screenshot({ path: new URL("failure.png", out).pathname })
    .catch(() => {});
} finally {
  await writeFile(new URL("report.json", out), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser?.close();
  console.log(
    `Stopping test server PID ${server.pid}: node scripts/serve.mjs (temporary score store)`,
  );
  server.kill("SIGTERM");
  await new Promise((resolve) => {
    if (server.exitCode !== null) resolve();
    else server.once("exit", resolve);
  });
  await rm(directory, { recursive: true, force: true });
}
