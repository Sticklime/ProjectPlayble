import { Vector3 } from "three";

export interface MovementController {
  acceleration: number;
  deceleration: number;
  maximumSpeed: number;

  position: Vector3;
  velocity: Vector3;
  isActive: boolean;

  getLastDirection(result: Vector3): void;
  getLastSpeed(): number;
}
