import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import {
  newGame,
  nextLevel,
  stepGame,
  pathTo,
  lineOfSight,
} from "../game/sim.js";
import { TICK, packInput, unpackInput, recordInput } from "../game/daily.js";
import { makeCheckpoint } from "../game/checkpoint.js";

const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/continue/", import.meta.url);
await mkdir(out, { recursive: true });
const directory = await mkdtemp(path.join(os.tmpdir(), "hft-continue-"));
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: new URL("../", import.meta.url).pathname,
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
    "Disposable browser and score store. Earned aisle-two and pending-upgrade saves are created by deterministic simulation of genuine aisle-one inputs, then preloaded into IndexedDB. Browser checks exercise real controls and reloads; this is not a full combat playthrough.",
};
let browser, page;

function earnedSave() {
  let game = newGame(0, { seed: 1234 });
  const stages = [{ inputs: [] }];
  let target, waypoint;
  for (let tick = 0; tick < 7000 && game.state === "playing"; tick++) {
    const p = game.player,
      distance = (point) => Math.hypot(point.x - p.x, point.z - p.z);
    if (!target || target.collected || distance(target) < 0.15) {
      target =
        game.collected >= game.map.level.quota
          ? game.map.exit
          : game.crumbs
              .filter((c) => !c.collected)
              .sort((a, b) => distance(a) - distance(b))[0];
      waypoint = null;
    }
    if (!waypoint || distance(waypoint) < 0.12)
      waypoint = pathTo(game, p, target);
    const enemy = game.enemies
      .filter((e) => e.respawn <= 0 && lineOfSight(game, p, e))
      .sort((a, b) => distance(a) - distance(b))[0];
    const dx = waypoint.x - p.x,
      dz = waypoint.z - p.z,
      gap = Math.hypot(dx, dz);
    const row = packInput({
      x: gap > 0.05 ? dx / gap : 0,
      z: gap > 0.05 ? dz / gap : 0,
      fire: !!enemy,
      aim: enemy ? Math.atan2(enemy.x - p.x, enemy.z - p.z) : undefined,
    });
    recordInput(stages[0].inputs, row);
    stepGame(game, unpackInput(row), TICK);
  }
  assert.equal(game.state, "cleared");
  const pending = makeCheckpoint("earned-shift", game, stages);
  game = nextLevel(game, "spread");
  stages.push({ upgrade: "spread", inputs: [] });
  return {
    pending,
    save: makeCheckpoint("earned-shift", game, stages),
    expected: game,
  };
}

try {
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Test server did not start")),
      10000,
    );
    server.once("error", reject);
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
  const ready = () => page.waitForFunction(() => window.__READY__);
  const read = () =>
    page.evaluate(async () =>
      (await import("./checkpoint.js")).checkpointStore().read(),
    );
  const seedSave = async (value) => {
    await page.evaluate(async (save) => {
      await (await import("./checkpoint.js")).checkpointStore().write(save);
    }, value);
    await page.reload({ waitUntil: "networkidle0" });
    await ready();
  };
  const shot = (name) =>
    page.screenshot({ path: new URL(`${name}.png`, out).pathname });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "networkidle0" });
  await ready();
  assert.equal(await page.$eval("#new-campaign", (el) => el.hidden), true);
  await page.click("#start");
  await page.waitForFunction(() => window.__GAME__?.briefing);
  await page.click("#briefing-continue");
  await page.keyboard.down("KeyW");
  await page.waitForFunction(() => window.__GAME__?.elapsed > 0.6);
  await page.keyboard.up("KeyW");
  await page.keyboard.press("Escape");
  const first = await read();
  assert.equal(first.floor, 1);
  assert.deepEqual(first.stages[0].inputs, []);
  await page.click("#pause-menu");
  await page.waitForFunction(() => window.__GAME__?.mode === "menu");
  assert.match(await page.$eval("#start", (el) => el.textContent), /CONTINUE/);
  await page.reload({ waitUntil: "networkidle0" });
  await ready();
  await page.click("#start");
  await page.waitForFunction(() => window.__GAME__?.paused);
  const firstRestored = await page.evaluate(() => window.__GAME__);
  assert.equal(firstRestored.seed, first.seed);
  assert.equal(firstRestored.elapsed, 0);
  assert.equal(firstRestored.ammo, 10);
  report.checks.push(
    "A real new campaign saves before movement and resumes at its aisle start after menu and reload",
  );
  await page.click("#pause-menu");
  await page.waitForFunction(() => window.__GAME__?.mode === "menu");
  const fixture = earnedSave();
  await seedSave(fixture.save);
  await page.click("#new-campaign");
  await page.click("#keep-campaign");
  assert.equal((await read()).id, fixture.save.id);
  await page.click("#start");
  await page.waitForFunction(
    () => window.__GAME__?.paused && window.__GAME__.floor === 2,
  );
  const restored = await page.evaluate(() => window.__GAME__);
  assert.equal(restored.hp, fixture.expected.player.hp);
  assert.equal(restored.ammo, fixture.expected.ammo);
  assert.equal(restored.score, fixture.expected.score);
  assert.deepEqual(restored.upgrades, fixture.expected.upgrades);
  await shot("restored-equipment-desktop");
  await page.click("#pause-menu");
  await page.waitForFunction(() => window.__GAME__?.mode === "menu");
  report.checks.push(
    "Continue restores earned spread, health, ammo, seed and score; canceling New Campaign preserves the save",
  );
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["phone", 390, 844],
    ["small-phone", 390, 640],
    ["landscape", 844, 390],
  ]) {
    await page.setViewport({
      width,
      height,
      isMobile: name !== "desktop",
      hasTouch: name !== "desktop",
      deviceScaleFactor: 1,
    });
    await page.goto(base, { waitUntil: "networkidle0" });
    await ready();
    const layout = await page.evaluate(() => {
      const rect = (id) =>
        document.querySelector(id).getBoundingClientRect().toJSON();
      return {
        start: rect("#start"),
        newRun: rect("#new-campaign"),
        best: rect("#best"),
        menu: rect("#menu"),
        header: rect("header"),
        summary: rect("#save-summary"),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.ok(
      layout.start.top >= layout.header.bottom - 1 &&
        layout.start.bottom < height,
    );
    assert.ok(layout.newRun.top >= 0 && layout.newRun.bottom < height);
    assert.ok(
      layout.best.bottom <= layout.menu.bottom + 1,
      "The saved record must not be clipped",
    );
    assert.equal(layout.overflow, false);
    report[name] = layout;
    await shot(`continue-${name}`);
  }
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await page.goto(base, { waitUntil: "networkidle0" });
  await ready();
  await page.tap("#start");
  await page.waitForFunction(
    () => window.__GAME__?.paused && window.__GAME__.floor === 2,
  );
  await page.tap("#pause-menu");
  await page.waitForFunction(() => window.__GAME__?.mode === "menu");
  await page.tap("#open-route");
  await page.tap("#practice-start");
  await page.waitForFunction(
    () =>
      window.__GAME__?.runKind === "practice" &&
      window.__GAME__.mode === "playing",
  );
  await page.tap("#pause");
  await page.tap("#pause-menu");
  await page.waitForFunction(() => window.__GAME__?.mode === "menu");
  assert.equal((await read()).id, fixture.save.id);
  report.checks.push(
    "Continue works with real touch and fits four viewports; Level Select keeps the campaign checkpoint",
  );
  await seedSave(fixture.pending);
  await page.tap("#start");
  await page.waitForFunction(
    () => !document.getElementById("upgrade-screen").hidden,
  );
  assert.equal(await page.$$eval("[data-upgrade]", (nodes) => nodes.length), 3);
  await page.tap('[data-upgrade="spread"]');
  await page.waitForFunction(
    () => window.__GAME__?.floor === 2 && window.__GAME__.state === "playing",
  );
  await page.tap("#pause");
  await page.tap("#pause-menu");
  await page.waitForFunction(() => window.__GAME__?.mode === "menu");
  assert.equal((await read()).floor, 2);
  report.checks.push(
    "Closing at checkout retains the completed floor and offered upgrade, then saves the next aisle",
  );
  await page.tap("#open-settings");
  await page.tap("#reset-save");
  await page.tap("#confirm-reset");
  await page.waitForFunction(() =>
    document
      .getElementById("settings-status")
      .textContent.includes("Local save reset"),
  );
  assert.equal(await read(), undefined);
  await page.tap("#settings-close");
  await page.reload({ waitUntil: "networkidle0" });
  await ready();
  assert.match(await page.$eval("#start", (el) => el.textContent), /PLAY/);
  await seedSave({ ...fixture.save, ruleset: "obsolete" });
  assert.equal(await page.$eval("#new-campaign", (el) => el.hidden), true);
  assert.match(
    await page.$eval("#save-summary", (el) => el.textContent),
    /older version/,
  );
  await seedSave({
    ...fixture.save,
    stages: [{ inputs: [] }, { upgrade: "spread", inputs: [] }],
  });
  await page.tap("#start");
  await page.waitForFunction(() =>
    document
      .getElementById("save-summary")
      .textContent.includes("could not be restored"),
  );
  assert.equal(await page.$eval("#start", (el) => el.disabled), false);
  await page.tap("#new-campaign");
  await page.tap("#replace-campaign");
  await page.waitForFunction(() => window.__GAME__?.briefing);
  assert.equal((await read()).floor, 1);
  report.checks.push(
    "Settings reset deletes the checkpoint; incompatible and corrupt saves fail safely and can be replaced",
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
    `Stopping owned test server PID ${server.pid}: node scripts/serve.mjs (temporary score store)`,
  );
  server.kill("SIGTERM");
  await new Promise((resolve) =>
    server.exitCode !== null ? resolve() : server.once("exit", resolve),
  );
  await rm(directory, { recursive: true, force: true });
}
