import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const output = new URL("../outputs/locked-wing-ui/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const report = {
  fixture:
    "Only local route unlocks are preloaded. Gameplay uses real keyboard, pointer and touch input with read-only telemetry.",
  checks: [],
  errors: [],
  peakDraws: 0,
  peakTriangles: 0,
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const read = () => page.evaluate(() => window.__GAME__);
const snap = (name) =>
  page.screenshot({ path: new URL(`${name}.png`, output).pathname });
const gap = (g, p) => Math.hypot(g.pos[0] - p.x, g.pos[1] - p.z);
let held = new Set(),
  firing = false;
async function controls(keys = [], shoot = false) {
  const wanted = new Set(keys);
  for (const key of held) if (!wanted.has(key)) await page.keyboard.up(key);
  for (const key of wanted) if (!held.has(key)) await page.keyboard.down(key);
  held = wanted;
  if (shoot !== firing) {
    if (shoot) await page.mouse.down();
    else await page.mouse.up();
    firing = shoot;
  }
}
function path(g, target) {
  const start = g.pos.map((n) => Math.round(n / 2));
  const end = [target.x, target.z].map((n) => Math.round(n / 2)).join(",");
  const queue = [{ at: start, steps: [] }],
    seen = new Set();
  for (let i = 0; i < queue.length; i++) {
    const { at, steps } = queue[i],
      id = at.join(",");
    if (seen.has(id)) continue;
    seen.add(id);
    if (id === end) return steps;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = [at[0] + dx, at[1] + dz],
        tile = g.map[next[1]]?.[next[0]];
      if (
        !tile ||
        ["#", " ", "P"].includes(tile) ||
        g.doors.some(
          (d) =>
            !d.open &&
            d.col === next[0] &&
            d.row === next[1] &&
            !g.keyring.includes(d.color),
        )
      )
        continue;
      queue.push({
        at: next,
        steps: [...steps, { x: next[0] * 2, z: next[1] * 2 }],
      });
    }
  }
  return [];
}
async function walkTo(target, done = (g) => gap(g, target) < 0.45) {
  const deadline = Date.now() + 45000;
  let waypoint;
  while (Date.now() < deadline) {
    const g = await read();
    if (done(g)) {
      await controls();
      return;
    }
    assert.equal(g.state, "playing", "Real navigation must stay alive");
    if (g.firstPerson) {
      await controls();
      await page.keyboard.press("KeyV");
      await sleep(900);
      waypoint = null;
      continue;
    }
    if (!waypoint || gap(g, waypoint) < 0.35)
      waypoint = path(g, target)[0] || target;
    const dx = waypoint.x - g.pos[0],
      dz = waypoint.z - g.pos[1];
    const enemy = g.enemies
      .filter(
        (e) =>
          e.respawn <= 0 &&
          gap(g, e) < 8 &&
          e.screen.x > 0 &&
          e.screen.x < 390 &&
          e.screen.y > 130 &&
          e.screen.y < 700,
      )
      .sort((a, b) => gap(g, a) - gap(g, b))[0];
    if (enemy) await page.mouse.move(enemy.screen.x, enemy.screen.y);
    await controls(
      [
        ...(Math.abs(dx) > 0.12 ? [dx > 0 ? "KeyD" : "KeyA"] : []),
        ...(Math.abs(dz) > 0.12 ? [dz > 0 ? "KeyS" : "KeyW"] : []),
      ],
      !!enemy,
    );
    if (enemy && gap(g, enemy) < 1.5 && g.dashCooldown === 0)
      await page.keyboard.press("Space");
    report.peakDraws = Math.max(report.peakDraws, g.draws);
    report.peakTriangles = Math.max(report.peakTriangles, g.tris);
    await sleep(65);
  }
  throw new Error("Real-input navigation timed out");
}
async function fixture(progress) {
  await controls();
  await page.evaluate(
    (value) => localStorage.setItem("hft-route-v1", JSON.stringify(value)),
    progress,
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
}
async function layout(name, width, height) {
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await sleep(120);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await snap(name);
}
try {
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
  });
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  for (const [progress, count, name] of [
    [{ unlocked: 0, cleared: [] }, 10, "route-new"],
    [{ unlocked: 19, cleared: [9] }, 20, "route-before-rescue"],
    [{ unlocked: 19, cleared: [9, 19] }, 25, "route-legacy-win"],
  ]) {
    await fixture(progress);
    await page.tap("#open-route");
    assert.equal(
      await page.$$eval("#route-map .route-node", (nodes) => nodes.length),
      count,
    );
    await snap(name);
  }
  assert.equal(
    await page.$eval('[data-floor="21"]', (node) => node.disabled),
    false,
  );
  assert.equal(
    await page.$eval('[data-floor="22"]', (node) => node.disabled),
    true,
  );
  report.checks.push(
    "Routes reveal 10, then 20, then 25 floors; an existing floor-20 win unlocks 21 only",
  );
  await page.tap('[data-floor="21"]');
  await page.tap("#practice-start");
  await page.waitForSelector("#briefing", { visible: true });
  const initial = await read();
  await sleep(350);
  const waiting = await read();
  assert.equal(waiting.elapsed, initial.elapsed);
  assert.equal(waiting.hp, 3);
  assert.equal(waiting.ammo, 10);
  await snap("key-briefing-phone");
  await page.tap("#briefing-continue");
  await page.waitForFunction(() => window.__GAME__.elapsed > 0.15);
  report.checks.push(
    "Key briefing freezes gameplay and starts with three hearts and ten shots",
  );
  let g = await read();
  const door = g.doors[0];
  await walkTo({ x: door.x - 2, z: door.z });
  const stick = await page.$eval("#move-stick", (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  const before = await read();
  await page.touchscreen.touchStart(stick.x, stick.y);
  await page.touchscreen.touchMove(stick.x + 36, stick.y);
  await sleep(700);
  await page.touchscreen.touchEnd();
  g = await read();
  assert.ok(g.pos[0] > before.pos[0] + 0.15);
  assert.ok(g.pos[0] < door.x - 1.1);
  assert.equal(g.doors[0].open, false);
  assert.ok(
    await page.$eval("#message", (el) => el.textContent.includes("RED")),
  );
  await snap("red-door-locked-phone");
  report.checks.push(
    "A real finger moves toward the red lock; the missing key blocks entry and names its color",
  );
  await walkTo(g.keycards[0], (state) => state.keyring.includes("red"));
  assert.equal(
    await page.$$eval("#key-ring .held", (nodes) => nodes.length),
    1,
  );
  await snap("red-key-collected-phone");
  await walkTo({ x: door.x - 2, z: door.z });
  await page.touchscreen.touchStart(stick.x, stick.y);
  await page.touchscreen.touchMove(stick.x + 36, stick.y);
  await sleep(1000);
  await page.touchscreen.touchEnd();
  await sleep(100);
  g = await read();
  assert.equal(g.doors[0].open, true);
  assert.ok(g.pos[0] > door.x + 1.1);
  assert.deepEqual(g.keyring, ["red"]);
  await snap("red-door-open-phone");
  report.checks.push(
    "Collecting the key fills its HUD slot; real touch opens and crosses the door without consuming it",
  );
  await page.keyboard.press("Escape");
  await page.tap("#pause-retry");
  await page.waitForSelector("#briefing", { visible: true });
  assert.deepEqual((await read()).keyring, []);
  assert.ok((await read()).doors.every((item) => !item.open));
  await page.tap("#briefing-continue");
  await page.keyboard.press("Escape");
  await page.tap("#pause-menu");
  report.checks.push("Restart resets the key and door state");
  await fixture({ unlocked: 24, cleared: [9, 19] });
  await page.tap("#open-route");
  await layout("route-expanded-landscape", 844, 390);
  await page.tap('[data-floor="24"]');
  await page.tap("#practice-start");
  await page.waitForFunction(() => window.__GAME__.floor === 24);
  for (const [name, width, height] of [
    ["landscape", 844, 390],
    ["portrait", 390, 844],
    ["desktop", 1280, 800],
  ]) {
    await layout(`four-key-hud-${name}`, width, height);
    const boxes = await page.evaluate(() =>
      ["key-ring", "minimap"].map((id) => {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          right: r.right,
          left: r.left,
          visible: !el.hidden,
        };
      }),
    );
    assert.ok(
      boxes[0].visible && boxes[0].right <= width && boxes[0].bottom < height,
    );
    assert.ok(boxes[0].top >= boxes[1].bottom, "Keys must sit below the map");
    assert.equal(
      await page.$$eval("#key-ring .key-slot", (nodes) => nodes.length),
      4,
    );
  }
  report.checks.push(
    "The four-key inventory and expanded route fit portrait, landscape and desktop without overlapping the map",
  );
  assert.ok(report.peakDraws < 900 && report.peakTriangles < 1500000);
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  report.last = await read().catch(() => null);
  await snap("failure").catch(() => {});
} finally {
  await controls().catch(() => {});
  await writeFile(
    new URL("report.json", output),
    JSON.stringify(report, null, 2),
  );
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
