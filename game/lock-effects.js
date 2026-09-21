import * as THREE from "three";
import { keyType } from "./locks.js";

function keySprite(key) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#18283c";
  ctx.beginPath();
  ctx.roundRect(5, 5, 246, 182, 22);
  ctx.fill();
  ctx.strokeStyle = key.color;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = key.color;
  ctx.fillRect(76, 67, 141, 24);
  ctx.fillRect(163, 84, 21, 30);
  ctx.fillRect(199, 84, 18, 22);
  ctx.beginPath();
  ctx.arc(70, 79, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#18283c";
  ctx.font = "bold 33px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(key.symbol, 70, 90);
  ctx.fillStyle = "#f0f2f3";
  ctx.font = "bold 23px sans-serif";
  ctx.fillText(`${key.label} KEY`, 128, 157);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sprite.scale.set(1.8, 1.35, 1);
  return sprite;
}

// Doors reuse the verified freezer module; keys and lock markings are original 2D sprites.
export function lockEffects({
  world,
  game,
  cloneAsset,
  markEmissive,
  makeRing,
  label,
}) {
  const cards = game.keycards.map((card) => {
    const key = keyType(card.color),
      sprite = keySprite(key),
      ring = makeRing(0.65, key.enamel);
    sprite.position.set(card.x, 1.2, card.z);
    ring.position.set(card.x, 0.06, card.z);
    world.add(sprite, ring);
    return { card, sprite, ring };
  });
  const doors = game.doors.map((door) => {
    const key = keyType(door.color),
      model = cloneAsset("freezer");
    markEmissive(model);
    model.traverse((node) => {
      if (!node.isMesh) return;
      node.material.color.setHex(key.enamel);
      node.material.emissive.setHex(key.enamel);
      node.material.emissiveIntensity = 0.1;
    });
    model.scale.set(1.04, 1.65, 1.2);
    model.position.set(door.x, 0, door.z);
    model.rotation.y = door.axis === "x" ? Math.PI / 2 : 0;
    const closed = label(`${key.symbol} ${key.label} LOCK`, key.color, 3);
    const opened = label(`${key.symbol} ACCESS OPEN`, key.color, 2.6);
    const ring = makeRing(0.83, key.enamel);
    closed.position.set(door.x, 2.1, door.z);
    opened.position.copy(closed.position);
    ring.position.set(door.x, 0.06, door.z);
    world.add(model, closed, opened, ring);
    return { door, model, closed, opened, ring };
  });
  return {
    update(clock, reduced) {
      for (const { card, sprite, ring } of cards) {
        sprite.visible = ring.visible = !card.collected;
        sprite.position.y = 1.2 + (reduced ? 0 : Math.sin(clock * 3) * 0.1);
      }
      for (const { door, model, closed, opened, ring } of doors) {
        const t = door.open
          ? reduced
            ? 1
            : Math.min(1, (game.elapsed - door.openedAt) / 0.45)
          : 0;
        model.position.y = -2.3 * t * t * (3 - 2 * t);
        model.visible = t < 1;
        const near =
          Math.hypot(door.x - game.player.x, door.z - game.player.z) < 10;
        closed.visible = !door.open && near;
        opened.visible = door.open && near && game.elapsed - door.openedAt < 2;
        ring.material.opacity = door.open ? 0.25 : 0.8;
      }
    },
  };
}
