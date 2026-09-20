import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const output = new URL("../outputs/touch/", import.meta.url);
await mkdir(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const report = { errors: [], checks: [] };
let page;
try {
  page = await browser.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  const centre = (selector) =>
    page.$eval(selector, (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
  const tap = async (selector) => {
    const p = await centre(selector);
    await page.touchscreen.tap(p.x, p.y);
  };
  await page.screenshot({ path: new URL("menu.png", output).pathname });
  await tap("#start");
  await page.waitForFunction(() => window.__GAME__?.elapsed > 0.5);
  const read = () => page.evaluate(() => window.__GAME__);
  const session = await page.createCDPSession();
  const send = (type, touchPoints) =>
    session.send("Input.dispatchTouchEvent", { type, touchPoints });
  const move = { ...(await centre("#move-stick")), id: 1 },
    aim = { ...(await centre("#aim-stick")), id: 2 },
    dash = { ...(await centre("#dash-button")), id: 3 };
  let before = await read();
  await send("touchStart", [move, aim]);
  await send("touchMove", [
    { ...move, x: move.x + 34 },
    { ...aim, y: aim.y - 34 },
  ]);
  await sleep(650);
  let after = await read();
  assert.ok(after.pos[0] > before.pos[0] + 1.5);
  assert.ok(after.shots > before.shots + 1);
  assert.ok(Math.abs(Math.abs(after.angle) - Math.PI) < 0.1);
  report.checks.push("Two simultaneous thumbs move right and fire north");
  await send("touchStart", [
    { ...move, x: move.x + 34 },
    { ...aim, y: aim.y - 34 },
    dash,
  ]);
  await sleep(110);
  assert.ok((await read()).dashCooldown > 0.8);
  report.checks.push(
    "A third touch activates dash without releasing either stick",
  );
  await send("touchEnd", []);
  await sleep(350);
  assert.ok((await read()).speed < 0.1);
  report.checks.push("Releasing the sticks stops movement and shooting");
  await send("touchStart", [move]);
  await send("touchMove", [{ ...move, y: move.y - 30 }]);
  await sleep(150);
  await send("touchCancel", []);
  await sleep(350);
  assert.ok((await read()).speed < 0.1);
  report.checks.push("Touch cancellation does not leave movement stuck");
  await tap("#sound");
  assert.equal(
    await page.$eval("#sound", (el) => el.getAttribute("aria-pressed")),
    "false",
  );
  await tap("#sound");
  await sleep(100);
  assert.equal((await read()).audio.state, "running");
  report.checks.push("Sound toggles and resumes after a gesture");
  await tap("#pause");
  await sleep(100);
  before = await read();
  await sleep(300);
  after = await read();
  assert.equal(before.elapsed, after.elapsed);
  await tap("#resume");
  report.checks.push("Touch pause and resume");
  await page.screenshot({ path: new URL("portrait.png", output).pathname });
  await page.setViewport({
    width: 844,
    height: 390,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await sleep(300);
  for (const id of [
    "#move-stick",
    "#aim-stick",
    "#dash-button",
    "#pause",
    "#sound",
  ]) {
    const box = await page.$eval(id, (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    });
    assert.ok(
      box.left >= 0 && box.top >= 0 && box.right <= 844 && box.bottom <= 390,
      `${id} must remain in the landscape viewport`,
    );
  }
  await page.screenshot({ path: new URL("landscape.png", output).pathname });
  report.checks.push("Landscape controls remain visible after rotation");
  report.final = await read();
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  if (page)
    await page
      .screenshot({ path: new URL("failure.png", output).pathname })
      .catch(() => {});
} finally {
  await writeFile(
    new URL("report.json", output),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        result: report.result,
        checks: report.checks,
        failure: report.failure,
        errors: report.errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
