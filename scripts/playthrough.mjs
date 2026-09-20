import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const fpsOnly = process.argv.includes("--fps");
const dailyOnly = process.argv.includes("--daily");
const output = new URL(
  fpsOnly
    ? "../outputs/fps/"
    : dailyOnly
      ? "../outputs/daily-survival/"
      : "../outputs/playthrough/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const report = {
  input:
    "Real keyboard and pointer events; read-only telemetry. No state injection.",
  errors: [],
  checks: [],
  floors: [],
  samples: [],
};
let page,
  held = new Set(),
  firing = false;
const read = () => page.evaluate(() => window.__GAME__);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

async function setKeys(next) {
  const wanted = new Set(next);
  for (const key of held) if (!wanted.has(key)) await page.keyboard.up(key);
  for (const key of wanted) if (!held.has(key)) await page.keyboard.down(key);
  held = wanted;
}
async function shoot(value) {
  if (value === firing) return;
  if (value) await page.mouse.down();
  else await page.mouse.up();
  firing = value;
}
function routes(g) {
  const start = g.pos.map((n) => Math.round(n / 2)),
    queue = [start];
  const found = new Map([[start.join(","), { path: [], point: start }]]);
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i],
      route = found.get(at.join(","));
    for (const [dx, dz] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const next = [at[0] + dx, at[1] + dz],
        key = next.join(",");
      if (
        !g.map[next[1]]?.[next[0]] ||
        ["#", " "].includes(g.map[next[1]][next[0]]) ||
        found.has(key)
      )
        continue;
      if (
        g.gates.some(
          (gate) => gate.col === next[0] && gate.row === next[1] && gate.closed,
        )
      )
        continue;
      found.set(key, {
        path: [...route.path, next.map((n) => n * 2)],
        point: next,
      });
      queue.push(next);
    }
  }
  return found;
}
function lineOfSight(g, target) {
  const d = distance(g.pos, [target.x, target.z]);
  for (let i = 1; i < d * 5; i++) {
    const x = g.pos[0] + ((target.x - g.pos[0]) * i) / (d * 5);
    const z = g.pos[1] + ((target.z - g.pos[1]) * i) / (d * 5);
    if (["#", " "].includes(g.map[Math.round(z / 2)]?.[Math.round(x / 2)]))
      return false;
  }
  return true;
}
function choosePath(g) {
  const found = routes(g);
  const pathFor = (point) =>
    found.get(point.map((n) => Math.round(n / 2)).join(","))?.path;
  if (g.hp <= 2) {
    const repairs = g.repairs
      .filter((r) => !r.collected)
      .map((r) => pathFor([r.x, r.z]))
      .filter((p) => p?.length)
      .sort((a, b) => a.length - b.length);
    if (repairs[0]) return repairs[0];
  }
  if (fpsOnly && g.floor === 2 && g.visors.some((v) => !v.collected)) {
    const visor = g.visors.find((v) => !v.collected);
    return pathFor([visor.x, visor.z]) || [];
  }
  const candidates = g.crumbs
    .map((point) => ({ point, path: pathFor(point) }))
    .filter((c) => c.path);
  const batteries = g.batteries
    .filter((b) => !b.collected)
    .map((b) => ({ point: [b.x, b.z], path: pathFor([b.x, b.z]) }))
    .filter((c) => c.path);
  const nearestBattery = batteries.sort(
    (a, b) => a.path.length - b.path.length,
  )[0];
  if (
    g.overtime < 0.5 &&
    nearestBattery &&
    (nearestBattery.path.length <= 7 || g.boss?.hp > 0)
  )
    return nearestBattery.path.length
      ? nearestBattery.path
      : [nearestBattery.point];
  if (
    g.runKind !== "daily" &&
    g.collected >= g.quota &&
    (!g.boss || g.boss.hp <= 0)
  )
    return pathFor([g.exit.x, g.exit.z]) || [];
  if (g.boss?.hp > 0 && g.collected >= g.quota) {
    const targets = [
      [g.boss.x - 6, g.boss.z],
      [g.boss.x + 6, g.boss.z],
      [g.boss.x, g.boss.z + 6],
      [g.boss.x, g.boss.z - 6],
    ];
    const usable = targets
      .map((point) => ({ point, path: pathFor(point) }))
      .filter((c) => c.path && distance(g.pos, c.point) > 1.5)
      .sort((a, b) => a.path.length - b.path.length);
    return usable[0]?.path || [];
  }
  candidates.sort((a, b) => a.path.length - b.path.length);
  const selected = candidates[0];
  return selected
    ? selected.path.length
      ? selected.path
      : [selected.point]
    : [];
}

try {
  page = await browser.newPage();
  page.on("pageerror", (e) => report.errors.push(e.stack));
  page.on("console", (e) => {
    if (e.type() === "error") report.errors.push(e.text());
  });
  await page.setViewport({
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: fpsOnly,
    hasTouch: fpsOnly,
  });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#start");
  await page.waitForFunction(() => window.__GAME__?.elapsed > 0.5);
  let before = await read();
  await setKeys(["KeyD"]);
  await sleep(400);
  await setKeys([]);
  await sleep(80);
  let after = await read();
  assert.ok(after.pos[0] > before.pos[0] + 1);
  before = after;
  await setKeys(["KeyA"]);
  await sleep(250);
  await setKeys([]);
  await sleep(80);
  after = await read();
  assert.ok(after.pos[0] < before.pos[0] - 0.5);
  report.checks.push("Screen-relative left and right");
  await setKeys(["KeyD"]);
  await page.keyboard.press("Space");
  await sleep(180);
  await setKeys([]);
  after = await read();
  assert.ok(after.dashCooldown > 0.6);
  report.checks.push("Dash on a real Space press");
  await page.keyboard.press("Escape");
  await sleep(100);
  before = await read();
  await sleep(300);
  after = await read();
  assert.equal(after.elapsed, before.elapsed);
  assert.equal(after.paused, true);
  await page.click("#resume");
  await sleep(150);
  assert.equal((await read()).paused, false);
  report.checks.push("Pause freezes simulation and resumes");
  assert.equal((await read()).audio.state, "running");
  report.checks.push("Audio starts after the start gesture");
  await page.keyboard.press("Escape");
  await page.click("#pause-retry");
  await page.waitForFunction(
    () => !window.__GAME__.paused && window.__GAME__.elapsed < 1,
  );
  if (dailyOnly) {
    await page.keyboard.press("Escape");
    await page.click("#pause-menu");
    await page.click("#open-daily");
    await page.waitForFunction(
      () => !document.getElementById("daily-start").disabled,
    );
    await page.click("#daily-start");
    await page.waitForFunction(
      () =>
        window.__GAME__.runKind === "daily" && window.__GAME__.elapsed > 0.2,
    );
  }

  let waypoint = null,
    previous = null,
    lastFloor = 1,
    lastLog = 0,
    sawOvertime = false,
    sawFPS = false,
    screenshots = new Set();
  const deadline = Date.now() + 720000;
  while (Date.now() < deadline) {
    const g = await read();
    if (g.firstPerson) {
      await setKeys([]);
      await shoot(false);
      if (!sawFPS) {
        const transition = [];
        for (let sample = 0; sample < 10; sample++) {
          transition.push((await read()).viewBlend);
          await sleep(85);
        }
        assert.ok(
          transition.some((value) => value > 0 && value < 1),
          "Camera entry must interpolate",
        );
        await page.waitForFunction(() => window.__GAME__.viewBlend === 1);
        report.checks.push(
          "Overhead-to-FPS camera interpolates continuously and settles",
        );
        await page.mouse.click(640, 400);
        await sleep(120);
        const beforeLook = await read();
        await page.mouse.move(735, 420);
        await sleep(150);
        const afterLook = await read();
        assert.ok(afterLook.firstPerson && afterLook.fpsTime > 0);
        assert.ok(
          Math.abs(afterLook.fpsYaw - beforeLook.fpsYaw) > 0.05,
          "Mouse movement must turn the first-person camera",
        );
        const shots = afterLook.shots;
        await shoot(true);
        await sleep(350);
        await shoot(false);
        assert.ok((await read()).shots > shots);
        await page.screenshot({
          path: new URL("first-person.png", output).pathname,
        });
        report.checks.push(
          "Visor pickup enters first person; real mouse look and firing work",
        );
        if (fpsOnly) {
          await page.keyboard.press("KeyV");
          await sleep(200);
          assert.ok(
            (await read()).viewBlend > 0 && (await read()).viewBlend < 1,
          );
          await page.keyboard.press("KeyV");
          await page.waitForFunction(() => window.__GAME__.viewBlend === 1);
          report.checks.push(
            "Camera transition reverses mid-flight without snapping or pausing",
          );
          await page.emulateMediaFeatures([
            { name: "prefers-reduced-motion", value: "reduce" },
          ]);
          await page.keyboard.press("KeyV");
          await sleep(120);
          assert.equal((await read()).viewBlend, 0);
          await page.keyboard.press("KeyV");
          await sleep(120);
          assert.equal((await read()).viewBlend, 1);
          await page.emulateMediaFeatures([
            { name: "prefers-reduced-motion", value: "no-preference" },
          ]);
          report.checks.push(
            "Reduced motion changes view without a camera flight",
          );
          await page.setViewport({
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
          });
          await sleep(200);
          const client = await page.createCDPSession();
          const points = await page.evaluate(() =>
            ["move-stick", "aim-stick"].map((id, i) => {
              const r = document.getElementById(id).getBoundingClientRect();
              return { id: i + 1, x: r.x + r.width / 2, y: r.y + r.height / 2 };
            }),
          );
          const beforeTouch = await read();
          await client.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: points,
          });
          await client.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [
              { ...points[0], y: points[0].y - 30 },
              { ...points[1], x: points[1].x + 26 },
            ],
          });
          await sleep(400);
          await client.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
          const afterTouch = await read();
          assert.ok(
            Math.abs(afterTouch.fpsYaw - beforeTouch.fpsYaw) > 0.3,
            "The right touch stick must turn the FPS view",
          );
          assert.ok(
            afterTouch.shots > beforeTouch.shots,
            "The right touch stick must fire in FPS",
          );
          assert.ok(
            distance(afterTouch.pos, beforeTouch.pos) > 0.2,
            "The left touch stick must move in FPS",
          );
          await page.screenshot({
            path: new URL("first-person-mobile.png", output).pathname,
          });
          report.checks.push(
            "Simultaneous touch movement, look and fire work in first person",
          );
        }
        sawFPS = true;
      }
      await page.keyboard.press("KeyV");
      await sleep(950);
      assert.equal((await read()).firstPerson, false);
      assert.equal((await read()).paused, false);
      if (fpsOnly && sawFPS) break;
      continue;
    }
    if (g.state === "lost")
      throw new Error(
        `Lost on aisle ${g.floor}, crumbs ${g.collected}/${g.quota}, time ${g.time.toFixed(1)}`,
      );
    if (g.state === "cleared" || g.state === "won") {
      await setKeys([]);
      await shoot(false);
      report.floors.push({
        floor: g.floor,
        seconds: g.elapsed,
        kills: g.kills,
        crumbs: g.collected,
        score: g.score,
        hp: g.hp,
        upgrades: g.upgrades,
      });
      await page.screenshot({
        path: new URL(`floor-${g.floor}-cleared.png`, output).pathname,
      });
      console.log(JSON.stringify({ cleared: report.floors.at(-1) }));
      if (g.state === "won") break;
      await page.click(
        `[data-upgrade="${g.floor === 1 || g.floor === 3 ? "spread" : "rapid"}"]`,
      );
      await page.waitForFunction(
        (old) => window.__GAME__.floor > old && window.__GAME__.elapsed > 0.2,
        {},
        g.floor,
      );
      waypoint = null;
      previous = null;
      lastFloor = g.floor + 1;
      continue;
    }
    if (g.overtime > 0) sawOvertime = true;
    if (!screenshots.has(g.floor) && g.elapsed > 4) {
      await page.screenshot({
        path: new URL(`floor-${g.floor}-playing.png`, output).pathname,
      });
      screenshots.add(g.floor);
    }
    if (
      !waypoint ||
      distance(g.pos, waypoint) < (g.theme === "ice" ? 0.45 : 0.32)
    )
      waypoint = choosePath(g)[0];
    if (
      waypoint &&
      g.gates.some(
        (gate) => gate.closed && distance([gate.x, gate.z], waypoint) < 0.5,
      )
    )
      waypoint = choosePath(g)[0];
    const deltaT = previous ? g.elapsed - previous.elapsed : 0;
    const velocity =
      previous && deltaT > 0
        ? g.pos.map((p, i) => (p - previous.pos[i]) / deltaT)
        : [0, 0];
    const ahead = g.theme === "ice" ? 0.12 : 0.015;
    const dx = waypoint ? waypoint[0] - g.pos[0] - velocity[0] * ahead : 0;
    const dz = waypoint ? waypoint[1] - g.pos[1] - velocity[1] * ahead : 0;
    const next = [];
    if (Math.abs(dx) > 0.12) next.push(dx > 0 ? "KeyD" : "KeyA");
    if (Math.abs(dz) > 0.12) next.push(dz > 0 ? "KeyS" : "KeyW");
    await setKeys(next);
    const targets = [
      ...g.enemies.filter((e) => e.respawn <= 0),
      ...(g.boss?.hp > 0 ? [g.boss] : []),
    ];
    const target = targets
      .filter(
        (e) =>
          distance(g.pos, [e.x, e.z]) < 13 &&
          lineOfSight(g, e) &&
          e.screen.x > 20 &&
          e.screen.x < 1260 &&
          e.screen.y > 130 &&
          e.screen.y < 720,
      )
      .sort(
        (a, b) => distance(g.pos, [a.x, a.z]) - distance(g.pos, [b.x, b.z]),
      )[0];
    if (target) await page.mouse.move(target.screen.x, target.screen.y);
    await shoot(Boolean(target));
    if (Date.now() - lastLog > 7000) {
      const sample = {
        floor: g.floor,
        elapsed: +g.elapsed.toFixed(1),
        pos: g.pos.map((v) => +v.toFixed(1)),
        waypoint,
        crumbs: g.collected,
        hp: g.hp,
        kills: g.kills,
        overtime: +g.overtime.toFixed(1),
        boss: g.boss?.hp,
        fps: g.fps,
        draws: g.draws,
      };
      report.samples.push(sample);
      console.log(JSON.stringify(sample));
      lastLog = Date.now();
    }
    previous = g;
    await sleep(65);
  }
  const end = await read();
  if (dailyOnly) {
    assert.equal(end.state, "won");
    assert.equal(end.dailyTicks, 5400);
    await page.type("#score-name", "QA_SURVIVOR");
    await page.click("#submit-score");
    await page.waitForFunction(
      () =>
        document
          .getElementById("score-status")
          .textContent.includes("VERIFIED"),
      { timeout: 20000 },
    );
    await page.screenshot({
      path: new URL("survived-verified.png", output).pathname,
    });
    report.checks.push(
      "Full 90-second daily survival is replayed and accepted by the server",
    );
  } else if (!fpsOnly) {
    assert.equal(
      end.state,
      "won",
      "Campaign must end through its real checkout",
    );
    assert.equal(report.floors.length, 10);
    assert.ok(sawOvertime);
    assert.ok(report.floors.some((f) => f.kills > 0));
    report.checks.push(
      "All ten floors cleared through actual movement and firing",
      "Overtime collected through movement",
      "Shots defeat pursuing enemies",
      "Repeated upgrades change the arsenal",
      "Final boss defeated before checkout",
    );
    await page.click("#retry");
    await page.waitForFunction(
      () => window.__GAME__.state === "playing" && window.__GAME__.floor === 1,
    );
    assert.equal((await read()).hp, 4);
    report.checks.push("Retry resets campaign, health and upgrades");
    await page.waitForFunction(() => window.__GAME__.state === "lost", {
      timeout: 70000,
    });
    await page.screenshot({ path: new URL("lost.png", output).pathname });
    report.checks.push("Enemy contact causes a real loss");
    await page.click("#retry");
    await page.waitForFunction(() => window.__GAME__.state === "playing");
    assert.equal((await read()).hp, 4);
    report.checks.push("Immediate retry after death");
  } else {
    assert.ok(sawFPS);
    assert.equal(end.firstPerson, false);
    await page.keyboard.press("Escape");
    await page.click("#pause-route");
    assert.equal(
      await page.$$eval(
        "#route-map button:not(:disabled)",
        (nodes) => nodes.length,
      ),
      2,
    );
    await page.screenshot({
      path: new URL("unlocked-route.png", output).pathname,
    });
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.__READY__);
    await page.click("#open-route");
    assert.equal(
      await page.$$eval(
        "#route-map button:not(:disabled)",
        (nodes) => nodes.length,
      ),
      2,
    );
    await page.click("#route-map button:nth-child(2)");
    await page.click("#practice-start");
    await page.waitForFunction(
      () =>
        window.__GAME__.floor === 2 && window.__GAME__.runKind === "practice",
    );
    report.checks.push(
      "Completed stages stay unlocked after reload and launch as practice",
    );
  }
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  if (page) {
    report.last = await read().catch(() => null);
    await page
      .screenshot({ path: new URL("failure.png", output).pathname })
      .catch(() => {});
  }
  console.error(error.message);
} finally {
  await writeFile(
    new URL("report.json", output),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      result: report.result,
      checks: report.checks,
      errors: report.errors,
    }),
  );
  await browser.close();
}
