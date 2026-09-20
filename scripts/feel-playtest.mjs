import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/feel/", import.meta.url);
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
    "Practice unlocks are preloaded; no combat state is injected. Movement, visor pickup and view changes use real controls.",
  checks: [],
  errors: [],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const read = () => page.evaluate(() => window.__GAME__);
let held = new Set();
async function keys(next) {
  const wanted = new Set(next);
  for (const key of held) if (!wanted.has(key)) await page.keyboard.up(key);
  for (const key of wanted) if (!held.has(key)) await page.keyboard.down(key);
  held = wanted;
}
function path(g, target) {
  const start = g.pos.map((n) => Math.round(n / 2)),
    end = target.map((n) => Math.round(n / 2));
  const queue = [{ p: start, route: [] }],
    seen = new Set([start.join(",")]);
  for (let i = 0; i < queue.length; i++) {
    const { p, route } = queue[i];
    if (p[0] === end[0] && p[1] === end[1]) return route;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = [p[0] + dx, p[1] + dz],
        k = n.join(",");
      if (
        seen.has(k) ||
        !g.map[n[1]]?.[n[0]] ||
        ["#", " "].includes(g.map[n[1]][n[0]])
      )
        continue;
      seen.add(k);
      queue.push({ p: n, route: [...route, n.map((v) => v * 2)] });
    }
  }
  return [];
}
try {
  page.on("pageerror", (e) => report.errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`);
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
      JSON.stringify({ unlocked: 9, cleared: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }),
    ),
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#open-route");
  await page.screenshot({ path: new URL("route-shapes.png", out).pathname });
  await page.click("#route-map button:nth-child(6)");
  await page.click("#practice-start");
  await page.waitForFunction(
    () => window.__GAME__.floor === 6 && window.__GAME__.elapsed > 0.1,
  );
  let waypoint = null,
    entered = false,
    captured = false;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const g = await read();
    assert.equal(g.state, "playing", "Practice encounter must stay playable");
    if (g.firstPerson && !entered) {
      await page.keyboard.press("KeyV");
      entered = true;
      await sleep(900);
      continue;
    }
    const drone = g.enemies
      .filter((e) => e.kind === "shooter" && e.respawn <= 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - g.pos[0], a.z - g.pos[1]) -
          Math.hypot(b.x - g.pos[0], b.z - g.pos[1]),
      )[0];
    if (entered && g.hazards.length && g.fpsTime > 2) {
      await keys([]);
      await page.mouse.move(drone.screen.x, drone.screen.y);
      await sleep(100);
      await page.keyboard.press("KeyV");
      await page.waitForFunction(() => window.__GAME__.viewBlend === 1);
      await page.waitForFunction(() => window.__GAME__.hazards.length > 0, {
        timeout: 5000,
      });
      await page.screenshot({
        path: new URL("receipt-fire-fps.png", out).pathname,
      });
      report.encounter = await read();
      captured = true;
      break;
    }
    const target = !entered
      ? [g.visors[0].x, g.visors[0].z]
      : [drone.x, drone.z];
    if (
      !waypoint ||
      Math.hypot(waypoint[0] - g.pos[0], waypoint[1] - g.pos[1]) < 0.3
    )
      waypoint = path(g, target)[0];
    if (!waypoint) {
      await keys([]);
      await sleep(80);
      continue;
    }
    const dx = waypoint[0] - g.pos[0],
      dz = waypoint[1] - g.pos[1];
    await keys([
      ...(Math.abs(dx) > 0.12 ? [dx > 0 ? "KeyD" : "KeyA"] : []),
      ...(Math.abs(dz) > 0.12 ? [dz > 0 ? "KeyS" : "KeyW"] : []),
    ]);
    await sleep(65);
  }
  await keys([]);
  assert.ok(captured, "A real receipt-firing encounter must be visible in FPS");
  report.checks.push(
    "Real visor pickup, drone warning and enemy receipt volley in first person",
  );
  await page.keyboard.press("Escape");
  const t = (await read()).fpsTime;
  await sleep(500);
  assert.equal((await read()).fpsTime, t);
  await page.click("#resume");
  await page.waitForFunction(
    () => window.__GAME__.fpsTime === 0 || window.__GAME__.state !== "playing",
    { timeout: 23000 },
  );
  await sleep(1000);
  assert.equal((await read()).viewBlend, 0);
  assert.equal((await read()).pointerLocked, false);
  report.checks.push(
    `Pause freezes visor time; ${(await read()).fpsTime === 0 ? "visor expiry" : "run ending"} returns smoothly overhead and releases look`,
  );
  if ((await read()).state === "playing") {
    await page.keyboard.press("Escape");
    await page.click("#pause-menu");
  } else await page.click("#back-menu");
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
    await page.screenshot({ path: new URL(`menu-${name}.png`, out).pathname });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.click("#open-route");
    await page.screenshot({ path: new URL(`route-${name}.png`, out).pathname });
    await page.click("#route-close");
  }
  report.checks.push(
    "Neutral menu and generated route silhouettes fit portrait and landscape",
  );
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (e) {
  report.result = "FAIL";
  report.failure = e.stack;
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
      failure: report.failure,
      errors: report.errors,
    }),
  );
  await browser.close();
}
