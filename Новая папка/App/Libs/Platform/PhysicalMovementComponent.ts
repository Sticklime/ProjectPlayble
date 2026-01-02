import { Body } from "Libs/Physics/Body";
import type { Collision } from "Libs/Physics/BodyOptions";
import { BodyAxis } from "Libs/Physics/BodyOptions";
import { PhysicsMaterial } from "Libs/Physics/PhysicsMaterial";
import { Object3D, Quaternion, Vector2, Vector3 } from "three";
import { Component } from "./Component";
import type { Platform } from "./Platform";

const EPSILON = 1e-6;
const ROTATION_SPEED = 20;
const DEFAULT_FORWARD_DIRECTION = new Vector3(0, 0, 1);

export abstract class PhysicalMovementComponent extends Component {
  public orientation?: Vector3 | Object3D;

  protected readonly horizontalVelocity = new Vector2();
  protected readonly tempVelocity = new Vector3();
  protected readonly tempVelocityTowards = new Vector2();
  protected readonly tempVelocityLateral = new Vector2();
  protected readonly tempTargetDirection = new Vector3();

  protected speedSquared = 0;
  protected speedInternal = 0;
  protected needsRecalculateSpeed = false;

  private readonly body: Body;
  private readonly tempBodyPosition = new Vector3();
  private readonly tempBodyQuaternion = new Quaternion();

  private readonly tempTargetQuaternion = new Quaternion();

  constructor(
    platform: Platform,
    public readonly acceleration: number,
    public readonly deceleration: number,
    public readonly radius = 0.75,
    collision?: Collision,
    mass = 75,
  ) {
    super(platform);

    this.body = new Body(
      { radius },
      {
        mass,
        angularLock: BodyAxis.X | BodyAxis.Y | BodyAxis.Z,
        collision,
      },
    );
    this.body.material = new PhysicsMaterial(0);
    this.writeBodyTransform();
  }

  public override destroy(): void {
    this.body.destroy();
    super.destroy();
  }

  public get currentSpeed(): number {
    return this.horizontalVelocity.length();
  }

  protected override onFixedTick(fixedDeltaTime: number): void {
    this.body.getVelocity(this.tempVelocity);
    this.horizontalVelocity.set(this.tempVelocity.x, this.tempVelocity.z);

    this.computeDesiredVelocity(fixedDeltaTime);
    this.updateOrientation(fixedDeltaTime);

    this.tempVelocity.set(
      this.horizontalVelocity.x,
      this.tempVelocity.y,
      this.horizontalVelocity.y,
    );

    this.body.setVelocity(this.tempVelocity);
    this.writeBodyTransform();
  }

  protected override onLateFixedTick(): void {
    this.readBodyTransform();
  }

  protected abstract computeDesiredVelocity(deltaTime: number): void;

  private updateOrientation(deltaTime: number): void {
    let targetLookAt: Vector3 | undefined;

    if (this.orientation instanceof Vector3) {
      targetLookAt = this.tempTargetDirection.copy(this.orientation);
    } else if (this.orientation instanceof Object3D) {
      this.orientation
        .getWorldPosition(this.tempTargetDirection)
        .sub(this.platform.position);
    } else if (
      Math.hypot(this.horizontalVelocity.x, this.horizontalVelocity.y) > EPSILON
    ) {
      targetLookAt = this.tempTargetDirection.set(
        this.horizontalVelocity.x,
        0,
        this.horizontalVelocity.y,
      );
    }

    if (targetLookAt) {
      targetLookAt.y = 0;
      targetLookAt.normalize();

      this.tempTargetQuaternion.setFromUnitVectors(
        DEFAULT_FORWARD_DIRECTION,
        targetLookAt,
      );

      this.platform.quaternion.slerp(
        this.tempTargetQuaternion,
        Math.min(1, ROTATION_SPEED * deltaTime),
      );
    }
  }

  protected decelerateToStop(deltaTime: number): void {
    if (this.speedSquared < EPSILON) {
      this.horizontalVelocity.set(0, 0);
      this.speedSquared = 0;
      this.speedInternal = 0;
      this.needsRecalculateSpeed = false;
      return;
    }

    if (this.needsRecalculateSpeed) {
      this.speedInternal = Math.sqrt(this.speedSquared);
      this.needsRecalculateSpeed = false;
    }
    const decelerationFactor = Math.max(
      0,
      1 - (this.deceleration * deltaTime) / this.speedInternal,
    );
    this.horizontalVelocity.multiplyScalar(decelerationFactor);

    this.speedInternal *= decelerationFactor;
    this.speedSquared = this.speedInternal * this.speedInternal;
    this.needsRecalculateSpeed = false;
  }

  protected applyVelocityDecomposition(
    normalizedDirection: Vector2,
    newForwardSpeed: number,
    deltaTime: number,
  ): void {
    const velocityDotDirection =
      this.horizontalVelocity.dot(normalizedDirection);

    const velocityTowards = this.tempVelocityTowards.set(
      normalizedDirection.x * velocityDotDirection,
      normalizedDirection.y * velocityDotDirection,
    );

    const velocityLateral = this.tempVelocityLateral.subVectors(
      this.horizontalVelocity,
      velocityTowards,
    );

    const newVelocityTowards = this.tempVelocityTowards.set(
      normalizedDirection.x * newForwardSpeed,
      normalizedDirection.y * newForwardSpeed,
    );

    const lateralSpeedSquared = velocityLateral.lengthSq();

    if (lateralSpeedSquared > EPSILON) {
      const lateralSpeed = Math.sqrt(lateralSpeedSquared);

      const lateralDecelerationFactor = Math.max(
        0,
        1 - (this.deceleration * deltaTime) / lateralSpeed,
      );
      velocityLateral.multiplyScalar(lateralDecelerationFactor);
    }

    this.horizontalVelocity.addVectors(newVelocityTowards, velocityLateral);

    this.speedSquared = this.horizontalVelocity.lengthSq();
    this.speedInternal = 0;
    this.needsRecalculateSpeed = true;
  }

  private writeBodyTransform() {
    this.platform.getWorldPosition(this.tempBodyPosition);
    this.platform.getWorldQuaternion(this.tempBodyQuaternion);

    this.tempBodyPosition.y += this.radius;
    this.body.setTransform(this.tempBodyPosition, this.tempBodyQuaternion);
  }

  private readBodyTransform() {
    this.body.getTransform(this.tempBodyPosition, this.tempBodyQuaternion);
    this.tempBodyPosition.y -= this.radius;

    this.platform.position.copy(this.tempBodyPosition);
    this.platform.quaternion.copy(this.tempBodyQuaternion);
  }
}
