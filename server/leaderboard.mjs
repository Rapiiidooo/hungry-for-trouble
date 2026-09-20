import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { challengeFor, verifyReplay, RULESET } from "../game/daily.js";

export async function createLeaderboard({ file, now = Date.now } = {}) {
  let boards = {};
  try {
    boards = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const attempts = new Map(),
    limits = new Map();
  let writes = Promise.resolve();
  const today = () => new Date(now()).toISOString().slice(0, 10);
  const rows = (day) =>
    (boards[`${RULESET}:${day}`] || []).sort(
      (a, b) => b.score - a.score || a.ticks - b.ticks || a.created - b.created,
    );
  const publicRows = (day) =>
    rows(day)
      .slice(0, 30)
      .map(({ name, score, kills, survived, ticks }, i) => ({
        rank: i + 1,
        name,
        score,
        kills,
        survived,
        seconds: +(ticks / 60).toFixed(1),
      }));
  function save() {
    const keys = Object.keys(boards).sort().slice(-90);
    boards = Object.fromEntries(keys.map((key) => [key, boards[key]]));
    const body = JSON.stringify(boards);
    writes = writes
      .catch(() => {})
      .then(async () => {
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(`${file}.tmp`, body, { mode: 0o600 });
        await rename(`${file}.tmp`, file);
      });
    return writes;
  }
  const send = (res, status, value) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(value));
  };
  return async function api(req, res, url) {
    if (!url.pathname.startsWith("/api/")) return false;
    try {
      for (const [id, run] of attempts)
        if (run.expires < now()) attempts.delete(id);
      for (const [ip, limit] of limits)
        if (now() - limit.start > 60000) limits.delete(ip);
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) {
        send(res, 403, { error: "Use the game's own page to submit." });
        return true;
      }
      const day = today();
      if (req.method === "GET" && url.pathname === "/api/daily") {
        send(res, 200, {
          ...challengeFor(day),
          resetsAt: new Date(Date.parse(day) + 86400000).toISOString(),
        });
        return true;
      }
      if (req.method === "GET" && url.pathname === "/api/leaderboard") {
        const selected = url.searchParams.get("day") || day;
        challengeFor(selected);
        send(res, 200, {
          day: selected,
          ruleset: RULESET,
          entries: publicRows(selected),
          players: rows(selected).length,
        });
        return true;
      }
      if (req.method !== "POST") {
        send(res, 404, { error: "Unknown endpoint" });
        return true;
      }
      const ip = req.socket.remoteAddress;
      const limit = limits.get(ip) || { start: now(), count: 0 };
      limits.set(ip, limit);
      if (++limit.count > 30 || attempts.size >= 2000) {
        send(res, 429, { error: "Too many attempts. Try again in a minute." });
        return true;
      }
      let player = /(?:^|;\s*)hft_player=([a-f0-9-]{36})(?:;|$)/.exec(
        req.headers.cookie || "",
      )?.[1];
      if (!player) {
        player = randomUUID();
        res.setHeader(
          "Set-Cookie",
          `hft_player=${player}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000`,
        );
      }
      if (url.pathname === "/api/runs") {
        const id = randomUUID(),
          config = challengeFor(day);
        attempts.set(id, {
          player,
          config,
          created: now(),
          expires: now() + 15 * 60000,
        });
        send(res, 201, { id, config });
        return true;
      }
      const match = /^\/api\/runs\/([a-f0-9-]{36})\/score$/.exec(url.pathname);
      if (!match) {
        send(res, 404, { error: "Unknown endpoint" });
        return true;
      }
      const run = attempts.get(match[1]);
      if (!run || run.player !== player) {
        send(res, 409, {
          error: "Attempt expired or already submitted. Start a new daily run.",
        });
        return true;
      }
      if (!req.headers["content-type"]?.startsWith("application/json")) {
        send(res, 415, { error: "JSON required" });
        return true;
      }
      let body = "",
        bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 512000) {
          send(res, 413, { error: "Replay too large" });
          return true;
        }
        body += chunk;
      }
      const submitted = JSON.parse(body);
      if (attempts.get(match[1]) !== run) {
        send(res, 409, { error: "Attempt already submitted." });
        return true;
      }
      if (
        !submitted ||
        typeof submitted.name !== "string" ||
        !/^[A-Za-z0-9 _-]{2,16}$/.test(submitted.name.trim())
      ) {
        send(res, 400, {
          error: "Use 2–16 letters, numbers, spaces or underscores.",
        });
        return true;
      }
      const result = verifyReplay(run.config, submitted.inputs);
      if (result.ticks / 60 > (now() - run.created) / 1000 + 2) {
        send(res, 400, {
          error: "Replay ran faster than the challenge clock.",
        });
        return true;
      }
      const key = `${RULESET}:${run.config.day}`;
      const board = (boards[key] ||= []);
      const previous = board.find((row) => row.player === player);
      const entry = {
        player,
        name: submitted.name.trim(),
        ...result,
        created: now(),
      };
      if (
        !previous ||
        result.score > previous.score ||
        (result.score === previous.score && result.ticks < previous.ticks)
      ) {
        if (previous) board.splice(board.indexOf(previous), 1);
        board.push(entry);
      }
      attempts.delete(match[1]);
      await save();
      send(res, 200, {
        accepted: true,
        ...result,
        rank:
          rows(run.config.day).findIndex((row) => row.player === player) + 1,
        entries: publicRows(run.config.day),
      });
    } catch (error) {
      const userError = /Invalid|Replay|Input|Finish|Unexpected|JSON/.test(
        error.message,
      );
      if (!userError) console.error("Leaderboard:", error.message);
      send(res, userError ? 400 : 503, {
        error: userError
          ? error.message
          : "Leaderboard unavailable. Please try again.",
      });
    }
    return true;
  };
}
