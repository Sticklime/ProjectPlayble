import * as THREE from "three";

Object.assign(THREE.AnimationAction.prototype, {
  setRandomFrame: function () {
    const duration = this.getClip().duration;
    this.time = Math.randomFloat(0, duration);
  },
});

Object.assign(THREE.AnimationMixer.prototype, {
  waitActionFinish: async function () {
    await safePromise((resolve, reject) => {
      const listener = () => {
        this.removeEventListener("finished", listener);
        resolve();
      };
      this.addEventListener("finished", listener);
    });
  },
});

THREE.SkinnedMesh.prototype.calculateBoneLocalAABB = function (
  name,
  minWeight = 0.5,
) {
  const bone = this.skeleton.bones.find((b) => b.name === name);
  if (!bone) return null;

  bone.updateMatrixWorld(true);
  bone.updateWorldMatrix(true, true);

  const matrix = bone.matrixWorld.invert();

  const points = [];
  const vertex = new THREE.Vector3();

  for (let i = 0; i < this.geometry.attributes.position.count; i++) {
    for (let j = 0; j < 4; j++) {
      const boneIndex = this.geometry.attributes.skinIndex.getComponent(i, j);
      const weight = this.geometry.attributes.skinWeight.getComponent(i, j);

      if (this.skeleton.bones[boneIndex] === bone && weight >= minWeight) {
        vertex
          .fromBufferAttribute(this.geometry.attributes.position, i)
          .applyMatrix4(matrix);

        points.push(vertex.clone());
        break;
      }
    }
  }

  if (points.length === 0) return null;

  const aabb = new THREE.Box3().setFromPoints(points);
  return {
    center: aabb.getCenter(new THREE.Vector3()),
    size: aabb.getSize(new THREE.Vector3()),
    bone,
  };
};
