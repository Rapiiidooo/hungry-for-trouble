import test from "node:test";
import assert from "node:assert/strict";
import { newGame, stepGame } from "../game/sim.js";
import { assistTouchAim, dragYaw } from "../game/touch-aim.js";
import {
  challengeFor,
  newDaily,
  packInput,
  unpackInput,
  recordInput,
  verifyReplay,
  TICK,
} from "../game/daily.js";

function room() {
  const game = newGame();
  game.map.level = {
    ...game.map.level,
    map: ["#########", ...Array(7).fill("#.......#"), "#########"],
  };
  game.map.gates = [];
  game.doors = [];
  Object.assign(game.player, { x: 8, z: 4 });
  game.enemies = [{ x: 8.7, z: 10, hp: 3, respawn: 0 }];
  return game;
}

test("touch assistance closes a small aiming error gradually and yields to manual turning", () => {
  const game = room();
  let yaw = 0;
  const target = Math.atan2(0.7, 6);
  for (let tick = 0; tick < 30; tick++) {
    const next = assistTouchAim(game, yaw, TICK);
    assert.equal(next.assisted, true);
    assert.ok(next.yaw > yaw && next.yaw < target);
    assert.ok(next.yaw - yaw <= 0.9 * TICK);
    yaw = next.yaw;
  }
  assert.ok(Math.abs(target - yaw) < 0.002);
  assert.deepEqual(assistTouchAim(game, 0, TICK, true), {
    yaw: 0,
    assisted: false,
  });
  assert.ok(
    dragYaw(50) < 0,
    "Dragging right turns the world-relative camera right",
  );
  assert.equal(Math.abs(dragYaw(0)), 0, "A still finger has no turn input");
});

test("aim assistance cannot see through shelves, timed shutters or closed key doors", () => {
  for (const obstacle of ["shelf", "shutter", "door"]) {
    const game = room();
    if (obstacle === "shelf") game.map.level.map[4] = "#...#...#";
    if (obstacle === "shutter")
      game.map.gates = [{ col: 4, row: 4, x: 8, z: 8, phase: 0 }];
    if (obstacle === "door")
      game.doors = [{ col: 4, row: 4, x: 8, z: 8, open: false }];
    assert.equal(assistTouchAim(game, 0, TICK).assisted, false, obstacle);
    if (obstacle === "shutter") game.elapsed = 4;
    else if (obstacle === "door") game.doors[0].open = true;
    else game.map.level.map[4] = "#.......#";
    assert.equal(
      assistTouchAim(game, 0, TICK).assisted,
      true,
      `${obstacle} opened`,
    );
  }
});

test("assistance ignores offscreen, distant and inactive targets, protected bosses and room opponents", () => {
  for (const enemy of [
    { x: 8, z: 2 },
    { x: 12, z: 10 },
    { x: 8, z: 18 },
    { respawn: 3 },
    { hp: 0 },
  ]) {
    const game = room();
    Object.assign(game.enemies[0], enemy);
    assert.equal(assistTouchAim(game, 0, TICK).assisted, false);
  }
  const game = room();
  game.boss = { ...game.enemies[0], exposed: false };
  game.enemies = [];
  assert.equal(assistTouchAim(game, 0, TICK).assisted, false);
  game.boss.exposed = true;
  assert.equal(assistTouchAim(game, 0, TICK).assisted, true);
  game.multiplayer = { kind: "versus" };
  assert.equal(assistTouchAim(game, 0, TICK).assisted, false);
});

test("targets are chosen near the crosshair and yaw wraps across north without a full turn", () => {
  const game = room();
  game.enemies.push({ x: 7.7, z: 10, hp: 3, respawn: 0 });
  assert.ok(assistTouchAim(game, 0, TICK).yaw < 0);
  game.enemies = [{ x: 7.9, z: 2, hp: 3, respawn: 0 }];
  const next = assistTouchAim(game, Math.PI - 0.01, TICK);
  assert.equal(next.assisted, true);
  assert.ok(next.yaw > Math.PI - 0.01 && next.yaw < Math.PI + 0.02);
});

test("assisted angles use the ordinary quantized input log and verify without a scoring rule change", () => {
  const config = challengeFor("2026-09-21"),
    game = newDaily(config),
    log = [];
  let assists = 0;
  for (let tick = 0; tick < 5400 && game.state === "playing"; tick++) {
    const target = game.enemies.find((e) => e.hp > 0 && e.respawn <= 0);
    const yaw = target
      ? Math.atan2(target.x - game.player.x, target.z - game.player.z) + 0.07
      : 0;
    const aiming = assistTouchAim(game, yaw, TICK);
    assists += Number(aiming.assisted);
    const packed = packInput({
      aim: aiming.yaw,
      fire: true,
      x: Math.sin(tick / 130),
      z: Math.cos(tick / 130),
      dash: tick % 100 === 0,
    });
    recordInput(log, packed);
    stepGame(game, unpackInput(packed), TICK);
  }
  assert.ok(assists > 0);
  const verified = verifyReplay(config, log);
  assert.equal(verified.score, game.score);
  assert.equal(verified.kills, game.kills);
  assert.equal(verified.crumbs, game.collected);
});
