import { canStand } from "./sim.js";

const difference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// Touch drags set an angle, not a turn speed. Holding still never keeps spinning.
export function dragYaw(pixels) {
  return -pixels * 0.009;
}

export function assistTouchAim(game, yaw, dt, turning = false) {
  if (turning || game.multiplayer) return { yaw, assisted: false };
  let best = null;
  const targets = game.enemies.filter((e) => e.hp > 0 && e.respawn <= 0);
  if (game.boss?.hp > 0 && game.boss.exposed && !game.boss.dormant)
    targets.push(game.boss);
  for (const target of targets) {
    const dx = target.x - game.player.x,
      dz = target.z - game.player.z,
      distance = Math.hypot(dx, dz),
      angle = Math.atan2(dx, dz),
      offset = difference(angle, yaw);
    if (distance > 12 || distance < 0.1 || Math.abs(offset) > 0.22) continue;
    const rank = Math.abs(offset) + distance * 0.002;
    if (best && rank >= best.rank) continue;
    // Use the same collision map as bullets, including shutters and locked doors.
    const steps = Math.ceil(distance / 0.18);
    let visible = true;
    for (let step = 1; step < steps; step++) {
      const t = step / steps;
      if (
        !canStand(game, game.player.x + dx * t, game.player.z + dz * t, 0.1)
      ) {
        visible = false;
        break;
      }
    }
    if (visible) best = { offset, rank };
  }
  if (!best) return { yaw, assisted: false };
  const correction = best.offset * (1 - Math.exp(-10 * dt));
  return {
    yaw: yaw + Math.max(-dt * 0.9, Math.min(dt * 0.9, correction)),
    assisted: true,
  };
}
