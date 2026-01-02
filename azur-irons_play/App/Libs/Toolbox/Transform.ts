import * as THREE from "three";

export interface Transform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export interface TransformReadonlyScale {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
}

export interface TransformReadonlyQuaternionScale {
  position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
}

export interface TransformReadonly {
  readonly position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
}
