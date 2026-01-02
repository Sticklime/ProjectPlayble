import { Component } from "Libs/Toolbox/Component";
import type { Platform } from "Libs/Toolbox/Platform";
import { Vector3 } from "three";

const EPSILON = 1e-6;

/**
 * A character movement component that provides smooth locomotion with realistic physics.
 *
 * This component implements smooth character movement to target positions with proper
 * acceleration, deceleration, and stopping behavior.
 *
 * Designed for character controllers, AI agents, or any object requiring smooth,
 * physics-based movement in 3D space.
 *
 * @example
 * ```typescript
 * // Create a character with movement speeds
 * const character = new Platform();
 * const movement = new MovementComponent(character, 15, 10, 25); // acceleration, deceleration, maxSpeed
 *
 * // Move to a target position
 * movement.target = new Vector3(100, 0, 50);
 *
 * // Stop moving
 * movement.target = undefined;
 * ```
 */
export class MovementComponent extends Component {
  /**
   * The target position for the character to move towards.
   *
   * When set to a Vector3 position, the character will smoothly accelerate towards
   * the target, automatically decelerating as it approaches to avoid overshooting.
   * Set to `undefined` to make the character smoothly decelerate to a stop.
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
   * Creates a new MovementComponent for character locomotion.
   *
   * @param platform - The Platform (character/entity) to control movement for
   * @param acceleration - Rate of speed increase per second (units/s²)
   * @param deceleration - Rate of speed decrease per second (units/s²)
   * @param maximumSpeed - Maximum movement speed limit (units/s)
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
   * Gets the current character movement speed.
   *
   * This value is cached and only recalculated when necessary for performance optimization.
   * Useful for animation systems, sound effects, or gameplay logic based on movement speed.
   *
   * @returns The current speed magnitude in units per second
   */
  public get currentSpeed(): number {
    if (this.needsRecalculateSpeed) {
      this.speedInternal = Math.sqrt(this.speedSquared);
      this.needsRecalculateSpeed = false;
    }
    return this.speedInternal;
  }

  /**
   * Gets the current character velocity vector.
   *
   * @param result - Vector3 to store the velocity in (avoids allocation)
   * @returns The result vector containing the current velocity
   */
  public getVelocity(result: Vector3): Vector3 {
    return result.copy(this.velocity);
  }

  /**
   * Directly sets the character's velocity vector.
   *
   * Use this to override the natural movement physics, for example when
   * implementing knockback effects or teleportation.
   *
   * @param velocity - The new velocity vector to apply
   */
  public setVelocity(velocity: Vector3): void {
    this.velocity.copy(velocity);
  }

  /**
   * Scales the character's current velocity by a multiplier.
   *
   * Useful for temporary speed effects like speed boosts,
   * or gradual velocity modifications.
   *
   * @param scalar - The multiplier to apply to the velocity
   */
  public scaleVelocity(scalar: number): void {
    this.velocity.multiplyScalar(scalar);
  }

  /**
   * Core update method called every frame by the Platform system.
   *
   * Handles character movement physics including target-seeking or deceleration
   * behavior, and automatically rotates the character to face the movement direction.
   *
   * @param deltaTime - Time elapsed since last update in seconds (scaled by TimeController)
   */
  protected override onTick(deltaTime: number): void {
    // The component operates in two distinct modes:
    // 1. Target-seeking: Move towards a specified target with acceleration/deceleration
    // 2. Free deceleration: Gradually come to a stop when no target is set
    this.target !== undefined
      ? this.moveToTarget(this.target, deltaTime)
      : this.decelerateToStop(deltaTime);

    // Only rotate the character if it's actually moving (avoid jitter at rest)
    // Calculate look-at point by projecting velocity forward from current position
    if (this.speedSquared > EPSILON) {
      this.tempLookAt.addVectors(this.platform.position, this.velocity);
      this.platform.lookAt(this.tempLookAt);
    }
  }

  /**
   * Implements smooth character movement towards a target position.
   *
   * This method handles the core movement physics:
   * - Calculates optimal stopping distance to avoid overshooting
   * - Applies smooth acceleration when far from target
   * - Applies smooth deceleration when approaching target
   * - Dampens lateral velocity for natural movement feel
   * - Handles precise arrival at target position
   *
   * @param target - The target position to move towards
   * @param deltaTime - Time elapsed since last update in seconds
   */
  private moveToTarget(target: Vector3, deltaTime: number): void {
    // Calculate vector from current position to target
    const toTarget = this.tempDirection.subVectors(
      target,
      this.platform.position,
    );

    // Check if we've essentially reached the target (within epsilon tolerance)
    const distanceToTargetSquared = toTarget.lengthSq();
    if (distanceToTargetSquared < EPSILON) {
      // Snap to exact target position and zero all movement values
      this.platform.position.copy(target);
      this.velocity.set(0, 0, 0);
      this.speedSquared = 0;
      this.speedInternal = 0;
      this.needsRecalculateSpeed = false;
      return;
    }

    // Convert distance vector to unit direction vector
    const distanceToTarget = Math.sqrt(distanceToTargetSquared);
    const direction = toTarget.divideScalar(distanceToTarget);

    // Split current velocity into two components:
    // 1. Forward velocity (towards/away from target)
    // 2. Lateral velocity (perpendicular to target direction)
    // This allows independent control of each component

    // Calculate how much current velocity is aligned with target direction
    // Dot product gives us the forward speed component (can be negative if moving away)
    const velocityDotTarget = this.velocity.dot(direction);

    // Create vector representing velocity component towards target
    const velocityTowards = this.tempVelocityTowards.set(
      direction.x * velocityDotTarget,
      direction.y * velocityDotTarget,
      direction.z * velocityDotTarget,
    );

    // Calculate lateral velocity: total velocity minus forward component
    // This represents sideways drift that needs to be dampened
    const velocityLateral = this.tempVelocityLateral.subVectors(
      this.velocity,
      velocityTowards,
    );

    // Calculate how far we need to decelerate to a complete stop
    // Using kinematic equation: stopping_distance = v² / (2 * deceleration)
    // This prevents overshooting the target
    const forwardSpeed = Math.abs(velocityDotTarget);
    const stoppingDistance =
      forwardSpeed * forwardSpeed * this.cachedDeceleration;

    let newForwardSpeed: number;
    if (distanceToTarget <= stoppingDistance) {
      // We're within stopping distance - start braking to avoid overshoot
      // Apply linear deceleration: new_speed = current_speed - deceleration * time
      const decelerationAmount = this.deceleration * deltaTime;
      newForwardSpeed = Math.max(forwardSpeed - decelerationAmount, 0);
    } else {
      // We're far enough away - accelerate towards target up to maximum speed
      // Apply linear acceleration: new_speed = current_speed + acceleration * time
      const accelerationAmount = this.acceleration * deltaTime;
      newForwardSpeed = Math.min(
        forwardSpeed + accelerationAmount,
        this.maximumSpeed,
      );
    }

    // Create new forward velocity vector with updated speed
    const newVelocityTowards = this.tempVelocityTowards.set(
      direction.x * newForwardSpeed,
      direction.y * newForwardSpeed,
      direction.z * newForwardSpeed,
    );

    // Gradually reduce sideways drift for more natural movement
    // This prevents sliding and creates more realistic character behavior
    const lateralSpeedSquared = velocityLateral.lengthSq();

    if (lateralSpeedSquared > EPSILON) {
      const lateralSpeed = Math.sqrt(lateralSpeedSquared);

      // Calculate dampening factor using exponential decay approach
      // Formula: factor = max(0, 1 - deceleration * deltaTime / current_speed)
      // This provides frame-rate independent lateral dampening
      const lateralDecelerationFactor = Math.max(
        0,
        1 - (this.deceleration * deltaTime) / lateralSpeed,
      );
      velocityLateral.multiplyScalar(lateralDecelerationFactor);
    }

    // Combine dampened lateral velocity with new forward velocity
    this.velocity.addVectors(newVelocityTowards, velocityLateral);

    // Calculate movement for this frame: displacement = velocity * time
    const movementStep = this.tempMovementStep.set(
      this.velocity.x * deltaTime,
      this.velocity.y * deltaTime,
      this.velocity.z * deltaTime,
    );

    // Check if this frame's movement would overshoot the target
    if (movementStep.lengthSq() > distanceToTargetSquared) {
      // Instead of overshooting, snap directly to target and stop
      this.platform.position.copy(target);
      this.velocity.set(0, 0, 0);
      this.speedSquared = 0;
      this.speedInternal = 0;
      this.needsRecalculateSpeed = false;
    } else {
      // Apply movement and update cached speed values
      this.platform.position.add(movementStep);
      this.speedSquared = this.velocity.lengthSq();
      this.speedInternal = 0; // Will be recalculated when needed
      this.needsRecalculateSpeed = true;
    }
  }

  /**
   * Smoothly brings the character to a stop when no target is set.
   *
   * Applies natural deceleration physics until the character comes to a complete stop,
   * maintaining realistic movement feel rather than instant stopping.
   *
   * @param deltaTime - Time elapsed since last update in seconds
   */
  private decelerateToStop(deltaTime: number): void {
    // If already essentially stopped, ensure clean zero state
    if (this.speedSquared < EPSILON) {
      this.velocity.set(0, 0, 0);
      this.speedSquared = 0;
      this.speedInternal = 0;
      this.needsRecalculateSpeed = false;
      return;
    }

    // Only recalculate speed magnitude when necessary (expensive sqrt operation)
    if (this.needsRecalculateSpeed) {
      this.speedInternal = Math.sqrt(this.speedSquared);
      this.needsRecalculateSpeed = false;
    }

    // Apply smooth deceleration using exponential decay approach
    // Formula: new_velocity = current_velocity * (1 - deceleration * deltaTime / current_speed)
    // This provides:
    // - Frame-rate independent deceleration
    // - Smooth exponential slowdown (fast initially, slower as speed decreases)
    // - Natural feeling stops without abrupt velocity changes
    const decelerationFactor = Math.max(
      0,
      1 - (this.deceleration * deltaTime) / this.speedInternal,
    );
    this.velocity.multiplyScalar(decelerationFactor);

    this.speedInternal *= decelerationFactor;
    this.speedSquared = this.speedInternal * this.speedInternal;
    this.needsRecalculateSpeed = false;

    // Apply movement for this frame: position += velocity * deltaTime
    // Using addScaledVector for efficiency (avoids temporary vector creation)
    this.platform.position.addScaledVector(this.velocity, deltaTime);
  }
}
