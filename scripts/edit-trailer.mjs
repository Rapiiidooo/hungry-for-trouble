import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const require = createRequire(
  new URL("../../404-game-recipe/package.json", import.meta.url),
);
const puppeteer = require("puppeteer");
const out = new URL("../outputs/trailer/", import.meta.url);
const media = new URL("../game/media/night-shift.mp3", import.meta.url);
const ffmpeg = "/opt/homebrew/bin/ffmpeg";
const ffprobe = "/opt/homebrew/bin/ffprobe";
const beat = 60 / 132,
  fade = 0.18;
// Provenance names the exact build that was recorded.
const source = process.env.GAME_URL || "https://trouble.rapidoai.dev/";
const gameplayCommit = process.env.GAMEPLAY_COMMIT;
assert.match(gameplayCommit || "", /^[0-9a-f]{40}$/, "Set GAMEPLAY_COMMIT.");
const metadata = {};
for (const floor of [1, 2, 3, 11, 12, 15, 24, 20])
  metadata[floor] = JSON.parse(
    await readFile(new URL(`aisle-${floor}.json`, out)),
  );
const clips = [
  {
    floor: 1,
    start: 0.65,
    beats: 8,
    label: "CRUMBS ARE AMMO.",
    tag: "HUNGRY FOR TROUBLE",
  },
  {
    floor: 1,
    start: metadata[1].marks.overtime - 0.45,
    beats: 8,
    label: "OVERTIME. EAT THE COMPETITION.",
  },
  {
    // The aisle-24 take shows the goggle change and a clean first-person kill;
    // recorded aisle-2 takes walked into scenery at point-blank range.
    floor: 24,
    start: Math.max(0, metadata[24].marks.visor - 0.8),
    beats: 12,
    label: "STEAL THEIR POINT OF VIEW.",
  },
  { floor: 3, start: 4.4, beats: 6, label: "NEW AISLE. NEW PROBLEMS." },
  {
    floor: 12,
    start: metadata[12].marks.teleport - 1.25,
    beats: 10,
    label: "TAKE THE STAFF SHORTCUT.",
  },
  { floor: 11, start: 7.4, beats: 6, label: "WATCH YOUR WHEELS." },
  { floor: 15, start: 9.2, beats: 8, label: "MANAGEMENT WOULD LIKE A WORD." },
  {
    floor: 24,
    start: metadata[24].marks["key-red"] - 1.15,
    beats: 6,
    label: "FIND THE KEYS...",
  },
  {
    floor: 24,
    start: metadata[24].marks["door-red"] - 1.2,
    beats: 8,
    label: "...BREAK INTO THE LOCKED WING.",
  },
  {
    floor: 1,
    start: metadata[1].marks.upgrade - 0.2,
    beats: 6,
    label: "PICK YOUR NEXT BAD IDEA.",
  },
  { floor: 20, start: 10.3, beats: 10, label: "HAND IN YOUR RESIGNATION." },
];
await mkdir(new URL("edit/", out), { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const html = `<style>*{box-sizing:border-box}html,body{margin:0;background:transparent;font-family:Arial,sans-serif}.caption{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 26px 13px;color:#f6faff;background:rgba(14,28,46,.94);border-bottom:4px solid #e64e38;border-radius:9px;white-space:nowrap;font-size:29px;font-weight:900;letter-spacing:1px}.tag{display:block;text-align:center;color:#a9c9e5;font-size:14px;letter-spacing:5px;margin-bottom:7px}</style><div class="caption">${clip.tag ? `<span class="tag">${clip.tag}</span>` : ""}${clip.label}</div>`;
    await page.setContent(html);
    await page.screenshot({
      path: new URL(`edit/title-${i}.png`, out).pathname,
      omitBackground: true,
    });
  }
  await page.setContent(
    `<style>*{box-sizing:border-box}html,body{margin:0;background:#142338;color:#f6faff;font-family:Arial,sans-serif;text-align:center}main{height:720px;border:16px solid #243b53;padding:59px 30px}.eyebrow{color:#9ebad4;font-size:17px;font-weight:bold;letter-spacing:8px}h1{font-size:67px;line-height:.96;letter-spacing:-2px;margin:28px 0 20px;font-weight:900}h1 strong{display:block;font-size:109px;color:#f0634b;letter-spacing:-5px}.line{margin:0;font-size:22px;color:#bdd0e2}.play{display:inline-block;background:#f4f8fd;color:#142338;border-bottom:7px solid #ed5b43;border-radius:12px;margin:33px 0 22px;padding:15px 33px;font-size:33px;font-weight:900}.credit{font-size:16px;color:#a9bfd3;margin-top:16px}.credit b{color:#fff}</style><main><div class="eyebrow">404 GAME JAM</div><h1>HUNGRY FOR<strong>TROUBLE</strong></h1><p class="line">A very bad day to be management.</p><div class="play">trouble.rapidoai.dev</div><p class="credit">Made by <b>RAPIDO</b> · Built with the <b>404 recipe</b> · Music via <b>Atlas</b></p></main>`,
  );
  await page.screenshot({ path: new URL("edit/end-card.png", out).pathname });
} finally {
  await browser.close();
}

const render = (args) =>
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: "inherit",
  });
const probe = (file) => {
  const value = JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { encoding: "utf8" },
    ),
  );
  if (!value.format.duration) {
    // Chrome's streamed WebM has no duration header; count its constant-rate frames.
    const frames = JSON.parse(
      execFileSync(
        ffprobe,
        [
          "-v",
          "error",
          "-count_frames",
          "-select_streams",
          "v:0",
          "-show_entries",
          "stream=nb_read_frames,r_frame_rate",
          "-of",
          "json",
          file,
        ],
        { encoding: "utf8" },
      ),
    ).streams[0];
    const [numerator, denominator] = frames.r_frame_rate.split("/").map(Number);
    value.format.duration = String(
      (Number(frames.nb_read_frames) * denominator) / numerator,
    );
  }
  return value;
};
const notes = [];
for (let i = 0; i < clips.length; i++) {
  const c = clips[i],
    duration = c.beats * beat + fade;
  const raw = new URL(`aisle-${c.floor}.webm`, out).pathname;
  const source = probe(raw);
  assert.ok(
    c.start + duration < Number(source.format.duration),
    `Clip ${i} must not freeze or run beyond its source.`,
  );
  const file = new URL(`edit/part-${i}.mp4`, out).pathname;
  render([
    "-ss",
    c.start.toFixed(4),
    "-i",
    raw,
    "-loop",
    "1",
    "-i",
    new URL(`edit/title-${i}.png`, out).pathname,
    "-filter_complex",
    `[0:v]fps=30,setpts=PTS-STARTPTS,format=yuv420p[scene];[1:v]format=rgba,fade=t=in:st=0:d=0.15:alpha=1[title];[scene][title]overlay=0:0:shortest=1[out]`,
    "-map",
    "[out]",
    "-t",
    duration.toFixed(4),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    file,
  ]);
  const actual = Number(probe(file).format.duration);
  notes.push({ ...c, file: `edit/part-${i}.mp4`, duration: actual });
  console.log(JSON.stringify({ part: i, floor: c.floor, duration: actual }));
}
const endDuration = 8 * beat + fade;
const endFile = new URL(`edit/part-${clips.length}.mp4`, out).pathname;
render([
  "-loop",
  "1",
  "-i",
  new URL("edit/end-card.png", out).pathname,
  "-t",
  endDuration.toFixed(4),
  "-r",
  "30",
  "-an",
  "-c:v",
  "libx264",
  "-preset",
  "fast",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
  endFile,
]);
notes.push({
  file: `edit/part-${clips.length}.mp4`,
  duration: Number(probe(endFile).format.duration),
  label: "PLAY / CREDITS",
});
const inputs = notes.flatMap((n) => ["-i", new URL(n.file, out).pathname]);
const filters = notes.map(
  (n, i) => `[${i}:v]settb=AVTB,setpts=PTS-STARTPTS[v${i}]`,
);
let elapsed = notes[0].duration,
  last = "v0";
for (let i = 1; i < notes.length; i++) {
  const transition = i === 4 || i === 7 ? "fadeblack" : "fade";
  filters.push(
    `[${last}][v${i}]xfade=transition=${transition}:duration=${fade}:offset=${(elapsed - fade).toFixed(4)}[join${i}]`,
  );
  elapsed += notes[i].duration - fade;
  last = `join${i}`;
}
filters.push(
  `[${last}]fade=t=in:st=0:d=0.18,fade=t=out:st=${(elapsed - 0.55).toFixed(4)}:d=0.55,format=yuv420p[video]`,
);
const audioIndex = notes.length;
filters.push(`[${audioIndex}:a]asplit=2[a0][a1]`);
filters.push(`[a0]atrim=0:30.772167,asetpts=PTS-STARTPTS[b0]`);
filters.push(`[a1]atrim=0:30.772167,asetpts=PTS-STARTPTS[b1]`);
filters.push(
  `[b0][b1]acrossfade=d=0.35:c1=qsin:c2=qsin,loudnorm=I=-16:TP=-1.5:LRA=9,afade=t=in:st=0:d=0.1,afade=t=out:st=${(elapsed - 1.2).toFixed(4)}:d=1.2,atrim=0:${elapsed.toFixed(4)}[music]`,
);
const file = new URL("hungry-for-trouble-trailer.mp4", out);
render([
  ...inputs,
  "-i",
  media.pathname,
  "-filter_complex_threads",
  "2",
  "-filter_complex",
  filters.join(";"),
  "-map",
  "[video]",
  "-map",
  "[music]",
  "-t",
  elapsed.toFixed(4),
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "19",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-ar",
  "48000",
  "-movflags",
  "+faststart",
  file.pathname,
]);
const result = probe(file.pathname),
  bytes = await readFile(file);
assert.ok(result.streams.some((s) => s.codec_type === "audio"));
await writeFile(
  new URL("edit.json", out),
  JSON.stringify(
    {
      source,
      gameplayCommit,
      editing:
        "Real-speed excerpts; short crossfades and two dips to black; original English caption overlays and end card. No combat manipulation or duplicated freeze frames in gameplay shots.",
      bpmGrid: 132,
      transitionSeconds: fade,
      clips: notes,
      music: {
        file: "game/media/night-shift.mp3",
        platform: "Atlas",
        generator: "Google Lyria 3 Clip",
        sha256: createHash("sha256")
          .update(await readFile(media))
          .digest("hex"),
        processing:
          "Original instrumental, repeated with a 350 ms crossfade, normalized and faded at the edges.",
      },
      output: {
        file: file.pathname.split("/").at(-1),
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        seconds: Number(result.format.duration),
        width: 1280,
        height: 720,
        fps: 30,
        audio: "AAC stereo, 48 kHz",
      },
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    file: file.pathname,
    seconds: result.format.duration,
    bytes: bytes.length,
  }),
);
