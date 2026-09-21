export const KEY_TYPES = [
  {
    id: "red",
    tile: "r",
    door: "1",
    label: "RED",
    symbol: "▲",
    color: "#e87361",
    enamel: 0xc94732,
  },
  {
    id: "green",
    tile: "g",
    door: "2",
    label: "GREEN",
    symbol: "◆",
    color: "#84c99a",
    enamel: 0x43885e,
  },
  {
    id: "blue",
    tile: "b",
    door: "3",
    label: "BLUE",
    symbol: "●",
    color: "#8fbef3",
    enamel: 0x527bb3,
  },
  {
    id: "yellow",
    tile: "y",
    door: "4",
    label: "YELLOW",
    symbol: "■",
    color: "#efc35d",
    enamel: 0xc79b39,
  },
];

export const keyType = (color) => KEY_TYPES.find((key) => key.id === color);
export const lockedDoorAt = (game, col, row) =>
  game.doors?.find(
    (door) => !door.open && door.col === col && door.row === row,
  );

export function updateLocks(game, dt, lineOfSight) {
  if (!game.keycards?.length) return;
  const p = game.player;
  game.lockHintCooldown = Math.max(0, game.lockHintCooldown - dt);
  for (const card of game.keycards) {
    if (
      card.collected ||
      Math.hypot(p.x - card.x, p.z - card.z) >= 0.85 ||
      !lineOfSight(game, p, card)
    )
      continue;
    card.collected = true;
    game.keyring.push(card.color);
    game.score += 150;
    game.events.push({
      type: "key-found",
      color: card.color,
      x: card.x,
      z: card.z,
    });
  }
  for (const door of game.doors) {
    if (door.open) continue;
    const dx = p.x - door.x,
      dz = p.z - door.z;
    // Only approach a doorway from its corridor, never from behind the side wall.
    const along = door.axis === "x" ? Math.abs(dx) : Math.abs(dz);
    const across = door.axis === "x" ? Math.abs(dz) : Math.abs(dx);
    if (along > 1.8 || across > 0.7) continue;
    if (game.keyring.includes(door.color)) {
      door.open = true;
      door.openedAt = game.elapsed;
      for (const enemy of game.enemies) enemy.waypoint = null;
      game.events.push({
        type: "door-open",
        color: door.color,
        x: door.x,
        z: door.z,
      });
    } else if (game.lockHintCooldown === 0) {
      game.lockHintCooldown = 3;
      game.events.push({
        type: "door-locked",
        color: door.color,
        x: door.x,
        z: door.z,
      });
    }
  }
}

export function keyIcon(color) {
  const key = keyType(color);
  return `<svg viewBox="0 0 48 36" aria-hidden="true" focusable="false"><path d="M20 19h23v7h-5v6h-7v-6H20" fill="${key.color}"/><circle cx="13" cy="18" r="11" fill="${key.color}"/><text x="13" y="22" text-anchor="middle" fill="#18283c" font-size="13" font-family="sans-serif" font-weight="900">${key.symbol}</text></svg>`;
}
