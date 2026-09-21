import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const coop = process.argv.includes("--coop");
const out = new URL(
  `../outputs/multiplayer-${coop ? "coop" : "versus"}/`,
  import.meta.url,
);
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
  ],
});
const report = {
  input:
    "Two independent browser contexts. Real DOM, keyboard, pointer and touch actions; read-only gameplay snapshots.",
  checks: [],
  errors: [],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
let pages = [],
  held = [new Set(), new Set()],
  firing = [false, false];
const read = (i) => pages[i].evaluate(() => window.__GAME__);
async function keys(i, next) {
  const wanted = new Set(next);
  for (const k of held[i]) if (!wanted.has(k)) await pages[i].keyboard.up(k);
  for (const k of wanted) if (!held[i].has(k)) await pages[i].keyboard.down(k);
  held[i] = wanted;
}
async function shoot(i, value) {
  if (firing[i] === value) return;
  await pages[i].mouse[value ? "down" : "up"]();
  firing[i] = value;
}
function routes(g) {
  const start = g.pos.map((v) => Math.round(v / 2)),
    queue = [start],
    found = new Map([[start.join(","), []]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = [p[0] + dx, p[1] + dz],
        key = n.join(",");
      if (
        found.has(key) ||
        !g.map[n[1]]?.[n[0]] ||
        ["#", " "].includes(g.map[n[1]][n[0]])
      )
        continue;
      found.set(key, [...found.get(p.join(",")), n.map((v) => v * 2)]);
      queue.push(n);
    }
  }
  return found;
}
function los(g, p) {
  const d = distance(g.pos, [p.x, p.z]);
  for (let t = 0.2; t < d; t += 0.2) {
    const x = g.pos[0] + ((p.x - g.pos[0]) * t) / d,
      z = g.pos[1] + ((p.z - g.pos[1]) * t) / d;
    if (["#", " "].includes(g.map[Math.round(z / 2)]?.[Math.round(x / 2)]))
      return false;
  }
  return true;
}
function routeTo(g, p, found = routes(g)) {
  return found.get(p.map((v) => Math.round(v / 2)).join(","));
}
let waypoints = [null, null];
async function navigate(i, g, path) {
  let point = waypoints[i];
  if (!point || distance(g.pos, point) < 0.32) point = path?.[0];
  waypoints[i] = point;
  if (!point) {
    await keys(i, []);
    return;
  }
  const dx = point[0] - g.pos[0],
    dz = point[1] - g.pos[1];
  await keys(i, [
    ...(Math.abs(dx) > 0.12 ? [dx > 0 ? "KeyD" : "KeyA"] : []),
    ...(Math.abs(dz) > 0.12 ? [dz > 0 ? "KeyS" : "KeyW"] : []),
  ]);
}
async function aim(i, g, target) {
  if (
    target &&
    los(g, target) &&
    distance(g.pos, [target.x, target.z]) < 14 &&
    target.screen.x > 5 &&
    target.screen.x < 1270 &&
    target.screen.y > 95 &&
    target.screen.y < 730
  ) {
    await pages[i].mouse.move(target.screen.x, target.screen.y);
    await shoot(i, true);
  } else await shoot(i, false);
}
try {
  for (let i = 0; i < 2; i++) {
    const context = await browser.createBrowserContext(),
      page = await context.newPage();
    pages.push(page);
    page.on("pageerror", (e) => report.errors.push(e.message));
    await page.setViewport({
      width: 1280,
      height: 800,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.__READY__);
    await page.click("#open-rooms");
    await page.click("#room-name");
    await page.$eval("#room-name", (input) => input.select());
    await page.keyboard.press("Backspace");
    await page.type("#room-name", i ? "BOB" : "ALICE");
  }
  await pages[0].click(coop ? "#create-coop" : "#create-versus");
  await pages[0].waitForFunction(
    () => document.getElementById("room-code").textContent.length === 6,
  );
  const code = await pages[0].$eval("#room-code", (n) => n.textContent);
  await pages[1].type("#join-code", code);
  await pages[1].click("#join-room");
  await pages[0].waitForFunction(
    () => !document.getElementById("room-start").disabled,
  );
  assert.equal(await pages[1].$eval("#room-start", (n) => n.disabled), true);
  await pages[0].screenshot({ path: new URL("lobby.png", out).pathname });
  await pages[0].click("#room-start");
  await Promise.all(
    pages.map((p) =>
      p.waitForFunction(
        () => window.__GAME__.multiplayer?.roomPhase === "playing",
      ),
    ),
  );
  report.checks.push(
    "Two independent clients create, join and start a private room; only the host starts",
  );
  const before = await read(0);
  await keys(0, ["KeyD"]);
  await sleep(600);
  await keys(0, []);
  await sleep(200);
  const moved = await read(0),
    observed = await read(1);
  assert.ok(moved.pos[0] > before.pos[0] + 1);
  assert.ok(
    Math.abs(
      observed.multiplayer.players.find(
        (p) => p.id === moved.multiplayer.selfId,
      ).x - moved.pos[0],
    ) < 0.5,
  );
  report.checks.push(
    "Real host movement reaches the other browser through the authoritative server",
  );
  await pages[1].reload({ waitUntil: "networkidle0" });
  await pages[1].waitForFunction(() => window.__READY__);
  await pages[1].click("#open-rooms");
  await pages[1].click("#room-reconnect");
  await pages[1].waitForFunction(
    () => window.__GAME__.multiplayer?.roomPhase === "playing",
  );
  report.checks.push(
    "Reloaded participant reconnects to the same running match through its room session",
  );
  const deadline = Date.now() + (coop ? 225000 : 185000);
  let last = 0,
    sawKO = false,
    sawRevive = false,
    previousDown = false;
  while (Date.now() < deadline) {
    const g = await read(0),
      other = await read(1);
    if (g.state !== "playing") break;
    if (!coop) {
      const opponent = g.multiplayer.players.find(
        (p) => p.id !== g.multiplayer.selfId,
      );
      sawKO ||= opponent.deaths > 0;
      if (opponent.hp <= 0) {
        await keys(0, []);
        waypoints[0] = null;
        await shoot(0, false);
      } else {
        const close =
          distance(g.pos, [opponent.x, opponent.z]) < 5 && los(g, opponent);
        if (close) {
          waypoints[0] = null;
          await keys(0, []);
        } else await navigate(0, g, routeTo(g, [opponent.x, opponent.z]));
        await aim(0, g, opponent);
      }
    } else {
      for (const [i, state] of [g, other].entries()) {
        const peer = state.multiplayer.players.find(
            (p) => p.id !== state.multiplayer.selfId,
          ),
          found = routes(state);
        let path;
        if (state.hp <= 0) {
          await keys(i, []);
          await shoot(i, false);
          continue;
        }
        if (peer.hp <= 0) path = routeTo(state, [peer.x, peer.z], found);
        else if (state.hp <= 2) {
          path = state.repairs
            .filter((r) => !r.collected)
            .map((r) => routeTo(state, [r.x, r.z], found))
            .filter((p) => p?.length)
            .sort((a, b) => a.length - b.length)[0];
        }
        if (!path && state.overtime <= 0)
          path = state.batteries
            .filter((r) => !r.collected)
            .map((r) => routeTo(state, [r.x, r.z], found))
            .filter((p) => p?.length && p.length < 10)
            .sort((a, b) => a.length - b.length)[0];
        if (!path && state.collected < state.quota)
          path = state.crumbs
            .map((p) => routeTo(state, p, found))
            .filter((p) => p?.length)
            .sort((a, b) => a.length - b.length)[0];
        if (!path && state.boss?.hp > 0) {
          const angle = state.elapsed * 0.35 + i * Math.PI,
            point = [
              state.boss.x + Math.sin(angle) * 7,
              state.boss.z + Math.cos(angle) * 7,
            ];
          path = routeTo(state, point, found);
        }
        if (!path && state.boss?.hp <= 0)
          path = routeTo(state, [state.exit.x, state.exit.z], found);
        await navigate(i, state, path);
        const targets = [
          ...state.enemies.filter((e) => e.respawn <= 0),
          ...(state.boss?.hp > 0 ? [state.boss] : []),
        ]
          .filter((e) => los(state, e))
          .sort(
            (a, b) =>
              distance(state.pos, [a.x, a.z]) - distance(state.pos, [b.x, b.z]),
          );
        await aim(i, state, targets[0]);
      }
      const down = g.multiplayer.players.some((p) => p.hp <= 0);
      if (previousDown && !down) sawRevive = true;
      previousDown = down;
    }
    if (Date.now() - last > 7000) {
      const sample = {
        elapsed: Math.round(g.elapsed),
        shots: g.shots,
        ammo: g.ammo,
        hp: g.hp,
        peerHp: other.hp,
        kills: g.kills,
        collected: g.collected,
        boss: g.boss?.hp,
        pos: g.pos,
      };
      console.log(JSON.stringify(sample));
      last = Date.now();
    }
    await sleep(65);
  }
  await keys(0, []);
  await keys(1, []);
  await shoot(0, false);
  await shoot(1, false);
  await sleep(200);
  const end = await read(0),
    peerEnd = await read(1);
  report.end = end;
  report.peerEnd = peerEnd;
  assert.notEqual(end.state, "playing");
  assert.equal(end.multiplayer.reason, peerEnd.multiplayer.reason);
  if (coop) {
    assert.equal(end.multiplayer.reason, "rescued");
    report.checks.push(
      "Both real players collect their shared quota, defeat management and check out together",
    );
    if (sawRevive)
      report.checks.push(
        "A disabled player is revived by its nearby partner in a real encounter",
      );
  } else {
    assert.ok(sawKO);
    assert.equal(end.multiplayer.winner, end.multiplayer.selfId);
    assert.equal(end.kills, 7);
    report.checks.push(
      "Real shots produce seven KOs, crumb drops, respawns and the same authoritative winner in both browsers",
    );
  }
  await pages[0].screenshot({ path: new URL("result-host.png", out).pathname });
  await pages[1].screenshot({
    path: new URL("result-guest.png", out).pathname,
  });
  await pages[0].click("#room-rematch");
  await Promise.all(
    pages.map((p) =>
      p.waitForFunction(
        () =>
          window.__GAME__.state === "playing" && window.__GAME__.elapsed < 5,
      ),
    ),
  );
  report.checks.push("The host starts a fresh rematch in the same room");
  await pages[0].setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await sleep(250);
  const touch = await pages[0].createCDPSession();
  const points = await pages[0].evaluate(() =>
    ["move-stick", "aim-stick"].map((id, i) => {
      const r = document.getElementById(id).getBoundingClientRect();
      return { id: i + 1, x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }),
  );
  const fingerBefore = await read(0);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: points,
  });
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { ...points[0], x: points[0].x + 25 },
      { ...points[1], y: points[1].y - 25 },
    ],
  });
  await sleep(600);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await sleep(200);
  const fingerAfter = await read(0);
  assert.ok(distance(fingerAfter.pos, fingerBefore.pos) > 0.5);
  assert.ok(fingerAfter.shots > fingerBefore.shots);
  await pages[0].screenshot({
    path: new URL("multiplayer-touch.png", out).pathname,
  });
  report.checks.push(
    "A real simultaneous two-thumb gesture moves and fires through the room server on a phone viewport",
  );

  const network = {
    offline: false,
    latency: 60,
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (1024 * 1024) / 8,
  };
  await touch.send("Network.enable");
  await touch.send("Network.emulateNetworkConditions", network);
  const slowerBefore = await read(0);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: points,
  });
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { ...points[0], x: points[0].x - 25 },
      { ...points[1], y: points[1].y - 25 },
    ],
  });
  await sleep(900);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await sleep(300);
  const slowerAfter = await read(0),
    slowerPeer = await read(1);
  assert.ok(distance(slowerAfter.pos, slowerBefore.pos) > 0.5);
  assert.ok(slowerAfter.shots > slowerBefore.shots);
  assert.ok(
    distance(
      slowerAfter.pos,
      (() => {
        const p = slowerPeer.multiplayer.players.find(
          (p) => p.id === slowerAfter.multiplayer.selfId,
        );
        return [p.x, p.z];
      })(),
    ) < 0.5,
  );
  report.checks.push(
    "Phone movement and shooting still agree between clients at 4 Mbps down, 1 Mbps up and 60 ms latency",
  );

  await keys(0, ["KeyD"]);
  await sleep(250);
  await touch.send("Network.emulateNetworkConditions", {
    ...network,
    offline: true,
  });
  await keys(0, []);
  await pages[0].waitForFunction(
    () => !document.getElementById("room-connection").hidden,
  );
  await sleep(1000);
  const absent = (await read(1)).multiplayer.players.find(
    (p) => p.id === slowerAfter.multiplayer.selfId,
  );
  await sleep(1000);
  const stopped = (await read(1)).multiplayer.players.find(
    (p) => p.id === slowerAfter.multiplayer.selfId,
  );
  assert.ok(
    distance([absent.x, absent.z], [stopped.x, stopped.z]) < 0.1,
    "The server releases stale controls during a dropped connection",
  );
  await touch.send("Network.emulateNetworkConditions", network);
  await pages[0].waitForFunction(
    () =>
      document.getElementById("room-connection").hidden &&
      window.__GAME__.multiplayer?.roomPhase === "playing",
  );
  report.checks.push(
    "A short connection loss visibly retries, stops stale movement and rejoins the same active match",
  );
  await touch.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });

  await pages[0].keyboard.press("Escape");
  await pages[0].click("#pause-menu");
  await pages[1].waitForFunction(
    () => window.__GAME__.multiplayer.reason === "disconnect",
  );
  report.checks.push(
    "Leaving ends the shared match clearly for the remaining participant",
  );
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (e) {
  report.result = "FAIL";
  report.failure = e.stack;
  process.exitCode = 1;
  for (const [i, p] of pages.entries()) {
    report["last" + i] = await read(i).catch(() => null);
    await p
      .screenshot({ path: new URL(`failure-${i}.png`, out).pathname })
      .catch(() => {});
  }
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
