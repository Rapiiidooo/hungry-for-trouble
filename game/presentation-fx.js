import * as THREE from "three";

// Combat volumes use constructors; physical props reuse the selected recipe assets.
export function presentationEffects({
  world,
  game,
  cloneAsset,
  makeRing,
  label,
  markEmissive,
  ownedGeometry,
}) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xa8d9ff,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.04, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    material,
  );
  dome.userData.ownMaterial = true;
  ownedGeometry.push(dome.geometry);
  const rim = makeRing(1.04, 0xb4d9ff),
    orbit = makeRing(1.08, 0xf0f6ff, Math.PI * 0.6);
  world.add(dome, rim, orbit);
  let hitUntil = 0;
  const lobs = Array.from({ length: game.boss?.director ? 18 : 0 }, () => {
    const projectile = cloneAsset("battery");
    projectile.scale.setScalar(0.8);
    markEmissive(projectile, true);
    const target = makeRing(1, 0xff8d54),
      fuse = makeRing(1, 0xffd59d);
    const sign = label("! INCOMING", "#ffd59d", 1.9);
    world.add(projectile, target, fuse, sign);
    return { projectile, target, fuse, sign };
  });
  const waves = Array.from(
    { length: game.boss?.kind === "core" ? 3 : 0 },
    () => {
      const ring = makeRing(1, 0xffa85c, Math.PI * 2 - 1.1);
      const sign = label("SHOCKWAVE · DODGE!", "#ffd59d", 3.2);
      world.add(ring, sign);
      return { ring, sign };
    },
  );
  return {
    hit(clock) {
      hitUntil = clock + 0.5;
    },
    get shieldVisible() {
      return dome.visible;
    },
    update(state, clock, blend, reduced) {
      const p = state.player,
        impact = Math.max(0, (hitUntil - clock) / 0.5);
      dome.visible =
        rim.visible =
        orbit.visible =
          (p.shield > 0 || impact > 0) &&
          blend < 0.8 &&
          state.state === "playing";
      dome.position.set(p.x, 0.13, p.z);
      rim.position.set(p.x, 0.13, p.z);
      orbit.position.set(p.x, 0.22, p.z);
      dome.scale.setScalar(1 + impact * 0.17);
      dome.material.opacity = 0.12 + impact * 0.42;
      dome.material.color.setHex(impact > 0 ? 0xffffff : 0xa8d9ff);
      rim.material.opacity = 0.5 + impact * 0.5;
      orbit.rotation.z = reduced ? 0 : clock * 1.4;
      for (const [i, fx] of lobs.entries()) {
        const shot = state.lobs?.[i],
          flying = shot && shot.age < shot.duration;
        fx.projectile.visible = !!flying;
        fx.target.visible = fx.fuse.visible = !!shot;
        fx.sign.visible = !!flying;
        if (!shot) continue;
        const t = Math.min(1, shot.age / shot.duration);
        fx.projectile.position.set(
          THREE.MathUtils.lerp(shot.fromX, shot.x, t),
          (1 - t) * 2.5 + Math.sin(t * Math.PI) * 5 + 0.2,
          THREE.MathUtils.lerp(shot.fromZ, shot.z, t),
        );
        fx.projectile.rotation.set(t * 5, t * 9, t * 3);
        fx.target.position.set(shot.x, 0.09, shot.z);
        fx.target.scale.setScalar(shot.radius);
        fx.target.material.opacity = flying
          ? 0.85
          : Math.max(0, 1 - (shot.age - shot.duration) / 0.4);
        fx.fuse.position.set(shot.x, 0.095, shot.z);
        fx.fuse.scale.setScalar(
          shot.radius *
            (flying ? Math.max(0.04, t) : 1 + (shot.age - shot.duration) * 2),
        );
        fx.fuse.material.opacity = fx.target.material.opacity;
        fx.sign.position.set(shot.x, 0.7, shot.z);
      }
      for (const [i, fx] of waves.entries()) {
        const wave = state.waves?.[i];
        fx.ring.visible = fx.sign.visible = !!wave;
        if (!wave) continue;
        const warning = wave.age < wave.warning;
        fx.ring.position.set(wave.x, 0.15, wave.z);
        fx.ring.scale.setScalar(warning ? 1.3 : Math.max(0.1, wave.radius));
        fx.ring.rotation.z = wave.gapAngle - Math.PI / 2 + 0.55;
        fx.ring.material.opacity = warning
          ? 0.35 + (0.6 * wave.age) / wave.warning
          : Math.min(1, (18 - wave.radius) / 2);
        fx.sign.position.set(wave.x, 3.4, wave.z);
        fx.sign.visible = warning;
      }
    },
  };
}
