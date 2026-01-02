import * as THREE from "three";

declare module "three" {
  interface Object3D {
    opacity: number;
    isStatic: boolean;
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    scaleXY: number;
    scaleXYZ: number;
    // bounds: {
    //   box: THREE.Box3;
    //   center: THREE.Vector3;
    //   size: THREE.Vector3;
    //   width: number;
    //   height: number;
    //   depth: number;
    //   localWidth: number;
    //   localHeight: number;
    //   localDepth: number;
    // };

    // setPosition(position: THREE.Vector3): void;
    // setPosition3f(x: number, y: number, z: number): void;
    // setRotation(rotation: THREE.Euler): void;
    // setRotation3f(x: number, y: number, z: number): void;
    // setQuaternion(quaternion: THREE.Quaternion): void;
    // setQuaternion4f(x: number, y: number, z: number, w: number): void;
    // setScale(scale: THREE.Vector3): void;
    // setScale3f(x: number, y: number, z: number): void;
    projectToUI(
      container?: THREE.Object3D,
      camera?: THREE.Camera,
    ): THREE.Vector3;
    filter(
      filterCallback: (child: THREE.Object3D) => boolean,
    ): THREE.Object3D[];
    // projectToLocal(object: THREE.Object3D | THREE.Vector3): THREE.Vector3;
    // projectToParent(
    //   object: THREE.Object3D | THREE.Vector3,
    // ): THREE.Vector3 | null;
    // projectScale(object: THREE.Object3D): THREE.Vector3;
    // projectQuaternion(object: THREE.Object3D): THREE.Quaternion;
    // projectTransform(object: THREE.Object3D): {
    //   position: THREE.Vector3;
    //   quaternion: THREE.Quaternion;
    //   scale: THREE.Vector3;
    // };
    // enableLayer(layer: number): void;
    // disableLayer(layer: number): void;
    // enableAllLayers(): void;
    // disableAllLayers(): void;
    // setLayer(layer: number): void;
    filterObjects(
      callback: (child: THREE.Object3D) => boolean,
    ): THREE.Object3D[];
    enhancedTraverse(callback: (child: THREE.Object3D) => boolean | void): void;
    findFirst<T = unknown>(
      callback: (child: THREE.Object3D) => T | undefined,
    ): T | undefined;
    getObjectByName(name: string): THREE.Object3D | null;
    getMaterialByName(name: string): THREE.Material | null;
    replaceMaterialByName(name: string, newMaterial: THREE.Material): void;
    getWorldPosition2D(position: THREE.Vector2): THREE.Vector2;
  }
}
