import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const baseline = process.argv.includes("--baseline");
const out = new URL(
  `../outputs/mobile-ui${baseline ? "-before" : ""}/`,
  import.meta.url,
);
const base = process.env.GAME_URL || "http://localhost:3001/";
await mkdir(out, { recursive: true });
const source = await readFile(
  new URL("../game/main.js", import.meta.url),
  "utf8",
);
assert.ok(
  source.includes("  newGame,") && source.includes("  upgradeChoices,"),
);
const report = {
  scope:
    "Real start and HUD; isolated checkout fixtures exercise the actual card renderer, all upgrade illustrations and real selection. Chrome phone emulation, not combat completion or a physical device. No score is posted.",
  checks: [],
  issues: [],
  errors: [],
  hud: [],
  cards: [],
};
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const sizes = [
  ["narrow", 320, 568],
  ["small", 360, 640],
  ["portrait", 390, 844],
  ["short-landscape", 667, 375],
  ["landscape", 844, 390],
  ["desktop", 1280, 800],
];
function check(value, message) {
  if (!value) report.issues.push(message);
}
async function open(name, width, height, fixture) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1,
    isMobile: name !== "desktop",
    hasTouch: name !== "desktop",
  });
  await page.evaluateOnNewDocument(() =>
    Object.defineProperty(navigator, "doNotTrack", { get: () => "1" }),
  );
  page.on("pageerror", (e) => report.errors.push(e.message));
  if (fixture) {
    const loaded = fixture === "loaded-hud";
    const body =
      source
        .replace("  newGame,", "  newGame as createNewGame,")
        .replace(
          "  upgradeChoices,",
          "  upgradeChoices as originalUpgradeChoices,",
        ) +
      `
function newGame(index = 0, carry = {}) {
  const value = createNewGame(index, ${loaded ? "{ ...carry, upgrades: { ...carry.upgrades, heart: 4, shield: 3 } }" : "carry"});
  if (index === 0) {
    ${loaded ? "value.player.hp = 5; value.ammo = 99; value.score = 1234567;" : "Object.assign(value.player, value.map.exit); value.collected = value.map.level.quota;"}
    for (const enemy of value.enemies) enemy.respawn = 999;
  }
  return value;
}
function upgradeChoices(value) { return ${loaded ? "originalUpgradeChoices(value)" : `value.levelIndex === 0 ? ${JSON.stringify(fixture)} : originalUpgradeChoices(value)`}; }
`;
    await page.setRequestInterception(true);
    page.on("request", (request) =>
      new URL(request.url()).pathname === "/main.js"
        ? request.respond({ status: 200, contentType: "text/javascript", body })
        : request.continue(),
    );
  }
  await page.goto(base, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__READY__);
  await page.click("#start");
  await page.waitForSelector("#briefing:not([hidden])");
  await page.click("#briefing-continue");
  return page;
}
try {
  for (const [name, width, height] of [
    ...sizes,
    ...sizes
      .filter(([name]) => name !== "desktop")
      .map(([name, width, height]) => [name + "-loaded", width, height]),
  ]) {
    const loaded = name.endsWith("-loaded");
    const page = await open(
      name,
      width,
      height,
      loaded ? "loaded-hud" : undefined,
    );
    await page.waitForFunction(
      () =>
        window.__GAME__?.elapsed > 0.1 &&
        !document.querySelector("#game").classList.contains("briefing"),
    );
    const bounds = await page.evaluate(() => {
      const rect = (selector) => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          right: r.right,
          bottom: r.bottom,
        };
      };
      return {
        vitals: rect(".vitals"),
        health: rect("#health"),
        ammo: rect("#ammo-panel"),
        move: rect("#move-stick"),
        aim: rect("#aim-stick"),
        score: rect(".score-block"),
        hearts: [...document.querySelectorAll(".heart")].map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
        }),
        shield: document.querySelector("#shield-count").textContent,
        shieldVisible:
          document.querySelector("#shield-count").getBoundingClientRect()
            .height > 0,
      };
    });
    report.hud.push({ name, ...bounds });
    if (name !== "desktop") {
      check(
        bounds.vitals.height <= 66,
        `${name}: vitals must stay within 66 px`,
      );
      if (loaded) {
        check(
          bounds.hearts.length === 8 &&
            bounds.hearts.every(
              (r) =>
                r.x >= bounds.vitals.x &&
                r.right <= bounds.vitals.right &&
                r.y >= bounds.vitals.y &&
                r.bottom <= bounds.vitals.bottom,
            ),
          `${name}: all eight hearts fit the panel`,
        );
        check(
          bounds.shieldVisible && bounds.shield.includes("3 HITS"),
          `${name}: shield charges remain visible`,
        );
      }
      check(
        bounds.vitals.right + 4 <= bounds.score.x,
        `${name}: vitals and score must not overlap`,
      );
      check(
        bounds.move.width >= 90 && bounds.aim.width >= 90,
        `${name}: thumb targets retain their size`,
      );
    }
    await page.screenshot({ path: new URL(`hud-${name}.png`, out).pathname });
    await page.browserContext().close();
  }
  const sets = [
    ["rapid", "spread", "pierce"],
    ["shield", "magnet", "heart"],
    ["ricochet", "frost", "heart"],
  ];
  for (const [name, width, height] of sizes) {
    for (const [group, fixture] of sets.entries()) {
      const page = await open(name, width, height, fixture);
      await page.waitForSelector(
        "#upgrade-screen:not([hidden]) [data-upgrade]",
      );
      await page.evaluate(() => document.fonts.ready);
      const cards = await page.$$eval("#upgrade-options button", (buttons) =>
        buttons.map((button) => {
          const box = (el) => {
            const r = el.getBoundingClientRect();
            return {
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              right: r.right,
              bottom: r.bottom,
            };
          };
          const art = box(button.querySelector(".upgrade-art"));
          const text = [...button.children]
            .filter((el) => !el.classList.contains("upgrade-art"))
            .map(box);
          const intersect = (a, b) =>
            Math.min(a.right, b.right) > Math.max(a.x, b.x) + 1 &&
            Math.min(a.bottom, b.bottom) > Math.max(a.y, b.y) + 1;
          const card = box(button);
          const svgs = [...button.querySelectorAll(".upgrade-art svg")]
            .filter((el) => el.getBoundingClientRect().width > 0)
            .map(box);
          return {
            key: button.dataset.upgrade,
            card,
            art,
            overlaps: text.some((r) => intersect(art, r)),
            overflow: button.scrollWidth > button.clientWidth + 1,
            svgs,
            illustrationInside: svgs.every(
              (r) =>
                r.x >= art.x - 1 &&
                r.right <= art.right + 1 &&
                r.y >= art.y - 1 &&
                r.bottom <= art.bottom + 1,
            ),
          };
        }),
      );
      for (const card of cards) {
        report.cards.push({ viewport: name, ...card });
        check(
          !card.overlaps,
          `${name}/${card.key}: illustration must not overlap text or stats`,
        );
        check(
          !card.overflow,
          `${name}/${card.key}: no horizontal card overflow`,
        );
        check(
          card.illustrationInside && card.svgs.length > 0,
          `${name}/${card.key}: illustration fits its frame`,
        );
      }
      check(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <= innerWidth &&
            document.querySelector("#upgrade-screen").scrollWidth <= innerWidth,
        ),
        `${name}: upgrade overlay has no horizontal overflow`,
      );
      await page.screenshot({
        path: new URL(`upgrades-${name}-${group}.png`, out).pathname,
      });
      if (!baseline && group === 0) {
        const chosen = fixture.at(-1);
        const selector = `[data-upgrade="${chosen}"]`;
        if (name === "desktop") await page.click(selector);
        else {
          await page.$eval(selector, (el) =>
            el.scrollIntoView({ block: "center" }),
          );
          const r = await (await page.$(selector)).boundingBox();
          await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 2);
        }
        await page.waitForFunction(
          () =>
            window.__GAME__.floor === 2 && window.__GAME__.state === "playing",
        );
        assert.equal(
          (await page.evaluate(() => window.__GAME__)).upgrades[chosen],
          1,
        );
      }
      await page.browserContext().close();
    }
  }
  report.checks.push(
    "Six viewport layouts captured, all eight upgrade illustrations inspected by geometry, eight-heart/shield fixtures fit, and original thumb target sizes retained",
  );
  if (!baseline)
    report.checks.push(
      "The last card can be reached and equipped in every viewport, entering the next aisle",
    );
  check(report.errors.length === 0, "No JavaScript runtime errors");
  report.result = report.issues.length ? "FAIL" : "PASS";
  if (report.issues.length && !baseline) process.exitCode = 1;
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await writeFile(
    new URL("report.json", out),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      result: report.result,
      issues: report.issues,
      errors: report.errors,
      failure: report.failure,
    }),
  );
  await browser.close();
}
