import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { newMatch, stepMatch, matchSnapshot } from "../game/multiplayer-sim.js";
import { createRooms } from "../server/rooms.mjs";
const roster = [
  { id: "a", name: "ALICE" },
  { id: "b", name: "BOB" },
];
function isolated(kind) {
  const g = newMatch(kind, 404, roster);
  g.enemies = [];
  g.batteries = [];
  g.repairs = [];
  g.crumbs.forEach((c) => {
    c.collected = true;
    c.respawn = 100;
  });
  if (g.boss) g.boss.hp = 0;
  Object.assign(g.players[0], { x: 20, z: 32, invincible: 0 });
  Object.assign(g.players[1], { x: 24, z: 32, invincible: 0 });
  return g;
}
function tick(g, input, seconds) {
  const events = [];
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    stepMatch(g, input);
    events.push(...g.events);
  }
  return events;
}

test("co-op shares supplies, prevents friendly fire, revives and requires both players at checkout", () => {
  const g = isolated("coop"),
    before = g.sharedAmmo;
  tick(g, { a: { fire: true, aim: Math.PI / 2 } }, 1);
  assert.ok(g.sharedAmmo < before);
  assert.equal(g.players[1].hp, 4);
  g.crumbs[0] = { x: 20, z: 32, collected: false, respawn: 0 };
  const ammo = g.sharedAmmo;
  stepMatch(g, {});
  assert.equal(g.sharedAmmo, ammo + 2);
  g.players[1].hp = 0;
  g.players[1].x = 21;
  const events = tick(g, {}, 2.1);
  assert.equal(g.players[1].hp, 3);
  assert.ok(events.some((e) => e.type === "revive"));
  g.collected = g.map.level.quota;
  Object.assign(g.players[0], g.map.exit);
  stepMatch(g, {});
  assert.equal(g.state, "playing");
  Object.assign(g.players[1], g.map.exit);
  stepMatch(g, {});
  assert.equal(g.state, "won");
  assert.equal(g.multiplayer.reason, "rescued");
  const lost = isolated("coop");
  lost.players.forEach((p) => (p.hp = 0));
  stepMatch(lost, {});
  assert.equal(lost.multiplayer.reason, "downed");

  const overlap = isolated("coop");
  const enemy = newMatch("coop", 404, roster).enemies.find(
    (e) => e.kind === "hunter",
  );
  Object.assign(enemy, { x: 20, z: 32, stun: 1, respawn: 0 });
  overlap.enemies = [enemy];
  overlap.players.forEach((p) =>
    Object.assign(p, { x: 20, z: 32, overtime: 1 }),
  );
  stepMatch(overlap, {});
  assert.equal(
    overlap.players.reduce((sum, p) => sum + p.kills, 0),
    1,
    "One enemy shared between two vacuums awards a single takedown",
  );
});

test("versus authoritative hits cause KOs, crumb drops, protected respawns and a seven-KO finish", () => {
  const g = isolated("versus");
  const events = tick(g, { a: { fire: true, aim: Math.PI / 2 } }, 3);
  assert.equal(g.players[0].kills, 1);
  assert.equal(g.players[1].hp, 0);
  assert.ok(events.some((e) => e.type === "knockout"));
  assert.ok(g.crumbs.some((c) => c.drop && !c.collected));
  tick(g, {}, 3);
  assert.equal(g.players[1].hp, 4);
  assert.ok(g.players[1].invincible > 0);
  for (let i = 1; i < 7; i++) {
    Object.assign(g.players[1], {
      x: 24,
      z: 32,
      hp: 4,
      invincible: 0,
      respawn: 0,
    });
    g.players[0].ammo = 40;
    tick(g, { a: { fire: true, aim: Math.PI / 2 } }, 3);
  }
  assert.equal(g.multiplayer.winner, "a");
  assert.equal(g.multiplayer.reason, "score");
  const time = g.time;
  tick(g, { b: { x: 1 } }, 1);
  assert.equal(g.time, time);
  const snapshot = matchSnapshot(g, "b");
  assert.equal(snapshot.player.id, "b");
  assert.equal(snapshot.players[0].kills, 7);
});

test("room API isolates sessions, validates controls, limits membership and handles departure", async () => {
  let clock = 1000;
  const api = createRooms({ now: () => clock, automatic: false });
  const server = http.createServer((req, res) =>
    api(req, res, new URL(req.url, "http://localhost")),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const req = async (path, body, headers = {}) => {
    const r = await fetch(base + "/api/rooms" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    return { status: r.status, data: await r.json() };
  };
  try {
    const a = await req("", { kind: "versus", name: "ALICE" });
    assert.equal(a.status, 201);
    const code = a.data.room.code;
    assert.equal(
      (await req(`/${code}/start`, { token: a.data.token })).status,
      409,
    );
    assert.equal((await req("/ZZZZZZ/join", { name: "BOB" })).status, 404);
    const b = await req(`/${code}/join`, { name: "BOB" });
    assert.equal(b.status, 201);
    assert.equal((await req(`/${code}/join`, { name: "EVE" })).status, 409);
    assert.equal(
      (await req(`/${code}/start`, { token: b.data.token })).status,
      403,
    );
    assert.equal(
      (
        await req(
          `/${code}/start`,
          { token: a.data.token },
          { Origin: "https://elsewhere.invalid" },
        )
      ).status,
      403,
    );
    const started = await req(`/${code}/start`, { token: a.data.token });
    assert.equal(started.status, 200);
    assert.ok(!JSON.stringify(started.data.room).includes(b.data.token));
    assert.equal(
      (
        await req(`/${code}/sync`, {
          token: "forged",
          seq: 0,
          input: [1, 0, 0, 0, 0],
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await req(`/${code}/sync`, {
          token: a.data.token,
          seq: 0,
          input: [1, 9000, 0, 0, 0],
        })
      ).status,
      400,
    );
    const before = started.data.snapshot.player.x;
    await req(`/${code}/sync`, {
      token: a.data.token,
      seq: 1,
      input: [1, 1000, 0, 0, 0],
      x: 99999,
      score: 99999,
    });
    for (let i = 0; i < 5; i++) {
      clock += 50;
      api.advance(0.05);
    }
    const moved = await req(`/${code}/sync`, {
      token: a.data.token,
      seq: 2,
      input: [1, 0, 0, null, 0],
    });
    assert.ok(moved.data.snapshot.player.x > before);
    assert.ok(moved.data.snapshot.player.x < before + 2);
    assert.ok(moved.data.snapshot.score < 99999);
    const seen = await req(`/${code}/sync`, {
      token: b.data.token,
      seq: 1,
      input: [1, 0, 0, null, 0],
    });
    assert.equal(seen.data.snapshot.players[0].x, moved.data.snapshot.player.x);
    assert.equal(
      (
        await req(`/${code}/sync`, {
          token: b.data.token,
          seq: 1,
          input: [1, 0, 0, null, 0],
        })
      ).status,
      409,
    );
    const still = moved.data.snapshot.player.x;
    for (let i = 0; i < 25; i++) {
      clock += 50;
      api.advance(0.05);
    }
    const stopped = await req(`/${code}/sync`, {
      token: a.data.token,
      seq: 3,
      input: [1, 0, 0, null, 0],
    });
    assert.ok(
      Math.abs(stopped.data.snapshot.player.x - still) < 0.3,
      "No held movement after input release or a missing client",
    );
    await req(`/${code}/leave`, { token: a.data.token });
    const ended = await req(`/${code}/sync`, {
      token: b.data.token,
      seq: 2,
      input: [1, 0, 0, null, 0],
    });
    assert.equal(ended.data.room.phase, "finished");
    assert.equal(ended.data.snapshot.multiplayer.winner, b.data.id);
    assert.equal(
      (await req(`/${code}/start`, { token: b.data.token })).status,
      409,
    );
    const replacement = await req(`/${code}/join`, { name: "CAROL" });
    assert.equal(replacement.status, 201);
    const waiting = await req(`/${code}/sync`, {
      token: replacement.data.token,
      seq: 1,
      input: [1, 0, 0, null, 0],
    });
    assert.equal(waiting.data.room.phase, "lobby");
    assert.equal(
      waiting.data.snapshot,
      undefined,
      "A new colleague cannot inherit the departed player's snapshot",
    );
    const rematch = await req(`/${code}/start`, { token: b.data.token });
    assert.deepEqual(
      rematch.data.snapshot.players.map((p) => p.name),
      ["BOB", "CAROL"],
    );
    clock += 16000;
    api.advance(0.05);
    const disconnected = await req(`/${code}/sync`, {
      token: replacement.data.token,
      seq: 2,
      input: [1, 0, 0, null, 0],
    });
    assert.equal(disconnected.data.room.phase, "finished");
    assert.equal(disconnected.data.snapshot.multiplayer.reason, "disconnect");
  } finally {
    api.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
