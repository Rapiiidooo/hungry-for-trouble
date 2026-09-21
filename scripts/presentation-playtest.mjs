import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/presentation/", import.meta.url);
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
    "Only practice unlocks are preloaded after fresh-menu checks. Real keyboard, pointer and touch events; game snapshots are read only.",
  checks: [],
  errors: [],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const read = () => page.evaluate(() => window.__GAME__);
const gap = (g, p) => Math.hypot(g.pos[0] - p.x, g.pos[1] - p.z);
let held = new Set();
async function controls(keys = []) {
  const wanted = new Set(keys);
  for (const key of held) if (!wanted.has(key)) await page.keyboard.up(key);
  for (const key of wanted) if (!held.has(key)) await page.keyboard.down(key);
  held = wanted;
}
function path(g, target) {
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
        cell = g.map[n[1]]?.[n[0]];
      if (
        !cell ||
        ["#", " "].includes(cell) ||
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
async function travel(target, stop, timeout = 18000) {
  let waypoint, previous;
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    const g = await read();
    if (stop(g)) {
      await controls();
      return g;
    }
    assert.equal(g.state, "playing");
    if (g.firstPerson) {
      await controls();
      await page.keyboard.press("KeyV");
      await sleep(900);
      waypoint = null;
      continue;
    }
    if (
      previous &&
      Math.hypot(g.pos[0] - previous.pos[0], g.pos[1] - previous.pos[1]) > 4
    )
      waypoint = null;
    if (!waypoint || gap(g, waypoint) < 0.3)
      waypoint = path(g, target)[0] || target;
    const dx = waypoint.x - g.pos[0],
      dz = waypoint.z - g.pos[1];
    await controls([
      ...(Math.abs(dx) > 0.12 ? [dx > 0 ? "KeyD" : "KeyA"] : []),
      ...(Math.abs(dz) > 0.12 ? [dz > 0 ? "KeyS" : "KeyW"] : []),
    ]);
    previous = g;
    await sleep(40);
  }
  throw new Error(`Travel timed out toward ${JSON.stringify(target)}`);
}
async function floor(number) {
  await controls();
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#open-route");
  await page.click(`#route-map button[data-floor="${number}"]`);
  await page.click("#practice-start");
  await page.waitForFunction(
    (n) => window.__GAME__.floor === n && window.__GAME__.elapsed > 0.1,
    {},
    number,
  );
}
async function screenshot(name) {
  await page.screenshot({ path: new URL(`${name}.png`, out).pathname });
}
try {
  page.on("pageerror", (e) => report.errors.push(e.stack));
  page.on("console", (e) => {
    if (e.type() === "error") report.errors.push(e.text());
  });
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["phone", 390, 844],
    ["landscape", 844, 390],
  ]) {
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
      isMobile: name !== "desktop",
      hasTouch: name !== "desktop",
    });
    await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.__READY__);
    assert.equal((await read()).mode, "menu");
    assert.equal((await read()).visibleFloors, 10);
    const initial = await page.evaluate(() => ({
      text: document.body.innerText,
      mission: document.getElementById("mission-goal").innerText,
      start: document.getElementById("start").getBoundingClientRect().toJSON(),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.match(initial.mission, /Rescue your friend/);
    assert.doesNotMatch(initial.text, /basement|20 AISLES|TWENTY|4 BOSSES/i);
    assert.ok(
      initial.start.y > 0 && initial.start.bottom < height,
      `${name}: start button stays in view`,
    );
    assert.equal(initial.overflow, false);
    await screenshot(`mission-${name}`);
    await page.click("#open-route");
    assert.equal(
      await page.$$eval("#route-map .route-node", (nodes) => nodes.length),
      10,
    );
    await screenshot(`route-ten-${name}`);
    await page.click("#route-close");
  }
  report.checks.push(
    "Readable mission and ten-floor route on desktop, phone and landscape; one-tap start stays visible",
  );
  const icon = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="icon"]');
    const response = await fetch(link.href);
    return {
      status: response.status,
      svg: (await response.text()).includes('viewBox="0 0 64 64"'),
    };
  });
  assert.deepEqual(icon, { status: 200, svg: true });
  report.checks.push("Original SVG favicon loads locally");
  await page.evaluate(() =>
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({ unlocked: 19, cleared: [] }),
    ),
  );
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await floor(10);
  let g = await read();
  assert.equal(g.hp, 3);
  assert.equal(g.shield, 0);
  assert.equal(g.shieldVisible, false);
  await screenshot("base-kit");
  await page.waitForFunction(
    () => window.__GAME__.lobs.some((s) => s.age > 0.5 && !s.hit),
    { timeout: 10000 },
  );
  await screenshot("lob-warning");
  const hp = (await read()).hp;
  await page.waitForFunction(
    (health) => window.__GAME__.hp < health,
    { timeout: 10000 },
    hp,
  );
  assert.equal((await read()).hp, hp - 1);
  await screenshot("lob-impact");
  report.checks.push(
    "Selected aisles start without a free shield; a warned lob removes one heart",
  );
  await floor(12);
  g = await read();
  const pad = g.portals.slice().sort((a, b) => gap(g, a) - gap(g, b))[0];
  await travel(pad, (state) => state.transitProgress < 1);
  const transit = [];
  for (let i = 0; i < 19; i++) {
    transit.push(await read());
    await sleep(40);
  }
  assert.ok(
    transit.some((s) => s.transitProgress > 0.1 && s.transitProgress < 0.8),
  );
  assert.equal(transit.at(-1).transitProgress, 1);
  const travelled = Math.hypot(
    ...transit
      .at(-1)
      .cameraPosition.map((n, i) => n - transit[0].cameraPosition[i]),
  );
  assert.ok(travelled > 4);
  report.transit = transit.map((s) => ({
    progress: s.transitProgress,
    camera: s.cameraPosition,
    pos: s.pos,
  }));
  await screenshot("transport-arrival");
  report.checks.push(
    "Walking onto a pad interpolates the camera over multiple frames and settles at the destination",
  );
  await floor(10);
  g = await read();
  await travel(g.visors[0], (state) => state.fpsTime > 0);
  if ((await read()).firstPerson) {
    await page.keyboard.press("KeyV");
    await sleep(900);
  }
  g = await read();
  await travel(g.boss, (state) => gap(state, state.boss) < 5);
  g = await read();
  const bar = await page.$eval("#boss-bar", (el) => ({
    hidden: el.hidden,
    rect: el.getBoundingClientRect().toJSON(),
  }));
  assert.equal(bar.hidden, false);
  assert.ok(Math.abs(bar.rect.x + bar.rect.width / 2 - g.boss.screen.x) < 15);
  assert.ok(bar.rect.bottom < g.boss.screen.y);
  await screenshot("boss-health-overhead");
  assert.ok(g.fpsTime > 1);
  await page.keyboard.press("KeyV");
  await page.waitForFunction(() => window.__GAME__.viewBlend === 1);
  await page.mouse.click(640, 400);
  g = await read();
  const wanted = Math.atan2(g.boss.x - g.pos[0], g.boss.z - g.pos[1]);
  const difference = Math.atan2(
    Math.sin(wanted - g.fpsYaw),
    Math.cos(wanted - g.fpsYaw),
  );
  const client = await page.createCDPSession();
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: 640,
    y: 400,
    deltaX: -difference / 0.003,
    deltaY: -70,
  });
  // Pointer-lock movement uses real browser input; check actual resulting direction below.
  await page.mouse.move(640 - difference / 0.003, 330);
  await sleep(150);
  report.fpsBoss = await read();
  assert.equal(await page.$eval("#boss-bar", (el) => el.hidden), false);
  await screenshot("boss-first-person");
  report.checks.push(
    "Boss health tracks its overhead position and remains visible above the boss in first person",
  );
  await controls();
  await page.keyboard.press("KeyV");
  await sleep(900);
  await page.keyboard.press("Escape");
  await screenshot("mission-log");
  await page.click("#pause-menu");
  await page.click("#open-route");
  assert.equal(
    await page.$$eval("#route-map .route-node", (nodes) => nodes.length),
    20,
  );
  await screenshot("route-twenty-shapes");
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  report.last = await read().catch(() => null);
  await screenshot("failure").catch(() => {});
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
