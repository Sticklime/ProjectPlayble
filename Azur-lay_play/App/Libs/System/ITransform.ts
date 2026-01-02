import * as THREE from "three";

export interface ITransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export interface ITransformReadonlyScale {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
}

export interface ITransformReadonlyQuaternionScale {
  position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
}

export interface ITransformReadonly {
  readonly position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
}
