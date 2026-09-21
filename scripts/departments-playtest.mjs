import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const baseline = process.argv.includes("--baseline");
const baselineRef =
  process.argv.find((arg) => arg.startsWith("--baseline-ref="))?.slice(15) ||
  "c2cf443402a7e5e91207d92809aae00e5d59be21";
const all = process.argv.includes("--all");
const repeat = process.argv.includes("--repeat");
const out = new URL(
  `../outputs/departments-${baseline ? "before" : repeat ? "repeat" : "after"}/`,
  import.meta.url,
);
await mkdir(out, { recursive: true });
const report = {
  scope:
    "Only route unlocks are preloaded. Real level-selection clicks/taps and real movement. Read-only telemetry. No combat-state injection or score submission. Phone viewport emulation, not physical hardware.",
  baseline,
  baselineRef: baseline ? baselineRef : null,
  errors: [],
  snapshots: [],
  result: "RUNNING",
};
const old = baseline
  ? Object.fromEntries(
      ["main.js", "index.html"].map((name) => [
        name,
        execFileSync("git", ["show", `${baselineRef}:game/${name}`], {
          cwd: new URL("../", import.meta.url),
          encoding: "utf8",
        }),
      ]),
    )
  : null;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
let page;
try {
  for (const [profile, width, height] of [
    ["desktop", 1365, 900],
    ["phone", 390, 844],
  ]) {
    const context = await browser.createBrowserContext();
    page = await context.newPage();
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
      isMobile: profile === "phone",
      hasTouch: profile === "phone",
    });
    await page.setExtraHTTPHeaders({ DNT: "1", "Sec-GPC": "1" });
    page.on("pageerror", (e) => report.errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`);
    });
    await page.evaluateOnNewDocument(() =>
      localStorage.setItem(
        "hft-route-v1",
        JSON.stringify({
          unlocked: 24,
          cleared: Array.from({ length: 24 }, (_, i) => i),
        }),
      ),
    );
    if (baseline) {
      await page.setRequestInterception(true);
      page.on("request", (r) => {
        const path = new URL(r.url()).pathname;
        const name = path.endsWith("main.js")
          ? "main.js"
          : path === "/" || path.endsWith("index.html")
            ? "index.html"
            : null;
        if (name)
          r.respond({
            status: 200,
            contentType: name.endsWith(".js") ? "text/javascript" : "text/html",
            body: old[name],
          });
        else r.continue();
      });
    }
    await page.goto(process.env.GAME_URL || "http://localhost:3001/", {
      waitUntil: "networkidle0",
    });
    await page.waitForFunction(() => window.__READY__);
    const activate = async (selector) => {
      if (profile === "desktop") await page.click(selector);
      else {
        await page.$eval(selector, (e) =>
          e.scrollIntoView({ block: "center", behavior: "instant" }),
        );
        const p = await page.$eval(selector, (e) => {
          const r = e.getBoundingClientRect();
          return [r.x + r.width / 2, r.y + r.height / 2];
        });
        await page.touchscreen.tap(...p);
      }
    };
    for (const floor of repeat
      ? Array.from({ length: 5 }, () => [1, 2, 3]).flat()
      : all
        ? [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 20, 25, 1, 2, 3]
        : [1, 2, 3]) {
      await activate("#open-route");
      await activate(`#route-map button[data-floor="${floor}"]`);
      await activate("#practice-start");
      await page.waitForFunction(
        (n) => window.__GAME__.floor === n && window.__GAME__.elapsed > 0.1,
        {},
        floor,
      );
      const before = await page.evaluate(() => window.__GAME__);
      if (profile === "desktop") {
        await page.keyboard.down("KeyW");
        await sleep(650);
        await page.keyboard.up("KeyW");
      } else {
        const p = await page.$eval("#move-stick", (e) => {
          const r = e.getBoundingClientRect();
          return [r.x + r.width / 2, r.y + r.height / 2];
        });
        await page.touchscreen.touchStart(...p);
        await page.touchscreen.touchMove(p[0], p[1] - 25);
        await sleep(650);
        await page.touchscreen.touchEnd();
      }
      const g = await page.evaluate(() => window.__GAME__);
      assert.ok(
        Math.hypot(g.pos[0] - before.pos[0], g.pos[1] - before.pos[1]) > 0.1,
        `Floor ${floor}: actual input moves`,
      );
      assert.equal(g.state, "playing");
      assert.ok(g.draws < 900);
      assert.ok(g.tris < 1500000);
      const index = report.snapshots.filter(
        (s) => s.profile === profile && s.floor === floor,
      ).length;
      const image = `${profile}-aisle-${floor}${index ? `-repeat-${index}` : ""}.png`;
      await page.screenshot({ path: new URL(image, out).pathname });
      report.snapshots.push({
        profile,
        floor,
        image,
        style: g.departmentStyle,
        fps: g.fps,
        draws: g.draws,
        triangles: g.tris,
        geometries: g.geometries,
        textures: g.textures,
        position: g.pos,
        firstPerson: g.firstPerson,
      });
      await activate("#pause");
      await activate("#pause-menu");
    }
    await context.close();
  }
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  if (page && !page.isClosed())
    await page
      .screenshot({ path: new URL("failure.png", out).pathname })
      .catch(() => {});
} finally {
  await writeFile(
    new URL("report.json", out),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
  await browser.close();
}
