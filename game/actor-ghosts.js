import * as THREE from "three";

// Actors draw after the static store and mark their visible pixels in the stencil.
// Flat silhouettes then fill only the parts that shelves hide from the perspective camera.
export function actorGhosts(world) {
  const entries = [],
    materials = [];
  return {
    add(model, color, opacity = 0.5) {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthTest: false,
        depthWrite: false,
        stencilWrite: true,
        stencilWriteMask: 0,
        stencilRef: 1,
        stencilFunc: THREE.NotEqualStencilFunc,
      });
      materials.push(material);
      const meshes = [];
      model.traverse((node) => {
        if (node.isMesh) meshes.push(node);
      });
      for (const node of meshes) {
        node.renderOrder = 1;
        for (const source of [node.material].flat())
          Object.assign(source, {
            stencilWrite: true,
            stencilRef: 1,
            stencilFunc: THREE.AlwaysStencilFunc,
            stencilZPass: THREE.ReplaceStencilOp,
          });
        const ghost = new THREE.Mesh(node.geometry, material);
        ghost.matrixAutoUpdate = false;
        ghost.matrixWorldAutoUpdate = false;
        ghost.frustumCulled = false;
        ghost.renderOrder = 10;
        // Copy the animated pose at draw time, after the scene updates its matrices.
        ghost.onBeforeRender = () => ghost.matrixWorld.copy(node.matrixWorld);
        world.add(ghost);
        entries.push({ model, node, ghost });
      }
    },
    get visibleCount() {
      return entries.filter(({ ghost }) => ghost.visible).length;
    },
    update(enabled) {
      for (const { model, node, ghost } of entries)
        ghost.visible = enabled && model.visible && node.visible;
    },
    dispose() {
      for (const material of materials) material.dispose();
    },
  };
}
