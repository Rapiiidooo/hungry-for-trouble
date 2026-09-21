import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/onboarding/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const report = {
  fixture:
    "Only route unlocks are preloaded for late-floor selection. All actions use real clicks, keys and touch; combat snapshots are read only.",
  checks: [],
  errors: [],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const read = () => page.evaluate(() => window.__GAME__);
const shot = (name) =>
  page.screenshot({ path: new URL(`${name}.png`, out).pathname });
async function load(width = 1440, height = 900, mobile = false) {
  await page.setViewport({
    width,
    height,
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
}
async function playing(floor = 1) {
  await page.waitForFunction(
    (number) =>
      window.__GAME__.floor === number &&
      window.__GAME__.elapsed > 0.1 &&
      !window.__GAME__.paused,
    {},
    floor,
  );
}
try {
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
  });
  for (const [name, width, height, mobile] of [
    ["desktop", 1440, 900, false],
    ["phone", 390, 844, true],
    ["landscape", 844, 390, true],
  ]) {
    await load(width, height, mobile);
    const menu = await page.evaluate(() => ({
      portraits: document.querySelectorAll("#menu .story-avatar").length,
      dialogue: document.querySelector("#mission-card") !== null,
      start: document.querySelector("#start").getBoundingClientRect().toJSON(),
      scores: document
        .querySelector("#open-leaderboard")
        .getBoundingClientRect()
        .toJSON(),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.equal(menu.portraits, 0);
    assert.equal(menu.dialogue, false);
    assert.equal(menu.overflow, false);
    assert.ok(menu.start.y > 0 && menu.start.bottom < height);
    assert.ok(menu.scores.y > 0 && menu.scores.bottom < height);
    await shot(`menu-${name}`);
  }
  report.checks.push(
    "Light title screen and visible Play/Leaderboard controls on desktop and both phone orientations",
  );
  await load();
  await page.click("#start");
  await page.waitForFunction(() => window.__GAME__.briefing);
  await shot("briefing-desktop");
  const frozen = await read();
  assert.equal(frozen.ammo, 10);
  assert.equal(frozen.elapsed, 0);
  await page.keyboard.down("KeyD");
  await sleep(600);
  await page.keyboard.up("KeyD");
  const after = await read();
  assert.deepEqual(after.pos, frozen.pos);
  assert.equal(after.time, frozen.time);
  assert.deepEqual(
    after.enemies.map((e) => [e.x, e.z]),
    frozen.enemies.map((e) => [e.x, e.z]),
  );
  await page.click("#briefing-continue");
  await playing();
  report.checks.push(
    "Play shows a short mission dialogue; player, enemies and timer wait; Start now skips it",
  );
  await page.mouse.move(0, 450);
  await page.mouse.down();
  await sleep(2800);
  await page.mouse.up();
  let g = await read();
  assert.equal(g.ammo, 0);
  assert.equal(g.shots, 10);
  await page.keyboard.down("KeyW");
  await sleep(600);
  await page.keyboard.up("KeyW");
  g = await read();
  assert.ok(g.ammo > 0 && g.collected > 0);
  const shots = g.shots;
  await page.mouse.down();
  await sleep(250);
  await page.mouse.up();
  assert.ok((await read()).shots > shots);
  report.checks.push(
    "Ten initial rounds can be exhausted; collecting crumbs enables firing again",
  );
  await page.keyboard.press("Escape");
  assert.match(
    await page.$eval("#resume", (el) => el.innerText),
    /RESUME GAME/,
  );
  assert.match(
    await page.$eval("#pause-retry", (el) => el.innerText),
    /aisle 1/,
  );
  await shot("pause-desktop");
  await page.click("#pause-route");
  assert.equal(
    await page.$eval("#route-close", (el) => el.innerText),
    "BACK TO PAUSE",
  );
  await page.click("#route-close");
  assert.equal((await read()).paused, true);
  await page.click("#pause-menu");
  await page.click("#open-leaderboard");
  await page.waitForFunction(
    () => !document.getElementById("daily-start").disabled,
  );
  assert.equal(
    await page.$eval("#daily-screen", (el) =>
      el.classList.contains("board-view"),
    ),
    true,
  );
  const scores = await page.evaluate(async () => {
    const daily = await (await fetch("/api/daily")).json();
    const board = await (
      await fetch(`/api/leaderboard?day=${daily.day}`)
    ).json();
    return {
      entries: board.entries,
      visible: document.getElementById("leaderboard").innerText,
    };
  });
  for (const entry of scores.entries)
    assert.ok(scores.visible.includes(entry.name));
  report.leaderboardEntries = scores.entries.length;
  await shot("leaderboard-desktop");
  await page.click("#daily-close");
  report.checks.push(
    "Pause actions name their destinations; the direct leaderboard displays the current server's entries",
  );
  await page.evaluate(() =>
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({ unlocked: 19, cleared: [] }),
    ),
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  for (const floor of [6, 10, 20]) {
    await page.click("#open-route");
    await page.click(`#route-map button[data-floor="${floor}"]`);
    assert.match(
      await page.$eval("#stage-kit", (el) => el.innerText),
      /3 HEARTS.*10 SHOTS.*NO UPGRADES/,
    );
    if (floor === 10) await shot("level-select");
    await page.click("#practice-start");
    await playing(floor);
    g = await read();
    assert.equal(g.hp, 3);
    assert.equal(g.maxHp, 3);
    assert.equal(g.ammo, 10);
    assert.equal(g.shield, 0);
    assert.ok(Object.values(g.upgrades).every((n) => n === 0));
    await page.keyboard.press("Escape");
    assert.match(
      await page.$eval("#restart-note", (el) => el.innerText),
      new RegExp(`aisle ${floor}\\.`),
    );
    await page.click("#pause-retry");
    await playing(floor);
    g = await read();
    assert.equal(g.hp, 3);
    assert.equal(g.ammo, 10);
    await page.keyboard.press("Escape");
    await page.click("#pause-menu");
  }
  report.checks.push(
    "Reached aisles 6, 10 and 20 start and restart with three hearts, ten shots and no upgrades",
  );
  await load(390, 844, true);
  await page.touchscreen.tap(
    ...(await page.$eval("#start", (el) => {
      const r = el.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2];
    })),
  );
  await page.waitForFunction(() => window.__GAME__.briefing);
  await shot("briefing-phone");
  const beforeTouch = await read();
  const stick = await page.$eval("#move-stick", (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, h: r.height };
  });
  await page.touchscreen.touchStart(stick.x, stick.y);
  await sleep(120);
  await page.touchscreen.touchMove(stick.x, stick.y - stick.h * 0.35);
  await sleep(7200);
  await page.touchscreen.touchEnd();
  const moved = await read();
  assert.equal(moved.briefing, false);
  assert.ok(
    Math.hypot(
      moved.pos[0] - beforeTouch.pos[0],
      moved.pos[1] - beforeTouch.pos[1],
    ) > 1,
  );
  await page.click("#pause");
  await shot("pause-phone");
  await page.click("#pause-menu");
  await page.click("#open-leaderboard");
  await page.waitForFunction(
    () => !document.getElementById("daily-start").disabled,
  );
  await shot("leaderboard-phone");
  report.checks.push(
    "The short briefing completes automatically, then a real held finger moves the robot; phone pause and scores remain readable",
  );
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  report.last = await read().catch(() => null);
  await shot("failure").catch(() => {});
} finally {
  await writeFile(new URL("report.json", out), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      result: report.result,
      checks: report.checks,
      errors: report.errors,
      failure: report.failure,
    }),
  );
  await browser.close();
}
