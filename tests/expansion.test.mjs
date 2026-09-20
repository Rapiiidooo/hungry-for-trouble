import test from "node:test";
import assert from "node:assert/strict";
import {
  newGame,
  stepGame,
  nextLevel,
  lineOfSight,
  canStand,
} from "../game/sim.js";
import {
  challengeFor,
  newDaily,
  packInput,
  unpackInput,
  recordInput,
  verifyReplay,
  TICK,
} from "../game/daily.js";

const tick = (game, input, seconds) => {
  const events = [];
  for (let i = 0; i < Math.round(seconds / TICK); i++)
    events.push(...stepGame(game, input, TICK));
  return events;
};

test("drones telegraph locked aim, launch receipts and cannot shoot through shelves", () => {
  const game = newGame(5);
  game.batteries = [];
  const drone = game.enemies.find((e) => e.kind === "shooter");
  game.enemies = [drone];
  Object.assign(game.player, { x: 8, z: 8 });
  Object.assign(drone, { x: 18, z: 8, shotCooldown: 0 });
  assert.ok(tick(game, {}, 0.1).some((e) => e.type === "drone-warning"));
  assert.equal(game.hazards.length, 0);
  assert.ok(tick(game, {}, 0.7).some((e) => e.type === "drone-shot"));
  assert.ok(game.hazards.length > 0);
  assert.ok(!lineOfSight(game, { x: 6, z: 2 }, { x: 6, z: 8 }));
  const shielded = newGame(5);
  shielded.hazards.push({ x: 6, z: 3, vx: 0, vz: 6, life: 3 });
  tick(shielded, {}, 0.7);
  assert.equal(shielded.hazards.length, 0);
});

test("late stages change movement and durability, visor lasts 18 seconds", () => {
  const game = newGame(8);
  game.enemies = [];
  game.batteries = [];
  Object.assign(game.player, { x: 8, z: 6 });
  tick(game, {}, 0.5);
  assert.ok(game.player.x > 9, "The belt must move an idle player");
  const visor = game.visors[0];
  Object.assign(game.player, visor);
  assert.ok(stepGame(game, {}, TICK).some((e) => e.type === "visor"));
  assert.equal(game.fpsTime, 18);
  const ammo = game.ammo;
  tick(game, { fire: true, aim: 0 }, 1);
  assert.ok(game.shots >= 6);
  assert.ok(game.ammo < ammo);
  tick(game, {}, 18);
  assert.equal(game.fpsTime, 0);
  assert.ok(
    newGame(6).enemies.some((e) => e.kind === "armoured" && e.hp === 9),
  );
});

test("defensive upgrades carry and block damage without hiding the health loss", () => {
  const game = newGame();
  game.state = "cleared";
  const shield = nextLevel(game, "shield");
  shield.player.invincible = 0;
  shield.enemies = [
    { ...shield.enemies[0], x: shield.player.x, z: shield.player.z, stun: 10 },
  ];
  assert.ok(stepGame(shield, {}, TICK).some((e) => e.type === "shield-save"));
  assert.equal(shield.player.hp, 4);
  assert.equal(shield.player.shield, 0);
  assert.ok(tick(shield, {}, 1.6).some((e) => e.type === "damage"));
  assert.equal(shield.player.hp, 3);
  game.upgrades.heart = 1;
  const heart = nextLevel(game, "heart");
  assert.equal(heart.player.maxHp, 6);
  assert.equal(heart.player.hp, 5);
});

export function idleReplay(config, movingTicks = 0) {
  const game = newDaily(config),
    log = [];
  let ticks = 0;
  while (game.state === "playing" && ticks < 5400) {
    const packed = packInput({
      x: ticks < movingTicks ? 1 : 0,
      aim: -Math.PI,
      fire: true,
    });
    recordInput(log, packed);
    stepGame(game, unpackInput(packed), TICK);
    ticks++;
  }
  return { game, log };
}

test("every seeded daily layout keeps reflected actors and pickups on walkable cells", () => {
  const variants = new Set();
  for (let day = 1; day <= 30; day++) {
    const config = challengeFor(`2026-09-${String(day).padStart(2, "0")}`);
    const key = `${config.levelIndex}/${config.seed % 2}`;
    if (variants.has(key)) continue;
    variants.add(key);
    const game = newDaily(config);
    for (const point of [
      game.player,
      ...game.enemies,
      ...game.crumbs,
      ...game.batteries,
      ...game.visors,
    ])
      assert.ok(
        canStand(game, point.x, point.z),
        `${key}: unreachable reflected object`,
      );
    for (const wall of game.map.walls)
      assert.equal(game.map.level.map[wall.row][wall.col], "#");
    for (const belt of game.map.belts)
      assert.equal(
        game.map.level.map[Math.round(belt.z / 2)][Math.round(belt.x / 2)],
        belt.direction === 1 ? ">" : "<",
      );
    const { game: played, log } = idleReplay(config, 90);
    assert.equal(verifyReplay(config, log).score, played.score);
  }
  assert.equal(variants.size, 6);
});

test("daily seeds, quantized replays, end conditions and score verification agree", () => {
  const config = challengeFor("2026-09-20");
  assert.deepEqual(config, challengeFor("2026-09-20"));
  assert.notEqual(config.seed, challengeFor("2026-09-21").seed);
  assert.throws(() => challengeFor("2026-02-31"));
  const { game, log } = idleReplay(config, 100);
  const result = verifyReplay(config, log);
  assert.equal(result.score, game.score);
  assert.equal(result.kills, game.kills);
  assert.equal(result.survived, game.state === "won");
  assert.deepEqual(result, verifyReplay(config, log));
  assert.throws(() => verifyReplay(config, [[9999999, 0, 0, 0, 0]]), /long/);
  assert.throws(() => verifyReplay(config, [[1, 2000, 0, 0, 0]]), /input/);
  assert.throws(() => verifyReplay(config, [[1, 0, 0, null, 0]]), /Finish/);
  assert.throws(
    () => verifyReplay(config, [...log, [1, 0, 0, 0, 0]]),
    /Input|long/,
  );
  const survivor = newDaily(config);
  survivor.enemies = [];
  tick(survivor, {}, 90);
  assert.equal(survivor.state, "won");
  assert.equal(survivor.wave, 5);
  assert.equal(survivor.time, 0);
  assert.ok(survivor.score >= 1250);
});
