// Deterministic machinery state is shared by the client and daily replay verifier.
const gap = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function ventPhase(game, vent) {
  if (["core", "locksmith"].includes(game.boss?.kind) && game.boss.hp <= 0)
    return "safe";
  const phase = (game.elapsed + vent.phase) % 5.6;
  return phase < 3.4 ? "safe" : phase < 4.6 ? "warning" : "active";
}
export function addMine(game, point, delay = 1.4) {
  if (game.mines.length >= 20) return;
  game.mines.push({
    x: point.x,
    z: point.z,
    arm: delay,
    life: 9,
    blast: 0,
  });
  game.events.push({ type: "mine-warning", x: point.x, z: point.z });
}
export function hitStock(game, item, vx, vz, damage = 1) {
  if (item.broken) return;
  if (item.kind === "cart") {
    const speed = Math.hypot(vx, vz) || 1;
    item.vx = (vx / speed) * 11;
    item.vz = (vz / speed) * 11;
    item.hits = [];
    item.cooldown = 0.35;
    game.events.push({ type: "cart-push", x: item.x, z: item.z });
  } else if ((item.hp -= damage) <= 0) {
    item.broken = true;
    item.cloud = 3;
    game.events.push({ type: "flour-burst", x: item.x, z: item.z });
  }
}
export function updateMachines(game, dt, { move, canStand, hurt, killEnemy }) {
  const p = game.player;
  p.transportCooldown = Math.max(0, p.transportCooldown - dt);
  const pad = game.map.portals.find((portal) => gap(p, portal) < 0.66);
  if (!pad) p.transportLocked = false;
  if (pad && !p.transportLocked && p.transportCooldown === 0) {
    const destination = game.map.portals[pad.target];
    if (destination && canStand(game, destination.x, destination.z)) {
      game.events.push({
        type: "transport",
        x: p.x,
        z: p.z,
        toX: destination.x,
        toZ: destination.z,
      });
      p.x = destination.x;
      p.z = destination.z;
      p.vx = p.vz = p.dash = 0;
      p.transportCooldown = 1.2;
      p.transportLocked = true;
      p.invincible = Math.max(p.invincible, 0.8);
      for (const enemy of game.enemies) enemy.waypoint = null;
    }
  }
  for (const vent of game.map.vents) {
    if (ventPhase(game, vent) !== "active") continue;
    if (gap(p, vent) < 0.86) hurt(game, vent);
    for (const enemy of game.enemies)
      if (enemy.respawn <= 0 && gap(enemy, vent) < 0.9) {
        enemy.hp -= dt * 5;
        if (enemy.hp <= 0) killEnemy(game, enemy);
      }
  }
  for (const mine of game.mines) {
    mine.arm = Math.max(0, mine.arm - dt);
    mine.life -= dt;
    if (mine.life <= 0) continue;
    if (mine.arm === 0 && !mine.blast && gap(p, mine) < 1.8) {
      mine.blast = 0.55;
      game.events.push({ type: "mine-trigger", x: mine.x, z: mine.z });
    }
    if (mine.blast > 0) {
      mine.blast -= dt;
      if (mine.blast <= 0) {
        if (gap(p, mine) < 2.1) hurt(game, mine);
        mine.life = 0;
        game.events.push({ type: "mine-burst", x: mine.x, z: mine.z });
      }
    }
  }
  game.mines = game.mines.filter((mine) => mine.life > 0);
  for (const item of game.stock) {
    item.cooldown = Math.max(0, item.cooldown - dt);
    item.cloud = Math.max(0, item.cloud - dt);
    if (item.cloud > 0) {
      for (const enemy of game.enemies)
        if (enemy.respawn <= 0 && gap(item, enemy) < 3) {
          enemy.stun = Math.max(enemy.stun, 0.25);
          enemy.tell = enemy.windup = enemy.charge = 0;
          enemy.shotCooldown = Math.max(enemy.shotCooldown, 1);
        }
    }
    if (item.broken) continue;
    if (p.dash > 0 && gap(p, item) < 1.15 && item.cooldown === 0)
      hitStock(game, item, p.dashX, p.dashZ, 2);
    const speed = Math.hypot(item.vx, item.vz);
    if (speed < 0.3) {
      item.vx = item.vz = 0;
      continue;
    }
    const x = item.x,
      z = item.z;
    move(game, item, item.vx * dt, item.vz * dt);
    if (Math.hypot(item.x - x, item.z - z) < speed * dt * 0.5)
      item.vx = item.vz = 0;
    else {
      item.vx *= Math.exp(-dt * 1.6);
      item.vz *= Math.exp(-dt * 1.6);
    }
    if (speed < 2) continue;
    for (const enemy of game.enemies)
      if (
        enemy.respawn <= 0 &&
        !item.hits.includes(enemy.id) &&
        gap(item, enemy) < 1.05
      ) {
        item.hits.push(enemy.id);
        enemy.hp -= 9;
        enemy.stun = 1.3;
        enemy.hit = 0.2;
        game.events.push({ type: "stock-hit", x: enemy.x, z: enemy.z });
        if (enemy.hp <= 0) killEnemy(game, enemy);
      }
    if (
      game.boss?.hp > 0 &&
      game.boss.exposed &&
      !item.hits.includes("boss") &&
      gap(item, game.boss) < 1.8
    ) {
      item.hits.push("boss");
      game.boss.hp = Math.max(0, game.boss.hp - 12);
      game.events.push({
        type: "stock-hit",
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
