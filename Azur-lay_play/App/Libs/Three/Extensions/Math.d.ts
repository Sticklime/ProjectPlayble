import * as THREE from "three";

declare module "three" {
  interface BufferGeometry {
    getAttribute(
      name: string,
    ): THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined;
    setAttribute(
      name: string,
      attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
    ): this;
    deleteAttribute(name: string): this;
    hasAttribute(name: string): boolean;
  }

  interface Vector3 {
    normalizeLength(): number;
    damp(target: THREE.Vector3, lambda: number, dx: number): void;
    distanceToXZ(vector: THREE.Vector3): number;
    distanceToXY(vector: THREE.Vector3): number;
    distanceToYZ(vector: THREE.Vector3): number;
    distanceToXZ2f(x: number, z: number): number;
    distanceToXY2f(x: number, y: number): number;
    distanceToYZ2f(y: number, z: number): number;
    multiply3f(x: number, y: number, z: number): this;
    divide3f(x: number, y: number, z: number): this;
    add3f(x: number, y: number, z: number): this;
    subtract3f(x: number, y: number, z: number): this;
  }

  interface Vector2 {
    multiply2f(x: number, y: number): this;
    divide2f(x: number, y: number): this;
    add2f(x: number, y: number): this;
    subtract2f(x: number, y: number): this;
  }

  interface MathUtils {
    convertEventToZeroOneSpace(value: THREE.Vector2): THREE.Vector2;
    convertEventToCameraSpace(value: THREE.Vector2): THREE.Vector2;
  }

  interface Box3 {
    getCorners(): THREE.Vector3[];
  }

  interface Quaternion {
    setFromView(viewDirection: THREE.Vector3, up?: THREE.Vector3): this;
  }
}
