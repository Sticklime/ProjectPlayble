import * as THREE from "three";

export interface IMovementController {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  readonly velocity: THREE.Vector3;

  readonly acceleration: number;
  readonly deceleration: number;

  readonly maximumSpeed: number;
  readonly currentSpeed: number;
}
