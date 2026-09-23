import * as THREE from "three";
import { keyType } from "./locks.js";

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// A bold key token: coloured key silhouette, white enamel outline, symbol in the bow.
function keyArt(key) {
  return canvasTexture(256, 256, (ctx) => {
    const shape = () => {
      ctx.beginPath();
      ctx.arc(86, 128, 56, 0, Math.PI * 2);
      ctx.rect(128, 112, 108, 32);
      ctx.rect(186, 136, 22, 34);
      ctx.rect(218, 136, 18, 26);
    };
    ctx.lineJoin = "round";
    shape();
    ctx.lineWidth = 16;
    ctx.strokeStyle = "#f0f2f3";
    ctx.stroke();
    shape();
    ctx.fillStyle = key.color;
    ctx.fill();
    ctx.fillStyle = "#18283c";
    ctx.font = "900 62px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(key.symbol, 86, 150);
  });
}

// Lock plate for the door faces and roof: the key's symbol on dark enamel.
function lockArt(key) {
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#18283c";
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 240, 34);
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = key.color;
    ctx.stroke();
    ctx.fillStyle = key.color;
    ctx.font = "900 128px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(key.symbol, 128, 160);
    ctx.fillStyle = "#f0f2f3";
    ctx.font = "800 30px sans-serif";
    ctx.fillText(`${key.label} LOCK`, 128, 222);
  });
}

// Doors reuse the verified freezer module. Keys, plates and light beams are original
// canvas art and constructor effect geometry, like the other rings and warning volumes.
export function lockEffects({
  world,
  game,
  cloneAsset,
  markEmissive,
  makeRing,
  label,
  ownedGeometry,
}) {
  const beamTexture = canvasTexture(4, 128, (ctx) => {
    const fade = ctx.createLinearGradient(0, 0, 0, 128);
    fade.addColorStop(0, "rgba(255,255,255,0)");
    fade.addColorStop(1, "rgba(255,255,255,0.85)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 4, 128);
  });
  const beamGeometry = new THREE.CylinderGeometry(0.34, 0.56, 4.6, 20, 1, true),
    plateGeometry = new THREE.PlaneGeometry(1, 1),
    discGeometry = new THREE.CircleGeometry(0.9, 32);
  ownedGeometry.push(beamGeometry, plateGeometry, discGeometry);
  const owned = (mesh, texture) => {
    mesh.userData.ownMaterial = true;
    if (texture) mesh.userData.ownTexture = texture;
    return mesh;
  };
  // Each beam gets its own material so its pulse and fade stay independent.
  const beam = (key) => {
    const mesh = owned(
      new THREE.Mesh(
        beamGeometry,
        new THREE.MeshBasicMaterial({
          color: key.enamel,
          map: beamTexture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      ),
    );
    mesh.userData.ownTexture = beamTexture;
    return mesh;
  };
  const cards = game.keycards.map((card) => {
    const key = keyType(card.color),
      art = keyArt(key);
    const token = owned(
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: art,
          depthWrite: false,
          toneMapped: false,
        }),
      ),
    );
    token.userData.ownTexture = art;
    token.scale.set(1.5, 1.5, 1);
    const ring = makeRing(0.9, key.enamel),
      disc = owned(
        new THREE.Mesh(
          discGeometry,
          new THREE.MeshBasicMaterial({
            color: key.enamel,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            toneMapped: false,
          }),
        ),
      ),
      light = beam(key);
    disc.rotation.x = -Math.PI / 2;
    token.position.set(card.x, 1.25, card.z);
    ring.position.set(card.x, 0.06, card.z);
    disc.position.set(card.x, 0.04, card.z);
    light.position.set(card.x, 2.3, card.z);
    world.add(token, ring, disc, light);
    return { card, token, ring, disc, light };
  });
  const doors = game.doors.map((door) => {
    const key = keyType(door.color),
      model = cloneAsset("freezer"),
      art = lockArt(key);
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
    const plate = new THREE.MeshBasicMaterial({ map: art, toneMapped: false });
    const plates = [0, Math.PI, "roof"].map((turn) => {
      const mesh = new THREE.Mesh(plateGeometry, plate);
      if (turn === "roof") {
        mesh.rotation.x = -Math.PI / 2;
        mesh.scale.setScalar(1.25);
      } else {
        mesh.rotation.y = model.rotation.y + turn;
        mesh.scale.setScalar(0.95);
      }
      world.add(mesh);
      return { mesh, turn };
    });
    plates[0].mesh.userData.ownMaterial = true;
    plates[0].mesh.userData.ownTexture = art;
    const closed = label(`${key.symbol} ${key.label} LOCK`, key.color, 3);
    const opened = label(`${key.symbol} ACCESS OPEN`, key.color, 2.6);
    const ring = makeRing(0.83, key.enamel),
      light = beam(key);
    closed.position.set(door.x, 2.45, door.z);
    opened.position.copy(closed.position);
    ring.position.set(door.x, 0.06, door.z);
    light.position.set(door.x, 2.3, door.z);
    world.add(model, closed, opened, ring, light);
    return { door, key, model, plates, closed, opened, ring, light };
  });
  const faceOffset = 0.98,
    roofHeight = 1.84;
  return {
    update(clock, reduced) {
      const pulse = reduced ? 0.5 : (Math.sin(clock * 4) + 1) / 2;
      for (const { card, token, ring, disc, light } of cards) {
        token.visible =
          ring.visible =
          disc.visible =
          light.visible =
            !card.collected;
        if (card.collected) continue;
        token.position.y = 1.25 + (reduced ? 0 : Math.sin(clock * 3) * 0.12);
        // A slow coin turn makes the token read as a physical key, not a label.
        token.scale.x =
          1.5 * (reduced ? 1 : Math.max(0.2, Math.abs(Math.cos(clock * 2.2))));
        ring.scale.setScalar(1 + pulse * 0.12);
        light.material.opacity = 0.55 + pulse * 0.35;
      }
      for (const {
        door,
        model,
        plates,
        closed,
        opened,
        ring,
        light,
      } of doors) {
        const t = door.open
          ? reduced
            ? 1
            : Math.min(1, (game.elapsed - door.openedAt) / 0.45)
          : 0;
        const sink = -2.3 * t * t * (3 - 2 * t);
        model.position.y = sink;
        model.visible = t < 1;
        // Holding the matching key lights its door, linking key and passage.
        const ready = !door.open && game.keyring.includes(door.color);
        model.traverse((node) => {
          if (node.isMesh)
            node.material.emissiveIntensity = ready ? 0.25 + pulse * 0.35 : 0.1;
        });
        for (const { mesh, turn } of plates) {
          mesh.visible = t < 1;
          if (turn === "roof")
            mesh.position.set(door.x, roofHeight + sink, door.z);
          else {
            const side = turn === 0 ? 1 : -1,
              alongX = door.axis === "x";
            mesh.position.set(
              door.x + (alongX ? side * faceOffset : 0),
              1 + sink,
              door.z + (alongX ? 0 : side * faceOffset),
            );
          }
        }
        light.visible = ready;
        light.material.opacity = 0.7 + pulse * 0.3;
        light.scale.set(1.5, 1, 1.5);
        const near =
          Math.hypot(door.x - game.player.x, door.z - game.player.z) < 10;
        closed.visible = !door.open && near;
        opened.visible = door.open && near && game.elapsed - door.openedAt < 2;
        ring.material.opacity = door.open
          ? 0.25
          : ready
            ? 0.6 + pulse * 0.4
            : 0.8;
      }
    },
  };
}
