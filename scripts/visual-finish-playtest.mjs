import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/visual-finish/", import.meta.url);
await mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  scope:
    "Fresh disposable browser profiles. Real clicks, keys, mouse and touchscreen gestures. Read-only game snapshots; no gameplay state injection or score submission. Emulated phones, not physical hardware.",
  checks: [],
  errors: [],
};
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
let page;
try {
  for (const [profile, width, height, mobile, fov] of [
    ["desktop", 1440, 900, false, 27],
    ["portrait", 390, 844, true, 40],
    ["landscape", 844, 390, true, 27],
  ]) {
    const context = await browser.createBrowserContext();
    page = await context.newPage();
    await page.setViewport({
      width,
      height,
      isMobile: mobile,
      hasTouch: mobile,
      deviceScaleFactor: mobile ? 2 : 1,
    });
    await page.setExtraHTTPHeaders({ DNT: "1", "Sec-GPC": "1" });
    const fonts = [];
    page.on("pageerror", (e) => report.errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") report.errors.push(m.text());
    });
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname))
        report.errors.push(`external request ${r.url()}`);
    });
    page.on("response", (r) => {
      if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`);
      if (r.url().endsWith(".woff2"))
        fonts.push([new URL(r.url()).pathname, r.headers()["content-type"]]);
    });
    const read = () => page.evaluate(() => window.__GAME__);
    const centre = (selector) =>
      page.$eval(selector, (e) => {
        const r = e.getBoundingClientRect();
        return [r.x + r.width / 2, r.y + r.height / 2];
      });
    const activate = async (selector) => {
      await page.$eval(selector, (e) =>
        e.scrollIntoView({ block: "center", behavior: "instant" }),
      );
      if (mobile) await page.touchscreen.tap(...(await centre(selector)));
      else await page.click(selector);
    };
    const shot = (name) =>
      page.screenshot({
        path: new URL(`${profile}-${name}.png`, out).pathname,
      });
    await page.goto(process.env.GAME_URL || "http://localhost:3001/", {
      waitUntil: "networkidle0",
    });
    await page.waitForFunction(() => window.__READY__);
    const typefaces = await page.evaluate(async () => {
      // Faces load on first use, so request each style explicitly.
      const loads = async (spec) =>
        (await document.fonts.load(spec)).length > 0;
      return {
        display: await loads('800 16px "Barlow Condensed"'),
        italic: await loads('italic 900 16px "Barlow Condensed"'),
        sans: await loads('500 12px "DM Sans"'),
      };
    });
    assert.deepEqual(typefaces, { display: true, italic: true, sans: true });
    assert.ok(fonts.length >= 3, `local fonts loaded: ${fonts.length}`);
    for (const [path, type] of fonts) {
      assert.ok(path.startsWith("/fonts/"), path);
      assert.equal(type, "font/woff2");
    }
    await shot("title");

    // Practice pass: opens aisles 1-10 without clearing anything or revealing Act II.
    await activate("#open-route");
    await page.waitForSelector("#practice-pass:not([hidden])");
    assert.equal(
      await page.$eval('#route-map button[data-floor="10"]', (b) => b.disabled),
      true,
    );
    await shot("route-before");
    await activate("#open-aisles");
    await page.waitForSelector("#practice-pass[hidden]", { hidden: true });
    const route = await page.evaluate(() => ({
      stored: JSON.parse(localStorage.getItem("hft-route-v1")),
      enabled: [...document.querySelectorAll("#route-map button")].map(
        (b) => !b.disabled,
      ),
      nodes: document.querySelectorAll("#route-map button").length,
    }));
    assert.deepEqual(route.stored, { unlocked: 9, cleared: [] });
    assert.equal(route.nodes, 10);
    assert.ok(route.enabled.every(Boolean), "all ten aisles open");
    await shot("route-after");
    await activate('#route-map button[data-floor="1"]');
    await activate("#practice-start");
    await page.waitForFunction(
      () => window.__GAME__.mode === "playing" && window.__GAME__.elapsed > 0.4,
    );
    let g = await read();
    assert.equal(g.runKind, "practice");
    assert.equal(g.visibleFloors, 10);
    assert.equal(g.overheadFov, fov);
    assert.ok(Math.abs(g.cameraPosition[1] - 25) < 0.6, g.cameraPosition);
    assert.ok(g.ghostsVisible > 0, "overhead silhouettes are enabled");

    if (!mobile) {
      const panel = await page.$eval(".vitals", (e) => {
        const style = getComputedStyle(e),
          rect = e.getBoundingClientRect();
        return {
          height: rect.height,
          left: style.borderLeftWidth,
          bottom: style.borderBottomWidth,
          hint: getComputedStyle(document.getElementById("heal-hint")).display,
        };
      });
      assert.ok(panel.height < 90, `compact status panel ${panel.height}px`);
      assert.deepEqual(
        [panel.left, panel.bottom, panel.hint],
        ["1px", "3px", "none"],
      );
      // The perspective aim ray must still point at the enemy under the cursor.
      await page.waitForFunction(
        () =>
          window.__GAME__.enemies.some(
            (e) =>
              e.respawn <= 0 &&
              e.screen.x > 60 &&
              e.screen.x < innerWidth - 60 &&
              e.screen.y > 120 &&
              e.screen.y < innerHeight - 160,
          ),
        { timeout: 15000 },
      );
      g = await read();
      const enemy = g.enemies.find(
        (e) =>
          e.respawn <= 0 &&
          e.screen.x > 60 &&
          e.screen.x < width - 60 &&
          e.screen.y > 120 &&
          e.screen.y < height - 160,
      );
      await page.mouse.move(enemy.screen.x, enemy.screen.y);
      await sleep(120);
      g = await read();
      const target = g.enemies.find(
        (e) => Math.hypot(e.x - enemy.x, e.z - enemy.z) < 1.5,
      );
      const expected = Math.atan2(target.x - g.pos[0], target.z - g.pos[1]);
      const error = Math.abs(
        Math.atan2(Math.sin(g.angle - expected), Math.cos(g.angle - expected)),
      );
      assert.ok(error < 0.12, `mouse aim error ${error.toFixed(3)} rad`);

      // Walk behind a shelf; the vacuum's hidden part is drawn as a silhouette.
      // Keys map to world axes only overhead, so a visor pickup ends the walk.
      const goTo = async (col, row, done = () => false) => {
        for (let step = 0; step < 500; step++) {
          const state = await read();
          const start = state.pos.map((v) => Math.round(v / 2));
          const queue = [start],
            previous = new Map([[start.join(","), null]]);
          for (let i = 0; i < queue.length; i++) {
            const [c, r] = queue[i];
            for (const [dc, dr] of [
              [0, -1],
              [1, 0],
              [0, 1],
              [-1, 0],
            ]) {
              const next = [c + dc, r + dr],
                id = next.join(",");
              if (
                previous.has(id) ||
                ["#", " ", undefined].includes(state.map[next[1]]?.[next[0]])
              )
                continue;
              previous.set(id, [c, r]);
              queue.push(next);
            }
          }
          let cell = [col, row];
          while (
            previous.get(cell.join(",")) &&
            previous.get(cell.join(",")).join(",") !== start.join(",")
          )
            cell = previous.get(cell.join(","));
          const dx = cell[0] * 2 - state.pos[0],
            dz = cell[1] * 2 - state.pos[1];
          const wanted = [];
          if (dx > 0.12) wanted.push("KeyD");
          if (dx < -0.12) wanted.push("KeyA");
          if (dz > 0.12) wanted.push("KeyS");
          if (dz < -0.12) wanted.push("KeyW");
          for (const key of ["KeyW", "KeyA", "KeyS", "KeyD"])
            if (!wanted.includes(key)) await page.keyboard.up(key);
          for (const key of wanted) await page.keyboard.down(key);
          if (Math.hypot(col * 2 - state.pos[0], row * 2 - state.pos[1]) < 0.2)
            break;
          if (state.state !== "playing" || done(state)) break;
          await sleep(30);
        }
        for (const key of ["KeyW", "KeyA", "KeyS", "KeyD"])
          await page.keyboard.up(key);
      };
      await goTo(2, 1);
      await sleep(300);
      g = await read();
      assert.ok(
        Math.hypot(g.pos[0] - 4, g.pos[1] - 2) < 0.6,
        `behind the shelf: ${g.pos}`,
      );
      await page.screenshot({
        path: new URL(`${profile}-behind-shelf.png`, out).pathname,
        clip: {
          x: Math.max(0, g.playerScreen.x - 200),
          y: Math.max(0, g.playerScreen.y - 150),
          width: 400,
          height: 300,
        },
      });
      await shot("aisle-01");

      // First person hides every silhouette; returning overhead restores them.
      await page.keyboard.press("Escape");
      await activate("#pause-route");
      await activate('#route-map button[data-floor="2"]');
      await activate("#practice-start");
      await page.waitForFunction(
        () =>
          window.__GAME__.mode === "playing" &&
          window.__GAME__.floor === 2 &&
          window.__GAME__.elapsed > 0.3,
      );
      g = await read();
      const visor = g.visors.find((v) => !v.collected);
      await goTo(
        Math.round(visor.x / 2),
        Math.round(visor.z / 2),
        (state) => state.firstPerson,
      );
      await page.waitForFunction(() => window.__GAME__.viewBlend > 0.98, {
        timeout: 8000,
      });
      g = await read();
      assert.equal(g.state, "playing");
      assert.equal(g.firstPerson, true);
      assert.equal(g.ghostsVisible, 0);
      await shot("vac-cam");
      await page.keyboard.press("KeyV");
      await page.waitForFunction(() => window.__GAME__.viewBlend === 0, {
        timeout: 5000,
      });
      await sleep(100);
      g = await read();
      assert.equal(g.state, "playing");
      assert.ok(g.ghostsVisible > 0);
      await shot("overhead-return");
    } else {
      await sleep(600);
      await shot("aisle-01");
    }
    report.checks.push(
      `${profile}: local OFL fonts only, practice pass opens aisles 1-10 without clears, perspective lens ${fov} degrees, silhouettes enabled overhead${mobile ? "" : ", compact status panel, mouse aim on the perspective ray, silhouette behind a shelf, none in Vac Cam and restored overhead"}`,
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
