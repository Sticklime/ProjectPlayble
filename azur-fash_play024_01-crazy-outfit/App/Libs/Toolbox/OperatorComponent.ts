import type { Object3D } from "three";
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { Component } from "./Component";

const POSITION_EPSILON = 0.001;
const ROTATION_EPSILON = 0.99995;

/**
 * Camera operator component that provides smooth camera positioning and rotation
 * around a target platform using spherical coordinates (azimuth, elevation, distance).
 *
 * This component smoothly interpolates camera position and rotation to follow
 * a target object while maintaining specified offset and look-at behavior.
 *
 * @example
 * ```typescript
 * const operator = new OperatorComponent();
 * operator.camera = myCamera;
 * operator.setViewOffset(45, 30, 10); // 45° azimuth, 30° elevation, 10 units distance
 * ```
 */
export class OperatorComponent extends Component {
  /** The camera object to be controlled by this operator */
  public camera?: Object3D;
  /** Factor controlling the speed of position interpolation (higher = faster) */
  public positionLerpFactor = 4;
  /** Factor controlling the speed of rotation interpolation (higher = faster) */
  public rotationLerpFactor = 16;

  /** Offset from platform position that the camera should look at */
  public readonly lookAtOffset = new Vector3(0, 0, 0);
  /** Calculated position offset from platform based on spherical coordinates */
  private readonly positionOffset = new Vector3(1, 1, 1);

  /** Target look-at position (platform position + look-at offset) */
  private readonly desiredLookAt = new Vector3();
  /** Target camera position (platform position + position offset) */
  private readonly desiredPosition = new Vector3();
  /** Target camera rotation quaternion for looking at the target */
  private readonly desiredQuaternion = new Quaternion();

  /** Cached interpolation alpha for position lerping (performance optimization) */
  private cachedPositionLerpAlpha = 0;
  /** Cached interpolation alpha for rotation lerping (performance optimization) */
  private cachedRotationLerpAlpha = 0;

  /** Last recorded camera position for change detection */
  private readonly lastCameraPosition = new Vector3();
  /** Last recorded camera quaternion for rotation state tracking */
  private readonly lastCameraQuaternion = new Quaternion();

  /** Flag indicating if camera is currently rotating (for optimization) */
  private isActiveRotationMode = false;
  /** Last frame delta time for caching interpolation alphas */
  private lastDeltaTime = -1;

  /** Current azimuth angle in radians (horizontal rotation around Y-axis) */
  private azimuthRadians = 0;
  /** Current elevation angle in radians (vertical rotation) */
  private elevationRadians = 0;

  /** Internal storage for azimuth angle in degrees */
  private azimuthInternal = 0;
  /** Internal storage for elevation angle in degrees */
  private elevationInternal = 0;
  /** Internal storage for distance from target */
  private distanceInternal = 0;

  /** Temporary matrix for lookAt calculations (reused for performance) */
  private readonly tempMatrix = new Matrix4();
  /** Temporary vector for calculations (reused for performance) */
  private readonly tempVector0 = new Vector3();
  /** Temporary vector for calculations (reused for performance) */
  private readonly tempVector1 = new Vector3();

  /**
   * Gets the current azimuth (horizontal) angle in degrees.
   * Azimuth represents rotation around the Y-axis.
   *
   * @returns The azimuth angle in degrees
   */
  public get azimuth(): number {
    return this.azimuthInternal;
  }

  /**
   * Gets the current elevation (vertical) angle in degrees.
   * Elevation represents vertical rotation (pitch).
   *
   * @returns The elevation angle in degrees
   */
  public get elevation(): number {
    return this.elevationInternal;
  }

  /**
   * Gets the current distance from the target platform.
   *
   * @returns The distance in world units
   */
  public get distance(): number {
    return this.distanceInternal;
  }

  /**
   * Sets the azimuth (horizontal) angle in degrees and updates the camera position.
   *
   * @param value - The azimuth angle in degrees
   */
  public set azimuth(value: number) {
    this.azimuthInternal = value;
    this.azimuthRadians = MathUtils.degToRad(value);
    this.updatePositionOffset();
  }

  /**
   * Sets the elevation (vertical) angle in degrees and updates the camera position.
   *
   * @param value - The elevation angle in degrees
   */
  public set elevation(value: number) {
    this.elevationInternal = value;
    this.elevationRadians = MathUtils.degToRad(value);
    this.updatePositionOffset();
  }

  /**
   * Sets the distance from the target platform and updates the camera position.
   *
   * @param value - The distance in world units
   */
  public set distance(value: number) {
    this.distanceInternal = value;
    this.updatePositionOffset();
  }

  /**
   * Sets both azimuth and elevation angles simultaneously.
   * More efficient than setting them individually as it only calls updatePositionOffset once.
   *
   * @param azimuth - The azimuth angle in degrees
   * @param elevation - The elevation angle in degrees
   */
  public setView(azimuth: number, elevation: number): void {
    this.azimuthInternal = azimuth;
    this.elevationInternal = elevation;
    this.azimuthRadians = MathUtils.degToRad(azimuth);
    this.elevationRadians = MathUtils.degToRad(elevation);
    this.updatePositionOffset();
  }

  /**
   * Sets azimuth, elevation, and distance simultaneously.
   * Most efficient way to set all camera positioning parameters at once.
   *
   * @param azimuth - The azimuth angle in degrees
   * @param elevation - The elevation angle in degrees
   * @param distance - The distance from target in world units
   */
  public setViewOffset(
    azimuth: number,
    elevation: number,
    distance: number,
  ): void {
    this.azimuthInternal = azimuth;
    this.elevationInternal = elevation;
    this.azimuthRadians = MathUtils.degToRad(azimuth);
    this.elevationRadians = MathUtils.degToRad(elevation);
    this.distanceInternal = distance;
    this.updatePositionOffset();
  }

  /**
   * Main update loop called every frame to smoothly interpolate camera position and rotation.
   *
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  protected override onTick(deltaTime: number): void {
    if (!this.camera) {
      return;
    }

    // Only recalculate interpolation alphas if deltaTime has changed significantly
    // This optimization avoids expensive Math.exp calculations every frame
    if (Math.abs(deltaTime - this.lastDeltaTime) > POSITION_EPSILON) {
      this.lastDeltaTime = deltaTime;

      // Calculate exponential decay interpolation alpha using formula:
      // alpha = 1 - e^(-factor * deltaTime)
      // This provides smooth, frame-rate independent interpolation where:
      // - Higher factor = faster convergence
      // - Alpha approaches 1 as deltaTime increases
      // - At deltaTime = 0, alpha = 0 (no interpolation)
      this.cachedPositionLerpAlpha =
        1 - Math.exp(-this.positionLerpFactor * deltaTime);
      this.cachedRotationLerpAlpha =
        1 - Math.exp(-this.rotationLerpFactor * deltaTime);
    }

    // Calculate target camera position: platform position + spherical offset
    // positionOffset is computed from spherical coordinates (azimuth, elevation, distance)
    this.desiredPosition.addVectors(
      this.platform.position,
      this.positionOffset,
    );

    // Calculate target look-at point: platform position + look-at offset
    // This is where the camera should be pointing
    this.desiredLookAt.addVectors(this.platform.position, this.lookAtOffset);

    // Only update position if the camera has moved significantly
    if (
      this.desiredPosition.distanceToSquared(this.lastCameraPosition) >
      POSITION_EPSILON
    ) {
      this.lastCameraPosition.copy(this.camera.position);

      // Linear interpolation: current = current + (target - current) * alpha
      // Where alpha is exponentially calculated for smooth, frame-rate independent motion
      this.camera.position.lerp(
        this.desiredPosition,
        this.cachedPositionLerpAlpha,
      );
    }

    // Update rotation if currently rotating OR if camera needs alignment
    if (
      this.isActiveRotationMode ||
      this.isCameraNeedsAlignment(this.camera, this.desiredLookAt)
    ) {
      // Create look-at matrix from current camera position to desired target
      // This matrix represents the rotation needed to look at the target
      this.tempMatrix.lookAt(
        this.camera.position,
        this.desiredLookAt,
        this.camera.up,
      );

      // Extract quaternion from the look-at matrix
      // Quaternions provide smooth rotation interpolation without gimbal lock
      this.desiredQuaternion.setFromRotationMatrix(this.tempMatrix);

      // Spherical linear interpolation (SLERP) between current and desired rotation
      // SLERP maintains constant angular velocity and is ideal for 3D rotations
      // Formula: q(t) = (sin((1-t)θ) * q1 + sin(tθ) * q2) / sin(θ)
      // Where θ is the angle between quaternions q1 and q2
      this.camera.quaternion.slerp(
        this.desiredQuaternion,
        this.cachedRotationLerpAlpha,
      );

      // Check if rotation is still active by comparing with last frame
      // If quaternions are equal, rotation has stopped and we can go into lazy mode
      this.isActiveRotationMode = !this.lastCameraQuaternion.equals(
        this.camera.quaternion,
      );
      this.lastCameraQuaternion.copy(this.camera.quaternion);
    }
  }

  /**
   * Checks if the camera needs rotation alignment by comparing its current direction
   * with the direction towards the target using dot product.
   *
   * @param camera - The camera object to check
   * @param target - The target position to look at
   * @returns True if camera needs alignment (dot product below threshold)
   */
  private isCameraNeedsAlignment(camera: Object3D, target: Vector3): boolean {
    return (
      camera
        .getWorldDirection(this.tempVector0)
        .dot(this.tempVector1.subVectors(camera.position, target).normalize()) <
      ROTATION_EPSILON
    );
  }

  /**
   * Updates the position offset vector based on current spherical coordinates.
   * Converts spherical coordinates (azimuth, elevation, distance) to Cartesian coordinates.
   *
   * The calculation follows standard spherical coordinate conversion:
   * - X = distance * cos(elevation) * sin(azimuth)
   * - Y = distance * sin(elevation)
   * - Z = distance * cos(elevation) * cos(azimuth)
   */
  private updatePositionOffset(): void {
    const cosElevation = Math.cos(this.elevationRadians);
    this.positionOffset.set(
      this.distanceInternal * cosElevation * Math.sin(this.azimuthRadians),
      this.distanceInternal * Math.sin(this.elevationRadians),
      this.distanceInternal * cosElevation * Math.cos(this.azimuthRadians),
    );
  }
}
