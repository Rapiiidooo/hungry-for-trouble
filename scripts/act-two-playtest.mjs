import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/act-two/", import.meta.url);
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
    "Only practice unlocks are preloaded. Combat, movement, pickups, machinery and camera changes use real keyboard, pointer and touch events; telemetry is read only.",
  checks: [],
  errors: [],
  floors: [],
  peakDraws: 0,
  peakTriangles: 0,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const read = () => page.evaluate(() => window.__GAME__);
const gap = (g, p) => Math.hypot(g.pos[0] - p.x, g.pos[1] - p.z);
let held = new Set(),
  firing = false;
async function controls(keys = [], shoot = false) {
  const wanted = new Set(keys);
  for (const k of held) if (!wanted.has(k)) await page.keyboard.up(k);
  for (const k of wanted) if (!held.has(k)) await page.keyboard.down(k);
  held = wanted;
  if (shoot !== firing) {
    if (shoot) await page.mouse.down();
    else await page.mouse.up();
    firing = shoot;
  }
}
function route(g, target) {
  const start = g.pos.map((v) => Math.round(v / 2)),
    end = [target.x / 2, target.z / 2].map(Math.round);
  const queue = [{ p: start, steps: [] }],
    seen = new Set([start.join(",")]);
  for (let i = 0; i < queue.length; i++) {
    const { p, steps } = queue[i];
    if (p[0] === end[0] && p[1] === end[1]) return steps;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = [p[0] + dx, p[1] + dz],
        key = n.join(","),
        c = g.map[n[1]]?.[n[0]];
      if (
        !c ||
        ["#", " "].includes(c) ||
        seen.has(key) ||
        g.gates.some((v) => v.closed && v.col === n[0] && v.row === n[1])
      )
        continue;
      seen.add(key);
      queue.push({ p: n, steps: [...steps, { x: n[0] * 2, z: n[1] * 2 }] });
    }
  }
  return [];
}
async function selectFloor(floor) {
  await controls();
  const g = await read();
  if (g.mode === "playing") {
    if (g.state === "playing") {
      await page.keyboard.press("Escape");
      await page.click("#pause-menu");
    } else await page.click("#back-menu");
  }
  await page.click("#open-route");
  await page.click(`#route-map button[data-floor="${floor}"]`);
  await page.click("#practice-start");
  await page.waitForFunction(
    (f) => window.__GAME__.floor === f && window.__GAME__.elapsed > 0.15,
    {},
    floor,
  );
}
try {
  page.on("pageerror", (e) => report.errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") report.errors.push(e.text());
  });
  await page.setViewport({
    width: 1280,
    height: 800,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.evaluate(() =>
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({
        unlocked: 19,
        cleared: Array.from({ length: 20 }, (_, i) => i),
      }),
    ),
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#open-route");
  await page.screenshot({
    path: new URL("route-desktop.png", out).pathname,
  });
  assert.equal(
    await page.$$eval("#route-map .route-node", (n) => n.length),
    25,
  );
  assert.equal(await page.$$eval("#route-map .boss-node", (n) => n.length), 5);
  await page.click("#route-close");
  let pushed = false,
    flour = false,
    warped = false,
    overtimeMusic = false;
  for (const floor of [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
    await selectFloor(floor);
    const initial = await read();
    let waypoint = null,
      previous = initial,
      screenshot = false;
    const deadline = Date.now() + (floor < 14 ? 35000 : 9000);
    while (Date.now() < deadline) {
      const g = await read();
      assert.equal(
        g.state,
        "playing",
        `Floor ${floor} should remain playable during the encounter`,
      );
      if (g.firstPerson) {
        await controls();
        await page.keyboard.press("KeyV");
        await sleep(900);
        waypoint = null;
        continue;
      }
      report.peakDraws = Math.max(report.peakDraws, g.draws);
      report.peakTriangles = Math.max(report.peakTriangles, g.tris);
      overtimeMusic ||= g.overtime > 0 && g.audio.score === "overtime";
      pushed ||= g.stock.some(
        (s, i) =>
          s.kind === "cart" &&
          Math.hypot(s.x - initial.stock[i].x, s.z - initial.stock[i].z) > 0.4,
      );
      flour ||= g.stock.some((s) => s.kind === "flour" && s.cloud > 0);
      warped ||= g.transportCooldown > 0;
      if (
        Math.hypot(g.pos[0] - previous.pos[0], g.pos[1] - previous.pos[1]) > 4
      )
        waypoint = null;
      const target =
        floor === 11 && !pushed
          ? g.stock
              .filter((s) => s.kind === "cart")
              .sort((a, b) => gap(g, a) - gap(g, b))[0]
          : floor === 12 && !warped
            ? g.portals.slice().sort((a, b) => gap(g, a) - gap(g, b))[0]
            : floor === 13 && !flour
              ? g.stock
                  .filter((s) => s.kind === "flour" && !s.broken)
                  .sort((a, b) => gap(g, a) - gap(g, b))[0]
              : g.batteries
                  .filter((b) => !b.collected)
                  .sort((a, b) => gap(g, a) - gap(g, b))[0] || g.map;
      if (target?.x !== undefined && (!waypoint || gap(g, waypoint) < 0.35))
        waypoint = route(g, target)[0] || target;
      const dx = waypoint ? waypoint.x - g.pos[0] : 0,
        dz = waypoint ? waypoint.z - g.pos[1] : 0;
      const enemy = g.enemies
        .filter(
          (e) =>
            e.respawn <= 0 &&
            e.screen.x > 0 &&
            e.screen.x < 1280 &&
            e.screen.y > 90 &&
            e.screen.y < 700,
        )
        .sort((a, b) => gap(g, a) - gap(g, b))[0];
      const shootingAt = target?.screen && gap(g, target) < 6 ? target : enemy;
      if (shootingAt)
        await page.mouse.move(shootingAt.screen.x, shootingAt.screen.y);
      await controls(
        [
          ...(Math.abs(dx) > 0.13 ? [dx > 0 ? "KeyD" : "KeyA"] : []),
          ...(Math.abs(dz) > 0.13 ? [dz > 0 ? "KeyS" : "KeyW"] : []),
        ],
        !!shootingAt,
      );
      if (g.dashCooldown === 0 && target?.kind === "cart" && gap(g, target) < 2)
        await page.keyboard.press("Space");
      if (!screenshot && g.elapsed > 5) {
        await page.screenshot({
          path: new URL(`floor-${floor}.png`, out).pathname,
        });
        screenshot = true;
      }
      if (
        (floor === 11 && pushed && overtimeMusic) ||
        (floor === 12 && warped) ||
        (floor === 13 && flour)
      )
        break;
      previous = g;
      await sleep(65);
    }
    await controls();
    report.floors.push({ floor, ...(await read()) });
    console.log(
      JSON.stringify({ floor, pushed, warped, flour, overtimeMusic }),
    );
  }
  assert.ok(pushed, "A stock cart moves after a real hit");
  assert.ok(warped, "Walking onto a pad transports the player");
  assert.ok(flour, "Real shots break a display and release flour");
  assert.ok(
    overtimeMusic,
    "Collecting a battery switches to the Overtime score",
  );
  report.checks.push(
    "Ten act-two floors render and accept real controls",
    "Real cart push, paired transport and flour explosion",
    "Battery pickup switches the original musical score",
  );
  await controls();
  await page.keyboard.press("Escape");
  await page.click("#pause-menu");
  for (const [name, width, height] of [
    ["portrait", 390, 844],
    ["landscape", 844, 390],
  ]) {
    await page.setViewport({
      width,
      height,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    await page.click("#open-route");
    await page.screenshot({
      path: new URL(`route-${name}.png`, out).pathname,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.click("#route-close");
  }
  report.checks.push(
    "Completed rescue reveals the expanded map at phone widths in both orientations",
  );
  assert.ok(report.peakDraws < 900);
  assert.ok(report.peakTriangles < 1500000);
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  report.last = await read().catch(() => null);
  await page
    .screenshot({ path: new URL("failure.png", out).pathname })
    .catch(() => {});
} finally {
  await writeFile(new URL("report.json", out), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      result: report.result,
      checks: report.checks,
      errors: report.errors,
      failure: report.failure,
      peakDraws: report.peakDraws,
      peakTriangles: report.peakTriangles,
    }),
  );
  await browser.close();
}
