import { newGame, stepGame, clamp } from "./sim.js";

export const RULESET = "daily-rush-1";
export const TICK = 1 / 60;
export const DAILY_TICKS = 5400;

export function challengeFor(day) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !Number.isFinite(Date.parse(day)) ||
    new Date(day).toISOString().slice(0, 10) !== day
  )
    throw new Error("Invalid challenge date");
  let seed = 2166136261;
  for (const ch of `${RULESET}:${day}`)
    seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  return {
    day,
    seed,
    ruleset: RULESET,
    duration: 90,
    levelIndex: [5, 7, 8][seed % 3],
  };
}

export function newDaily(config) {
  const expected = challengeFor(config.day);
  if (config.seed !== expected.seed || config.ruleset !== RULESET)
    throw new Error("Challenge has changed. Reload to start.");
  const game = newGame(expected.levelIndex, {
    hp: 4,
    upgrades: { rapid: 1, spread: 1, magnet: 1 },
  });
  game.daily = expected;
  game.wave = 1;
  game.time = 90;
  game.player.hp = game.player.maxHp = 5;
  game.ammo = 60;
  game.boss = null;
  // A seeded reflection changes routes without changing collision geometry or connectivity.
  if (expected.seed % 2) {
    const flip = (p) => {
      p.x = (game.map.width - 1) * 2 - p.x;
    };
    game.map.level = {
      ...game.map.level,
      map: game.map.level.map.map((row) =>
        [...row]
          .reverse()
          .map((c) => (c === ">" ? "<" : c === "<" ? ">" : c))
          .join(""),
      ),
    };
    for (const p of [
      game.player,
      game.map.start,
      game.map.exit,
      ...game.crumbs,
      ...game.batteries,
      ...game.visors,
      ...game.enemies,
      ...game.map.walls,
      ...game.map.gates,
      ...game.map.belts,
    ]) {
      flip(p);
      if ("col" in p) p.col = game.map.width - 1 - p.col;
      if ("direction" in p) p.direction *= -1;
      if (p.origin) flip(p.origin);
    }
  }
  return game;
}

// The client simulates the exact quantized values it submits, including mouse/touch aim.
export function packInput(input) {
  const aim = Number.isFinite(input.aim)
    ? Math.atan2(Math.sin(input.aim), Math.cos(input.aim))
    : null;
  return [
    1,
    Math.round(clamp(input.x || 0, -1, 1) * 1000),
    Math.round(clamp(input.z || 0, -1, 1) * 1000),
    aim === null ? null : Math.round(aim * 10000),
    (input.fire ? 1 : 0) | (input.dash ? 2 : 0),
  ];
}
export function unpackInput(row) {
  return {
    x: row[1] / 1000,
    z: row[2] / 1000,
    aim: row[3] === null ? undefined : row[3] / 10000,
    fire: !!(row[4] & 1),
    dash: !!(row[4] & 2),
  };
}
export function recordInput(log, row) {
  const last = log.at(-1);
  if (last && last.slice(1).every((v, i) => v === row[i + 1])) last[0]++;
  else log.push([...row]);
}
export function verifyReplay(config, log) {
  if (!Array.isArray(log) || !log.length || log.length > DAILY_TICKS)
    throw new Error("Invalid replay");
  let ticks = 0;
  for (const r of log) {
    if (
      !Array.isArray(r) ||
      r.length !== 5 ||
      !Number.isInteger(r[0]) ||
      r[0] < 1 ||
      !Number.isInteger(r[1]) ||
      Math.abs(r[1]) > 1000 ||
      !Number.isInteger(r[2]) ||
      Math.abs(r[2]) > 1000 ||
      (r[3] !== null && (!Number.isInteger(r[3]) || Math.abs(r[3]) > 31416)) ||
      !Number.isInteger(r[4]) ||
      r[4] < 0 ||
      r[4] > 3
    )
      throw new Error("Invalid replay input");
    ticks += r[0];
    if (ticks > DAILY_TICKS) throw new Error("Replay too long");
  }
  const game = newDaily(config);
  let played = 0;
  for (const r of log)
    for (let i = 0; i < r[0]; i++) {
      if (game.state !== "playing")
        throw new Error("Input after the run ended");
      stepGame(game, unpackInput(r), TICK);
      played++;
    }
  if (game.state === "playing")
    throw new Error("Finish the run before submitting");
  return {
    score: game.score,
    kills: game.kills,
    crumbs: game.collected,
    survived: game.state === "won",
    ticks: played,
  };
}
