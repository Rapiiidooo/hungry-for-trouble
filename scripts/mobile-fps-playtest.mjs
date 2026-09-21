import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/mobile-fps/", import.meta.url);
await mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  scope:
    "Disposable practice unlock only; actual floor-two movement, visor pickup and FPS input with simultaneous CDP touches. No combat injection, shared score or claim of campaign completion. Chrome emulation, not a physical phone.",
  checks: [],
  errors: [],
  runs: [],
};
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
let page;
function route(g, target) {
  const start = g.pos.map((n) => Math.round(n / 2)),
    goal = [Math.round(target.x / 2), Math.round(target.z / 2)],
    queue = [{ p: start, path: [] }],
    seen = new Set([start.join(",")]);
  for (let i = 0; i < queue.length; i++) {
    const { p, path } = queue[i];
    if (p[0] === goal[0] && p[1] === goal[1]) return path;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = [p[0] + dx, p[1] + dz],
        key = n.join(",");
      if (
        seen.has(key) ||
        !g.map[n[1]]?.[n[0]] ||
        ["#", " "].includes(g.map[n[1]][n[0]])
      )
        continue;
      seen.add(key);
      queue.push({ p: n, path: [...path, n.map((v) => v * 2)] });
    }
  }
  throw new Error("Visor must be reachable");
}
const delta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
try {
  for (const [name, width, height] of [
    ["portrait", 390, 844],
    ["landscape", 844, 390],
    ["narrow", 320, 568],
  ]) {
    const context = await browser.createBrowserContext();
    page = await context.newPage();
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    page.on("pageerror", (error) => report.errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      if (location.protocol !== "http:" && location.protocol !== "https:")
        return;
      Object.defineProperty(navigator, "doNotTrack", { get: () => "1" });
      localStorage.setItem(
        "hft-route-v1",
        JSON.stringify({ unlocked: 1, cleared: [0] }),
      );
    });
    await page.goto(process.env.GAME_URL || "http://localhost:3001/", {
      waitUntil: "networkidle0",
    });
    await page.waitForFunction(() => window.__READY__);
    const read = () => page.evaluate(() => window.__GAME__);
    const centre = (selector) =>
      page.$eval(selector, (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
    const tap = async (selector) => {
      const p = await centre(selector);
      await page.touchscreen.tap(p.x, p.y);
    };
    await tap("#open-route");
    await tap('#route-map button[data-floor="2"]');
    await tap("#practice-start");
    await page.waitForFunction(
      () => window.__GAME__.floor === 2 && window.__GAME__.elapsed > 0.1,
    );
    const client = await page.createCDPSession();
    const send = (type, touchPoints) =>
      client.send("Input.dispatchTouchEvent", { type, touchPoints });
    const move = { ...(await centre("#move-stick")), id: 1 },
      aim = { ...(await centre("#aim-stick")), id: 2 };
    let waypoint = null;
    const deadline = Date.now() + 15000;
    await send("touchStart", [move]);
    while (Date.now() < deadline) {
      const g = await read();
      assert.equal(
        g.state,
        "playing",
        "Real pickup approach must remain alive",
      );
      if (g.firstPerson) break;
      if (
        !waypoint ||
        Math.hypot(waypoint[0] - g.pos[0], waypoint[1] - g.pos[1]) < 0.28
      )
        waypoint = route(g, g.visors[0])[0] || [g.visors[0].x, g.visors[0].z];
      const dx = waypoint[0] - g.pos[0],
        dz = waypoint[1] - g.pos[1],
        length = Math.max(0.25, Math.hypot(dx, dz));
      await send("touchMove", [
        {
          ...move,
          x: move.x + (dx / length) * 31,
          y: move.y + (dz / length) * 31,
        },
      ]);
      await sleep(45);
    }
    await send("touchEnd", []);
    await page.waitForFunction(() => window.__GAME__.viewBlend === 1, {
      timeout: 3000,
    });
    const pickup = await read();
    assert.ok(
      pickup.visors[0].collected && pickup.firstPerson && pickup.fpsTime > 10,
    );
    let before = await read();
    await send("touchStart", [aim]);
    await sleep(320);
    let after = await read();
    assert.ok(
      after.shots > before.shots,
      "A centred held thumb fires without needing an aim offset",
    );
    assert.equal(after.fpsPitch, 0);
    await send("touchMove", [{ ...aim, y: aim.y - 35 }]);
    await sleep(150);
    assert.equal(
      (await read()).fpsPitch,
      0,
      "Vertical thumb drift cannot aim into the ceiling or floor",
    );
    before = await read();
    const turned = { ...aim, x: aim.x + 34, y: aim.y - 35 };
    await send("touchMove", [turned]);
    await sleep(80);
    after = await read();
    assert.ok(
      delta(after.fpsYaw, before.fpsYaw) < -0.2,
      "A rightward drag turns right",
    );
    await sleep(250);
    const held = await read();
    if (!after.touchAimAssist && !held.touchAimAssist)
      assert.ok(
        Math.abs(delta(held.fpsYaw, after.fpsYaw)) < 0.02,
        "Holding an offset thumb no longer spins the camera",
      );
    const moving = { ...move, y: move.y - 31 };
    before = await read();
    await send("touchStart", [moving, turned]);
    await sleep(400);
    after = await read();
    assert.ok(
      Math.hypot(after.pos[0] - before.pos[0], after.pos[1] - before.pos[1]) >
        0.25,
      "Left thumb movement and right thumb fire work together",
    );
    assert.ok(after.shots > before.shots);
    const dash = { ...(await centre("#dash-button")), id: 3 };
    await send("touchStart", [moving, turned, dash]);
    await sleep(100);
    assert.ok((await read()).dashCooldown > 0.7);
    await send("touchEnd", []);
    await sleep(350);
    const stopped = await read();
    await sleep(200);
    assert.equal((await read()).shots, stopped.shots, "Release stops fire");
    // This aisle is ice: verify the drift settles instead of assuming instant braking.
    await page.waitForFunction(() => window.__GAME__.speed < 0.1, {
      timeout: 2000,
    });
    await send("touchStart", [aim]);
    await send("touchCancel", []);
    await sleep(200);
    assert.equal(
      (await read()).touchFiring,
      false,
      "Cancellation clears firing",
    );
    const look = { id: 4, x: width * 0.58, y: height * 0.42 };
    before = await read();
    await send("touchStart", [look]);
    await send("touchMove", [{ ...look, x: look.x + width * 0.2 }]);
    await sleep(180);
    after = await read();
    assert.ok(
      delta(after.fpsYaw, before.fpsYaw) < -0.4,
      "The right half of the scene accepts a broad swipe, beyond the small pad",
    );
    assert.ok(after.shots > before.shots);
    assert.equal(after.fpsPitch, 0);
    await send("touchEnd", []);
    await tap("#map-toggle");
    assert.equal(
      await page.$eval("#map-toggle", (el) => el.getAttribute("aria-expanded")),
      "true",
    );
    assert.ok(
      await page.$eval(
        "#minimap",
        (el) => el.getBoundingClientRect().width > 100,
      ),
    );
    await tap("#map-toggle");
    await tap("#pause");
    const frozen = await read();
    await sleep(220);
    assert.equal((await read()).fpsTime, frozen.fpsTime);
    assert.ok(
      await page.$eval("#pause-status", (el) =>
        el.textContent.includes("POINTS"),
      ),
    );
    await tap("#resume");
    await tap("#view-toggle");
    await page.waitForFunction(() => window.__GAME__.viewBlend === 0);
    assert.equal((await read()).touchFiring, false);
    await tap("#view-toggle");
    await page.waitForFunction(() => window.__GAME__.viewBlend === 1);
    await page.screenshot({ path: new URL(`${name}.png`, out).pathname });
    const controls = await page.evaluate(() =>
      [
        "move-stick",
        "aim-stick",
        "dash-button",
        "view-toggle",
        "map-toggle",
        "pause",
        "sound",
      ].map((id) => {
        const r = document.getElementById(id).getBoundingClientRect();
        return {
          id,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          right: r.right,
          bottom: r.bottom,
        };
      }),
    );
    for (const r of controls) {
      assert.ok(
        r.x >= 0 && r.y >= 0 && r.right <= width && r.bottom <= height,
        `${name}: ${r.id} is in view`,
      );
      assert.ok(
        r.width >= 44 && r.height >= 44,
        `${name}: ${r.id} remains touchable`,
      );
      for (const other of controls.filter((c) => c.id !== r.id)) {
        assert.ok(
          Math.min(r.right, other.right) <= Math.max(r.x, other.x) ||
            Math.min(r.bottom, other.bottom) <= Math.max(r.y, other.y),
          `${name}: ${r.id} and ${other.id} must not overlap`,
        );
      }
    }
    report.runs.push({
      name,
      pickup: { time: pickup.elapsed, hp: pickup.hp },
      after: {
        hp: (await read()).hp,
        shots: (await read()).shots,
        pitch: (await read()).fpsPitch,
      },
      controls,
    });
    report.checks.push(
      `${name}: real visor, hold fire, pad and right-half swipes, stable horizon, two thumbs plus dodge, release/cancel, map, pause and view reversal`,
    );
    console.log(report.checks.at(-1));
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  if (page && !page.isClosed()) {
    report.last = await page.evaluate(() => window.__GAME__).catch(() => null);
    await page
      .screenshot({ path: new URL("failure.png", out).pathname })
      .catch(() => {});
  }
} finally {
  await writeFile(
    new URL("report.json", out),
    JSON.stringify(report, null, 2) + "\n",
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
