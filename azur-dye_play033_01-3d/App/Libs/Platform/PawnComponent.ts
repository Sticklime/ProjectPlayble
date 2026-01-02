import type { Collision } from "Libs/Physics/BodyOptions";
import { PhysicalMovementComponent } from "Libs/Platform/PhysicalMovementComponent";
import type { Platform } from "Libs/Platform/Platform";
import { Vector2, type Vector3 } from "three";

export class PawnComponent extends PhysicalMovementComponent {
  public direction?: Vector3;
  public maximumSpeedFactor: number;
  protected readonly tempDirection = new Vector2();

  constructor(
    platform: Platform,
    acceleration: number,
    deceleration: number,
    public readonly maximumSpeed: number,
    collision?: Collision,
    mass = 75,
  ) {
    super(platform, acceleration, deceleration, 0.5, collision, mass);
    this.maximumSpeedFactor = 1;
  }

  protected override computeDesiredVelocity(deltaTime: number): void {
    this.direction !== undefined
      ? this.moveInDirection(this.direction, deltaTime)
      : this.decelerateToStop(deltaTime);
  }

  private moveInDirection(direction: Vector3, deltaTime: number): void {
    const normalizedDirection = this.tempDirection
      .set(direction.x, direction.z)
      .normalize();

    const velocityDotDirection =
      this.horizontalVelocity.dot(normalizedDirection);

    const currentForwardSpeed = Math.max(0, velocityDotDirection);
    const accelerationAmount = this.acceleration * deltaTime;
    const newForwardSpeed = Math.min(
      currentForwardSpeed + accelerationAmount,
      this.maximumSpeedFactor * this.maximumSpeed,
    );

    this.applyVelocityDecomposition(
      normalizedDirection,
      newForwardSpeed,
      deltaTime,
    );
  }
}
