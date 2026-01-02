import { IMovementController } from "Libs/System/IMovementController";
import { Vector3 } from "three";
import { TimeHandler } from "TimeHandler";

interface IOptions {
  acceleration?: number;
  deceleration?: number;
  maximumSpeed?: number;
  priority?: number;
}

export class TargetMovementController implements IMovementController {
  public position: Vector3;
  public targetPosition: Vector3;

  public velocity: Vector3 = new Vector3();
  public readonly acceleration: number;
  public readonly deceleration: number;
  public readonly maximumSpeed: number;

  public isActive: boolean = false;

  public constructor(position: Vector3, options: IOptions = {}) {
    const {
      acceleration = 8,
      deceleration = 8,
      maximumSpeed = 8,
      priority = 0,
    } = options;

    this.position = position.clone();
    this.targetPosition = position.clone();
    this.acceleration = acceleration;
    this.deceleration = deceleration;
    this.maximumSpeed = maximumSpeed;

    TimeHandler.instance.on(
      TimeHandler.EEvent.TICK,
      this.onTick,
      this,
      priority,
    );
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);
  }

  private onTick(deltaTime: number): void {
    if (!this.isActive) return;

    const toTarget = new Vector3().subVectors(
      this.targetPosition,
      this.position,
    );

    const distanceToTarget = toTarget.length();

    if (distanceToTarget < 1e-5 && this.velocity.lengthSq() < 1e-5) {
      this.position.copy(this.targetPosition);
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

    let newSpeedAlongTarget =
      velocityAlongTarget.length() + this.acceleration * deltaTime;
    newSpeedAlongTarget = Math.min(newSpeedAlongTarget, this.maximumSpeed);

    const newVelocity = directionToTarget
      .multiplyScalar(newSpeedAlongTarget)
      .add(lateralVelocity);

    const moveStep = new Vector3().copy(newVelocity).multiplyScalar(deltaTime);
    if (moveStep.lengthSq() > distanceToTarget * distanceToTarget) {
      this.position.copy(this.targetPosition);
      this.velocity.set(0, 0, 0);
    } else {
      this.velocity.copy(newVelocity);
      this.position.add(moveStep);
    }
  }

  public get currentSpeed(): number {
    return this.velocity.length();
  }

  public get direction(): Vector3 {
    return new Vector3()
      .subVectors(this.targetPosition, this.position)
      .normalize();
  }
}
