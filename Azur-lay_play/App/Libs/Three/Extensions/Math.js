import * as THREE from "three";

const __extension_temp_vector_3d = new THREE.Vector3();
const __extension_temp_matrix = new THREE.Matrix4();

Object.assign(THREE.BufferGeometry.prototype, {
  getAttribute: function getAttribute(name) {
    return this.attributes[name];
  },
  setAttribute: function setAttribute(name, attribute) {
    this.attributes[name] = attribute;
    return this;
  },
  deleteAttribute: function deleteAttribute(name) {
    delete this.attributes[name];
    return this;
  },
  hasAttribute: function hasAttribute(name) {
    return this.attributes[name] !== undefined;
  },
});

Object.assign(THREE.Vector3.prototype, {
  normalizeLength() {
    const length = this.length();
    if (length > 0) this.divideScalar(length);
    return length;
  },
  damp(target, lambda, dx) {
    this.x = THREE.MathUtils.damp(this.x, target.x, lambda, dx);
    this.y = THREE.MathUtils.damp(this.y, target.y, lambda, dx);
    this.z = THREE.MathUtils.damp(this.z, target.z, lambda, dx);
  },
  distanceToXZ(vector) {
    return Math.sqrt(
      Math.pow(this.x - vector.x, 2) + Math.pow(this.z - vector.z, 2),
    );
  },
  distanceToXY(vector) {
    return Math.sqrt(
      Math.pow(this.x - vector.x, 2) + Math.pow(this.y - vector.y, 2),
    );
  },
  distanceToYZ(vector) {
    return Math.sqrt(
      Math.pow(this.y - vector.y, 2) + Math.pow(this.z - vector.z, 2),
    );
  },
  distanceToXZ2f(x, z) {
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.z - z, 2));
  },
  distanceToXY2f(x, y) {
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
  },
  distanceToYZ2f(y, z) {
    return Math.sqrt(Math.pow(this.y - y, 2) + Math.pow(this.z - z, 2));
  },
  multiply3f(x, y, z) {
    this.x *= x;
    this.y *= y;
    this.z *= z;
    return this;
  },
  divide3f(x, y, z) {
    this.x /= x;
    this.y /= y;
    this.z /= z;
    return this;
  },
  add3f(x, y, z) {
    this.x += x;
    this.y += y;
    this.z += z;
    return this;
  },
  subtract3f(x, y, z) {
    this.x -= x;
    this.y -= y;
    this.z -= z;
    return this;
  },
});

Object.assign(THREE.Vector2.prototype, {
  multiply2f(x, y) {
    this.x *= x;
    this.y *= y;
    return this;
  },
  divide2f(x, y) {
    this.x /= x;
    this.y /= y;
    return this;
  },
  add2f(x, y) {
    this.x += x;
    this.y += y;
    return this;
  },
  subtract2f(x, y) {
    this.x -= x;
    this.y -= y;
    return this;
  },
});

Object.assign(THREE.MathUtils, {
  convertEventToZeroOneSpace(value) {
    const totalScreenWidth = App.Width / App.PixelRatio;
    const totalScreenHeight = App.Height / App.PixelRatio;

    const spaceZeroToOne = new THREE.Vector2(
      value.x / totalScreenWidth,
      value.y / totalScreenHeight,
    );

    return spaceZeroToOne;
  },
  convertEventToCameraSpace(value) {
    const spaceZeroToOne = THREE.MathUtils.convertEventToZeroOneSpace(value);
    spaceZeroToOne.y = 1 - spaceZeroToOne.y;

    const spaceMinusOneToOne = spaceZeroToOne
      .clone()
      .multiplyScalar(2)
      .subScalar(1);

    return spaceMinusOneToOne;
  },
});

Object.defineProperty(THREE.Vector3, "up", {
  value: new THREE.Vector3(0, 1, 0),
  writable: false,
});

Object.defineProperty(THREE.Vector3, "forward", {
  value: new THREE.Vector3(0, 0, 1),
  writable: false,
});

Object.defineProperty(THREE.Vector3, "right", {
  value: new THREE.Vector3(1, 0, 0),
  writable: false,
});

Object.assign(THREE.Quaternion.prototype, {
  setFromView: function (viewDirection, up = THREE.Vector3.up) {
    __extension_temp_vector_3d.set(0, 0, 0);
    __extension_temp_matrix.lookAt(
      __extension_temp_vector_3d,
      viewDirection,
      up,
    );
    return this.setFromRotationMatrix(__extension_temp_matrix);
  },
});

THREE.Box3.prototype.getCorners = function () {
  return [
    new THREE.Vector3(this.min.x, this.min.y, this.min.z),
    new THREE.Vector3(this.min.x, this.min.y, this.max.z),
    new THREE.Vector3(this.min.x, this.max.y, this.min.z),
    new THREE.Vector3(this.min.x, this.max.y, this.max.z),
    new THREE.Vector3(this.max.x, this.min.y, this.min.z),
    new THREE.Vector3(this.max.x, this.min.y, this.max.z),
    new THREE.Vector3(this.max.x, this.max.y, this.min.z),
    new THREE.Vector3(this.max.x, this.max.y, this.max.z),
  ];
};
