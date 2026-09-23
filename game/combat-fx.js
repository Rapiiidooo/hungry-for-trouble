import * as THREE from "three";

// Receipt sprites and warning lines are combat effects, not imported mesh assets.
export function receiptEffects(parent, ownGeometry) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const c = canvas.getContext("2d");
  c.fillStyle = "#ed604e";
  c.fillRect(1, 1, 62, 126);
  c.fillStyle = "#ffffff";
  c.fillRect(7, 7, 50, 110);
  c.fillStyle = "#263650";
  for (let y = 21; y < 104; y += 14) c.fillRect(15, y, y % 3 ? 34 : 20, 5);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(1, 1);
  ownGeometry.push(geometry);
  const make = (material) => {
    const mesh = new THREE.InstancedMesh(geometry, material, 128);
    mesh.userData.ownMaterial = true;
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    parent.add(mesh);
    return mesh;
  };
  const head = make(
    new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  head.userData.ownTexture = texture;
  const trail = make(
    new THREE.MeshBasicMaterial({
      color: 0xff6046,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  const warningGeometry = new THREE.BufferGeometry();
  warningGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(6 * 16), 3),
  );
  warningGeometry.setDrawRange(0, 0);
  ownGeometry.push(warningGeometry);
  const warning = new THREE.LineSegments(
    warningGeometry,
    new THREE.LineBasicMaterial({
      color: 0xff6046,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  warning.userData.ownMaterial = true;
  warning.frustumCulled = false;
  parent.add(warning);
  const t = new THREE.Object3D(),
    direction = new THREE.Vector3(),
    side = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    basis = new THREE.Matrix4();
  return {
    update(game, camera, canStand) {
      head.count = trail.count = Math.min(game.hazards.length, 128);
      for (let i = 0; i < head.count; i++) {
        const shot = game.hazards[i];
        // At eye level a receipt brushing the lens would fill the screen; damage cues cover it.
        const grazing =
          camera.position.y < 2 &&
          Math.hypot(shot.x - camera.position.x, shot.z - camera.position.z) <
            1.1;
        t.position.set(shot.x, 0.78, shot.z);
        t.quaternion.copy(camera.quaternion);
        t.rotateZ(Math.sin((shot.age || 0) * 20 + i) * 0.25);
        t.scale.set(grazing ? 0 : 0.24, grazing ? 0 : 0.43, 1);
        t.updateMatrix();
        head.setMatrixAt(i, t.matrix);
        direction.set(shot.vx, 0, shot.vz).normalize();
        normal.copy(camera.position).sub(t.position).normalize();
        side.crossVectors(direction, normal).normalize();
        normal.crossVectors(side, direction).normalize();
        basis.makeBasis(side, direction, normal);
        t.quaternion.setFromRotationMatrix(basis);
        t.position.addScaledVector(direction, -0.36);
        t.scale.set(grazing ? 0 : 0.09, grazing ? 0 : 0.75, 1);
        t.updateMatrix();
        trail.setMatrixAt(i, t.matrix);
      }
      head.instanceMatrix.needsUpdate = trail.instanceMatrix.needsUpdate = true;
      let n = 0;
      for (const e of game.enemies)
        if (e.tell > 0 && e.respawn <= 0 && n < 16) {
          const dx = Math.sin(e.shotAngle),
            dz = Math.cos(e.shotAngle);
          const range = e.kind === "sniper" ? 20 : 14;
          let reach = 0.25;
          while (
            reach < range &&
            canStand(game, e.x + dx * reach, e.z + dz * reach, 0.15)
          )
            reach += 0.25;
          warningGeometry.attributes.position.setXYZ(n * 2, e.x, 0.78, e.z);
          warningGeometry.attributes.position.setXYZ(
            n * 2 + 1,
            e.x + dx * reach,
            0.78,
            e.z + dz * reach,
          );
          n++;
        }
      warningGeometry.setDrawRange(0, n * 2);
      warningGeometry.attributes.position.needsUpdate = true;
    },
  };
}
