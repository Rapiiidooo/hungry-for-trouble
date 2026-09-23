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
  await page.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#open-settings");
  await page.click("#open-credits");
  await page.waitForFunction(() => window.__GAME__.credits?.elapsed > 1);
  await shot("opening-desktop");
  const at = (time) =>
    page.waitForFunction(
      (value) => window.__GAME__.credits.elapsed >= value,
      { timeout: 30000 },
      time,
    );
  const robot = (gag) =>
    page.$eval(`[data-gag="${gag}"]`, (el) => ({
      x: el.getBoundingClientRect().x,
      facing: new DOMMatrix(
        getComputedStyle(el.querySelector(".credit-machine")).transform,
      ).a,
      pose: [...el.querySelectorAll("*")]
        .map(
          (part) =>
            part.getAttribute("style") + part.getAttribute("transform"),
        )
        .join(";"),
      caption: getComputedStyle(el.querySelector(".credit-caption"))
        .opacity,
      visible: !el.hidden,
    }));
  const text = await page.$eval("#credits-roll", (el) => el.textContent);
  for (const name of [
    "Rapido",
    "Codex",
    "Claude Code",
    "Three.js",
    "404 game recipe",
    "Bittensor",
    "ImageGen",
    "Atlas",
    "Lyria",
    "Gemini",
    "Web Audio",
    "INSPIRATIONS",
  ])
    assert.ok(text.includes(name), name);
  // Atlas media ship at runtime since the Atlas release; the roll names the platform.
  assert.ok(
    text.includes("Generated on Atlas"),
    "Atlas runtime media are attributed accurately",
  );
  await at(5.8);
  const braking = await robot("brake");
  await at(7.6);
  const stopped = await robot("brake");
  assert.ok(braking.visible && stopped.visible);
  assert.ok(
    Math.abs(stopped.x - braking.x) < 1,
    "The vacuum holds its position after braking",
  );
  assert.equal(stopped.caption, "1");
  await page.click("#credits-pause");
  const paused = await page.evaluate(() => window.__GAME__.credits.elapsed);
  const frozen = await robot("brake");
  await sleep(450);
  assert.equal(
    await page.evaluate(() => window.__GAME__.credits.elapsed),
    paused,
  );
  assert.deepEqual(
    await robot("brake"),
    frozen,
    "Pause freezes the vacuum, wheels, dust and caption too",
  );
  await shot("braking-desktop");
  await page.click("#credits-pause");
  await page.waitForFunction(
    (time) => window.__GAME__.credits.elapsed > time + 0.3,
    {},
    paused,
  );
  await at(10.2);
  assert.ok(
    (await robot("brake")).x > stopped.x + 10,
    "The stopped vacuum accelerates away",
  );
  await at(21);
  const peeking = await robot("peek");
  assert.ok(peeking.visible && peeking.facing < 0);
  await shot("peek-desktop");
  await at(24.5);
  const turned = await robot("peek");
  assert.ok(
    turned.x > peeking.x && turned.facing > 0,
    "The second vacuum turns and leaves through its entrance",
  );
  await shot("crew-desktop");
  report.checks.push(
    "The braking gag holds for its caption, pause freezes every effect, and the peeking vacuum turns back; tool attribution remains accurate",
  );
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await at(35.5);
  const reversing = await robot("reverse");
  await shot("reverse-phone");
  await at(40.5);
  const backedUp = await robot("reverse");
  assert.ok(reversing.visible && backedUp.visible);
  assert.ok(
    backedUp.x < reversing.x && backedUp.facing > 0,
    "The third vacuum travels backwards with its face still pointing right",
  );
  await shot("crew-phone");
  const bounds = await page.evaluate(() =>
    ["credits-pause", "credits-skip"].map((id) =>
      document.getElementById(id).getBoundingClientRect().toJSON(),
    ),
  );
  assert.ok(
    bounds.every(
      (r) =>
        r.left >= 0 && r.right <= 390 && r.bottom <= 844 && r.height >= 44,
    ),
  );
  await at(49);
  assert.equal(
    await page.evaluate(() => window.__GAME__.credits.finished),
    false,
    "The roll lasts longer than the previous 48 seconds",
  );
  await page.waitForFunction(
    () => window.__GAME__.credits.finaleTime !== null,
    {
      timeout: 20000,
    },
  );
  assert.equal(await page.$eval("#credits-finale", (el) => el.inert), true);
  const deliveryAt = (time) =>
    page.waitForFunction(
      (value) => window.__GAME__.credits.finaleTime >= value,
      { timeout: 8000 },
      time,
    );
  const deliveryPose = () =>
    page.evaluate(() => ({
      time: window.__GAME__.credits.finaleTime,
      ticket: document
        .getElementById("credits-ticket")
        .getAttribute("style"),
      courier: document
        .getElementById("credits-courier")
        .getAttribute("style"),
      body: document
        .getElementById("credits-courier-body")
        .getAttribute("style"),
    }));
  await deliveryAt(1.45);
  await page.click("#credits-pause");
  const pausedDelivery = await deliveryPose();
  await sleep(350);
  assert.deepEqual(
    await deliveryPose(),
    pausedDelivery,
    "Pause must freeze the delivery scene too",
  );
  assert.equal(
    await page.$eval("#credits-ticket", (el) => el.style.opacity),
    "0",
  );
  await shot("delivery-cough-phone");
  await page.click("#credits-pause");
  await deliveryAt(2.55);
  assert.equal(
    await page.$eval("#credits-ticket", (el) => el.style.opacity),
    "1",
  );
  assert.notEqual(
    await page.$eval("#credits-ticket", (el) => el.style.transform),
    "none",
  );
  await shot("delivery-ticket-phone");
  await page.waitForFunction(() => window.__GAME__.credits.finished, {
    timeout: 8000,
  });
  assert.equal(
    await page.$eval("#credits-finale", (el) => el.inert),
    false,
  );
  assert.equal(
    await page.$eval("#credits-ticket", (el) => el.style.transform),
    "none",
  );
  report.duration = await page.evaluate(
    () => window.__GAME__.credits.elapsed,
  );
  assert.ok(report.duration >= 60 && report.duration < 60.2);
  report.deliveryDuration = await page.evaluate(
    () => window.__GAME__.credits.finaleTime,
  );
  assert.ok(
    report.deliveryDuration >= 4.4 && report.deliveryDuration < 4.6,
  );
  assert.match(
    await page.$eval("#credits-finale", (el) => el.textContent),
    /Rapido/,
  );
  assert.equal(await page.$eval("#credits-twist", (el) => el.hidden), true);
  await shot("made-by-phone");
  await page.click("#credits-continue");
  assert.equal(
    await page.$eval("#settings-screen", (el) => el.hidden),
    false,
  );
  report.checks.push(
    "After the 60-second roll, a pausable vacuum delivery unfolds the Rapido receipt over 4.4 seconds; the final controls work without spoiling the basement",
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
    await page.$eval(
      ".credits-traffic",
      (el) => getComputedStyle(el).display,
    ),
    "none",
  );
  await page.mouse.move(190, 420);
  await page.mouse.wheel({ deltaY: 680 });
  await sleep(300);
  assert.ok(await page.$eval("#credits-window", (el) => el.scrollTop > 0));
  await shot("reduced-motion-phone");
  await page.$$eval(".credit-block", (blocks) =>
    blocks
      .find((block) => block.textContent.includes("INSPIRATIONS"))
      .scrollIntoView({ block: "center" }),
  );
  await shot("inspirations-phone");
  await page.click("#credits-skip");
  await page.waitForFunction(() => window.__GAME__.credits.finished, {
    timeout: 1500,
  });
  await page.click("#credits-continue");
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 });
  await page.click("#open-credits");
  await shot("opening-landscape");
  await page.click("#credits-skip");
  await deliveryAt(2.5);
  await shot("delivery-ticket-landscape");
  await page.click("#credits-skip");
  await page.waitForFunction(() => window.__GAME__.credits.finished, {
    timeout: 1500,
  });
  await shot("made-by-landscape");
  await page.click("#credits-continue");
  await page.click("#open-credits");
  await page.keyboard.press("Escape");
  assert.equal(
    await page.$eval("#credits-screen", (el) => el.hidden),
    true,
  );
  assert.equal(
    await page.$eval("#settings-screen", (el) => el.hidden),
    false,
  );
  await page.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
  });
  await page.click("#open-credits");
  await page.click("#credits-pause");
  await page.click("#credits-skip");
  await deliveryAt(1.5);
  assert.equal(
    await page.evaluate(() => window.__GAME__.credits.paused),
    false,
  );
  await shot("delivery-cough-desktop");
  await deliveryAt(2.55);
  await shot("delivery-ticket-desktop");
  await page.waitForFunction(() => window.__GAME__.credits.finished, {
    timeout: 8000,
  });
  await shot("made-by-desktop");
  await page.click("#credits-continue");
  report.checks.push(
    "Reduced motion bypasses the flying ticket; skip from a paused roll starts the delivery, a second skip settles it, and desktop/landscape returns work",
  );
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  await shot("failure").catch(() => {});
} finally {
  await writeFile(
    new URL("report.json", out),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
