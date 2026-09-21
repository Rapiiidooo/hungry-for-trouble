import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/credits/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const report = {
  checks: [],
  errors: [],
  input:
    "Real settings clicks, scroll and keyboard; read-only presentation snapshots. No save fixtures or submitted scores.",
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const shot = (name) =>
  page.screenshot({ path: new URL(`${name}.png`, out).pathname });
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (e) => {
  if (e.type() === "error") report.errors.push(e.text());
});
try {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#open-settings");
  await page.click("#open-credits");
  await page.waitForFunction(() => window.__GAME__.credits?.elapsed > 1);
  await shot("opening-desktop");
  const text = await page.$eval("#credits-roll", (el) => el.textContent);
  for (const name of [
    "Rapido",
    "Codex",
    "Three.js",
    "404 game recipe",
    "Bittensor",
    "ImageGen",
    "Atlas",
    "Lyria",
    "Gemini",
    "Web Audio",
  ])
    assert.ok(text.includes(name), name);
  assert.ok(
    text.includes("not used in this build"),
    "Atlas studies are attributed accurately",
  );
  await page.click("#credits-pause");
  const paused = await page.evaluate(() => window.__GAME__.credits.elapsed);
  await sleep(450);
  assert.equal(
    await page.evaluate(() => window.__GAME__.credits.elapsed),
    paused,
  );
  await page.click("#credits-pause");
  await page.waitForFunction(
    (time) => window.__GAME__.credits.elapsed > time + 0.3,
    {},
    paused,
  );
  await page.waitForFunction(() => window.__GAME__.credits.elapsed > 13);
  const traffic = await page.$eval(
    ".credit-vacuum",
    (el) => el.style.transform,
  );
  await sleep(300);
  assert.notEqual(
    await page.$eval(".credit-vacuum", (el) => el.style.transform),
    traffic,
  );
  await shot("crew-desktop");
  report.checks.push(
    "Credits roll, passing vacuum gags and pause/resume work; tool credits distinguish Atlas studies from runtime media",
  );
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await shot("crew-phone");
  const bounds = await page.evaluate(() =>
    ["credits-pause", "credits-skip"].map((id) =>
      document.getElementById(id).getBoundingClientRect().toJSON(),
    ),
  );
  assert.ok(
    bounds.every(
      (r) => r.left >= 0 && r.right <= 390 && r.bottom <= 844 && r.height >= 44,
    ),
  );
  await page.waitForFunction(() => window.__GAME__.credits.finished, {
    timeout: 50000,
  });
  assert.match(
    await page.$eval("#credits-finale", (el) => el.textContent),
    /Rapido/,
  );
  assert.equal(await page.$eval("#credits-twist", (el) => el.hidden), true);
  await shot("made-by-phone");
  await page.click("#credits-continue");
  assert.equal(await page.$eval("#settings-screen", (el) => el.hidden), false);
  report.checks.push(
    "The natural ending shows Made by Rapido; manual credits do not spoil the basement and return to Settings",
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.click("#open-credits");
  const transform = await page.$eval(
    "#credits-roll",
    (el) => el.style.transform,
  );
  await sleep(500);
  assert.equal(
    await page.$eval("#credits-roll", (el) => el.style.transform),
    transform,
  );
  assert.equal(
    await page.$eval(".credits-traffic", (el) => getComputedStyle(el).display),
    "none",
  );
  await page.mouse.move(190, 420);
  await page.mouse.wheel({ deltaY: 680 });
  await sleep(300);
  assert.ok(await page.$eval("#credits-window", (el) => el.scrollTop > 0));
  await shot("reduced-motion-phone");
  await page.click("#credits-skip");
  await page.click("#credits-continue");
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 });
  await page.click("#open-credits");
  await shot("opening-landscape");
  await page.click("#credits-skip");
  await shot("made-by-landscape");
  await page.click("#credits-continue");
  await page.click("#open-credits");
  await page.keyboard.press("Escape");
  assert.equal(await page.$eval("#credits-screen", (el) => el.hidden), true);
  assert.equal(await page.$eval("#settings-screen", (el) => el.hidden), false);
  report.checks.push(
    "Reduced motion uses a manually scrollable list; skip, keyboard return and landscape controls remain usable",
  );
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  await shot("failure").catch(() => {});
} finally {
  await writeFile(new URL("report.json", out), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
