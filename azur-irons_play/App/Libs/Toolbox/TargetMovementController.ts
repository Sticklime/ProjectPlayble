import { Vector3, Vector3Like } from "three";
import { MovementController } from "./MovementController";

interface TargetMovementControllerParameters {
  acceleration?: number;
  deceleration?: number;
  maximumSpeed?: number;
  distance?: number;
  isActive?: boolean;
}

export class TargetMovementController implements MovementController {
  public position: Vector3 = new Vector3();
  public target: Vector3 = new Vector3();
  public distance: number;

  public velocity: Vector3 = new Vector3();
  public readonly acceleration: number;
  public readonly deceleration: number;
  public readonly maximumSpeed: number;

  public isActive: boolean = false;
  private desiredTarget: Vector3 = new Vector3();

  public constructor(
    position: Vector3Like,
    parameters: TargetMovementControllerParameters = {},
  ) {
    const {
      acceleration = 8,
      deceleration = 8,
      maximumSpeed = 8,
      distance = 0,
    } = parameters;

    this.position.copy(position);
    this.target.copy(position);
    this.acceleration = acceleration;
    this.deceleration = deceleration;
    this.maximumSpeed = maximumSpeed;
    this.distance = distance;

    this.isActive = parameters.isActive ?? false;
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    this.desiredTarget = new Vector3()
      .subVectors(this.position, this.target)
      .normalize()
      .multiplyScalar(this.distance)
      .add(this.target);

    const toTarget = new Vector3().subVectors(
      this.desiredTarget,
      this.position,
    );

    const distanceToTarget = toTarget.length();

    if (distanceToTarget < 1e-5 && this.velocity.lengthSq() < 1e-5) {
      this.position.copy(this.desiredTarget);
      this.velocity.set(0, 0, 0);
      return;
    }

    const directionToTarget = toTarget.normalize();
    const velocityAlongTarget = directionToTarget
      .clone()
      .multiplyScalar(this.velocity.dot(directionToTarget));
    const lateralVelocity = new Vector3().subVectors(
      this.velocity,
      velocityAlongTarget,
    );

    const lateralSpeed = lateralVelocity.length();
    if (lateralSpeed > 1e-5) {
      const lateralDecay = Math.min(
        lateralSpeed,
        this.deceleration * deltaTime,
      );
      lateralVelocity.addScaledVector(
        lateralVelocity.clone().normalize(),
        -lateralDecay,
      );
    } else {
      lateralVelocity.set(0, 0, 0);
    }

    const speedAlongTarget = velocityAlongTarget.length();
    const stoppingDistance =
      (speedAlongTarget * speedAlongTarget) / (2 * this.deceleration);

    let newSpeedAlongTarget: number;

    if (distanceToTarget <= stoppingDistance) {
      newSpeedAlongTarget = Math.max(
        speedAlongTarget - this.deceleration * deltaTime,
        0,
      );
    } else {
      newSpeedAlongTarget = Math.min(
        speedAlongTarget + this.acceleration * deltaTime,
        this.maximumSpeed,
      );
    }

    const newVelocity = directionToTarget
      .multiplyScalar(newSpeedAlongTarget)
      .add(lateralVelocity);

    const moveStep = new Vector3().copy(newVelocity).multiplyScalar(deltaTime);
    if (moveStep.lengthSq() > distanceToTarget * distanceToTarget) {
      this.position.copy(this.desiredTarget);
      this.velocity.set(0, 0, 0);
    } else {
      this.velocity.copy(newVelocity);
      this.position.add(moveStep);
    }
  }

  public getLastDirection(result: Vector3): void {
    result.subVectors(this.desiredTarget, this.position).normalize();
  }

  public getLastSpeed(): number {
    return this.velocity.length();
  }
}
