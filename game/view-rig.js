import * as THREE from "three";

export class ViewRig {
  constructor(overhead, firstPerson) {
    this.overhead = overhead;
    this.firstPerson = firstPerson;
    this.bridge = new THREE.Camera();
    this.blend = 0;
    this.target = new THREE.Vector3();
  }
  reset() {
    this.blend = 0;
  }
  get camera() {
    return this.blend === 0
      ? this.overhead
      : this.blend === 1
        ? this.firstPerson
        : this.bridge;
  }
  update(dt, enter, reducedMotion = false) {
    this.blend = reducedMotion
      ? Number(enter)
      : THREE.MathUtils.clamp(
          this.blend + ((enter ? 1 : -1) * dt) / 0.85,
          0,
          1,
        );
    const t = this.blend * this.blend * (3 - 2 * this.blend);
    const { overhead: a, firstPerson: b, bridge: c } = this;
    c.position.lerpVectors(a.position, b.position, t);
    // Centre over the vacuum before descending past the shelves.
    const centre = Math.min(1, t * 1.8);
    c.position.x = THREE.MathUtils.lerp(a.position.x, b.position.x, centre);
    c.position.z = THREE.MathUtils.lerp(a.position.z, b.position.z, centre);
    c.quaternion.slerpQuaternions(a.quaternion, b.quaternion, t);
    const distance = Math.max(1, a.position.distanceTo(b.position));
    // Homogeneous normalisation joins orthographic and perspective without a lens cut.
    const normalization = THREE.MathUtils.lerp(distance, 1, t);
    for (let i = 0; i < 16; i++)
      c.projectionMatrix.elements[i] =
        (1 - t) * a.projectionMatrix.elements[i] +
        (t * b.projectionMatrix.elements[i]) / normalization;
    c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
    c.updateMatrixWorld();
  }
}
