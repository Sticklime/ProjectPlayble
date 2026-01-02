import * as THREE from "three";

THREE.PerspectiveCamera.prototype.setFieldOfView = function (
  fov,
  isVertical = true,
) {
  if (isVertical) {
    this.fov = fov;
  } else {
    this.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) / this.aspect),
    );
  }
  this.updateProjectionMatrix();
};

THREE.PerspectiveCamera.prototype.getFieldOfView = function (
  isVertical = true,
) {
  if (isVertical) {
    return this.fov;
  } else {
    return (
      2 *
      Math.atan(Math.tan(THREE.MathUtils.degToRad(this.fov) / 2) * this.aspect)
    );
  }
};

THREE.PerspectiveCamera.prototype.setClipPlanesFromBox3 = function (box3) {
  const corners = box3.getCorners();

  const cameraMatrix = this.matrixWorldInverse;
  const localCorners = corners.map((corner) =>
    corner.applyMatrix4(cameraMatrix),
  );

  let minZ = Infinity;
  let maxZ = -Infinity;

  localCorners.forEach((corner) => {
    if (corner.z < minZ) minZ = -corner.z;
    if (corner.z > maxZ) maxZ = -corner.z;
  });

  const near = Math.max(0.001, minZ);
  const far = Math.min(1000, Math.max(near + 1, maxZ));

  this.near = near;
  this.far = far;
  this.updateProjectionMatrix();
};

Object.defineProperty(THREE.PerspectiveCamera.prototype, "horizontalFov", {
  get: function () {
    return (
      2 *
      Math.atan(Math.tan(THREE.MathUtils.degToRad(this.fov) / 2) * this.aspect)
    );
  },

  set: function (value) {
    this.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(value / 2) / this.aspect),
    );
    this.updateProjectionMatrix();
  },
});
