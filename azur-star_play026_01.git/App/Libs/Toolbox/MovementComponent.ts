import { Component } from "Libs/Toolbox/Component";
import type { Platform } from "Libs/Toolbox/Platform";
import { Vector3 } from "three";

const EPSILON = 1e-6;

/**
 * Component that moves platform to target positions with acceleration and deceleration.
 *
 * @example
 * ```typescript
 * const movement = new MovementComponent(platform, 15, 10, 25);
 * movement.target = new Vector3(100, 0, 50);
 * movement.target = undefined; // stop moving
 * ```
 */
export class MovementComponent extends Component {
  /**
   * Target position to move towards.
   * Set to undefined to decelerate to a stop.
   */
  public target: Vector3 | undefined;

  private readonly velocity = new Vector3();
  private readonly tempDirection = new Vector3();
  private readonly tempVelocityTowards = new Vector3();
  private readonly tempVelocityLateral = new Vector3();
  private readonly tempMovementStep = new Vector3();
  private readonly tempLookAt = new Vector3();

  private speedSquared = 0;
  private speedInternal = 0;
  private needsRecalculateSpeed = false;

  private readonly cachedDeceleration: number;

  /**
   * Creates MovementComponent.
   *
   * @param platform - Platform to control
   * @param acceleration - Speed increase rate (units/s²)
   * @param deceleration - Speed decrease rate (units/s²)
   * @param maximumSpeed - Maximum speed (units/s)
   */
  constructor(
    platform: Platform,
    private readonly acceleration: number,
    private readonly deceleration: number,
    private readonly maximumSpeed: number,
  ) {
    super(platform);
    this.cachedDeceleration = 1 / (2 * deceleration);
  }

  /**
   * Gets current movement speed (cached for performance).
   *
   * @returns Current speed in units per second
   */
  public get currentSpeed(): number {
    if (this.needsRecalculateSpeed) {
      this.speedInternal = Math.sqrt(this.speedSquared);
      this.needsRecalculateSpeed = false;
    }
    return this.speedInternal;
  }

  /**
   * Gets current velocity vector.
   *
   * @param result - Vector3 to store velocity in
   * @returns Result vector with current velocity
   */
  public getVelocity(result: Vector3): Vector3 {
    return result.copy(this.velocity);
  }

  /**
   * Sets velocity vector directly. Overrides natural movement physics.
   *
   * @param velocity - New velocity vector
   */
  public setVelocity(velocity: Vector3): void {
    this.velocity.copy(velocity);
  }

  /**
   * Scales current velocity by multiplier.
   *
   * @param scalar - Velocity multiplier
   */
  public scaleVelocity(scalar: number): void {
    this.velocity.multiplyScalar(scalar);
  }

  /**
   * Update method called every frame. Handles movement physics and rotation.
   *
   * @param deltaTime - Time elapsed since last update in seconds
   */
  protected override onTick(deltaTime: number): void {
    // Two modes: move to target or decelerate to stop
    this.target !== undefined
      ? this.moveToTarget(this.target, deltaTime)
      : this.decelerateToStop(deltaTime);

    // Rotate only when moving to avoid jitter
    if (this.speedSquared > EPSILON) {
      this.tempLookAt.addVectors(this.platform.position, this.velocity);
      this.platform.lookAt(this.tempLookAt);
    }
  }

  /**
   * Moves towards target with acceleration/deceleration and lateral dampening.
   *
   * @param target - Target position
   * @param deltaTime - Time elapsed in seconds
   */
  private moveToTarget(target: Vector3, deltaTime: number): void {
    // Vector from current position to target
    const toTarget = this.tempDirection.subVectors(
      target,
      this.platform.position,
    );

    // Check if target reached (within epsilon)
    const distanceToTargetSquared = toTarget.lengthSq();
    if (distanceToTargetSquared < EPSILON) {
      // Snap to target and zero movement
      this.platform.position.copy(target);
      this.velocity.set(0, 0, 0);
      this.speedSquared = 0;
      this.speedInternal = 0;
      this.needsRecalculateSpeed = false;
      return;
    }

    // Convert to unit direction vector
    const distanceToTarget = Math.sqrt(distanceToTargetSquared);
    const direction = toTarget.divideScalar(distanceToTarget);

    // Split velocity: forward (towards target) and lateral (perpendicular)
    // Dot product gives forward speed component
    const velocityDotTarget = this.velocity.dot(direction);

    // Velocity component towards target
    const velocityTowards = this.tempVelocityTowards.set(
      direction.x * velocityDotTarget,
      direction.y * velocityDotTarget,
      direction.z * velocityDotTarget,
    );

    // Lateral velocity: total minus forward component
    const velocityLateral = this.tempVelocityLateral.subVectors(
      this.velocity,
      velocityTowards,
    );

    // Calculate stopping distance to prevent overshoot
    const forwardSpeed = Math.abs(velocityDotTarget);
    const stoppingDistance =
      forwardSpeed * forwardSpeed * this.cachedDeceleration;

    let newForwardSpeed: number;
    if (distanceToTarget <= stoppingDistance) {
      // Within stopping distance - apply deceleration
      const decelerationAmount = this.deceleration * deltaTime;
      newForwardSpeed = Math.max(forwardSpeed - decelerationAmount, 0);
    } else {
      // Far from target - apply acceleration up to max speed
      const accelerationAmount = this.acceleration * deltaTime;
      newForwardSpeed = Math.min(
        forwardSpeed + accelerationAmount,
        this.maximumSpeed,
      );
    }

    // New forward velocity with updated speed
    const newVelocityTowards = this.tempVelocityTowards.set(
      direction.x * newForwardSpeed,
      direction.y * newForwardSpeed,
      direction.z * newForwardSpeed,
    );

    // Reduce sideways drift for natural movement
    const lateralSpeedSquared = velocityLateral.lengthSq();

    if (lateralSpeedSquared > EPSILON) {
      const lateralSpeed = Math.sqrt(lateralSpeedSquared);

      // Calculate dampening factor for frame-rate independent lateral dampening
      const lateralDecelerationFactor = Math.max(
        0,
        1 - (this.deceleration * deltaTime) / lateralSpeed,
      );
      velocityLateral.multiplyScalar(lateralDecelerationFactor);
    }

    // Combine dampened lateral with new forward velocity
    this.velocity.addVectors(newVelocityTowards, velocityLateral);

    // Calculate movement for this frame
    const movementStep = this.tempMovementStep.set(
      this.velocity.x * deltaTime,
      this.velocity.y * deltaTime,
      this.velocity.z * deltaTime,
    );

    // Check for target overshoot
    if (movementStep.lengthSq() > distanceToTargetSquared) {
      // Snap to target instead of overshooting
      this.platform.position.copy(target);
      this.velocity.set(0, 0, 0);
      this.speedSquared = 0;
      this.speedInternal = 0;
      this.needsRecalculateSpeed = false;
    } else {
      // Apply movement and update speed values
      this.platform.position.add(movementStep);
      this.speedSquared = this.velocity.lengthSq();
      this.speedInternal = 0; // Will be recalculated when needed
      this.needsRecalculateSpeed = true;
    }
  }

  /**
   * Decelerates to stop when no target is set.
   *
   * @param deltaTime - Time elapsed in seconds
   */
  private decelerateToStop(deltaTime: number): void {
    // If already stopped, ensure zero state
    if (this.speedSquared < EPSILON) {
      this.velocity.set(0, 0, 0);
      this.speedSquared = 0;
      this.speedInternal = 0;
      this.needsRecalculateSpeed = false;
      return;
    }

    // Recalculate speed when necessary (expensive sqrt)
    if (this.needsRecalculateSpeed) {
      this.speedInternal = Math.sqrt(this.speedSquared);
      this.needsRecalculateSpeed = false;
    }

    // Apply smooth deceleration using exponential decay for frame-rate independence
    const decelerationFactor = Math.max(
      0,
      1 - (this.deceleration * deltaTime) / this.speedInternal,
    );
    this.velocity.multiplyScalar(decelerationFactor);

    this.speedInternal *= decelerationFactor;
    this.speedSquared = this.speedInternal * this.speedInternal;
    this.needsRecalculateSpeed = false;

    // Apply movement for this frame using addScaledVector for efficiency
    this.platform.position.addScaledVector(this.velocity, deltaTime);
  }
}
