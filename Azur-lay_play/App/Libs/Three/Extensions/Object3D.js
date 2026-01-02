import * as THREE from "three";

const __extension_temp_box = new THREE.Box3();
const __extension_temp_vector_3d = new THREE.Vector3();

THREE.Object3D.prototype._opacity = 1;

/**
 * Defines the opacity property on THREE.Object3D prototype.
 */
Object.defineProperty(THREE.Object3D.prototype, "opacity", {
  /**
   * Gets the opacity of the object.
   * @returns {number} The current opacity.
   */
  get: function () {
    return this._opacity;
  },

  /**
   * Sets the opacity of the object and updates materials accordingly.
   * @param {number} newValue - The new opacity value.
   */
  set: function (newValue) {
    this._opacity = newValue;

    /**
     * Applies the given opacity to a material.
     * @param {THREE.Material} material - The material to apply opacity to.
     * @param {number} opacity - The opacity value to set.
     */
    const applyOpacity = (material, opacity) => {
      if (material.isShaderMaterial) {
        if (material.uniforms.opacity) {
          material.uniforms.opacity.value = opacity;
        }
      } else if (material.blending !== THREE.MultiplyBlending) {
        material.opacity = opacity;
      }
    };

    /**
     * Calculates the cumulative opacity of a material based on object hierarchy.
     * @param {THREE.Object3D} child - The child object to calculate opacity for.
     * @returns {number} The calculated opacity.
     */
    const calculateMaterialOpacity = (child) => {
      let resultOpacity = 1;
      let currentChild = child;

      while (
        currentChild !== null &&
        currentChild !== undefined &&
        currentChild._opacity !== null &&
        currentChild._opacity !== undefined
      ) {
        resultOpacity *= currentChild._opacity;
        currentChild = currentChild.parent;
      }

      return resultOpacity;
    };

    this.traverse((child) => {
      if (!child.material) return;

      if (Array.isArray(child.material)) {
        for (const currentMaterial of child.material) {
          applyOpacity(currentMaterial, calculateMaterialOpacity(child));
        }
      } else {
        applyOpacity(child.material, calculateMaterialOpacity(child));
      }
    });
  },
});

Object.defineProperty(THREE.Object3D.prototype, "isStatic", {
  /**
   * Gets the isStatic state of the object.
   * @returns {boolean} The current isStatic state.
   */
  get: function () {
    return !this.matrixAutoUpdate;
  },

  /**
   * Sets the isStatic state of the object and updates matrices accordingly.
   * @param {boolean} value - The new isStatic value.
   */
  set: function (value) {
    this.matrixAutoUpdate = !value;
    this.updateMatrix();

    this.traverse((child) => {
      child.matrixAutoUpdate = !value;
      child.updateMatrix();
    });
  },
});

Object.defineProperty(THREE.Object3D.prototype, "x", {
  get: function () {
    return this.position.x;
  },
  set: function (val) {
    this.position.x = val;
  },
});
Object.defineProperty(THREE.Object3D.prototype, "y", {
  get: function () {
    return this.position.y;
  },
  set: function (val) {
    this.position.y = val;
  },
});
Object.defineProperty(THREE.Object3D.prototype, "z", {
  get: function () {
    return this.position.z;
  },
  set: function (val) {
    this.position.z = val;
  },
});

Object.defineProperty(THREE.Object3D.prototype, "rotationX", {
  get: function () {
    return this.rotation.x;
  },
  set: function (val) {
    this.rotation.x = val;
  },
});

Object.defineProperty(THREE.Object3D.prototype, "rotationY", {
  get: function () {
    return this.rotation.y;
  },
  set: function (val) {
    this.rotation.y = val;
  },
});

Object.defineProperty(THREE.Object3D.prototype, "rotationZ", {
  get: function () {
    return this.rotation.z;
  },
  set: function (val) {
    this.rotation.z = val;
  },
});

Object.defineProperty(THREE.Object3D.prototype, "scaleX", {
  get: function () {
    return this.scale.x;
  },
  set: function (val) {
    this.scale.x = val;
  },
});

Object.defineProperty(THREE.Object3D.prototype, "scaleY", {
  get: function () {
    return this.scale.y;
  },
  set: function (val) {
    this.scale.y = val;
  },
});

Object.defineProperty(THREE.Object3D.prototype, "scaleZ", {
  get: function () {
    return this.scale.z;
  },
  set: function (val) {
    this.scale.z = val;
  },
});

Object.defineProperty(THREE.Object3D.prototype, "scaleXY", {
  get: function () {
    return this.scale.x;
  },
  set: function (val) {
    this.scale.x = this.scale.y = val;
  },
});

Object.defineProperty(THREE.Object3D.prototype, "scaleXYZ", {
  get: function () {
    return this.scale.x;
  },
  set: function (val) {
    this.scale.x = this.scale.y = this.scale.z = val;
  },
});

// Object.defineProperty(THREE.Object3D.prototype, "bounds", {
//   get: function () {
//     const scope = this;
//     __extension_temp_box.setFromObject(scope);

//     return {
//       get box() {
//         return __extension_temp_box.clone();
//       },

//       get center() {
//         return __extension_temp_box
//           .getCenter(__extension_temp_vector_3d)
//           .clone();
//       },

//       get size() {
//         return __extension_temp_box.getSize(__extension_temp_vector_3d).clone();
//       },

//       get width() {
//         return __extension_temp_box.max.x - __extension_temp_box.min.x;
//       },
//       set width(value) {
//         const currentWidth =
//           __extension_temp_box.max.x - __extension_temp_box.min.x;
//         if (currentWidth !== 0) {
//           const scaleFactor = value / currentWidth;
//           scope.scale.multiplyScalar(scaleFactor);
//         }
//       },

//       get height() {
//         return __extension_temp_box.max.y - __extension_temp_box.min.y;
//       },
//       set height(value) {
//         const currentHeight =
//           __extension_temp_box.max.y - __extension_temp_box.min.y;
//         if (currentHeight !== 0) {
//           const scaleFactor = value / currentHeight;
//           scope.scale.multiplyScalar(scaleFactor);
//         }
//       },

//       get depth() {
//         return __extension_temp_box.max.z - __extension_temp_box.min.z;
//       },
//       set depth(value) {
//         const currentDepth =
//           __extension_temp_box.max.z - __extension_temp_box.min.z;
//         if (currentDepth !== 0) {
//           const scaleFactor = value / currentDepth;
//           scope.scale.multiplyScalar(scaleFactor);
//         }
//       },

//       get localWidth() {
//         const worldWidth =
//           __extension_temp_box.max.x - __extension_temp_box.min.x;
//         if (!scope.parent) return worldWidth;
//         scope.parent.getWorldScale(__extension_temp_vector_3d);
//         return worldWidth / __extension_temp_vector_3d.x;
//       },

//       get localHeight() {
//         const worldHeight =
//           __extension_temp_box.max.y - __extension_temp_box.min.y;
//         if (!scope.parent) return worldHeight;
//         scope.parent.getWorldScale(__extension_temp_vector_3d);
//         return worldHeight / __extension_temp_vector_3d.y;
//       },

//       get localDepth() {
//         const worldDepth =
//           __extension_temp_box.max.z - __extension_temp_box.min.z;
//         if (!scope.parent) return worldDepth;
//         scope.parent.getWorldScale(__extension_temp_vector_3d);
//         return worldDepth / __extension_temp_vector_3d.z;
//       },
//     };
//   },
// });

Object.assign(THREE.Object3D.prototype, {
  // setPosition: function (position) {
  //   this.position.copy(position);
  //   __extension_penging_objects.add(this);
  // },
  // setPosition3f: function (x, y, z) {
  //   this.position.set(x, y, z);
  //   __extension_penging_objects.add(this);
  // },
  // setRotation: function (rotation) {
  //   this.rotation.copy(rotation);
  //   __extension_penging_objects.add(this);
  // },
  // setRotation3f: function (x, y, z) {
  //   this.rotation.set(x, y, z);
  //   __extension_penging_objects.add(this);
  // },
  // setQuaternion: function (quaternion) {
  //   this.quaternion.copy(quaternion);
  //   __extension_penging_objects.add(this);
  // },
  // setQuaternion4f: function (x, y, z, w) {
  //   this.quaternion.set(x, y, z, w);
  //   __extension_penging_objects.add(this);
  // },
  // setScale: function (scale) {
  //   this.scale.copy(scale);
  //   __extension_penging_objects.add(this);
  // },
  // setScale3f: function (x, y, z) {
  //   this.scale.set(x, y, z);
  //   __extension_penging_objects.add(this);
  // },

  projectToUI(container, camera) {
    this.getWorldPosition(__extension_temp_vector_3d);

    const worldCamera = camera || App.World.Camera;
    const projectedPosition = __extension_temp_vector_3d.project(worldCamera);
    const cameraUI = App.World.CameraGUI;

    const factorX = Math.abs(cameraUI.left);
    const factorY = Math.abs(cameraUI.bottom);

    const worldUIPosition = new THREE.Vector3(
      factorX * projectedPosition.x,
      factorY * projectedPosition.y,
      0,
    );

    if (container) return container.worldToLocal(worldUIPosition).clone();
    return worldUIPosition;
  },
  filter: function (filterCallback) {
    const result = [];
    this.traverse((child) => {
      if (filterCallback(child)) result.push(child);
    });
    return result;
  },
  projectToLocal(object) {
    object.getWorldPosition(__extension_temp_vector_3d);
    return this.worldToLocal(__extension_temp_vector_3d).clone();
  },
  projectToParent(object) {
    if (object instanceof THREE.Vector3)
      __extension_temp_vector_3d.copy(object);
    else object.getWorldPosition(__extension_temp_vector_3d);

    if (!this.parent) return null;
    return this.parent.worldToLocal(__extension_temp_vector_3d).clone();
  },
  projectScale(object) {
    const objectWorldScale = object.getWorldScale(new THREE.Vector3());
    const thisWorldScale = this.getWorldScale(new THREE.Vector3());
    return objectWorldScale.divide(thisWorldScale);
  },
  projectQuaternion(object) {
    const objectWorldQuaternion = object.getWorldQuaternion(
      new THREE.Quaternion(),
    );
    const inverseThisQuaternion = this.getWorldQuaternion(
      new THREE.Quaternion(),
    ).invert();

    return new THREE.Quaternion().multiplyQuaternions(
      inverseThisQuaternion,
      objectWorldQuaternion,
    );
  },
  projectTransform(object) {
    const position = this.projectToLocal(object);
    const quaternion = this.projectQuaternion(object);
    const scale = this.projectScale(object);

    return { position, quaternion, scale };
  },
  // enableLayer(layer) {
  //   this.layers.enable(layer);
  //   this.traverse((object) => {
  //     object.layers.enable(layer);
  //   });
  // },
  // disableLayer(layer) {
  //   this.layers.disable(layer);
  //   this.traverse((object) => {
  //     object.layers.disable(layer);
  //   });
  // },
  // enableAllLayers() {
  //   this.layers.enableAll();
  //   this.traverse((object) => {
  //     object.layers.enableAll();
  //   });
  // },
  // disableAllLayers() {
  //   this.layers.disableAll();
  //   this.traverse((object) => {
  //     object.layers.disableAll();
  //   });
  // },
  // setLayer(layer) {
  //   this.layers.set(layer);
  //   this.traverse((object) => {
  //     object.layers.set(layer);
  //   });
  // },

  filterObjects(callback) {
    const result = [];
    this.traverse((child) => callback(child) && result.push(child));
    return result;
  },

  enhancedTraverse: function (callback) {
    const recursivelyTraverse = (object) => {
      if (callback(object) === false) return;

      object.children.forEach((child) => {
        recursivelyTraverse(child);
      });
    };
    recursivelyTraverse(this);
  },

  findFirst: function (callback) {
    const recursivelyTraverse = (object) => {
      const result = callback(object);
      if (result) return result;

      for (const child of object.children) {
        const result = recursivelyTraverse(child);
        if (result) return result;
      }
    };

    return recursivelyTraverse(this);
  },

  getObjectByName: function (name) {
    let result = null;

    this.enhancedTraverse((child) => {
      if (child.name === name) {
        result = child;
        return false;
      }

      return true;
    });

    return result;
  },

  getMaterialByName: function (name) {
    let foundMaterial = null;

    if (this.material) {
      if (Array.isArray(this.material)) {
        for (const material of this.material) {
          if (material.name === name) {
            foundMaterial = material;
          }
        }
      } else if (this.material.name === name) {
        foundMaterial = child.material;
      }
    }

    this.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          for (const material of child.material) {
            if (material.name === name) {
              foundMaterial = material;
            }
          }
        } else if (child.material.name === name) {
          foundMaterial = child.material;
        }
      }
    });

    return foundMaterial;
  },

  replaceMaterialByName: function (name, newMaterial) {
    this.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          for (let i = 0; i < child.material.length; i++) {
            if (child.material[i].name === name) {
              child.material[i] = newMaterial;
            }
          }
        } else if (child.material.name === name) {
          child.material = newMaterial;
        }
      }
    });
  },

  getWorldPosition2D: function (position) {
    this.getWorldPosition(__extension_temp_vector_3d);
    position.set(__extension_temp_vector_3d.x, __extension_temp_vector_3d.z);
    return position;
  },
});
