import * as THREE from "three";
import { ITransform } from "./ITransform";

export class Object3DToolbox {
  private static tempBox3 = new THREE.Box3();
  private static tempVector3 = new THREE.Vector3();

  public static getObjectByName(
    object: THREE.Object3D,
    name: string,
  ): THREE.Object3D | null {
    if (object.name === name) return object;

    for (const child of object.children) {
      const result = Object3DToolbox.getObjectByName(child, name);
      if (result) return result;
    }

    return null;
  }

  public static getMaterialByName(
    object: THREE.Object3D,
    name: string,
  ): THREE.Material | null {
    if (object instanceof THREE.Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          if (material.name === name) return material;
        }
      } else if (object.material.name === name) {
        return object.material;
      }
    }

    for (const child of object.children) {
      const material = Object3DToolbox.getMaterialByName(child, name);
      if (material) return material;
    }

    return null;
  }

  public static enumerateMaterials(
    object: THREE.Object3D,
    callback: (material: THREE.Material) => void,
  ): void {
    if (object instanceof THREE.Mesh) {
      if (Array.isArray(object.material)) {
        for (const material of object.material) {
          callback(material);
        }
      } else {
        callback(object.material);
      }
    }

    for (const child of object.children) {
      Object3DToolbox.enumerateMaterials(child, callback);
    }
  }

  public static calculateBounds(object: THREE.Object3D) {
    Object3DToolbox.tempBox3.setFromObject(object);
    return {
      get box() {
        return Object3DToolbox.tempBox3.clone();
      },

      get center() {
        return Object3DToolbox.tempBox3
          .getCenter(Object3DToolbox.tempVector3)
          .clone();
      },

      get size() {
        return Object3DToolbox.tempBox3
          .getSize(Object3DToolbox.tempVector3)
          .clone();
      },

      get width() {
        return Object3DToolbox.tempBox3.max.x - Object3DToolbox.tempBox3.min.x;
      },

      set width(value) {
        const currentWidth =
          Object3DToolbox.tempBox3.max.x - Object3DToolbox.tempBox3.min.x;

        if (currentWidth !== 0) {
          const scaleFactor = value / currentWidth;
          object.scale.multiplyScalar(scaleFactor);
        }
      },

      get height() {
        return Object3DToolbox.tempBox3.max.y - Object3DToolbox.tempBox3.min.y;
      },

      set height(value) {
        const currentHeight =
          Object3DToolbox.tempBox3.max.y - Object3DToolbox.tempBox3.min.y;

        if (currentHeight !== 0) {
          const scaleFactor = value / currentHeight;
          object.scale.multiplyScalar(scaleFactor);
        }
      },

      get depth() {
        return Object3DToolbox.tempBox3.max.z - Object3DToolbox.tempBox3.min.z;
      },

      set depth(value) {
        const currentDepth =
          Object3DToolbox.tempBox3.max.z - Object3DToolbox.tempBox3.min.z;

        if (currentDepth !== 0) {
          const scaleFactor = value / currentDepth;
          object.scale.multiplyScalar(scaleFactor);
        }
      },

      get localWidth() {
        const worldWidth =
          Object3DToolbox.tempBox3.max.x - Object3DToolbox.tempBox3.min.x;
        if (!object.parent) return worldWidth;

        object.parent.getWorldScale(Object3DToolbox.tempVector3);
        return worldWidth / Object3DToolbox.tempVector3.x;
      },

      get localHeight() {
        const worldHeight =
          Object3DToolbox.tempBox3.max.y - Object3DToolbox.tempBox3.min.y;
        if (!object.parent) return worldHeight;

        object.parent.getWorldScale(Object3DToolbox.tempVector3);
        return worldHeight / Object3DToolbox.tempVector3.y;
      },

      get localDepth() {
        const worldDepth =
          Object3DToolbox.tempBox3.max.z - Object3DToolbox.tempBox3.min.z;
        if (!object.parent) return worldDepth;

        object.parent.getWorldScale(Object3DToolbox.tempVector3);
        return worldDepth / Object3DToolbox.tempVector3.z;
      },
    };
  }

  public static setShadowRecursive(
    object: THREE.Object3D,
    castShadow = true,
    receiveShadow = true,
  ) {
    if ("isMesh" in object) {
      (object as THREE.Mesh).castShadow = castShadow;
      (object as THREE.Mesh).receiveShadow = receiveShadow;
    }
    object.traverse((child) => {
      if ("isMesh" in child) {
        (child as THREE.Mesh).castShadow = castShadow;
        (child as THREE.Mesh).receiveShadow = receiveShadow;
      }
    });
  }

  public static worldPositionToLocal(
    position: THREE.Vector3,
    container: THREE.Object3D,
  ) {
    return container.worldToLocal(position).clone();
  }

  public static worldQuaternionToLocal(
    quaternion: THREE.Quaternion,
    container: THREE.Object3D,
  ) {
    const invertedContainerQuaternion = container
      .getWorldQuaternion(new THREE.Quaternion())
      .invert();

    return new THREE.Quaternion().multiplyQuaternions(
      invertedContainerQuaternion,
      quaternion,
    );
  }

  public static worldScaleToLocal(
    scale: THREE.Vector3,
    container: THREE.Object3D,
  ) {
    const containerWorldScale = container.getWorldScale(new THREE.Vector3());
    return scale.divide(containerWorldScale);
  }

  public static worldTransformToLocal(
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    scale: THREE.Vector3,
    container: THREE.Object3D,
  ): ITransform {
    const localPosition = Object3DToolbox.worldPositionToLocal(
      position,
      container,
    );
    const localQuaternion = Object3DToolbox.worldQuaternionToLocal(
      quaternion,
      container,
    );
    const localScale = Object3DToolbox.worldScaleToLocal(scale, container);

    return {
      position: localPosition,
      quaternion: localQuaternion,
      scale: localScale,
    };
  }
}
