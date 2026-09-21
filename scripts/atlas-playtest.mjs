import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/atlas/", import.meta.url);
await mkdir(out, { recursive: true });
const directory = await mkdtemp(path.join(os.tmpdir(), "hft-atlas-check-"));
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: new URL("../", import.meta.url).pathname,
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: "0",
    LEADERBOARD_FILE: path.join(directory, "scores.json"),
  },
  stdio: ["ignore", "pipe", "pipe"],
});
const report = {
  checks: [],
  errors: [],
  scope:
    "Disposable server and browser. Real briefing, pause, mute and practice controls; practice unlocks are a disclosed local fixture. A separate Sound component fixture measures actual Web Audio output, a full loop, Overtime and decode-failure fallback. No subjective listening or complete combat run is claimed.",
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Server did not start")),
      10000,
    );
    server.once("error", reject);
    server.stdout.on("data", (data) => {
      const url = /http:\/\/localhost:\d+/.exec(String(data))?.[0];
      if (url) {
        clearTimeout(timer);
        resolve(url);
      }
    });
  });
  browser = await puppeteer.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  async function client(mobile = false) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    page.on("console", (event) => {
      if (event.type() === "error") report.errors.push(event.text());
    });
    await page.setViewport({
      width: mobile ? 390 : 1440,
      height: mobile ? 844 : 900,
      isMobile: mobile,
      hasTouch: mobile,
      deviceScaleFactor: 1,
    });
    await page.evaluateOnNewDocument(() => {
      const connect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (destination, ...args) {
        const result = connect.call(this, destination, ...args);
        if (destination === this.context.destination) {
          const analyser = this.context.createAnalyser();
          analyser.fftSize = 2048;
          connect.call(this, analyser);
          window.qaAudio = { analyser, context: this.context, master: this };
        }
        return result;
      };
      const start = AudioBufferSourceNode.prototype.start;
      window.qaMusicStarts = 0;
      AudioBufferSourceNode.prototype.start = function (...args) {
        if (this.buffer?.duration > 2) {
          window.qaMusicStarts++;
          window.qaMusic = this;
        }
        return start.apply(this, args);
      };
    });
    await page.goto(base, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.__READY__);
    return page;
  }
  async function rms(page) {
    return page.evaluate(async () => {
      const analyser = window.qaAudio.analyser;
      const samples = new Float32Array(analyser.fftSize);
      let peak = 0;
      // A single audio frame can land in a musical rest; observe a short window.
      for (let i = 0; i < 8; i++) {
        analyser.getFloatTimeDomainData(samples);
        peak = Math.max(
          peak,
          Math.sqrt(
            samples.reduce((sum, value) => sum + value * value, 0) /
              samples.length,
          ),
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return peak;
    });
  }
  const page = await client();
  assert.equal(await page.evaluate(() => window.qaMusicStarts), 0);
  await page.click("#start");
  await page.waitForFunction(() => window.__GAME__.briefing);
  await page.waitForFunction(
    () => document.querySelector("#briefing-mop img")?.naturalWidth === 256,
  );
  await page.screenshot({
    path: new URL("mop-briefing-desktop.png", out).pathname,
  });
  await page.click("#briefing-continue");
  await page.waitForFunction(() => window.qaMusicStarts > 0);
  await sleep(700);
  assert.ok((await rms(page)) > 0.001);
  await page.keyboard.press("Escape");
  await sleep(700);
  assert.ok((await rms(page)) < 0.0001);
  await page.click("#resume");
  await sleep(350);
  await page.click("#sound");
  await sleep(500);
  assert.ok((await rms(page)) < 0.0001);
  await page.click("#sound");
  await sleep(500);
  assert.ok((await rms(page)) > 0.001);
  await page.keyboard.press("Escape");
  await page.click("#pause-menu");
  report.checks.push(
    "No audio before a gesture; real Play starts the Atlas track; real pause and mute silence output and Resume/unmute restore it",
  );
  await page.close();

  const phone = await client(true);
  await phone.tap("#start");
  await phone.waitForFunction(() => window.__GAME__.briefing);
  await phone.screenshot({
    path: new URL("mop-briefing-phone.png", out).pathname,
  });
  await phone.tap("#briefing-continue");
  await phone.waitForFunction(() => window.qaMusicStarts > 0);
  await phone.tap("#pause");
  await phone.tap("#pause-menu");
  await phone.evaluate(() =>
    localStorage.setItem(
      "hft-route-v1",
      JSON.stringify({ unlocked: 2, cleared: [0, 1] }),
    ),
  );
  await phone.reload({ waitUntil: "networkidle0" });
  await phone.waitForFunction(() => window.__READY__);
  await phone.tap("#open-route");
  await phone.tap('#route-map button[data-floor="3"]');
  await phone.tap("#practice-start");
  await phone.waitForFunction(
    () =>
      window.__GAME__?.floor === 3 &&
      document.querySelector("#radio-portrait img")?.naturalWidth === 256,
  );
  assert.match(
    await phone.$eval("#radio-portrait img", (el) => el.src),
    /shelf-control/,
  );
  await phone.screenshot({
    path: new URL("shelf-radio-phone.png", out).pathname,
  });
  await phone.tap("#pause");
  await phone.tap("#pause-menu");
  await phone.tap("#open-settings");
  await phone.tap("#open-credits");
  const credits = await phone.$eval("#credits-roll", (el) => el.textContent);
  assert.ok(
    credits.includes("Atlas") &&
      credits.includes("Google Lyria 3 Clip") &&
      credits.includes("Gemini 3.1 Flash Lite Image"),
  );
  assert.ok(!credits.includes("not used in this build"));
  report.checks.push(
    "Atlas MOP-3 loads in desktop and touch briefings; SHELF CONTROL appears in actual aisle-three radio; credits identify the shipped generators",
  );
  await phone.close();

  async function component(fail = false) {
    const page = await client();
    if (fail) {
      await page.setRequestInterception(true);
      page.on("request", (request) =>
        request.url().endsWith("night-shift.mp3")
          ? request.respond({
              status: 200,
              contentType: "audio/mpeg",
              body: "Deliberately invalid fixture",
            })
          : request.continue(),
      );
    }
    await page.evaluate(async () => {
      const { Sound } = await import("./audio.js");
      const sound = new Sound();
      window.qaComponent = { sound, overtime: 0, playing: true };
      const button = document.createElement("button");
      button.id = "qa-audio";
      button.textContent = "Start audio component check";
      button.style.cssText =
        "position:fixed;inset:0 auto auto 0;z-index:999999";
      button.onclick = async () => {
        await sound.start();
        function frame() {
          const c = window.qaComponent;
          sound.update(c.playing, c.overtime, "food");
          requestAnimationFrame(frame);
        }
        frame();
      };
      document.body.append(button);
    });
    await page.click("#qa-audio");
    await page.waitForFunction(() =>
      ["ready", "fallback"].includes(window.qaComponent.sound.trackState),
    );
    return page;
  }
  const audio = await component();
  const duration = await audio.evaluate(
    () => window.qaComponent.sound.trackBuffer.duration,
  );
  assert.ok(duration > 30 && duration < 31);
  await sleep(350);
  await audio.evaluate(() => {
    window.qaComponent.overtime = 8;
  });
  await sleep(600);
  assert.equal(
    await audio.evaluate(() => window.qaComponent.sound.trackVoice),
    null,
  );
  assert.ok((await rms(audio)) > 0.0001);
  await audio.evaluate(() => {
    window.qaComponent.overtime = 0;
  });
  await sleep(600);
  const loopStart = await audio.evaluate(() => window.qaMusicStarts);
  const samples = [];
  for (let second = 0; second < 33; second++) {
    await sleep(1000);
    samples.push(await rms(audio));
  }
  assert.equal(await audio.evaluate(() => window.qaMusicStarts), loopStart);
  assert.equal(await audio.evaluate(() => window.qaMusic.loop), true);
  assert.ok(samples.every((value) => value > 0.0001));
  report.loop = {
    duration,
    samplingWindowMs: 400,
    minimumWindowPeakRms: Math.min(...samples),
    samples,
    sourceRestarted: false,
  };
  report.checks.push(
    "A full real-time Atlas loop remains audible without restarting its source; Overtime switches to the original synth cue and restores the music afterward",
  );
  await audio.close();
  const fallback = await component(true);
  assert.equal(
    await fallback.evaluate(() => window.qaComponent.sound.trackState),
    "fallback",
  );
  await sleep(750);
  assert.ok((await rms(fallback)) > 0.0001);
  report.checks.push(
    "A deliberately undecodable music response falls back to the original synthesized score without blocking play",
  );
  await fallback.close();
  assert.deepEqual(report.errors, []);
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failure = error.stack;
  report.diagnostics = await Promise.all(
    ((await browser?.pages()) || []).map((page) =>
      page
        .evaluate(() => ({
          game: window.__GAME__ && {
            mode: window.__GAME__.mode,
            paused: window.__GAME__.paused,
            state: window.__GAME__.state,
            elapsed: window.__GAME__.elapsed,
          },
          audio: window.qaAudio && {
            state: window.qaAudio.context.state,
            time: window.qaAudio.context.currentTime,
            gain: window.qaAudio.master.gain.value,
          },
          musicStarts: window.qaMusicStarts,
          musicDuration: window.qaMusic?.buffer?.duration,
          hidden: document.hidden,
        }))
        .catch(() => null),
    ),
  );
  process.exitCode = 1;
} finally {
  await writeFile(new URL("report.json", out), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser?.close();
  console.log(
    `Stopping owned test server PID ${server.pid}: node scripts/serve.mjs (temporary score store)`,
  );
  server.kill("SIGTERM");
  await new Promise((resolve) =>
    server.exitCode !== null ? resolve() : server.once("exit", resolve),
  );
  await rm(directory, { recursive: true, force: true });
}
