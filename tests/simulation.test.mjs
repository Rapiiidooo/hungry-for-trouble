import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, layoutFor } from "../game/levels.js";
import {
  newGame,
  stepGame,
  canStand,
  pathTo,
  nextLevel,
  gateClosed,
} from "../game/sim.js";

function tick(game, input, seconds) {
  const events = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 120)
    events.push(...stepGame(game, input, 1 / 120));
  return events;
}

test("every floor has a connected maze, reachable pickups and enough crumbs", () => {
  for (let index = 0; index < LEVELS.length; index++) {
    const layout = layoutFor(index),
      rows = layout.level.map;
    assert.ok(rows.every((row) => row.length === layout.width));
    const queue = [[layout.start.x / 2, layout.start.z / 2]],
      seen = new Set([queue[0].join(",")]);
    for (let i = 0; i < queue.length; i++)
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const p = [queue[i][0] + dx, queue[i][1] + dz],
          key = p.join(",");
        if (rows[p[1]]?.[p[0]] && rows[p[1]][p[0]] !== "#" && !seen.has(key)) {
          seen.add(key);
          queue.push(p);
        }
      }
    for (const point of [...layout.crumbs, ...layout.batteries, layout.exit])
      assert.ok(
        seen.has([point.x / 2, point.z / 2].join(",")),
        `${layout.level.name}: unreachable objective`,
      );
    assert.ok(layout.crumbs.length >= layout.level.quota);
  }
});

test("left and right are screen-relative and dashes cannot tunnel through walls", () => {
  const right = newGame();
  tick(right, { x: 1 }, 0.3);
  assert.ok(right.player.x > right.map.start.x);
  const up = newGame();
  tick(up, { z: -1 }, 0.3);
  assert.ok(up.player.z < up.map.start.z);
  const left = newGame();
  tick(left, { x: -1, dash: true }, 1);
  assert.ok(canStand(left, left.player.x, left.player.z));
  assert.ok(left.player.x > 1.3);
});

test("shots hit enemies in open corridors and walls absorb shots", () => {
  const game = newGame();
  Object.assign(game.player, { x: 2, z: 6, angle: Math.PI / 2 });
  game.enemies = [{ ...game.enemies[0], x: 5, z: 6, hp: 3, stun: 10 }];
  const events = tick(game, { fire: true, aim: Math.PI / 2 }, 0.7);
  assert.ok(events.some((e) => e.type === "enemy-down"));
  assert.equal(game.kills, 1);
  const blocked = newGame();
  Object.assign(blocked.player, { x: 2, z: 2 });
  blocked.enemies = [{ ...blocked.enemies[0], x: 2, z: 6, hp: 3, stun: 10 }];
  // Put the shot behind the shelf at column 2, row 2.
  Object.assign(blocked.player, { x: 4, z: 2 });
  Object.assign(blocked.enemies[0], { x: 4, z: 6 });
  tick(blocked, { fire: true, aim: 0 }, 1);
  assert.equal(blocked.enemies[0].hp, 3);
});

test("overtime reverses contact damage, makes firing free and expires", () => {
  const game = newGame();
  const battery = game.batteries[0];
  Object.assign(game.player, { x: battery.x, z: battery.z });
  assert.ok(stepGame(game, {}, 1 / 120).some((e) => e.type === "overtime"));
  assert.ok(game.overtime > 7.9);
  game.enemies = [
    { ...game.enemies[0], x: game.player.x, z: game.player.z, stun: 10 },
  ];
  const hp = game.player.hp;
  stepGame(game, {}, 1 / 120);
  assert.equal(game.player.hp, hp);
  assert.equal(game.kills, 1);
  game.enemies = [];
  const ammo = game.ammo;
  tick(game, { fire: true, aim: 0 }, 1);
  assert.equal(game.ammo, ammo);
  tick(game, {}, 8);
  assert.equal(game.overtime, 0);
});

test("damage has a grace period, death stops play and restart clears state", () => {
  const game = newGame();
  game.player.invincible = 0;
  game.enemies = [
    { ...game.enemies[0], x: game.player.x, z: game.player.z, stun: 10 },
  ];
  tick(game, {}, 0.5);
  assert.equal(game.player.hp, 2);
  tick(game, {}, 3.2);
  assert.equal(game.state, "lost");
  const time = game.time;
  assert.deepEqual(stepGame(game, { x: 1 }, 0.02), []);
  assert.equal(game.time, time);
  assert.equal(newGame().player.hp, 3);
});

test("exit requires the quota and final boss, upgrades transfer between floors", () => {
  const game = newGame();
  Object.assign(game.player, game.map.exit);
  stepGame(game, {}, 1 / 120);
  assert.equal(game.state, "playing");
  game.collected = game.map.level.quota;
  stepGame(game, {}, 1 / 120);
  assert.equal(game.state, "cleared");
  const next = nextLevel(game, "spread");
  assert.equal(next.levelIndex, 1);
  assert.equal(next.upgrades.spread, 1);
  assert.equal(next.score, game.score);
  assert.equal(nextLevel(next, "rapid"), null);
  const last = newGame(9);
  last.collected = last.map.level.quota;
  Object.assign(last.player, last.map.exit);
  stepGame(last, {}, 1 / 120);
  assert.equal(last.state, "playing");
  last.boss.hp = 0;
  stepGame(last, {}, 1 / 120);
  assert.equal(last.state, "won");
});

test("shutters alternate and wait for occupied cells; enemies can route around shelves", () => {
  const game = newGame(2);
  const gate = game.map.gates[0];
  assert.equal(gateClosed(game, gate.col, gate.row), true);
  game.elapsed = 4.1;
  assert.equal(gateClosed(game, gate.col, gate.row), false);
  game.elapsed = 0;
  Object.assign(game.player, gate);
  assert.equal(gateClosed(game, gate.col, gate.row), false);
  const chase = newGame();
  const step = pathTo(chase, chase.enemies[0], chase.player);
  assert.ok(canStand(chase, step.x, step.z));
  assert.ok(Number.isFinite(step.x));
});

test("ice preserves momentum and repeated spread upgrades add real pellets", () => {
  const normal = newGame(),
    ice = newGame(1);
  for (const game of [normal, ice]) {
    game.enemies = [];
    Object.assign(game.player, { x: 4, z: 6 });
    tick(game, { x: 1 }, 0.3);
    tick(game, {}, 0.1);
  }
  assert.ok(
    ice.player.vx > normal.player.vx * 2,
    "Ice must change handling after release",
  );
  const upgraded = newGame();
  upgraded.upgrades.spread = 2;
  stepGame(upgraded, { fire: true, aim: Math.PI / 2 }, 1 / 120);
  assert.equal(upgraded.bullets.length, 5);
  assert.equal(upgraded.ammo, 23);
});

test("an ambusher still pursues a predicted target outside the store", () => {
  const game = newGame();
  const enemy = game.enemies.find((e) => e.kind === "ambusher");
  const waypoint = pathTo(game, enemy, { x: -6, z: 22 });
  assert.ok(canStand(game, waypoint.x, waypoint.z));
  assert.ok(Math.hypot(waypoint.x - enemy.x, waypoint.z - enemy.z) > 1);
});

test("polishers announce a charge, and an overtime pickup cancels it", () => {
  const game = newGame();
  Object.assign(game.player, { x: 2, z: 6 });
  const enemy = {
    ...game.enemies.find((e) => e.kind === "ambusher"),
    x: 7,
    z: 6,
    chargeCooldown: 0,
  };
  game.enemies = [enemy];
  assert.ok(
    stepGame(game, {}, 1 / 120).some((e) => e.type === "charge-warning"),
  );
  const x = enemy.x;
  tick(game, {}, 0.3);
  assert.equal(enemy.x, x, "The warning must leave time to dodge");
  tick(game, {}, 0.5);
  assert.ok(enemy.x < x - 0.7);
  Object.assign(game.player, game.batteries[0]);
  stepGame(game, {}, 1 / 120);
  assert.equal(enemy.charge, 0);
  assert.equal(enemy.windup, 0);
});

test("the Manager shield blocks overtime, opens, and enrages below half health", () => {
  const game = newGame(4);
  game.enemies = [];
  Object.assign(game.player, { x: 16, z: 14 });
  game.overtime = 8;
  tick(game, { fire: true, aim: Math.PI }, 1);
  assert.equal(
    game.boss.hp,
    game.boss.maxHp,
    "Overtime must not skip the boss's attack windows",
  );
  game.boss.phase = 3.6;
  tick(game, { fire: true, aim: Math.PI }, 1);
  assert.ok(game.boss.hp < game.boss.maxHp);
  game.boss.hp = 50;
  game.boss.phase = 0;
  game.boss.fire = 0;
  game.hazards = [];
  tick(game, {}, 0.04);
  assert.ok(
    game.hazards.length >= 8,
    "The second phase must change the attack pattern",
  );
});
