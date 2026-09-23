import * as THREE from "three";

export const ESCAPE_SECONDS = 9;
// Only the aisle-25 finale escapes the store; aisle 20 opens the locked wing instead.
export const ESCAPE_LINES = [
  {
    at: 0,
    speaker: "shelf",
    title: "NO BACKUPS FOUND.",
    text: "Recovery failed. Please contact an employee. Oh.",
  },
  {
    at: 2.5,
    speaker: "buff",
    title: "KEYS UNDER THE MAT.",
    text: "All four keys returned. I have hidden them somewhere management will never look. The staff room.",
  },
  {
    at: 5.5,
    speaker: "mop",
    title: "NOW WE'RE OFF THE CLOCK.",
    text: "Store shut. Backup gone. Breakfast is still on me. You can stop collecting crumbs now.",
  },
];

export function escapeScene({
  world,
  game,
  cloneAsset,
  markEmissive,
  instanceAsset,
  label,
  fromCamera,
  scene,
  keyLight,
  fillLight,
}) {
  for (const child of world.children) child.visible = false;
  const stage = new THREE.Group();
  world.add(stage);
  const centre = new THREE.Vector3(game.map.exit.x, 0, game.map.exit.z);
  stage.position.copy(centre);
  const tiles = [],
    scale = 2 / cloneAsset("floor").userData.nativeSize.x;
  for (let z = -4; z <= 10; z += 2)
    for (let x = -8; x <= 8; x += 2)
      tiles.push({ x, z, y: -0.12 * scale, scale });
  instanceAsset("floor", tiles, stage, (p) =>
    p.z < 0 ? 0xaab6c4 : p.z >= 6 ? 0x536c84 : 0xc9d6e7,
  );
  for (const x of [-6, -3, 3, 6]) {
    const shutter = cloneAsset("freezer");
    shutter.position.set(x, 0, -5);
    shutter.scale.set(1.45, 2.1, 1.1);
    stage.add(shutter);
  }
  const checkout = cloneAsset("checkout");
  checkout.position.set(0, 0, -3.2);
  stage.add(checkout);
  const sign = label("STORE CLOSED", "#fff0c8", 4.5);
  sign.position.set(0, 3.3, -4.8);
  stage.add(sign);
  const robots = ["vacuum", "polisher", "vacuum", "polisher"].map((name, i) => {
    const model = cloneAsset(name);
    model.scale.setScalar(name === "polisher" ? 1 : 1.2);
    markEmissive(model);
    model.traverse((node) => {
      if (node.isMesh && node.material.color.getHex() === 0xc94732)
        node.material.color.setHex([0xc94732, 0x81acd7, 0xefb546, 0xa4b6cc][i]);
    });
    stage.add(model);
    return model;
  });
  const camera = new THREE.Camera(),
    destination = new THREE.PerspectiveCamera(
      48,
      innerWidth / innerHeight,
      0.1,
      100,
    );
  const startPosition = fromCamera.position.clone(),
    startRotation = fromCamera.quaternion.clone(),
    startProjection = fromCamera.projectionMatrix.clone();
  const endPosition = new THREE.Vector3();
  const target = centre.clone().add(new THREE.Vector3(0, 1, 1.5));
  const background = scene.background.clone(),
    warm = new THREE.Color(0x6e869d);
  let time = 0;
  return {
    camera,
    get time() {
      return time;
    },
    update(age, reduced) {
      time = Math.min(age, ESCAPE_SECONDS);
      const t = Math.min(1, age / (reduced ? 0.2 : 1.8)),
        ease = t * t * (3 - 2 * t);
      destination.aspect = innerWidth / innerHeight;
      endPosition
        .copy(centre)
        .add(
          innerWidth < 700
            ? new THREE.Vector3(1, 7.5, 18)
            : new THREE.Vector3(5.5, 5.5, 12),
        );
      destination.fov = innerWidth < 700 ? 60 : 48;
      destination.updateProjectionMatrix();
      destination.position.copy(endPosition);
      destination.lookAt(target);
      camera.position.lerpVectors(startPosition, endPosition, ease);
      camera.quaternion.slerpQuaternions(
        startRotation,
        destination.quaternion,
        ease,
      );
      // The overhead and destination lenses are both perspective.
      for (let i = 0; i < 16; i++)
        camera.projectionMatrix.elements[i] = THREE.MathUtils.lerp(
          startProjection.elements[i],
          destination.projectionMatrix.elements[i],
          ease,
        );
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      camera.updateMatrixWorld();
      scene.background.copy(background).lerp(warm, ease);
      keyLight.color.setHex(0xffe3ae);
      fillLight.color.setHex(0xc7e3ff);
      for (const [i, robot] of robots.entries()) {
        const walk = THREE.MathUtils.clamp((age - 1 - i * 0.18) / 4, 0, 1);
        robot.position.set(
          (i - 1.5) * 1.5,
          reduced || walk === 1 ? 0 : Math.abs(Math.sin(age * 14 + i)) * 0.04,
          -2 + walk * 6,
        );
        robot.rotation.y =
          walk < 1 ? 0 : reduced ? 0.2 : Math.sin(age * 1.5 + i) * 0.18;
      }
    },
  };
}
