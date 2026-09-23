import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const output = new URL("../outputs/locked-wing-endings/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const report = {
  fixture:
    "Isolated presentation test. This browser intercepts main.js to place practice floors 20 and 25 at completed checkout conditions. It tests real scene/UI transitions, not a combat victory. No game files or leaderboard records are modified.",
  checks: [],
  errors: [],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const read = () => page.evaluate(() => window.__GAME__);
const snap = (name) =>
  page.screenshot({ path: new URL(`${name}.png`, output).pathname });
const source = await readFile(
  new URL("../game/main.js", import.meta.url),
  "utf8",
);
assert.ok(source.includes("  newGame,"));
const fixtureSource =
  source.replace("  newGame,", "  newGame as createNewGame,") +
  `
function newGame(index = 0, carry = {}) {
  const fixture = createNewGame(index, carry);
  if (![19, 24].includes(index)) return fixture;
  Object.assign(fixture.player, fixture.map.exit);
  fixture.collected = fixture.map.level.quota;
  fixture.boss.hp = 0;
  for (const enemy of fixture.enemies) enemy.respawn = 999;
  for (const key of fixture.keycards) {
    key.collected = true;
    fixture.keyring.push(key.color);
  }
  for (const door of fixture.doors) { door.open = true; door.openedAt = 0; }
  return fixture;
}
`;
async function dimensions(name, width, height) {
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await sleep(100);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await snap(name);
}
try {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/main.js")
      request.respond({
        status: 200,
        contentType: "text/javascript",
        body: fixtureSource,
      });
    else request.continue();
  });
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") report.errors.push(message.text());
  });
  await page.setViewport({
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle0" });
  await page.evaluate(() =>
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({ unlocked: 19, cleared: [9] }),
    ),
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#open-route");
  await page.click('[data-floor="20"]');
  await page.click("#practice-start");
  // Aisle 20 no longer plays the escape cinematic: the crew cheers, then the wing opens.
  await page.waitForFunction(() => window.__GAME__.state === "cleared");
  await sleep(600);
  await snap("floor20-crew-free");
  await page.waitForSelector("#vault-discovery", { visible: true });
  assert.equal(await page.$eval("#cinema", (el) => el.hidden), true);
  assert.equal((await read()).endingTime, null);
  const frozen = await read();
  await sleep(500);
  assert.equal((await read()).elapsed, frozen.elapsed);
  assert.equal(frozen.visibleFloors, 25);
  assert.equal(frozen.goldEnabled, true);
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("hft-route-v1")).unlocked,
    ),
    20,
  );
  for (const [name, width, height] of [
    ["desktop", 1280, 800],
    ["portrait", 390, 844],
    ["short-phone", 390, 640],
    ["landscape", 844, 390],
  ]) {
    await dimensions(`discovery-${name}`, width, height);
    await page.$eval("#vault-title", (el) =>
      el.scrollIntoView({ block: "center" }),
    );
    assert.ok(
      await page.$eval(
        "#vault-title",
        (el) => el.getBoundingClientRect().top >= 0,
      ),
      "The discovery title remains reachable on short screens",
    );
    await page.$eval("#vault-continue", (el) =>
      el.scrollIntoView({ block: "center" }),
    );
    assert.ok(
      await page.$eval("#vault-continue", (el) => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
      }),
    );
  }
  report.checks.push(
    "Fixture checkout 20 skips the escape cinematic, equips gold, saves aisle 21 and reveals 25 floors in a frozen readable discovery",
  );
  await page.tap("#vault-continue");
  await page.waitForSelector("#upgrade-screen", { visible: true });
  // The route strip on the upgrade screen: the next aisle points at the cards,
  // any other reached aisle opens Level Select on it.
  assert.equal(
    await page.$$eval("#upgrade-route button:not(:disabled)", (b) => b.length),
    21,
  );
  await page.click('#upgrade-route [data-floor="21"]');
  assert.ok(
    await page.$eval("#upgrade-options", (el) =>
      el.classList.contains("nudge"),
    ),
  );
  await page.click('#upgrade-route [data-floor="5"]');
  await page.waitForSelector("#route-screen", { visible: true });
  assert.match(
    await page.$eval("#stage-title", (el) => el.textContent),
    /AISLE 05/,
  );
  assert.equal(
    await page.$eval("#route-close", (el) => el.textContent),
    "BACK TO UPGRADES",
  );
  await snap("upgrade-route-pick");
  await page.click("#route-close");
  assert.equal(await page.$eval("#upgrade-screen", (el) => el.hidden), false);
  report.checks.push(
    "The upgrade screen's route opens any reached aisle in Level Select and points the next aisle at the upgrade cards",
  );
  await page.click("#upgrade-options button");
  await page.waitForFunction(() => window.__GAME__.floor === 21);
  assert.equal((await read()).state, "playing");
  assert.ok(Object.values((await read()).upgrades).some((value) => value > 0));
  assert.deepEqual((await read()).keyring, []);
  await page.waitForSelector("#briefing", { visible: true });
  await dimensions("floor21-briefing", 390, 844);
  await page.tap("#briefing-continue");
  await page.waitForFunction(() => window.__GAME__.elapsed > 0.2);
  assert.ok(await page.$eval("#cinema", (el) => el.hidden));
  assert.ok(await page.$eval("#vault-discovery", (el) => el.hidden));
  report.checks.push(
    "Continue equips the actual offered upgrade, opens the key briefing and starts aisle 21 with a fresh key ring",
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  assert.equal((await read()).goldEnabled, true);
  await page.tap("#open-route");
  assert.equal(
    await page.$eval('[data-floor="21"]', (el) => el.disabled),
    false,
  );
  assert.equal(
    await page.$eval('[data-floor="22"]', (el) => el.disabled),
    true,
  );
  report.checks.push("The new unlock and golden preference survive reload");
  await page.evaluate(() =>
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({ unlocked: 24, cleared: [9, 19] }),
    ),
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.tap("#open-route");
  await page.tap('[data-floor="25"]');
  await page.tap("#practice-start");
  await page.waitForSelector("#cinema", { visible: true });
  assert.equal((await read()).state, "won");
  await page.waitForFunction(() => window.__GAME__.endingTime >= 3.5);
  await snap("floor25-escape-phone");
  // The only escape cinematic hands over to the end credits, then the results.
  await page.waitForFunction(() => window.__GAME__.credits?.mode === "finale", {
    timeout: 20000,
  });
  await page.waitForFunction(() => window.__GAME__.credits.elapsed > 1);
  assert.equal(await page.$eval("#result", (el) => el.hidden), true);
  await snap("floor25-credits-phone");
  await page.tap("#credits-skip");
  await page.waitForFunction(() => window.__GAME__.credits.finished, {
    timeout: 15000,
  });
  assert.match(
    await page.$eval("#credits-twist", (el) => el.textContent),
    /Store closed/,
  );
  await snap("floor25-credits-closing-phone");
  await page.tap("#credits-continue");
  await page.waitForSelector("#result", { visible: true });
  assert.match(
    await page.$eval("#result-title", (el) => el.textContent),
    /Locks broken/,
  );
  assert.match(
    await page.$eval("#result-comment", (el) => el.textContent),
    /Last backup erased/,
  );
  assert.ok(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("hft-route-v1")).cleared.includes(24),
    ),
  );
  await snap("floor25-results-phone");
  await page.tap("#back-menu");
  await page.tap("#open-route");
  assert.equal(
    await page.$eval('[data-floor="25"]', (el) =>
      el.classList.contains("complete"),
    ),
    true,
  );
  report.checks.push(
    "Fixture checkout 25 plays the only escape, rolls the closing credits, persists completion and returns to the completed route",
  );
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
  report.last = await read().catch(() => null);
  await snap("failure").catch(() => {});
} finally {
  await writeFile(
    new URL("report.json", output),
    JSON.stringify(report, null, 2),
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
