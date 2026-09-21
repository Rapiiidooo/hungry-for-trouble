import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const production = "https://trouble.rapidoai.dev";
const preview = "http://localhost:3001";
const output = new URL("../outputs/analytics/", import.meta.url);
await mkdir(output, { recursive: true });
const response = await fetch(`${production}/analytics/script.js`);
assert.equal(response.status, 200);
const tracker = await response.text();
assert.ok(tracker.includes("umami"));
const report = {
  scope:
    "Disposable browser contexts run the actual game and live Umami tracker under an intercepted production origin. Game requests go to the local preview; analytics collection is intercepted and never creates visitor records. Real controls check startup when tracking is blocked or fails.",
  checks: [],
  errors: [],
  trackerBytes: Buffer.byteLength(tracker),
};
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function client(kind, local = false) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const calls = [],
    scripts = [];
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.setViewport({ width: 1280, height: 800 });
  await page.evaluateOnNewDocument((kind) => {
    if (kind === "dnt")
      Object.defineProperty(navigator, "doNotTrack", { get: () => "1" });
    if (kind === "gpc")
      Object.defineProperty(navigator, "globalPrivacyControl", {
        get: () => true,
      });
    if (kind === "disabled") localStorage.setItem("umami.disabled", "1");
  }, kind);
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    try {
      const url = new URL(request.url());
      if (url.hostname === "example.test") {
        return await request.respond({
          status: 200,
          contentType: "text/html",
          headers: { "Referrer-Policy": "unsafe-url" },
          body: `<a href="${production}/?invitation=QA_ONLY&token=fixture#private-fragment">Visit game</a>`,
        });
      }
      if (url.origin !== production) return await request.continue();
      if (url.pathname === "/analytics/script.js") {
        scripts.push(url.pathname);
        if (kind === "blocked") return await request.abort("blockedbyclient");
        return await request.respond({
          status: 200,
          contentType: "text/javascript",
          body: tracker,
        });
      }
      if (url.pathname === "/analytics/api/send") {
        calls.push({
          body: JSON.parse(request.postData()),
          cookie: request.headers().cookie || null,
        });
        return await request.respond({
          status: kind === "unavailable" ? 503 : 200,
          contentType: "application/json",
          body: "{}",
        });
      }
      const headers = { ...request.headers() };
      delete headers.host;
      if (headers.origin) headers.origin = preview;
      const upstream = await fetch(`${preview}${url.pathname}${url.search}`, {
        method: request.method(),
        headers,
        body: ["GET", "HEAD"].includes(request.method())
          ? undefined
          : request.postData(),
        redirect: "manual",
      });
      await request.respond({
        status: upstream.status,
        headers: Object.fromEntries(upstream.headers),
        body: Buffer.from(await upstream.arrayBuffer()),
      });
    } catch (error) {
      report.errors.push(error.message);
      if (!request.isInterceptResolutionHandled()) await request.abort();
    }
  });
  if (kind === "normal") {
    await page.goto("https://example.test/private-path?secret=fixture", {
      waitUntil: "domcontentloaded",
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click("a"),
    ]);
  } else
    await page.goto(local ? preview : production, {
      waitUntil: "networkidle0",
    });
  await page.waitForFunction(() => window.__READY__);
  await sleep(400);
  return { context, page, calls, scripts };
}
async function play(page) {
  await page.click("#start");
  await page.waitForFunction(() => window.__GAME__?.briefing);
  await page.click("#briefing-continue");
  const before = await page.evaluate(() => window.__GAME__.pos);
  await page.keyboard.down("KeyW");
  await sleep(650);
  await page.keyboard.up("KeyW");
  const after = await page.evaluate(() => window.__GAME__.pos);
  assert.ok(Math.hypot(after[0] - before[0], after[1] - before[1]) > 0.5);
}
try {
  const normal = await client("normal");
  assert.equal(normal.calls.length, 1);
  const payload = normal.calls[0].body.payload;
  assert.deepEqual(Object.keys(payload).sort(), [
    "hostname",
    "language",
    "referrer",
    "screen",
    "title",
    "url",
    "website",
  ]);
  assert.equal(payload.website, "92113d9d-fdd2-4ea2-aecf-e9e587fa26f5");
  assert.equal(payload.url, "/");
  assert.equal(payload.referrer, "https://example.test");
  assert.ok(!JSON.stringify(payload).includes("fixture"));
  await normal.page.setCookie({
    name: "qa_private_cookie",
    value: "fixture",
    url: production,
    httpOnly: true,
  });
  await normal.page.evaluate(() => window.umami.track());
  await sleep(350);
  assert.equal(normal.calls.length, 2);
  assert.ok(normal.calls.every((call) => call.cookie === null));
  await normal.page.evaluate(async () => {
    await window.umami.track("private-score", { callsign: "fixture" });
    await window.umami.identify("fixture", { score: 123 });
  });
  await sleep(350);
  assert.equal(normal.calls.length, 2);
  await play(normal.page);
  await normal.page.screenshot({
    path: new URL("playing.png", output).pathname,
  });
  await normal.context.close();
  report.checks.push(
    "Actual tracker sends a pageview with origin-only referrer and no query/hash, identifier, custom data or cookies; real game input works",
  );
  for (const kind of ["dnt", "gpc", "disabled", "local"]) {
    const clientPage = await client(kind, kind === "local");
    assert.equal(clientPage.calls.length, 0);
    if (kind !== "disabled") assert.equal(clientPage.scripts.length, 0);
    await clientPage.context.close();
  }
  report.checks.push(
    "DNT, Global Privacy Control, Umami local opt-out and local preview produce no tracking requests",
  );
  for (const kind of ["blocked", "unavailable"]) {
    const clientPage = await client(kind);
    await play(clientPage.page);
    if (kind === "blocked") assert.equal(clientPage.calls.length, 0);
    else assert.equal(clientPage.calls.length, 1);
    await clientPage.context.close();
  }
  report.checks.push(
    "Real game startup and movement still work with a blocked tracker or a 503 collection response",
  );
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await writeFile(
    new URL("report.json", output),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
