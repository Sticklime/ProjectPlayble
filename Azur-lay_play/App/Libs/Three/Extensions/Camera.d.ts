import * as THREE from "three";

declare module "three" {
  interface PerspectiveCamera {
    setFieldOfView(fov: number, isVertical?: boolean): void;
    getFieldOfView(isVertical?: boolean): number;
    setClipPlanesFromBox3(box: THREE.Box3): void;
    readonly horizontalFov: number;
  }
}
