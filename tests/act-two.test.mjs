import test from "node:test";
import assert from "node:assert/strict";
import {
  newGame,
  stepGame,
  nextLevel,
  canStand,
  UPGRADE_LIMITS,
} from "../game/sim.js";
import { LEVELS, layoutFor } from "../game/levels.js";
import { ventPhase, addMine } from "../game/machines.js";
import { upgradeChoices, readProgress } from "../game/arcade.js";
import { newMatch, stepMatch } from "../game/multiplayer-sim.js";
const dt = 1 / 60;
const tick = (g, input, seconds) => {
  const events = [];
  for (let i = 0; i < Math.round(seconds / dt); i++)
    events.push(...stepGame(g, input, dt));
  return events;
};
function quiet(index = 0) {
  const g = newGame(index);
  g.enemies = [];
  g.batteries = [];
  g.visors = [];
  g.stock = [];
  g.player.invincible = 0;
  return g;
}

test("twenty floors introduce new rules and preserve the act-one clear", () => {
  assert.equal(LEVELS.length, 20);
  const kinds = new Set();
  for (let i = 10; i < 20; i++) {
    const map = layoutFor(i);
    map.enemies.forEach((e) => kinds.add(e.kind));
    assert.ok(map.stock.length >= 3);
    assert.ok(map.portals.length % 2 === 0);
    for (const p of map.portals) {
      assert.ok(map.portals[p.target]);
      assert.equal(map.portals[p.target].target, map.portals.indexOf(p));
    }
  }
  for (const kind of ["sniper", "layer", "shieldcart"])
    assert.ok(kinds.has(kind));
  const g = quiet(9);
  g.boss.hp = 0;
  g.collected = g.map.level.quota;
  Object.assign(g.player, g.map.exit);
  stepGame(g, {}, dt);
  assert.equal(g.state, "cleared");
  assert.equal(nextLevel(g, "frost").levelIndex, 10);
});

test("transport pads never force a player into a corridor loop, including the reported final-floor seed", () => {
  for (const seed of [3809365241, ...Array.from({ length: 200 }, (_, i) => i)])
    for (const index of [11, 13, 15, 16, 17, 18, 19]) {
      const map = layoutFor(index, seed),
        rows = map.level.map;
      assert.equal(map.portals.length, [15, 17, 19].includes(index) ? 4 : 2);
      const queue = [[map.start.x / 2, map.start.z / 2]],
        seen = new Set();
      for (let i = 0; i < queue.length; i++) {
        const [x, z] = queue[i],
          k = `${x},${z}`;
        if (
          seen.has(k) ||
          !rows[z]?.[x] ||
          ["#", " ", "P"].includes(rows[z][x])
        )
          continue;
        seen.add(k);
        queue.push([x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]);
      }
      for (const p of [
        map.exit,
        ...map.crumbs,
        ...map.batteries,
        ...map.repairs,
        ...(map.boss ? [map.boss] : []),
      ])
        assert.ok(
          seen.has(`${p.x / 2},${p.z / 2}`),
          `seed ${seed}, floor ${index + 1}: objective requires transport`,
        );
    }
});

test("room players can dash from stationary aim and the burst keeps its direction", () => {
  const g = newMatch("versus", 42, [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]),
    p = g.players[0];
  const before = p.x;
  stepMatch(g, { a: { dash: true, aim: Math.PI / 2 } }, dt);
  assert.ok(p.dash > 0 && p.dashCooldown > 0);
  for (let i = 0; i < 6; i++) stepMatch(g, { a: { z: -1 } }, dt);
  assert.ok(p.x > before + 1, "Aiming right should remain a rightward dodge");
});

test("transport is paired, safe on arrival and requires leaving the destination", () => {
  const g = quiet(11),
    pad = g.map.portals[0],
    destination = g.map.portals[pad.target];
  Object.assign(g.player, { x: pad.x, z: pad.z });
  assert.ok(stepGame(g, {}, dt).some((e) => e.type === "transport"));
  assert.equal(g.player.x, destination.x);
  assert.equal(g.player.z, destination.z);
  assert.ok(canStand(g, g.player.x, g.player.z));
  assert.ok(g.player.invincible > 0);
  tick(g, {}, 2);
  assert.equal(
    g.player.x,
    destination.x,
    "Idle on arrival must not bounce back",
  );
  Object.assign(g.player, g.map.start);
  stepGame(g, {}, dt);
  Object.assign(g.player, { x: destination.x, z: destination.z });
  assert.ok(stepGame(g, {}, dt).some((e) => e.type === "transport"));
  assert.equal(g.player.x, pad.x);
});

test("vents warn before damage, while dash blocks the hit and cannot cross shelves", () => {
  const g = quiet(10),
    vent = g.map.vents[0];
  Object.assign(g.player, { x: vent.x, z: vent.z });
  g.elapsed = (3.5 - vent.phase + 5.6) % 5.6;
  assert.equal(ventPhase(g, vent), "warning");
  tick(g, {}, 0.2);
  assert.equal(g.player.hp, 4);
  g.elapsed = (4.7 - vent.phase + 5.6) % 5.6;
  stepGame(g, {}, dt);
  assert.equal(g.player.hp, 3);
  g.player.invincible = 0;
  assert.ok(
    stepGame(g, { dash: true, aim: 0 }, dt).some((e) => e.type === "dash"),
  );
  assert.equal(g.player.hp, 3);
  assert.ok(g.player.dash > 0, "Stationary aim can initiate a dodge");
});

test("mine warning permits escape, shooting defuses it and Overtime blocks the blast", () => {
  const g = quiet();
  Object.assign(g.player, { x: 4, z: 6 });
  addMine(g, { x: 6, z: 6 });
  tick(g, {}, 0.8);
  assert.equal(g.player.hp, 4);
  assert.ok(
    tick(g, { fire: true, aim: Math.PI / 2 }, 0.2).some(
      (e) => e.type === "mine-defused",
    ),
  );
  assert.equal(g.player.hp, 4);
  addMine(g, g.player, 0.1);
  tick(g, {}, 0.5);
  assert.equal(g.player.hp, 4);
  g.overtime = 2;
  assert.ok(tick(g, {}, 0.3).some((e) => e.type === "mine-burst"));
  assert.equal(g.player.hp, 4);
  g.overtime = 0;
  addMine(g, g.player, 0.1);
  tick(g, {}, 0.8);
  assert.equal(g.player.hp, 3);
});

test("snipers lock aim during their warning and mine layers leave timed hazards", () => {
  const g = quiet();
  Object.assign(g.player, { x: 2, z: 6 });
  const sniper = newGame(10).enemies.find((e) => e.kind === "sniper");
  Object.assign(sniper, { x: 12, z: 6, shotCooldown: 0 });
  g.enemies = [sniper];
  assert.ok(stepGame(g, {}, dt).some((e) => e.type === "drone-warning"));
  const angle = sniper.shotAngle;
  tick(g, { z: 1 }, 0.4);
  assert.equal(sniper.shotAngle, angle);
  assert.equal(g.hazards.length, 0);
  assert.ok(tick(g, {}, 0.7).some((e) => e.type === "drone-shot"));
  const layer = newGame(12).enemies.find((e) => e.kind === "layer");
  Object.assign(layer, { x: 12, z: 6, mineCooldown: 0 });
  g.enemies = [layer];
  stepGame(g, {}, dt);
  assert.ok(g.mines.length > 0);
});

test("shield carts block their front but take flank damage", () => {
  const g = quiet();
  Object.assign(g.player, { x: 2, z: 6 });
  const e = newGame(13).enemies.find((e) => e.kind === "shieldcart");
  Object.assign(e, { x: 6, z: 6, angle: -Math.PI / 2, stun: 20 });
  g.enemies = [e];
  tick(g, { fire: true, aim: Math.PI / 2 }, 0.35);
  assert.equal(e.hp, e.maxHp);
  e.angle = Math.PI / 2;
  tick(g, { fire: true, aim: Math.PI / 2 }, 0.35);
  assert.ok(e.hp < e.maxHp);
});

test("ricochet reflects a real wall collision and frost interrupts enemy attacks", () => {
  const g = quiet();
  Object.assign(g.player, { x: 4, z: 6 });
  g.upgrades.ricochet = 1;
  const events = tick(g, { fire: true, aim: Math.PI }, 0.14);
  assert.ok(events.some((e) => e.type === "ricochet"));
  assert.ok(g.bullets.some((b) => b.vz > 0));
  const e = newGame(5).enemies.find((e) => e.kind === "shooter");
  Object.assign(e, { x: 8, z: 6, tell: 1, shotCooldown: 0 });
  g.enemies = [e];
  g.upgrades.frost = 1;
  tick(g, { fire: true, aim: Math.PI / 2 }, 0.35);
  assert.ok(e.frozen > 0);
  assert.equal(e.tell, 0);
  assert.equal(g.hazards.length, 0);
});

test("stock carts hit enemies once per push and flour interrupts nearby shooters", () => {
  const g = quiet();
  Object.assign(g.player, { x: 2, z: 6 });
  const cart = {
    x: 4,
    z: 6,
    kind: "cart",
    vx: 0,
    vz: 0,
    cooldown: 0,
    cloud: 0,
    hits: [],
    broken: false,
  };
  g.stock = [cart];
  const e = { ...newGame().enemies[0], x: 7, z: 6, stun: 10 };
  g.enemies = [e];
  tick(g, { dash: true, x: 1 }, 0.16);
  tick(g, {}, 0.5);
  assert.ok(cart.x > 4);
  assert.equal(g.kills, 1);
  tick(g, {}, 0.5);
  assert.equal(g.kills, 1);
  const shooter = {
    ...newGame(5).enemies.find((e) => e.kind === "shooter"),
    x: 7,
    z: 6,
    tell: 0.8,
  };
  g.enemies = [shooter];
  g.stock = [{ ...cart, x: 5, z: 6, kind: "flour", hp: 1, vx: 0, vz: 0 }];
  Object.assign(g.player, { x: 2, z: 6, vx: 0, vz: 0 });
  tick(g, { fire: true, aim: Math.PI / 2 }, 0.4);
  assert.ok(g.stock[0].cloud > 0);
  assert.equal(shooter.tell, 0);
  assert.ok(shooter.stun > 0);
});

test("new bosses mark hazards, builds cap correctly and old clears unlock act two", () => {
  for (const floor of [14, 19]) {
    const g = quiet(floor);
    g.boss.special = 0;
    stepGame(g, {}, dt);
    assert.ok(g.mines.length > 0);
    assert.ok(g.mines.every((m) => m.arm >= 1));
  }
  const g = newGame();
  Object.assign(g.upgrades, UPGRADE_LIMITS);
  g.upgrades.frost = 2;
  assert.deepEqual(upgradeChoices(g), ["frost"]);
  g.state = "cleared";
  assert.equal(nextLevel(g, "rapid"), null);
  globalThis.localStorage = {
    getItem: () => JSON.stringify({ unlocked: 9, cleared: [9] }),
  };
  try {
    assert.equal(readProgress().unlocked, 10);
  } finally {
    delete globalThis.localStorage;
  }
});
