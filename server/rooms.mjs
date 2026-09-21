import { randomBytes, randomUUID } from "node:crypto";
import {
  newMatch,
  stepMatch,
  matchSnapshot,
  MATCH_TICK,
} from "../game/multiplayer-sim.js";
import { unpackInput } from "../game/daily.js";

export function createRooms({ now = Date.now, automatic = true } = {}) {
  const rooms = new Map(),
    limits = new Map();
  const fail = (status, message) => {
    const error = new Error(message);
    error.status = status;
    throw error;
  };
  const send = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  const nameFor = (value) => {
    if (
      typeof value !== "string" ||
      !/^[A-Za-z0-9 _-]{2,16}$/.test(value.trim())
    )
      fail(400, "Use 2–16 letters, numbers, spaces or underscores.");
    return value.trim();
  };
  const member = (name) => ({
    id: randomUUID(),
    token: randomBytes(24).toString("hex"),
    name: nameFor(name),
    seen: now(),
    inputAt: 0,
    input: {},
    seq: -1,
    requests: 0,
    window: now(),
  });
  const publicRoom = (room) => ({
    code: room.code,
    kind: room.kind,
    phase: room.phase,
    round: room.round,
    seed: room.seed,
    host: room.host,
    players: room.members.map((m) => ({
      id: m.id,
      name: m.name,
      connected: now() - m.seen < 5000,
    })),
  });
  function advance(seconds) {
    for (const [code, room] of rooms) {
      if (
        !room.members.length ||
        room.members.every((m) => now() - m.seen > 300000)
      ) {
        rooms.delete(code);
        continue;
      }
      if (room.phase !== "playing") continue;
      const absent = room.members.find((m) => now() - m.seen > 15000);
      if (absent) {
        room.phase = "finished";
        room.game.state = "lost";
        Object.assign(room.game.multiplayer, {
          reason: "disconnect",
          winner:
            room.kind === "versus"
              ? room.members.find((m) => m !== absent)?.id
              : null,
        });
        continue;
      }
      room.accumulator += Math.min(0.1, seconds);
      while (room.accumulator >= MATCH_TICK && room.phase === "playing") {
        const inputs = Object.fromEntries(
          room.members.map((m) => [
            m.id,
            now() - m.inputAt < 600 ? m.input : {},
          ]),
        );
        stepMatch(room.game, inputs);
        for (const m of room.members) m.input.dash = false;
        room.accumulator -= MATCH_TICK;
        if (room.game.state !== "playing") room.phase = "finished";
      }
    }
    for (const [ip, limit] of limits)
      if (now() - limit.time > 60000) limits.delete(ip);
  }
  let last = now();
  const timer = automatic
    ? setInterval(() => {
        const t = now();
        advance((t - last) / 1000);
        last = t;
      }, 1000 / 60)
    : null;
  timer?.unref();
  async function api(req, res, url) {
    if (!url.pathname.startsWith("/api/rooms")) return false;
    try {
      if (req.method !== "POST")
        fail(405, "Use the room controls in the game.");
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        fail(403, "Use the game's own page.");
      if (!req.headers["content-type"]?.startsWith("application/json"))
        fail(415, "JSON required.");
      let body = "",
        bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 4096) fail(413, "Room request too large.");
        body += chunk;
      }
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        fail(400, "Invalid JSON.");
      }
      if (!data || typeof data !== "object" || Array.isArray(data))
        fail(400, "Invalid room request.");
      const parts =
        /^\/api\/rooms(?:\/([A-Z2-9]{6})\/(join|sync|start|leave))?$/.exec(
          url.pathname,
        );
      if (!parts) fail(404, "Room not found. Check the code.");
      const [, code, action] = parts;
      if (!code || action === "join") {
        const ip = req.socket.remoteAddress,
          limit = limits.get(ip) || { time: now(), count: 0 };
        if (now() - limit.time > 60000) {
          limit.time = now();
          limit.count = 0;
        }
        limits.set(ip, limit);
        if (++limit.count > 30)
          fail(429, "Too many room requests. Try again in a minute.");
      }
      if (!code) {
        if (!["coop", "versus"].includes(data.kind))
          fail(400, "Choose co-op or versus.");
        if (rooms.size >= 200) fail(503, "Rooms are full. Try again shortly.");
        const owner = member(data.name),
          alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code;
        do {
          code = [...randomBytes(6)]
            .map((b) => alphabet[b % alphabet.length])
            .join("");
        } while (rooms.has(code));
        const room = {
          code,
          kind: data.kind,
          phase: "lobby",
          round: 0,
          seed: 0,
          host: owner.id,
          members: [owner],
          accumulator: 0,
        };
        rooms.set(code, room);
        send(res, 201, {
          room: publicRoom(room),
          id: owner.id,
          token: owner.token,
        });
        return true;
      }
      const room = rooms.get(code);
      if (!room) fail(404, "Room not found or expired. Ask for a new code.");
      if (action === "join") {
        if (room.members.length >= 2)
          fail(409, "This room already has two players.");
        if (room.phase === "playing")
          fail(409, "This match has already started.");
        const guest = member(data.name);
        room.members.push(guest);
        room.game = null;
        room.phase = "lobby";
        send(res, 201, {
          room: publicRoom(room),
          id: guest.id,
          token: guest.token,
        });
        return true;
      }
      const self = room.members.find((m) => m.token === data.token);
      if (!self) fail(403, "This room session is no longer valid. Join again.");
      if (now() - self.window >= 1000) {
        self.window = now();
        self.requests = 0;
      }
      if (++self.requests > 50)
        fail(429, "Room input is arriving too quickly.");
      self.seen = now();
      if (action === "leave") {
        room.members = room.members.filter((m) => m !== self);
        if (!room.members.length) rooms.delete(code);
        else {
          room.host = room.members[0].id;
          if (room.phase === "playing") {
            room.phase = "finished";
            room.game.state = "lost";
            Object.assign(room.game.multiplayer, {
              reason: "disconnect",
              winner: room.kind === "versus" ? room.host : null,
            });
          }
        }
        send(res, 200, { left: true });
        return true;
      }
      if (action === "start") {
        if (self.id !== room.host)
          fail(403, "Only the host can start a match.");
        if (room.phase === "playing")
          fail(409, "The match is already running.");
        if (
          room.members.length !== 2 ||
          room.members.some((m) => now() - m.seen > 5000)
        )
          fail(409, "Wait for two connected players.");
        room.seed = randomBytes(4).readUInt32LE();
        room.round++;
        room.accumulator = 0;
        room.game = newMatch(room.kind, room.seed, room.members);
        room.phase = "playing";
        for (const m of room.members) {
          m.input = {};
          m.inputAt = 0;
        }
      }
      if (action === "sync") {
        const r = data.input;
        if (
          !Number.isSafeInteger(data.seq) ||
          data.seq < 0 ||
          data.seq <= self.seq
        )
          fail(409, "Stale input sequence.");
        if (
          !Array.isArray(r) ||
          r.length !== 5 ||
          r[0] !== 1 ||
          !Number.isInteger(r[1]) ||
          Math.abs(r[1]) > 1000 ||
          !Number.isInteger(r[2]) ||
          Math.abs(r[2]) > 1000 ||
          (r[3] !== null &&
            (!Number.isInteger(r[3]) || Math.abs(r[3]) > 31416)) ||
          !Number.isInteger(r[4]) ||
          r[4] < 0 ||
          r[4] > 3
        )
          fail(400, "Invalid controls.");
        self.seq = data.seq;
        self.input = unpackInput(r);
        self.inputAt = now();
      }
      send(res, 200, {
        room: publicRoom(room),
        ...(room.game
          ? {
              snapshot: matchSnapshot(
                room.game,
                self.id,
                Number.isSafeInteger(data.since) ? data.since : 0,
              ),
            }
          : {}),
      });
    } catch (error) {
      send(res, error.status || 503, {
        error: error.status
          ? error.message
          : "Room unavailable. Try reconnecting.",
      });
    }
    return true;
  }
  api.advance = advance;
  api.close = () => clearInterval(timer);
  return api;
}
