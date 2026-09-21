import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, layoutFor } from "../game/levels.js";
import {
  newGame,
  nextLevel,
  stepGame,
  canStand,
  lineOfSight,
  pathTo,
  checkoutReady,
} from "../game/sim.js";
import { KEY_TYPES } from "../game/locks.js";
import {
  readProgress,
  visibleFloorCount,
  upgradeChoices,
} from "../game/arcade.js";
import { packInput, unpackInput, TICK } from "../game/daily.js";
import { CAMPAIGN_RULESET, CAMPAIGN_BOARD } from "../game/campaign.js";

function reach(map, colors = [], skipPads = false) {
  const seen = new Set(),
    queue = [map.start];
  for (let i = 0; i < queue.length; i++) {
    const { x, z } = queue[i],
      col = x / 2,
      row = z / 2,
      id = `${x},${z}`;
    const tile = map.level.map[row]?.[col];
    if (
      !tile ||
      ["#", " "].includes(tile) ||
      seen.has(id) ||
      (skipPads && tile === "P")
    )
      continue;
    const lock = map.doors.find((d) => d.x === x && d.z === z);
    if (lock && !colors.includes(lock.color)) continue;
    seen.add(id);
    queue.push(
      { x: x + 2, z },
      { x: x - 2, z },
      { x, z: z + 2 },
      { x, z: z - 2 },
    );
    if (!skipPads) {
      const pad = map.portals.find((p) => p.x === x && p.z === z);
      if (pad) queue.push(map.portals[pad.target]);
    }
  }
  return seen;
}
const contains = (seen, point) => seen.has(`${point.x},${point.z}`);
function quiet(floor) {
  const game = newGame(floor);
  game.enemies = [];
  game.stock = [];
  game.batteries = [];
  game.visors = [];
  game.map.vents = [];
  return game;
}
function tick(game, input, seconds) {
  const events = [];
  for (let i = 0; i < seconds * 60; i++)
    events.push(...stepGame(game, input, TICK));
  return events;
}

test("1,000 locked layouts have necessary keys, solvable order and no transport bypass", () => {
  assert.equal(LEVELS.length, 25);
  const variants = Array.from({ length: 5 }, () => new Set());
  for (let seed = 0; seed < 200; seed++)
    for (let floor = 20; floor < 25; floor++) {
      const map = layoutFor(floor, seed),
        colors = KEY_TYPES.slice(0, Math.min(4, floor - 19)).map((k) => k.id);
      const context = `floor ${floor + 1}, seed ${seed}`;
      assert.equal(map.keycards.length, colors.length, context);
      assert.ok(map.crumbs.length >= map.level.quota + 15, context);
      assert.ok(
        !contains(reach(map), map.exit),
        `${context}: unlocked exit bypass`,
      );
      for (let i = 0; i < colors.length; i++) {
        const before = reach(map, colors.slice(0, i));
        assert.ok(
          contains(
            before,
            map.keycards.find((k) => k.color === colors[i]),
          ),
          `${context}: key locked behind itself`,
        );
        const earned = [];
        let without;
        for (let stage = 0; stage <= colors.length; stage++) {
          without = reach(map, earned);
          for (const card of map.keycards)
            if (
              card.color !== colors[i] &&
              !earned.includes(card.color) &&
              contains(without, card)
            )
              earned.push(card.color);
        }
        assert.ok(
          !contains(without, map.exit),
          `${context}: ${colors[i]} key is unnecessary`,
        );
      }
      const walk = reach(map, colors, true);
      for (const point of [
        map.exit,
        ...map.keycards,
        ...map.crumbs,
        ...map.batteries,
        ...map.repairs,
        ...map.visors,
        ...map.enemies,
      ])
        assert.ok(
          contains(walk, point),
          `${context}: isolated objective or forced transport loop`,
        );
      for (const e of map.enemies)
        assert.ok(
          Math.hypot(e.x - map.start.x, e.z - map.start.z) >= 6,
          context,
        );
      variants[floor - 20].add(map.level.map.join("\n"));
    }
  for (const set of variants)
    assert.ok(
      set.size > 190,
      "Cover and supply placement should vary with the seed",
    );
});

test("locked doors block movement, dashes, enemies and projectiles until the correct key arrives", () => {
  const g = quiet(20),
    door = g.doors[0];
  Object.assign(g.player, { x: door.x - 3, z: door.z, invincible: 0 });
  const across = { x: door.x + 3, z: door.z };
  const enemy = {
    ...newGame(20).enemies[0],
    ...across,
    hp: 5,
    maxHp: 5,
    stun: 999,
    respawn: 0,
  };
  g.enemies = [enemy];
  g.keyring.push("green");
  assert.equal(canStand(g, door.x, door.z), false);
  assert.equal(lineOfSight(g, g.player, across), false);
  assert.deepEqual(pathTo(g, enemy, g.player), { ...enemy });
  tick(g, { x: 1, dash: true, fire: true, aim: Math.PI / 2 }, 0.8);
  assert.equal(door.open, false);
  assert.ok(g.player.x <= door.x - 1.3);
  assert.equal(enemy.hp, 5, "Player shots cannot cross a lock");
  g.hazards = [{ x: door.x + 3, z: door.z, vx: -20, vz: 0, life: 2 }];
  const hp = g.player.hp;
  tick(g, {}, 0.3);
  assert.equal(g.hazards.length, 0);
  assert.equal(g.player.hp, hp, "Enemy shots cannot cross a lock");
  g.keyring.push("red");
  assert.ok(stepGame(g, {}, TICK).some((e) => e.type === "door-open"));
  assert.equal(door.open, true);
  assert.equal(canStand(g, door.x, door.z), true);
  assert.equal(lineOfSight(g, g.player, across), true);
  tick(g, { fire: true, aim: Math.PI / 2 }, 0.5);
  assert.ok(enemy.hp < 5, "Shots cross an opened doorway");
});

test("keys award once, open multiple matching locks and reset on the next floor and restart", () => {
  const g = quiet(21),
    card = g.keycards.find((k) => k.color === "red");
  Object.assign(g.player, { x: card.x, z: card.z });
  assert.equal(
    stepGame(g, {}, TICK).filter((e) => e.type === "key-found").length,
    1,
  );
  const score = g.score;
  assert.ok(!tick(g, {}, 0.2).some((e) => e.type === "key-found"));
  assert.equal(g.score, score);
  for (const door of g.doors.filter((d) => d.color === "red")) {
    Object.assign(g.player, {
      x: door.x - (door.axis === "x" ? 1.6 : 0),
      z: door.z - (door.axis === "z" ? 1.6 : 0),
      vx: 0,
      vz: 0,
    });
    stepGame(g, {}, TICK);
    assert.equal(door.open, true);
    assert.deepEqual(g.keyring, ["red"]);
  }
  g.state = "cleared";
  const next = nextLevel(g, upgradeChoices(g)[0]);
  assert.deepEqual(next.keyring, []);
  assert.ok(next.keycards.every((k) => !k.collected));
  assert.ok(next.doors.every((d) => !d.open));
  assert.deepEqual(newGame(21).keyring, []);
});

test("old victories open aisle 21 without exposing the wing before floor 20 is cleared", () => {
  assert.equal(visibleFloorCount({ unlocked: 0, cleared: [] }), 10);
  assert.equal(visibleFloorCount({ unlocked: 10, cleared: [9] }), 20);
  assert.equal(visibleFloorCount({ unlocked: 19, cleared: [9] }), 20);
  globalThis.localStorage = {
    getItem: () => JSON.stringify({ unlocked: 19, cleared: [9, 19] }),
  };
  try {
    const progress = readProgress();
    assert.equal(progress.unlocked, 20);
    assert.equal(visibleFloorCount(progress), 25);
    assert.deepEqual(progress.cleared, [9, 19]);
  } finally {
    delete globalThis.localStorage;
  }
  assert.equal(CAMPAIGN_RULESET, "campaign-2");
  assert.equal(
    CAMPAIGN_BOARD,
    "campaign-1:all",
    "Existing all-time records keep their board",
  );
});

test("floor 20 continues with the same build, and only the cleared master vault ends the campaign", () => {
  const g = quiet(19);
  g.boss.hp = 0;
  g.collected = g.map.level.quota;
  Object.assign(g.player, g.map.exit);
  stepGame(g, {}, TICK);
  assert.equal(g.state, "cleared");
  const next = nextLevel(g, "rapid");
  assert.equal(next.levelIndex, 20);
  assert.equal(next.upgrades.rapid, 1);
  assert.equal(next.score, g.score);
  const last = quiet(24);
  Object.assign(last.player, last.map.exit);
  last.collected = last.map.level.quota;
  last.boss.hp = 0;
  assert.equal(checkoutReady(last), false);
  stepGame(last, {}, TICK);
  assert.equal(last.state, "playing");
  last.keycards.forEach((card) => {
    card.collected = true;
  });
  assert.equal(checkoutReady(last), true);
  stepGame(last, {}, TICK);
  assert.equal(last.state, "won");
  assert.equal(nextLevel(last, "rapid"), null);
});

test("the Locksmith waits for access, then alternates marked artillery and a wave", () => {
  const g = quiet(24);
  tick(g, {}, 6);
  assert.equal(g.hazards.length + g.lobs.length + g.waves.length, 0);
  g.doors.forEach((door) => {
    door.open = true;
  });
  Object.assign(g.player, { x: g.boss.x + 4, z: g.boss.z + 2 });
  g.boss.special = 0;
  stepGame(g, {}, TICK);
  assert.ok(g.lobs.length >= 1);
  assert.ok(g.lobs.every((lob) => lob.duration >= 1.5));
  g.boss.special = 0;
  stepGame(g, {}, TICK);
  assert.equal(g.waves.length, 1);
  g.boss.hp = 0;
  stepGame(g, {}, TICK);
  assert.equal(g.hazards.length + g.lobs.length + g.waves.length, 0);
});

test("quantized movement replays key pickup and door opening deterministically", () => {
  const a = newGame(20, { seed: 91 }),
    b = newGame(20, { seed: 91 });
  const card = a.keycards[0],
    door = a.doors[0];
  let waypoint;
  for (let i = 0; i < 4000 && a.state === "playing" && !door.open; i++) {
    const target = card.collected ? { x: door.x - 1.5, z: door.z } : card;
    if (
      !waypoint ||
      Math.hypot(a.player.x - waypoint.x, a.player.z - waypoint.z) < 0.15
    )
      waypoint = pathTo(a, a.player, target);
    if (
      Math.hypot(a.player.x - target.x, a.player.z - target.z) < 2.1 &&
      lineOfSight(a, a.player, target)
    )
      waypoint = target;
    const dx = waypoint.x - a.player.x,
      dz = waypoint.z - a.player.z,
      distance = Math.hypot(dx, dz);
    const enemy = a.enemies.find(
      (e) => e.respawn <= 0 && lineOfSight(a, a.player, e),
    );
    const input = unpackInput(
      packInput({
        x: distance > 0.03 ? dx / distance : 0,
        z: distance > 0.03 ? dz / distance : 0,
        fire: !!enemy,
        aim: enemy
          ? Math.atan2(enemy.x - a.player.x, enemy.z - a.player.z)
          : undefined,
      }),
    );
    stepGame(a, input, TICK);
    stepGame(b, input, TICK);
  }
  assert.equal(card.collected, true);
  assert.equal(door.open, true);
  assert.deepEqual(a, b);
});
