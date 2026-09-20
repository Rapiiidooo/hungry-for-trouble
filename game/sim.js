import { DEFAULT_SEED } from "./floorplans.js";
import { CELL, LEVELS, layoutFor } from "./levels.js";

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const length = (x, z) => Math.hypot(x, z);
const distance = (a, b) => length(a.x - b.x, a.z - b.z);
const directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function newGame(levelIndex = 0, carry = {}) {
  const seed = carry.seed ?? DEFAULT_SEED;
  const map = layoutFor(levelIndex, seed);
  return {
    levelIndex,
    seed,
    map,
    state: "playing",
    elapsed: 0,
    time: map.level.time,
    player: {
      ...map.start,
      vx: 0,
      vz: 0,
      angle: 0,
      hp: Math.min(
        4 + (carry.upgrades?.heart || 0),
        (carry.hp ?? 4 + (carry.upgrades?.heart || 0)) +
          (carry.hp !== undefined && levelIndex ? 1 : 0),
      ),
      maxHp: 4 + (carry.upgrades?.heart || 0),
      shield: carry.upgrades?.shield || 0,
      invincible: 1.5,
      dash: 0,
      dashCooldown: 0,
      fireCooldown: 0,
    },
    enemies: map.enemies.map((enemy, id) => ({
      ...enemy,
      id,
      origin: { x: enemy.x, z: enemy.z },
      hp: enemy.kind === "armoured" ? 9 : enemy.kind === "shooter" ? 5 : 3,
      maxHp: enemy.kind === "armoured" ? 9 : enemy.kind === "shooter" ? 5 : 3,
      shotCooldown: 1.5 + id * 0.3,
      tell: 0,
      shotAngle: 0,
      angle: 0,
      stun: 0,
      respawn: 0,
      waypoint: null,
      pathTimer: 0,
      hit: 0,
      windup: 0,
      charge: 0,
      chargeCooldown: 3 + id,
      chargeX: 0,
      chargeZ: 0,
    })),
    boss: map.boss
      ? {
          ...map.boss,
          hp: levelIndex === 9 ? 360 : 180,
          maxHp: levelIndex === 9 ? 360 : 180,
          director: levelIndex === 9,
          phase: 0,
          fire: 1.5,
          exposed: false,
          hit: 0,
        }
      : null,
    crumbs: map.crumbs,
    batteries: map.batteries,
    visors: map.visors,
    repairs: map.repairs,
    fpsTime: 0,
    bullets: [],
    hazards: [],
    collected: 0,
    score: carry.score || 0,
    ammo: 24,
    overtime: 0,
    combo: 0,
    comboTimer: 0,
    kills: 0,
    shots: 0,
    hits: 0,
    upgrades: {
      rapid: 0,
      spread: 0,
      pierce: 0,
      shield: 0,
      magnet: 0,
      heart: 0,
      ...carry.upgrades,
    },
    events: [],
    shake: 0,
    gateClock: 0,
  };
}

export function gateClosed(game, col, row) {
  const gate = game.map.gates.find(
    (item) => item.col === col && item.row === row,
  );
  if (!gate) return false;
  // A gate waits while an actor occupies it so it cannot entomb a player or enemy.
  if (
    [game.player, ...game.enemies].some(
      (actor) =>
        Math.abs(actor.x - gate.x) < 1.35 && Math.abs(actor.z - gate.z) < 1.35,
    )
  )
    return false;
  return Math.floor(game.elapsed / 4 + gate.phase) % 2 === 0;
}

export function solid(game, col, row) {
  return (
    !game.map.level.map[row] ||
    game.map.level.map[row][col] === undefined ||
    ["#", " "].includes(game.map.level.map[row][col]) ||
    gateClosed(game, col, row)
  );
}

export function canStand(game, x, z, radius = 0.34) {
  const left = Math.round((x - radius) / CELL),
    right = Math.round((x + radius) / CELL);
  const top = Math.round((z - radius) / CELL),
    bottom = Math.round((z + radius) / CELL);
  for (let row = top; row <= bottom; row++)
    for (let col = left; col <= right; col++) {
      if (!solid(game, col, row)) continue;
      const nearestX = clamp(x, col * CELL - 1, col * CELL + 1);
      const nearestZ = clamp(z, row * CELL - 1, row * CELL + 1);
      if (length(x - nearestX, z - nearestZ) < radius) return false;
    }
  return true;
}

function move(game, actor, dx, dz) {
  // Substeps prevent dashes and frame stalls from crossing thin walls.
  const steps = Math.max(1, Math.ceil(length(dx, dz) / 0.18));
  for (let i = 0; i < steps; i++) {
    if (canStand(game, actor.x + dx / steps, actor.z)) actor.x += dx / steps;
    else if ("vx" in actor) actor.vx = 0;
    if (canStand(game, actor.x, actor.z + dz / steps)) actor.z += dz / steps;
    else if ("vz" in actor) actor.vz = 0;
  }
}

export function pathTo(game, from, target, flee = false) {
  const start = [Math.round(from.x / CELL), Math.round(from.z / CELL)];
  let goal = [Math.round(target.x / CELL), Math.round(target.z / CELL)];
  if (solid(game, ...goal)) {
    // Predicted ambush targets can lie beyond the store or deep inside shelves.
    const candidates = [];
    for (let row = 0; row < game.map.height; row++)
      for (let col = 0; col < game.map.width; col++)
        if (!solid(game, col, row)) candidates.push([col, row]);
    goal =
      candidates.sort(
        (a, b) =>
          length(a[0] - goal[0], a[1] - goal[1]) -
          length(b[0] - goal[0], b[1] - goal[1]),
      )[0] || start;
  }
  if (flee) {
    const candidates = directions
      .map(([x, z]) => [start[0] + x, start[1] + z])
      .filter((point) => !solid(game, ...point));
    const best = candidates.sort(
      (a, b) =>
        length(b[0] - goal[0], b[1] - goal[1]) -
        length(a[0] - goal[0], a[1] - goal[1]),
    )[0];
    return best ? { x: best[0] * CELL, z: best[1] * CELL } : { ...from };
  }
  const queue = [{ p: start, first: null }],
    seen = new Set([start.join(",")]);
  for (let i = 0; i < queue.length; i++) {
    const { p, first } = queue[i];
    if (p[0] === goal[0] && p[1] === goal[1])
      return first || { x: goal[0] * CELL, z: goal[1] * CELL };
    for (const [dx, dz] of directions) {
      const next = [p[0] + dx, p[1] + dz],
        key = next.join(",");
      if (seen.has(key) || solid(game, ...next)) continue;
      seen.add(key);
      queue.push({
        p: next,
        first: first || { x: next[0] * CELL, z: next[1] * CELL },
      });
    }
  }
  return { ...from };
}

function killEnemy(game, enemy) {
  if (enemy.respawn > 0) return;
  enemy.respawn = game.daily
    ? Math.max(3, 8 - game.wave)
    : game.levelIndex >= 5
      ? 7
      : 9;
  enemy.hp = 0;
  enemy.windup = enemy.charge = 0;
  game.combo = game.comboTimer > 0 ? game.combo + 1 : 1;
  game.comboTimer = 3;
  game.score += 100 * Math.min(game.combo, 8);
  game.ammo = Math.min(99, game.ammo + 7);
  game.kills++;
  game.events.push({
    type: "enemy-down",
    x: enemy.x,
    z: enemy.z,
    combo: game.combo,
  });
}

function hurt(game, source = game.player) {
  const p = game.player;
  if (p.invincible > 0 || p.dash > 0 || game.overtime > 0) return;
  if (p.shield > 0) {
    p.shield--;
    p.invincible = 1.5;
    game.events.push({ type: "shield-save", x: p.x, z: p.z });
    return;
  }
  p.hp--;
  p.invincible = 1.5;
  game.combo = 0;
  game.shake = 0.18;
  game.events.push({
    type: "damage",
    x: p.x,
    z: p.z,
    fromX: source.x,
    fromZ: source.z,
  });
  if (p.hp <= 0) {
    game.state = "lost";
    game.events.push({ type: "lost" });
  }
}

function fire(game, input) {
  const p = game.player;
  if (!input.fire || p.fireCooldown > 0) return;
  if (game.ammo <= 0 && game.overtime <= 0) {
    p.fireCooldown = 0.4;
    game.events.push({ type: "empty" });
    return;
  }
  if (game.overtime <= 0) game.ammo--;
  p.fireCooldown =
    game.overtime > 0
      ? 0.11
      : (game.fpsTime > 0 ? 0.14 : 0.22) / (1 + game.upgrades.rapid * 0.25);
  const spread = Math.max(game.upgrades.spread, game.overtime > 0 ? 1 : 0);
  const offsets = Array.from(
    { length: 1 + spread * 2 },
    (_, i) => (i - spread) * 0.12,
  );
  for (const offset of offsets) {
    const angle = p.angle + offset;
    game.bullets.push({
      x: p.x,
      z: p.z,
      vx: Math.sin(angle) * 19,
      vz: Math.cos(angle) * 19,
      life: 0.85,
      pierce: game.upgrades.pierce,
      damage: game.overtime > 0 ? 3 : 1,
      hit: new Set(),
    });
  }
  game.shots++;
  game.events.push({ type: "shot", x: p.x, z: p.z });
}

export function stepGame(game, input, dt) {
  game.events = [];
  if (game.state !== "playing" || dt <= 0) return game.events;
  dt = Math.min(dt, 0.05);
  game.elapsed += dt;
  game.time = Math.max(0, game.time - dt);
  game.overtime = Math.max(0, game.overtime - dt);
  game.fpsTime = Math.max(0, game.fpsTime - dt);
  game.comboTimer = Math.max(0, game.comboTimer - dt);
  game.shake = Math.max(0, game.shake - dt);
  if (game.time < 1e-8) {
    game.time = 0;
    game.state = game.daily ? "won" : "lost";
    if (game.daily) game.score += 500 + game.player.hp * 150;
    return [{ type: game.state }];
  }
  if (game.daily && Math.floor(game.elapsed / 18) + 1 > game.wave) {
    game.wave++;
    game.events.push({ type: "wave", wave: game.wave });
    for (const c of game.crumbs)
      if (distance(c, game.player) > 4) c.collected = false;
    for (const e of game.enemies) {
      e.shotCooldown = Math.min(e.shotCooldown, 1);
    }
  }
  const p = game.player;
  for (const key of ["invincible", "dash", "dashCooldown", "fireCooldown"])
    p[key] = Math.max(0, p[key] - dt);
  let ix = input.x || 0,
    iz = input.z || 0;
  const size = length(ix, iz);
  if (size > 1) {
    ix /= size;
    iz /= size;
  }
  if (Number.isFinite(input.aim)) p.angle = input.aim;
  else if (size > 0.1) p.angle = Math.atan2(ix, iz);
  if (input.dash && p.dashCooldown === 0 && size > 0.1) {
    p.dash = 0.18;
    p.dashCooldown = 1.2;
    game.events.push({ type: "dash", x: p.x, z: p.z });
  }
  const speed = p.dash > 0 ? 13 : game.overtime > 0 ? 5.9 : 4.7;
  const grip = game.map.level.theme === "ice" && p.dash === 0 ? 5 : 24;
  p.vx += (ix * speed - p.vx) * Math.min(1, dt * grip);
  p.vz += (iz * speed - p.vz) * Math.min(1, dt * grip);
  move(game, p, p.vx * dt, p.vz * dt);
  const belt = game.map.belts.find(
    (b) => Math.abs(p.x - b.x) < 1 && Math.abs(p.z - b.z) < 0.85,
  );
  if (belt) move(game, p, belt.direction * 2.3 * dt, 0);
  fire(game, input);

  for (const crumb of game.crumbs)
    if (
      !crumb.collected &&
      distance(p, crumb) < 0.85 + game.upgrades.magnet * 0.32 &&
      lineOfSight(game, p, crumb)
    ) {
      crumb.collected = true;
      game.collected++;
      game.score += 10;
      game.ammo = Math.min(99, game.ammo + 2);
      game.events.push({ type: "crumb", x: crumb.x, z: crumb.z });
      if (!game.daily && game.collected === game.map.level.quota)
        game.events.push({ type: "exit-open" });
    }
  for (const battery of game.batteries) {
    if (battery.collected) {
      battery.respawn -= dt;
      if (battery.respawn <= 0 && (game.map.boss || game.daily))
        battery.collected = false;
    } else if (distance(p, battery) < 0.85) {
      battery.collected = true;
      battery.respawn = 28;
      game.overtime = game.daily ? 5 : 8;
      game.ammo = Math.min(99, game.ammo + 12);
      game.score += 50;
      game.events.push({ type: "overtime", x: battery.x, z: battery.z });
      for (const enemy of game.enemies) {
        enemy.waypoint = null;
        enemy.windup = enemy.charge = 0;
      }
    }
  }

  for (const repair of game.repairs) {
    if (repair.collected) {
      repair.respawn -= dt;
      if (game.daily && repair.respawn <= 0) repair.collected = false;
    } else if (p.hp < p.maxHp && distance(p, repair) < 0.85) {
      repair.collected = true;
      repair.respawn = 30;
      p.hp++;
      game.events.push({ type: "heal", x: repair.x, z: repair.z });
    }
  }

  for (const visor of game.visors) {
    if (visor.collected) {
      visor.respawn -= dt;
      if (game.daily && visor.respawn <= 0) visor.collected = false;
    } else if (distance(p, visor) < 0.85) {
      visor.collected = true;
      visor.respawn = 36;
      game.fpsTime = 18;
      game.ammo = Math.min(99, game.ammo + 24);
      p.invincible = Math.max(p.invincible, 2);
      game.events.push({ type: "visor", x: visor.x, z: visor.z });
    }
  }

  for (const enemy of game.enemies) {
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);
    enemy.chargeCooldown = Math.max(0, enemy.chargeCooldown - dt);
    if (enemy.respawn > 0) {
      enemy.respawn -= dt;
      if (enemy.respawn <= 0) {
        Object.assign(enemy, enemy.origin, {
          hp: enemy.maxHp,
          waypoint: null,
          stun: 1,
          windup: 0,
          charge: 0,
          chargeCooldown: 3,
          tell: 0,
          shotCooldown: 1.5,
        });
        if (distance(p, enemy) < 3) enemy.respawn = 2;
      }
      continue;
    }
    if (enemy.kind === "shooter" && enemy.stun === 0 && game.overtime <= 0) {
      const gap = distance(p, enemy);
      enemy.shotCooldown = Math.max(0, enemy.shotCooldown - dt);
      if (enemy.tell > 0) {
        enemy.tell = Math.max(0, enemy.tell - dt);
        if (enemy.tell === 0) {
          const offsets =
            game.levelIndex >= 7 || (game.daily && game.wave > 2)
              ? [-0.13, 0, 0.13]
              : [0];
          for (const offset of offsets)
            launchHazard(game, enemy, enemy.shotAngle + offset, 6.2);
          enemy.shotCooldown = game.daily
            ? Math.max(0.9, 2.2 - game.wave * 0.2)
            : 2;
          game.events.push({ type: "drone-shot", x: enemy.x, z: enemy.z });
        }
      } else if (
        enemy.shotCooldown === 0 &&
        gap < 14 &&
        lineOfSight(game, enemy, p)
      ) {
        enemy.tell = 0.65;
        enemy.shotAngle = Math.atan2(p.x - enemy.x, p.z - enemy.z);
        game.events.push({ type: "drone-warning", x: enemy.x, z: enemy.z });
      }
      if (
        enemy.tell > 0 ||
        (gap > 4 && gap < 10 && lineOfSight(game, enemy, p))
      ) {
        enemy.angle = Math.atan2(p.x - enemy.x, p.z - enemy.z);
        continue;
      }
    } else if (game.overtime > 0) enemy.tell = 0;
    if (enemy.stun === 0) {
      if (enemy.windup > 0) {
        enemy.windup = Math.max(0, enemy.windup - dt);
        if (enemy.windup === 0) {
          enemy.charge = 0.6;
          game.events.push({ type: "charge", x: enemy.x, z: enemy.z });
        }
      } else if (enemy.charge > 0) {
        enemy.charge = Math.max(0, enemy.charge - dt);
        move(game, enemy, enemy.chargeX * 7.8 * dt, enemy.chargeZ * 7.8 * dt);
        if (enemy.charge === 0) {
          enemy.stun = 0.5;
          enemy.waypoint = null;
        }
      } else {
        const separation = distance(p, enemy);
        if (
          enemy.kind === "ambusher" &&
          game.overtime <= 0 &&
          enemy.chargeCooldown === 0 &&
          separation > 2.3 &&
          separation < 6.5 &&
          (Math.abs(p.x - enemy.x) < 0.6 || Math.abs(p.z - enemy.z) < 0.6)
        ) {
          let clear = true;
          for (let t = 0.2; t < separation; t += 0.2)
            if (
              !canStand(
                game,
                enemy.x + ((p.x - enemy.x) * t) / separation,
                enemy.z + ((p.z - enemy.z) * t) / separation,
                0.15,
              )
            )
              clear = false;
          if (clear) {
            enemy.windup = 0.65;
            enemy.chargeCooldown = 4.5;
            enemy.chargeX = (p.x - enemy.x) / separation;
            enemy.chargeZ = (p.z - enemy.z) / separation;
            enemy.angle = Math.atan2(enemy.chargeX, enemy.chargeZ);
            game.events.push({
              type: "charge-warning",
              x: enemy.x,
              z: enemy.z,
            });
          }
        }
        if (enemy.windup === 0) {
          const arrived =
            !enemy.waypoint || distance(enemy, enemy.waypoint) < 0.08;
          if (arrived) {
            const target =
              enemy.kind === "ambusher"
                ? { x: p.x + ix * 5, z: p.z + iz * 5 }
                : p;
            enemy.waypoint = pathTo(game, enemy, target, game.overtime > 0);
          }
          const dx = enemy.waypoint.x - enemy.x,
            dz = enemy.waypoint.z - enemy.z;
          const d = length(dx, dz);
          const step = Math.min(
            d,
            game.map.level.speed *
              (game.overtime > 0 ? 0.8 : 1) *
              (enemy.kind === "armoured" ? 0.78 : 1) *
              (game.daily ? 1 + (game.wave - 1) * 0.1 : 1) *
              dt,
          );
          if (d > 0.01) {
            enemy.angle = Math.atan2(dx, dz);
            const oldX = enemy.x,
              oldZ = enemy.z;
            move(game, enemy, (dx / d) * step, (dz / d) * step);
            if (length(enemy.x - oldX, enemy.z - oldZ) < step * 0.5)
              enemy.waypoint = null;
          }
        }
      }
    }
    if (distance(p, enemy) < 0.75) {
      if (game.overtime > 0) killEnemy(game, enemy);
      else hurt(game, enemy);
    }
  }

  for (const bullet of game.bullets) {
    bullet.life -= dt;
    const substeps = 3;
    for (let i = 0; i < substeps && bullet.life > 0; i++) {
      bullet.x += (bullet.vx * dt) / substeps;
      bullet.z += (bullet.vz * dt) / substeps;
      if (!canStand(game, bullet.x, bullet.z, 0.08)) {
        bullet.life = 0;
        break;
      }
      for (const enemy of game.enemies)
        if (
          enemy.respawn <= 0 &&
          !bullet.hit.has(enemy.id) &&
          distance(bullet, enemy) < 0.6
        ) {
          bullet.hit.add(enemy.id);
          enemy.hp -= bullet.damage;
          enemy.stun = 0.16;
          enemy.hit = 0.12;
          game.hits++;
          game.events.push({ type: "hit", x: enemy.x, z: enemy.z });
          if (enemy.hp <= 0) killEnemy(game, enemy);
          if (bullet.pierce-- <= 0) bullet.life = 0;
          break;
        }
      if (
        game.boss &&
        game.boss.hp > 0 &&
        distance(bullet, game.boss) < 1.3 &&
        !bullet.hit.has("boss")
      ) {
        bullet.hit.add("boss");
        bullet.life = 0;
        // Overtime clears ordinary enemies, but the Manager still requires attack windows.
        const damage = game.boss.exposed ? Math.min(1, bullet.damage) : 0;
        game.boss.hp = Math.max(0, game.boss.hp - damage);
        game.boss.hit = 0.1;
        game.events.push({
          type: damage > 0 ? "hit" : "shield",
          x: game.boss.x,
          z: game.boss.z,
        });
        if (game.boss.hp === 0) {
          game.score += 2500;
          game.events.push({ type: "boss-down" });
        }
      }
    }
  }
  game.bullets = game.bullets.filter((bullet) => bullet.life > 0);
  if (game.boss && game.boss.hp > 0) {
    const boss = game.boss;
    boss.hit = Math.max(0, boss.hit - dt);
    boss.phase += dt;
    boss.fire -= dt;
    boss.exposed = boss.director ? boss.phase % 7 > 4 : boss.phase % 6 > 3.5;
    if (boss.fire <= 0 && !boss.exposed) {
      const enraged = boss.hp < boss.maxHp / 2;
      boss.fire = enraged ? 0.7 : 0.95;
      const angle = Math.atan2(p.x - boss.x, p.z - boss.z);
      const angles = [-0.24, 0, 0.24].map((offset) => angle + offset);
      if (boss.director) {
        for (let i = 0; i < 12; i++)
          angles.push((i * Math.PI) / 6 + boss.phase * 0.5);
        boss.fire = enraged ? 0.6 : 0.9;
      }
      if (enraged)
        for (let i = 0; i < 8; i++)
          angles.push((i * Math.PI) / 4 + boss.phase * 0.12);
      for (const direction of angles) launchHazard(game, boss, direction, 5, 4);
      game.events.push({ type: "boss-shot" });
    }
    if (distance(p, boss) < 1.6) hurt(game, boss);
  }
  for (const hazard of game.hazards) {
    hazard.life -= dt;
    hazard.age = (hazard.age || 0) + dt;
    const steps = Math.max(
      1,
      Math.ceil((Math.hypot(hazard.vx, hazard.vz) * dt) / 0.12),
    );
    for (let i = 0; i < steps && hazard.life > 0; i++) {
      hazard.x += (hazard.vx * dt) / steps;
      hazard.z += (hazard.vz * dt) / steps;
      if (!canStand(game, hazard.x, hazard.z, 0.15)) {
        hazard.life = 0;
        game.events.push({ type: "receipt-impact", x: hazard.x, z: hazard.z });
        break;
      }
      if (distance(hazard, p) < 0.48) {
        hurt(game, { x: hazard.x - hazard.vx, z: hazard.z - hazard.vz });
        hazard.life = 0;
      }
    }
  }
  game.hazards = game.hazards.filter((item) => item.life > 0);
  if (
    game.state === "playing" &&
    !game.daily &&
    game.collected >= game.map.level.quota &&
    (!game.boss || game.boss.hp === 0) &&
    distance(p, game.map.exit) < 1
  ) {
    game.score += Math.round(game.time * 10);
    game.state = game.levelIndex === LEVELS.length - 1 ? "won" : "cleared";
    game.events.push({ type: game.state });
  }
  return game.events;
}

export function nextLevel(game, upgrade) {
  if (
    game.state !== "cleared" ||
    !["rapid", "spread", "pierce", "shield", "magnet", "heart"].includes(
      upgrade,
    )
  )
    return null;
  const upgrades = { ...game.upgrades, [upgrade]: game.upgrades[upgrade] + 1 };
  return newGame(game.levelIndex + 1, {
    hp: game.player.hp + (upgrade === "heart" ? 1 : 0),
    score: game.score,
    seed: game.seed,
    upgrades,
  });
}

export function lineOfSight(game, a, b) {
  const d = distance(a, b);
  for (let t = 0.25; t < d; t += 0.25)
    if (
      !canStand(
        game,
        a.x + ((b.x - a.x) * t) / d,
        a.z + ((b.z - a.z) * t) / d,
        0.08,
      )
    )
      return false;
  return true;
}

function launchHazard(game, origin, angle, speed, life = 3) {
  game.hazards.push({
    x: origin.x,
    z: origin.z,
    vx: Math.sin(angle) * speed,
    vz: Math.cos(angle) * speed,
    life,
    age: 0,
  });
}
