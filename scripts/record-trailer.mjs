import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/trailer/", import.meta.url);
await mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const width = 1280,
  height = 720;
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const read = () => page.evaluate(() => window.__GAME__);
const report = {
  scope:
    "Real keyboard and mouse gameplay in a disposable practice profile with route unlocks preloaded. No combat, health, ammunition, upgrades or position injection; no score submission. Edited excerpts are not a continuous campaign playthrough.",
  width,
  height,
  clips: [],
  errors: [],
};
let held = new Set(),
  firing = false,
  recorder,
  recordingStart,
  current;
const gap = (g, p) => Math.hypot(g.pos[0] - p.x, g.pos[1] - p.z);
async function controls(wanted = [], shoot = false) {
  for (const key of held)
    if (!wanted.includes(key)) await page.keyboard.up(key);
  for (const key of wanted) if (!held.has(key)) await page.keyboard.down(key);
  held = new Set(wanted);
  if (shoot !== firing) await page.mouse[shoot ? "down" : "up"]();
  firing = shoot;
}
function routes(g, allowPortal) {
  const start = g.pos.map((v) => Math.round(v / 2));
  const queue = [start],
    found = new Map([[start.join(","), []]]);
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i],
      path = found.get(at.join(","));
    for (const [dx, dz] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const p = [at[0] + dx, at[1] + dz],
        id = p.join(","),
        tile = g.map[p[1]]?.[p[0]];
      if (!tile || ["#", " "].includes(tile) || found.has(id)) continue;
      if (
        tile === "P" &&
        (!allowPortal ||
          p[0] * 2 !== allowPortal.x ||
          p[1] * 2 !== allowPortal.z)
      )
        continue;
      if (
        g.doors.some(
          (d) =>
            !d.open &&
            d.col === p[0] &&
            d.row === p[1] &&
            !g.keyring.includes(d.color),
        )
      )
        continue;
      found.set(id, [...path, p.map((v) => v * 2)]);
      queue.push(p);
    }
  }
  return found;
}
function pathTo(found, p) {
  return found.get([p.x, p.z].map((v) => Math.round(v / 2)).join(","));
}
function clearSight(g, p) {
  const steps = Math.ceil(gap(g, p) * 5);
  for (let i = 1; i < steps; i++) {
    const col = Math.round((g.pos[0] + ((p.x - g.pos[0]) * i) / steps) / 2);
    const row = Math.round((g.pos[1] + ((p.z - g.pos[1]) * i) / steps) / 2);
    if (
      ["#", " ", undefined].includes(g.map[row]?.[col]) ||
      g.doors.some((d) => !d.open && d.col === col && d.row === row)
    )
      return false;
  }
  return true;
}
function closest(g, points, found = routes(g)) {
  return points
    .map((p) => ({ p, path: pathTo(found, p) }))
    .filter((c) => c.path)
    .sort((a, b) => a.path.length - b.path.length)[0]?.p;
}
function objective(g, mode) {
  const found = routes(g);
  if (mode === "portal" && !current.marks.teleport) {
    return g.portals.slice().sort((a, b) => gap(g, a) - gap(g, b))[0];
  }
  if (mode === "visor" && !current.marks.visor)
    return closest(
      g,
      g.visors.filter((v) => !v.collected),
      found,
    );
  if (g.hp <= 1) {
    const repair = closest(
      g,
      g.repairs.filter((r) => !r.collected),
      found,
    );
    if (repair) return repair;
  }
  if (mode === "keys") {
    const card = closest(
      g,
      g.keycards.filter((k) => !k.collected),
      found,
    );
    if (card) return card;
    const door = g.doors.find(
      (d) => !d.open && g.keyring.includes(d.color) && pathTo(found, d),
    );
    if (door) return door;
  }
  if (g.collected >= g.quota && !g.boss && mode === "clear") return g.exit;
  if (g.overtime < 0.1) {
    const battery = closest(
      g,
      g.batteries.filter((b) => !b.collected),
      found,
    );
    if (battery && pathTo(found, battery).length < 10) return battery;
  }
  if (mode === "boss" && g.boss && gap(g, g.boss) > 7) {
    const positions = [
      [-5, 0],
      [5, 0],
      [0, -5],
      [0, 5],
    ].map(([dx, dz]) => ({
      x: Math.round((g.boss.x + dx) / 2) * 2,
      z: Math.round((g.boss.z + dz) / 2) * 2,
    }));
    const position = closest(g, positions, found);
    if (position) return position;
  }
  return closest(
    g,
    g.crumbs.map(([x, z]) => ({ x, z })),
    found,
  );
}
function mark(name, g) {
  if (current.marks[name] !== undefined) return;
  current.marks[name] = +((performance.now() - recordingStart) / 1000).toFixed(
    3,
  );
  console.log(
    JSON.stringify({ floor: g.floor, mark: name, time: current.marks[name] }),
  );
}
async function drive(mode, seconds, stop) {
  const deadline = Date.now() + seconds * 1000;
  let waypoint, previous, previousGoal;
  while (Date.now() < deadline) {
    const g = await read();
    if (g.overtime > 0) mark("overtime", g);
    if (g.firstPerson) mark("visor", g);
    if (g.transitProgress < 1) mark("teleport", g);
    for (const color of g.keyring) mark(`key-${color}`, g);
    for (const color of new Set(
      g.doors.filter((d) => d.open).map((d) => d.color),
    ))
      mark(`door-${color}`, g);
    if (g.boss && g.boss.hp < current.initialBossHp) mark("boss-hit", g);
    if (g.lobs.length) mark("lob", g);
    if (stop?.(g) || g.state !== "playing") break;
    if (g.firstPerson) {
      // Keep navigating after the real pickup, with the same camera-relative controls as a player.
      const p = closest(
        g,
        g.crumbs.map(([x, z]) => ({ x, z })),
      );
      const target = p && pathTo(routes(g), p)?.[0];
      if (target) {
        const dx = target[0] - g.pos[0],
          dz = target[1] - g.pos[1];
        const forward = dx * Math.sin(g.fpsYaw) + dz * Math.cos(g.fpsYaw);
        const right = -dx * Math.cos(g.fpsYaw) + dz * Math.sin(g.fpsYaw);
        await controls(
          [
            ...(Math.abs(forward) > 0.15
              ? [forward > 0 ? "KeyW" : "KeyS"]
              : []),
            ...(Math.abs(right) > 0.15 ? [right > 0 ? "KeyD" : "KeyA"] : []),
          ],
          true,
        );
      }
      if (
        (performance.now() - recordingStart) / 1000 - current.marks.visor >
        5.5
      ) {
        await page.keyboard.press("KeyV");
        mark("top-view", g);
      }
      await sleep(65);
      continue;
    }
    const goal = objective(g, mode);
    const goalId = goal && `${goal.x},${goal.z}`;
    if (
      previous &&
      Math.hypot(g.pos[0] - previous.pos[0], g.pos[1] - previous.pos[1]) > 4
    )
      waypoint = null;
    if (
      !waypoint ||
      goalId !== previousGoal ||
      Math.hypot(waypoint[0] - g.pos[0], waypoint[1] - g.pos[1]) <
        (g.theme === "ice" ? 0.45 : 0.3)
    ) {
      waypoint =
        goal &&
        (pathTo(routes(g, mode === "portal" ? goal : undefined), goal)?.[0] || [
          goal.x,
          goal.z,
        ]);
      previousGoal = goalId;
    }
    const dt = previous ? g.elapsed - previous.elapsed : 0;
    const ahead = g.theme === "ice" ? 0.1 : 0.015;
    const dx = waypoint
      ? waypoint[0] -
        g.pos[0] -
        (dt > 0 ? ((g.pos[0] - previous.pos[0]) / dt) * ahead : 0)
      : 0;
    const dz = waypoint
      ? waypoint[1] -
        g.pos[1] -
        (dt > 0 ? ((g.pos[1] - previous.pos[1]) / dt) * ahead : 0)
      : 0;
    const target = [
      ...g.enemies.filter((e) => e.respawn <= 0),
      ...(g.boss?.hp > 0 ? [g.boss] : []),
    ]
      .filter(
        (e) =>
          gap(g, e) < 13 &&
          clearSight(g, e) &&
          e.screen.x > 20 &&
          e.screen.x < width - 20 &&
          e.screen.y > 130 &&
          e.screen.y < height - 65,
      )
      .sort((a, b) => gap(g, a) - gap(g, b))[0];
    if (target) await page.mouse.move(target.screen.x, target.screen.y);
    await controls(
      [
        ...(Math.abs(dx) > 0.12 ? [dx > 0 ? "KeyD" : "KeyA"] : []),
        ...(Math.abs(dz) > 0.12 ? [dz > 0 ? "KeyS" : "KeyW"] : []),
      ],
      Boolean(target),
    );
    if (
      g.dashCooldown === 0 &&
      ((g.overtime === 0 &&
        g.enemies.some((e) => e.respawn <= 0 && gap(g, e) < 1.8)) ||
        g.lobs.some(
          (l) =>
            !l.hit && l.duration - l.age < 0.4 && gap(g, l) < l.radius + 0.5,
        ) ||
        g.vents.some((v) => v.phaseState !== "safe" && gap(g, v) < 1.7))
    )
      await page.keyboard.press("Space");
    previous = g;
    await sleep(55);
  }
  await controls();
}
try {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setExtraHTTPHeaders({ DNT: "1", "Sec-GPC": "1" });
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({ unlocked: 24, cleared: [9, 19] }),
    );
    localStorage.setItem(
      "hft-lessons-v1",
      JSON.stringify({ ammo: true, dash: true, visor: true }),
    );
  });
  await page.goto(process.env.GAME_URL || "http://localhost:3001/", {
    waitUntil: "networkidle0",
  });
  await page.waitForFunction(() => window.__READY__);
  const requested = process.argv
    .find((a) => a.startsWith("--floor="))
    ?.split("=")[1];
  for (const [floor, mode, seconds] of [
    [1, "clear", 75],
    [2, "visor", 20],
    [3, "action", 12],
    [11, "action", 12],
    [12, "portal", 25],
    [15, "boss", 15],
    [24, "keys", 70],
    [20, "boss", 15],
  ]) {
    if (requested && floor !== Number(requested)) continue;
    await controls();
    if ((await read()).mode !== "title") {
      await page.goto(process.env.GAME_URL || "http://localhost:3001/", {
        waitUntil: "networkidle0",
      });
      await page.waitForFunction(() => window.__READY__);
    }
    await page.click("#open-route");
    await page.click(`#route-map button[data-floor="${floor}"]`);
    await page.click("#practice-start");
    await page.waitForFunction(
      (n) => window.__GAME__.floor === n && window.__GAME__.elapsed > 0.1,
      {},
      floor,
    );
    const initial = await read();
    current = {
      floor,
      file: `aisle-${floor}.webm`,
      mode,
      marks: {},
      initialBossHp: initial.boss?.hp,
    };
    recordingStart = performance.now();
    recorder = await page.screencast({
      path: new URL(current.file, out).pathname,
      format: "webm",
      fps: 30,
      quality: 20,
      ffmpegPath: "/opt/homebrew/bin/ffmpeg",
    });
    await drive(
      mode,
      seconds,
      (g) =>
        (mode === "visor" && current.marks["top-view"] !== undefined) ||
        (mode === "portal" &&
          current.marks.teleport !== undefined &&
          (performance.now() - recordingStart) / 1000 >
            current.marks.teleport + 4) ||
        (mode === "keys" && g.doors.filter((d) => d.open).length >= 2),
    );
    let g = await read();
    if (mode === "clear" && g.state === "cleared") {
      await page.waitForSelector("#upgrade-screen", { visible: true });
      mark("upgrade", g);
      const choices = await page.$$eval("#upgrade-options button", (bs) =>
        bs.map((b) => b.dataset.upgrade),
      );
      const chosen = [
        "spread",
        "ricochet",
        "shield",
        "rapid",
        "frost",
        "magnet",
        "heart",
        "pierce",
      ].find((k) => choices.includes(k));
      const card = await page.$(`[data-upgrade="${chosen}"]`);
      await card.hover();
      await sleep(1800);
      await card.click();
      await page.waitForFunction(
        () => window.__GAME__.floor === 2 && window.__GAME__.elapsed > 0.1,
      );
      mark("upgraded", await read());
      await drive("action", 3);
      current.chosenUpgrade = chosen;
    }
    g = await read();
    current.end = {
      floor: g.floor,
      state: g.state,
      hp: g.hp,
      shots: g.shots,
      kills: g.kills,
      collected: g.collected,
      keyring: g.keyring,
      bossHp: g.boss?.hp,
    };
    await page.screenshot({
      path: new URL(`aisle-${floor}.png`, out).pathname,
    });
    await controls();
    await recorder.stop();
    recorder = null;
    current.wallSeconds = +(
      (performance.now() - recordingStart) /
      1000
    ).toFixed(3);
    report.clips.push(current);
    await writeFile(
      new URL(`aisle-${floor}.json`, out),
      JSON.stringify(current, null, 2) + "\n",
    );
    console.log(JSON.stringify(current));
  }
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  await page
    .screenshot({ path: new URL("failure.png", out).pathname })
    .catch(() => {});
} finally {
  await controls().catch(() => {});
  if (recorder) await recorder.stop().catch(() => {});
  await browser.close();
  await writeFile(
    new URL("report.json", out),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({ result: report.result, failure: report.failure }),
  );
}
