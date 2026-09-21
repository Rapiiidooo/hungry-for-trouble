import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/field-coach/", import.meta.url);
await mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = {
  scope:
    "Fresh disposable browser profiles. Real clicks, keys and touchscreen gestures. Read-only game snapshots; no gameplay state injection or score submission. Emulated phones, not physical hardware.",
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
  for (const [profile, width, height, mobile] of [
    ["desktop", 1365, 900, false],
    ["portrait", 390, 844, true],
    ["landscape", 844, 390, true],
    ["narrow", 320, 568, true],
  ]) {
    const context = await browser.createBrowserContext();
    page = await context.newPage();
    await page.setViewport({
      width,
      height,
      isMobile: mobile,
      hasTouch: mobile,
      deviceScaleFactor: 1,
    });
    await page.setExtraHTTPHeaders({ DNT: "1", "Sec-GPC": "1" });
    if (profile === "landscape")
      await page.emulateMediaFeatures([
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
    page.on("pageerror", (e) => report.errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`);
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
    await page.goto(process.env.GAME_URL || "http://localhost:3001/", {
      waitUntil: "networkidle0",
    });
    await page.waitForFunction(() => window.__READY__);
    await activate("#start");
    await page.waitForFunction(() => window.__GAME__.briefing);
    assert.equal((await read()).coach.visible, false);
    await activate("#briefing-continue");
    await page.waitForFunction(
      () =>
        window.__GAME__.coach.visible &&
        window.__GAME__.coach.lesson === "ammo",
      { timeout: 15000 },
    );
    const layout = await page.evaluate(() => {
      const rect = (id) =>
        document.getElementById(id).getBoundingClientRect().toJSON();
      return {
        tip: rect("field-tip"),
        controls: ["move-stick", "aim-stick", "dash-button"].map(rect),
        overflow: document.documentElement.scrollWidth > innerWidth,
        text: document.getElementById("field-tip").textContent,
      };
    });
    assert.equal(layout.overflow, false);
    assert.ok(
      layout.tip.x >= 0 &&
        layout.tip.right <= width &&
        layout.tip.y >= 0 &&
        layout.tip.bottom <= height,
    );
    if (mobile)
      for (const c of layout.controls)
        assert.ok(
          Math.min(c.right, layout.tip.right) <= Math.max(c.x, layout.tip.x) ||
            Math.min(c.bottom, layout.tip.bottom) <=
              Math.max(c.y, layout.tip.y),
          `${profile}: lesson must not cover controls`,
        );
    await page.screenshot({
      path: new URL(`${profile}-ammo.png`, out).pathname,
    });
    if (mobile) {
      const p = await centre("#aim-stick");
      await page.touchscreen.touchStart(...p);
      await page.touchscreen.touchMove(p[0], p[1] - 25);
      await sleep(450);
      await page.touchscreen.touchEnd();
      const m = await centre("#move-stick");
      await page.touchscreen.touchStart(...m);
      await page.touchscreen.touchMove(m[0], m[1] - 30);
      await sleep(650);
      await page.touchscreen.touchEnd();
    } else {
      await page.mouse.move(100, 300);
      await page.mouse.down();
      await sleep(450);
      await page.mouse.up();
      await page.keyboard.down("KeyW");
      await sleep(650);
      await page.keyboard.up("KeyW");
    }
    await page.waitForFunction(
      () => window.__GAME__.coach.learned.ammo && window.__GAME__.coach.visible,
      { timeout: 5000 },
    );
    assert.ok((await read()).shots > 0 && (await read()).collected > 0);
    assert.ok(
      await page.$eval("#field-tip", (e) => e.classList.contains("confirmed")),
    );
    await page.screenshot({
      path: new URL(`${profile}-reloaded.png`, out).pathname,
    });
    if (mobile) await activate("#dash-button");
    else await page.keyboard.press("Space");
    await page.waitForFunction(
      () =>
        window.__GAME__.coach.learned.dash &&
        window.__GAME__.dashCooldown > 0.5,
    );
    await page.screenshot({
      path: new URL(`${profile}-dodge.png`, out).pathname,
    });
    await activate("#pause");
    await sleep(100);
    assert.equal((await read()).coach.visible, false);
    assert.equal(await page.$$eval(".lesson-target", (els) => els.length), 0);
    await activate("#pause-menu");
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.__READY__);
    assert.deepEqual((await read()).coach.learned, { ammo: true, dash: true });
    await activate("#open-settings");
    await activate("#reset-save");
    await activate("#confirm-reset");
    await page.waitForFunction(() =>
      document
        .getElementById("settings-status")
        .textContent.includes("Local save reset"),
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("hft-lessons-v1")),
      null,
    );
    assert.deepEqual((await read()).coach.learned, {});
    report.checks.push(
      `${profile}: briefing waits, ammo prompt fits without covering controls, actual shots and crumbs teach reload, actual dodge teaches protection, pause clears cues, learning persists and Settings resets it${profile === "landscape" ? ", reduced motion enabled" : ""}`,
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
