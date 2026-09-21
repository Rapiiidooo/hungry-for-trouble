import test from "node:test";
import assert from "node:assert/strict";
import { layoutFor } from "../game/levels.js";
import { newGame, stepGame, nextLevel, canStand } from "../game/sim.js";
import { challengeFor, newDaily, RULESET } from "../game/daily.js";

test("200 run seeds preserve connected supplies, safe spawns and varied footprints", () => {
  const variations = Array.from({ length: 20 }, () => new Set());
  for (let seed = 0; seed < 200; seed++)
    for (const index of [
      1,
      2,
      3,
      ...Array.from({ length: 15 }, (_, i) => i + 5),
    ]) {
      const m = layoutFor(index, seed),
        rows = m.level.map;
      const seen = new Set(),
        queue = [[m.start.x / 2, m.start.z / 2]];
      for (let i = 0; i < queue.length; i++) {
        const [x, z] = queue[i],
          k = `${x},${z}`;
        if (seen.has(k) || !rows[z]?.[x] || ["#", " "].includes(rows[z][x]))
          continue;
        seen.add(k);
        queue.push([x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]);
      }
      assert.ok(rows.every((row) => row.length === m.width));
      assert.ok(
        rows.join("").includes(" "),
        "Later floors need an exterior void",
      );
      assert.ok(m.crumbs.length >= m.level.quota + 15);
      for (const p of [
        m.exit,
        ...m.crumbs,
        ...m.visors,
        ...m.repairs,
        ...m.batteries,
        ...m.enemies,
        ...m.portals,
        ...m.vents,
        ...m.stock,
        ...(m.boss ? [m.boss] : []),
      ])
        assert.ok(
          seen.has(`${p.x / 2},${p.z / 2}`),
          `seed ${seed}, floor ${index}: unreachable objective`,
        );
      for (const e of m.enemies)
        assert.ok(
          Math.hypot(e.x - m.start.x, e.z - m.start.z) >= 6,
          "No enemy spawns in immediate contact",
        );
      assert.equal(m.repairs.length, 2);
      assert.equal(
        m.portals.length % 2,
        0,
        "Transport pads must stay paired for every seed",
      );
      for (const portal of m.portals) assert.ok(m.portals[portal.target]);
      if ([2, 6].includes(index)) assert.ok(m.gates.length);
      variations[index].add(rows.join("\n"));
    }
  for (const i of [1, 2, 3, ...Array.from({ length: 15 }, (_, i) => i + 5)])
    assert.ok(variations[i].size > 190);
});

test("repair kits heal exactly one heart, remain when full, and checkout heals on departure", () => {
  const g = newGame();
  g.enemies = [];
  assert.equal(g.player.hp, g.player.maxHp);
  const kit = g.repairs[0];
  Object.assign(g.player, { x: kit.x, z: kit.z });
  stepGame(g, {}, 1 / 60);
  assert.equal(kit.collected, false);
  g.player.hp = 2;
  const events = stepGame(g, {}, 1 / 60);
  assert.ok(events.some((e) => e.type === "heal"));
  assert.equal(g.player.hp, 3);
  stepGame(g, {}, 1 / 60);
  assert.equal(g.player.hp, 3);
  g.state = "cleared";
  const next = nextLevel(g, "rapid");
  assert.equal(next.player.hp, 4);
  assert.equal(next.seed, g.seed);
  const daily = newDaily(challengeFor("2026-09-21"));
  daily.enemies = [];
  const dkit = daily.repairs[0];
  Object.assign(daily.player, dkit);
  daily.player.hp = 3;
  stepGame(daily, {}, 1 / 60);
  assert.equal(daily.player.hp, 4);
  Object.assign(daily.player, daily.map.start);
  for (let i = 0; i < 1810; i++) stepGame(daily, {}, 1 / 60);
  assert.equal(dkit.collected, false);
  assert.equal(RULESET, "daily-rush-4");
});

test("receipt impacts respect walls and incoming damage carries a world direction", () => {
  const g = newGame();
  g.enemies = [];
  Object.assign(g.player, { x: 4, z: 6, invincible: 0 });
  assert.ok(canStand(g, 4, 6));
  g.hazards = [{ x: 4, z: 2, vx: 0, vz: 100, life: 3 }];
  const hp = g.player.hp;
  const impact = stepGame(g, {}, 0.05);
  assert.equal(g.player.hp, hp);
  assert.equal(g.hazards.length, 0);
  assert.ok(impact.some((e) => e.type === "receipt-impact"));
  g.hazards = [{ x: 3.6, z: 6, vx: 6, vz: 0, life: 3 }];
  const hit = stepGame(g, {}, 1 / 60).find((e) => e.type === "damage");
  assert.equal(g.player.hp, hp - 1);
  assert.ok(hit.fromX < hit.x);
});
