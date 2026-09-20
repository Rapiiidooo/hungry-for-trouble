import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/smoke/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.stack));
  page.on("console", (e) => {
    if (["error", "warn"].includes(e.type())) errors.push(e.text());
  });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__ === true, {
    timeout: 20000,
  });
  await page.screenshot({ path: new URL("menu.png", out).pathname });
  await page.click("#start");
  await page.waitForFunction(
    () => window.__GAME__?.mode === "playing" && window.__GAME__.elapsed > 0.5,
  );
  await page.screenshot({ path: new URL("playing.png", out).pathname });
  const before = await page.evaluate(() => window.__GAME__);
  await page.keyboard.down("KeyD");
  await new Promise((resolve) => setTimeout(resolve, 450));
  await page.keyboard.up("KeyD");
  const after = await page.evaluate(() => window.__GAME__);
  await page.keyboard.press("Escape");
  await page.screenshot({ path: new URL("paused.png", out).pathname });
  const geometries = [after.geometries];
  for (let i = 0; i < 8; i++) {
    await page.click("#pause-retry");
    await page.waitForFunction(
      () =>
        !window.__GAME__.paused &&
        window.__GAME__.elapsed > 0.5 &&
        window.__GAME__.elapsed < 1.5,
    );
    geometries.push((await page.evaluate(() => window.__GAME__)).geometries);
    await page.keyboard.press("Escape");
  }
  assert.ok(
    Math.max(...geometries) <= geometries[0] + 2,
    `Geometry count grew across restarts: ${geometries}`,
  );
  assert.deepEqual(errors, []);
  const report = {
    result: "PASS",
    errors,
    before,
    after,
    restartGeometryCounts: geometries,
  };
  await writeFile(new URL("report.json", out), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        errors,
        restartGeometryCounts: geometries,
        before: {
          pos: before.pos,
          fps: before.fps,
          draws: before.draws,
          tris: before.tris,
        },
        after: {
          pos: after.pos,
          collected: after.collected,
          shots: after.shots,
        },
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e, errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
