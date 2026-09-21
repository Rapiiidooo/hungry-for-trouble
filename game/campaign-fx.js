import { ventPhase } from "./machines.js";

// World fixtures reuse the selected recipe modules. Rings and labels convey gameplay state.
export function campaignEffects({
  world,
  game,
  cloneAsset,
  makeRing,
  label,
  markEmissive,
}) {
  const portals = game.map.portals.map((data) => {
    const color = data.pair === 0 ? 0x8bbff4 : 0xd0a4e8;
    const outer = makeRing(0.83, color),
      inner = makeRing(0.54, color);
    outer.position.set(data.x, 0.055, data.z);
    inner.position.set(data.x, 0.06, data.z);
    const sign = label(
      `↔ ${data.pair === 0 ? "A" : "B"} · TRANSPORT`,
      data.pair === 0 ? "#b4d9ff" : "#e7bbff",
      2.7,
    );
    sign.position.set(data.x, 1.3, data.z);
    world.add(outer, inner, sign);
    return { data, outer, inner, sign };
  });
  const vents = game.map.vents.map((data) => {
    const floor = cloneAsset("floor");
    floor.scale.setScalar(0.65);
    floor.position.set(data.x, 0.015, data.z);
    markEmissive(floor);
    floor.traverse((node) => {
      if (node.isMesh) node.material.color.setHex(0x344158);
    });
    const ring = makeRing(0.86, 0xefb546),
      plume = label("♨ STEAM", "#fff", 1.8);
    ring.position.set(data.x, 0.08, data.z);
    plume.position.set(data.x, 0.9, data.z);
    world.add(floor, ring, plume);
    return { data, floor, ring, plume };
  });
  const stock = game.stock.map((data) => {
    const model = cloneAsset(
      data.kind === "cart" ? "security_trolley" : "shelf",
    );
    model.scale.setScalar(data.kind === "cart" ? 0.82 : 0.5);
    markEmissive(model);
    model.traverse((node) => {
      if (!node.isMesh) return;
      if ([0xc94732, 0x6c8fb8].includes(node.material.color.getHex()))
        node.material.color.setHex(0xefb546);
    });
    const sign = label(
      data.kind === "cart" ? "DASH / SHOOT · PUSH" : "SHOOT · FLOUR CLOUD",
      "#ffe094",
      2.6,
    );
    const ring = makeRing(data.kind === "cart" ? 0.7 : 3, 0xf0f2f3);
    world.add(model, sign, ring);
    return { model, sign, ring };
  });
  const mines = Array.from({ length: 20 }, () => {
    const ring = makeRing(1, 0xff735b),
      core = makeRing(0.23, 0xefb546);
    const sign = label("! MINE", "#ffbdab", 1.3);
    ring.visible = core.visible = sign.visible = false;
    world.add(ring, core, sign);
    return { ring, core, sign };
  });
  const edible = game.enemies.map(() => {
    const ring = makeRing(0.72, 0xefb546),
      sign = label("CHOMP!", "#ffe094", 1.55);
    ring.visible = sign.visible = false;
    world.add(ring, sign);
    return { ring, sign };
  });
  const dashTrail = Array.from({ length: 5 }, () => {
    const ring = makeRing(0.48, 0x93d3ff);
    ring.visible = false;
    world.add(ring);
    return ring;
  });
  const shields = game.enemies.map((enemy) => {
    if (enemy.kind !== "shieldcart") return null;
    const shield = makeRing(0.94, 0xb4d9ff, Math.PI * 0.8);
    world.add(shield);
    return shield;
  });
  return {
    update(state, clock, reduced) {
      const pulse = reduced ? 0.5 : (Math.sin(clock * 6) + 1) / 2;
      for (const [i, shield] of shields.entries()) {
        if (!shield) continue;
        const enemy = state.enemies[i];
        shield.visible =
          enemy.respawn <= 0 && state.overtime <= 0 && enemy.frozen <= 0;
        shield.position.set(enemy.x, 0.16, enemy.z);
        shield.rotation.z = -enemy.angle - Math.PI * 0.9;
      }
      for (const { data, outer, inner, sign } of portals) {
        inner.scale.setScalar(0.85 + pulse * 0.2);
        outer.material.opacity = 0.7 + pulse * 0.3;
        sign.position.y = 1.3 + (reduced ? 0 : Math.sin(clock * 2) * 0.08);
      }
      for (const { data, floor, ring, plume } of vents) {
        const phase = ventPhase(state, data),
          active = phase === "active",
          warning = phase === "warning";
        ring.material.color.setHex(
          active ? 0xff5d3e : warning ? 0xefb546 : 0x879caf,
        );
        ring.material.opacity = active ? 1 : warning ? 0.6 + pulse * 0.4 : 0.3;
        ring.scale.setScalar(active ? 1 : warning ? 0.65 + pulse * 0.35 : 0.7);
        floor.traverse((node) => {
          if (!node.isMesh) return;
          node.material.emissive.setHex(
            active ? 0xff5d3e : warning ? 0xefb546 : 0,
          );
          node.material.emissiveIntensity = active ? 0.9 : warning ? 0.4 : 0;
        });
        plume.visible = active || warning;
        plume.position.y = active ? 1.05 + (reduced ? 0 : pulse * 0.35) : 0.5;
      }
      for (const [i, visual] of stock.entries()) {
        const item = state.stock[i];
        visual.model.position.set(item.x, item.broken ? -0.05 : 0, item.z);
        visual.model.rotation.z = item.broken ? Math.PI / 2 : 0;
        if (Math.hypot(item.vx, item.vz) > 0.3)
          visual.model.rotation.y = Math.atan2(item.vx, item.vz);
        visual.model.visible = !item.broken || item.cloud > 0;
        visual.sign.position.set(item.x, 1.55, item.z);
        visual.sign.visible =
          !item.broken &&
          Math.hypot(item.x - state.player.x, item.z - state.player.z) < 6;
        visual.ring.position.set(item.x, 0.06, item.z);
        visual.ring.visible = item.kind === "cart" || item.cloud > 0;
        visual.ring.material.opacity =
          item.cloud > 0 ? 0.35 + pulse * 0.25 : 0.45;
      }
      for (const [i, visual] of mines.entries()) {
        const mine = state.mines[i];
        visual.ring.visible =
          visual.core.visible =
          visual.sign.visible =
            !!mine && mine.life > 0;
        if (!mine) continue;
        visual.ring.position.set(mine.x, 0.07, mine.z);
        visual.ring.scale.setScalar(
          mine.blast > 0 ? 2.1 : mine.arm > 0 ? 0.7 : 1.8,
        );
        visual.core.position.set(mine.x, 0.075, mine.z);
        visual.sign.position.set(mine.x, 0.65, mine.z);
        visual.ring.material.opacity =
          mine.blast > 0 ? 0.75 + pulse * 0.25 : 0.5;
      }
      for (const [i, visual] of edible.entries()) {
        const enemy = state.enemies[i];
        visual.ring.visible = visual.sign.visible =
          state.overtime > 0 && enemy.respawn <= 0;
        visual.ring.position.set(enemy.x, 0.05, enemy.z);
        visual.ring.scale.setScalar(1 + pulse * 0.15);
        visual.sign.position.set(enemy.x, 1.7, enemy.z);
      }
      for (const [i, ring] of dashTrail.entries()) {
        ring.visible = state.player.dash > 0;
        ring.position.set(
          state.player.x -
            (state.player.dashX ?? Math.sin(state.player.angle)) * i * 0.35,
          0.05,
          state.player.z -
            (state.player.dashZ ?? Math.cos(state.player.angle)) * i * 0.35,
        );
        ring.material.opacity = 0.8 - i * 0.13;
        ring.scale.setScalar(1 - i * 0.12);
      }
    },
  };
}
