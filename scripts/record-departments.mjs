import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/department-demo/", import.meta.url);
await mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
    "Silent desktop gameplay clips, edited only between practice aisles. Route unlocks preloaded in a disposable profile. Real keyboard/mouse actions and visor pickups; no combat injection or score submission.",
  clips: [],
  errors: [],
};
let recorder;
let firing = false;
async function fire(value) {
  if (value === firing) return;
  await page.mouse[value ? "down" : "up"]();
  firing = value;
}
const held = new Set();
async function keys(wanted = []) {
  for (const key of held)
    if (!wanted.includes(key)) {
      await page.keyboard.up(key);
      held.delete(key);
    }
  for (const key of wanted)
    if (!held.has(key)) {
      await page.keyboard.down(key);
      held.add(key);
    }
}
function route(g, target) {
  const start = g.pos.map((n) => Math.round(n / 2)),
    goal = [Math.round(target.x / 2), Math.round(target.z / 2)];
  const queue = [{ p: start, path: [] }],
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
  return [];
}
async function fireAtThreat(g) {
  const targets = [
    ...g.enemies.filter((e) => e.respawn <= 0),
    ...(g.boss ? [g.boss] : []),
  ];
  const target = targets
    .filter(
      (e) =>
        e.screen.x > 30 &&
        e.screen.x < 1330 &&
        e.screen.y > 90 &&
        e.screen.y < 650,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - g.pos[0], a.z - g.pos[1]) -
        Math.hypot(b.x - g.pos[0], b.z - g.pos[1]),
    )[0];
  if (target) {
    await page.mouse.move(target.screen.x, target.screen.y);
    await fire(true);
  } else await fire(false);
}
async function walk(target, maxMs, { stopDistance = 0.4, shoot = true } = {}) {
  let waypoint;
  const until = Date.now() + maxMs;
  while (Date.now() < until) {
    const g = await read();
    if (g.state !== "playing") break;
    if (
      g.firstPerson ||
      Math.hypot(g.pos[0] - target.x, g.pos[1] - target.z) < stopDistance
    )
      break;
    if (
      !waypoint ||
      Math.hypot(waypoint[0] - g.pos[0], waypoint[1] - g.pos[1]) < 0.35
    )
      waypoint = route(g, target)[0] || [target.x, target.z];
    const dx = waypoint[0] - g.pos[0],
      dz = waypoint[1] - g.pos[1];
    await keys([
      ...(Math.abs(dx) > 0.18 ? [dx > 0 ? "KeyD" : "KeyA"] : []),
      ...(Math.abs(dz) > 0.18 ? [dz > 0 ? "KeyS" : "KeyW"] : []),
    ]);
    if (shoot) await fireAtThreat(g);
    if (
      shoot &&
      g.dashCooldown === 0 &&
      g.enemies.some(
        (e) =>
          e.respawn <= 0 && Math.hypot(e.x - g.pos[0], e.z - g.pos[1]) < 2.6,
      )
    )
      await page.keyboard.press("Space");
    await sleep(45);
  }
  await keys();
  await fire(false);
}
try {
  await page.setViewport({ width: 1360, height: 900, deviceScaleFactor: 1 });
  await page.setExtraHTTPHeaders({ DNT: "1", "Sec-GPC": "1" });
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.evaluateOnNewDocument(() =>
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({ unlocked: 4, cleared: [0, 1, 2, 3] }),
    ),
  );
  await page.goto(process.env.GAME_URL || "http://localhost:3001/", {
    waitUntil: "networkidle0",
  });
  await page.waitForFunction(() => window.__READY__);
  for (const floor of [1, 2, 3, 5]) {
    await page.click("#open-route");
    await page.click(`#route-map button[data-floor="${floor}"]`);
    await page.click("#practice-start");
    await page.waitForFunction(
      (n) => window.__GAME__.floor === n && window.__GAME__.elapsed > 0.1,
      {},
      floor,
    );
    recorder = await page.screencast({
      path: new URL(`aisle-${floor}.webm`, out).pathname,
      format: "webm",
      fps: 30,
      quality: 22,
      ffmpegPath: "/opt/homebrew/bin/ffmpeg",
    });
    await sleep(800);
    let g = await read();
    if (floor === 2) {
      await walk(g.visors[0], 12000, { shoot: false });
      await page.waitForFunction(() => window.__GAME__.viewBlend === 1, {
        timeout: 3000,
      });
      await page.mouse.move(680, 420);
      await fire(true);
      await sleep(500);
      await page.mouse.move(770, 420, { steps: 8 });
      await sleep(600);
      await fire(false);
      await page.keyboard.press("KeyV");
      await page.waitForFunction(() => window.__GAME__.viewBlend === 0);
      await sleep(900);
      assert.equal((await read()).coach.learned.visor, true);
    } else {
      const target =
        floor !== 5
          ? g.batteries.reduce((a, b) =>
              route(g, a).length < route(g, b).length ? a : b,
            )
          : g.boss;
      await walk(target, floor === 1 ? 8500 : floor === 3 ? 5000 : 9500, {
        stopDistance: floor === 5 ? 6 : 0.4,
      });
      await fireAtThreat(await read());
      await sleep(1800);
      await fire(false);
      await sleep(700);
    }
    g = await read();
    await page.screenshot({
      path: new URL(`aisle-${floor}.png`, out).pathname,
    });
    await recorder.stop();
    recorder = null;
    report.clips.push({
      floor,
      file: `aisle-${floor}.webm`,
      elapsed: g.elapsed,
      hp: g.hp,
      state: g.state,
      shots: g.shots,
      kills: g.kills,
      collected: g.collected,
      visorCollected: g.visors.some((v) => v.collected),
    });
    console.log(JSON.stringify(report.clips.at(-1)));
    if ((await read()).state === "playing") {
      await page.click("#pause");
      await page.click("#pause-menu");
    } else {
      await page.waitForSelector("#back-menu", { visible: true });
      await page.click("#back-menu");
    }
  }
  assert.deepEqual(report.errors, []);
  await writeFile(
    new URL("clips.txt", out),
    report.clips.map((c) => `file '${c.file}'`).join("\n") + "\n",
  );
  execFileSync("/opt/homebrew/bin/ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    new URL("clips.txt", out).pathname,
    "-c:v",
    "libx264",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    new URL("hungry-for-trouble-departments.mp4", out).pathname,
  ]);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  await page
    .screenshot({ path: new URL("failure.png", out).pathname })
    .catch(() => {});
} finally {
  if (recorder) await recorder.stop().catch(() => {});
  await browser.close();
  await writeFile(
    new URL("report.json", out),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
}
