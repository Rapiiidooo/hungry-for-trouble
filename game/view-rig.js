import * as THREE from "three";

export class ViewRig {
  constructor(overhead, firstPerson) {
    this.overhead = overhead;
    this.firstPerson = firstPerson;
    this.bridge = new THREE.Camera();
    this.blend = 0;
    this.target = new THREE.Vector3();
    this.transit = new THREE.Camera();
    this.departure = new THREE.Camera();
    this.transitProgress = 1;
  }
  reset() {
    this.blend = 0;
    this.transitProgress = 1;
  }
  get camera() {
    return this.transitProgress < 1 ? this.transit : this.baseCamera;
  }
  get baseCamera() {
    return this.blend === 0
      ? this.overhead
      : this.blend === 1
        ? this.firstPerson
        : this.bridge;
  }
  beginTransit(reducedMotion = false) {
    const camera = this.camera;
    this.departure.position.copy(camera.position);
    this.departure.quaternion.copy(camera.quaternion);
    this.departure.projectionMatrix.copy(camera.projectionMatrix);
    this.transitProgress = 0;
    this.transitDuration = reducedMotion ? 0.18 : 0.72;
    this.updateTransit(0, reducedMotion);
  }
  updateTransit(dt, reducedMotion) {
    if (this.transitProgress >= 1) return;
    this.transitProgress = Math.min(
      1,
      this.transitProgress + dt / this.transitDuration,
    );
    const t =
      this.transitProgress *
      this.transitProgress *
      (3 - 2 * this.transitProgress);
    const from = this.departure,
      to = this.baseCamera,
      camera = this.transit;
    camera.position.lerpVectors(
      from.position,
      to.position,
      reducedMotion ? 1 : t,
    );
    camera.position.y += reducedMotion
      ? 0
      : Math.sin(t * Math.PI) * (1 - this.blend) * 4;
    camera.quaternion.slerpQuaternions(
      from.quaternion,
      to.quaternion,
      reducedMotion ? 1 : t,
    );
    for (let i = 0; i < 16; i++)
      camera.projectionMatrix.elements[i] = THREE.MathUtils.lerp(
        from.projectionMatrix.elements[i],
        to.projectionMatrix.elements[i],
        reducedMotion ? 1 : t,
      );
    const breath = reducedMotion ? 1 : 1 - Math.sin(t * Math.PI) * 0.12;
    camera.projectionMatrix.elements[0] *= breath;
    camera.projectionMatrix.elements[5] *= breath;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld();
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
    this.updateTransit(dt, reducedMotion);
  }
}
