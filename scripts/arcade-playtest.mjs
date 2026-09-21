import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/arcade/", import.meta.url);
await mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const report = {
  checks: [],
  errors: [],
  input:
    "Real DOM clicks, keyboard and pointer events. Simulation snapshots are read only.",
};
let page;
try {
  page = await browser.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.setViewport({
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#open-route");
  assert.equal(
    await page.$$eval("#route-map .route-node", (rows) => rows.length),
    10,
  );
  assert.equal(
    await page.$$eval("#route-map .boss-node", (rows) => rows.length),
    2,
  );
  assert.equal(
    await page.$$eval("#route-map button:disabled", (rows) => rows.length),
    9,
  );
  await page.screenshot({ path: new URL("route-desktop.png", out).pathname });
  report.checks.push(
    "Ten-node rescue map, two boss milestones and hidden basement",
  );
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await sleep(200);
  await page.screenshot({ path: new URL("route-mobile.png", out).pathname });
  await page.click("#route-close");
  await page.screenshot({ path: new URL("menu-mobile.png", out).pathname });
  await page.setViewport({
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.click("#open-daily");
  await page.waitForFunction(
    () => !document.getElementById("daily-start").disabled,
  );
  await page.screenshot({ path: new URL("daily-before.png", out).pathname });
  await page.click("#daily-start");
  await page.waitForFunction(
    () => window.__GAME__?.runKind === "daily" && window.__GAME__.elapsed > 0.5,
  );
  await page.keyboard.down("KeyD");
  await sleep(1400);
  await page.keyboard.up("KeyD");
  await page.mouse.move(780, 350);
  await page.mouse.down();
  let tookDamage = false,
    lastHP = 5;
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const game = await page.evaluate(() => window.__GAME__);
    if (game.firstPerson) await page.keyboard.press("KeyV");
    if (game.hp < lastHP && !tookDamage) {
      await page.screenshot({
        path: new URL("damage-heart.png", out).pathname,
      });
      tookDamage = true;
    }
    lastHP = game.hp;
    if (game.state !== "playing") break;
    await sleep(60);
  }
  await page.mouse.up();
  const ended = await page.evaluate(() => window.__GAME__);
  assert.ok(["lost", "won"].includes(ended.state));
  assert.ok(ended.dailyTicks > 60);
  assert.ok(ended.score > 0);
  report.run = {
    score: ended.score,
    ticks: ended.dailyTicks,
    state: ended.state,
    day: ended.dailyDay,
  };
  await page.type("#score-name", "QA_VACUUM");
  await page.click("#submit-score");
  await page.waitForFunction(
    () =>
      document.getElementById("score-status").textContent.includes("VERIFIED"),
    { timeout: 20000 },
  );
  await page.screenshot({ path: new URL("daily-verified.png", out).pathname });
  report.checks.push(
    "A real daily run records inputs and is accepted by server replay",
  );
  const anotherContext = await browser.createBrowserContext();
  const other = await anotherContext.newPage();
  await other.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await other.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await other.waitForFunction(() => window.__READY__);
  await other.click("#open-daily");
  await other.waitForFunction(() =>
    document.getElementById("leaderboard").textContent.includes("QA_VACUUM"),
  );
  assert.ok(
    (await other.$eval("#leaderboard", (el) => el.textContent)).includes(
      ended.score.toLocaleString("en-US"),
    ),
  );
  await other.screenshot({
    path: new URL("shared-board-mobile.png", out).pathname,
  });
  report.checks.push(
    "An independent browser identity reads the same accepted score",
  );
  await anotherContext.close();
  await page.bringToFront();
  await page.click("#back-menu");
  await page.setOfflineMode(true);
  await page.click("#open-daily");
  await page.waitForFunction(() =>
    document
      .getElementById("daily-status")
      .textContent.includes("Campaign and practice"),
  );
  assert.equal(await page.$eval("#daily-start", (el) => el.disabled), true);
  report.checks.push(
    "Unavailable ranking is explicit and does not show fabricated scores",
  );
  await page.setOfflineMode(false);
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  if (page)
    await page
      .screenshot({ path: new URL("failure.png", out).pathname })
      .catch(() => {});
} finally {
  await writeFile(new URL("report.json", out), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
