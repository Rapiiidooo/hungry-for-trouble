import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
registerHooks({
  resolve(specifier, context, next) {
    return next(
      specifier === "three"
        ? new URL("../game/vendor/three.module.js", import.meta.url).href
        : specifier,
      context,
    );
  },
});
const THREE = await import("three");
const { presentationEffects } = await import("../game/presentation-fx.js");
const { newGame } = await import("../game/sim.js");

test("the rendered shockwave gap matches the safe sector for every attack direction", () => {
  const game = newGame(19),
    world = new THREE.Group(),
    ownedGeometry = [];
  const fx = presentationEffects({
    world,
    game,
    ownedGeometry,
    cloneAsset: () => new THREE.Group(),
    label: () => new THREE.Group(),
    markEmissive() {},
    makeRing(radius, color, arc = Math.PI * 2) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius + 0.055, 40, 1, 0, arc),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      return ring;
    },
  });
  const ring = world.children.find(
    (node) =>
      node.geometry?.parameters.thetaLength > 5 &&
      node.geometry.parameters.thetaLength < 6,
  );
  assert.ok(ring);
  for (const angle of [0, 0.8, Math.PI / 2, Math.PI, -1.2]) {
    game.waves = [
      { x: 0, z: 0, age: 2.1, warning: 1.1, radius: 5, gapAngle: angle },
    ];
    fx.update(game, 2.1, 0, true);
    world.updateMatrixWorld(true);
    for (const [offset, blocked] of [
      [0, false],
      [0.35, false],
      [-0.35, false],
      [0.8, true],
      [-0.8, true],
      [Math.PI, true],
    ]) {
      const direction = angle + offset;
      const ray = new THREE.Raycaster(
        new THREE.Vector3(
          Math.sin(direction) * 5.1,
          10,
          Math.cos(direction) * 5.1,
        ),
        new THREE.Vector3(0, -1, 0),
      );
      assert.equal(
        ray.intersectObject(ring).length > 0,
        blocked,
        `Safe sector mismatch for angle ${angle}, offset ${offset}`,
      );
    }
  }
  world.traverse((node) => {
    node.geometry?.dispose();
    node.material?.dispose();
  });
});
