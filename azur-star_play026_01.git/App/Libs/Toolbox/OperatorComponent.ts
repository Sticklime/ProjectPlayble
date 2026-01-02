import type { Object3D } from "three";
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { Component } from "./Component";

const POSITION_EPSILON = 0.00001;
const ROTATION_EPSILON = 0.99999;

/**
 * Camera operator component that positions and rotates camera around target platform
 * using spherical coordinates (azimuth, elevation, distance).
 *
 * @example
 * ```typescript
 * const operator = new OperatorComponent(platform);
 * operator.camera = myCamera;
 * operator.setViewOffset(45, 30, 10);
 * ```
 */
export class OperatorComponent extends Component {
  /** Camera object controlled by this operator */
  public camera?: Object3D;
  /** Position interpolation speed factor (higher = faster) */
  public positionLerpFactor = 4;
  /** Rotation interpolation speed factor (higher = faster) */
  public rotationLerpFactor = 16;

  /** Offset from platform position that camera looks at */
  public readonly lookAtOffset = new Vector3(0, 0, 0);
  /** Position offset from platform based on spherical coordinates */
  private readonly positionOffset = new Vector3(1, 1, 1);

  /** Target look-at position (platform position + look-at offset) */
  private readonly desiredLookAt = new Vector3();
  /** Target camera position (platform position + position offset) */
  private readonly desiredPosition = new Vector3();
  /** Target camera rotation quaternion */
  private readonly desiredQuaternion = new Quaternion();

  /** Cached interpolation alpha for position lerping */
  private cachedPositionLerpAlpha = 0;
  /** Cached interpolation alpha for rotation lerping */
  private cachedRotationLerpAlpha = 0;

  /** Last camera position for change detection */
  private readonly lastCameraPosition = new Vector3();
  /** Last camera quaternion for rotation tracking */
  private readonly lastCameraQuaternion = new Quaternion();

  /** Flag indicating if camera is currently rotating */
  private isActiveRotationMode = false;
  /** Last frame delta time for caching interpolation alphas */
  private lastDeltaTime = -1;

  /** Current azimuth angle in radians (horizontal rotation) */
  private azimuthRadians = 0;
  /** Current elevation angle in radians (vertical rotation) */
  private elevationRadians = 0;

  /** Internal azimuth angle in degrees */
  private azimuthInternal = 0;
  /** Internal elevation angle in degrees */
  private elevationInternal = 0;
  /** Internal distance from target */
  private distanceInternal = 0;

  /** Temporary matrix for lookAt calculations */
  private readonly tempMatrix = new Matrix4();
  /** Temporary vector for calculations */
  private readonly tempVector0 = new Vector3();
  /** Temporary vector for calculations */
  private readonly tempVector1 = new Vector3();

  /**
   * Gets current azimuth (horizontal) angle in degrees.
   *
   * @returns Azimuth angle in degrees
   */
  public get azimuth(): number {
    return this.azimuthInternal;
  }

  /**
   * Gets current elevation (vertical) angle in degrees.
   *
   * @returns Elevation angle in degrees
   */
  public get elevation(): number {
    return this.elevationInternal;
  }

  /**
   * Gets current distance from target platform.
   *
   * @returns Distance in world units
   */
  public get distance(): number {
    return this.distanceInternal;
  }

  /**
   * Sets azimuth (horizontal) angle in degrees and updates camera position.
   *
   * @param value - Azimuth angle in degrees
   */
  public set azimuth(value: number) {
    this.azimuthInternal = value;
    this.azimuthRadians = MathUtils.degToRad(value);
    this.updatePositionOffset();
  }

  /**
   * Sets elevation (vertical) angle in degrees and updates camera position.
   *
   * @param value - Elevation angle in degrees
   */
  public set elevation(value: number) {
    this.elevationInternal = value;
    this.elevationRadians = MathUtils.degToRad(value);
    this.updatePositionOffset();
  }

  /**
   * Sets distance from target platform and updates camera position.
   *
   * @param value - Distance in world units
   */
  public set distance(value: number) {
    this.distanceInternal = value;
    this.updatePositionOffset();
  }

  /**
   * Sets azimuth and elevation angles simultaneously.
   * More efficient than setting individually.
   *
   * @param azimuth - Azimuth angle in degrees
   * @param elevation - Elevation angle in degrees
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
   *
   * @param azimuth - Azimuth angle in degrees
   * @param elevation - Elevation angle in degrees
   * @param distance - Distance from target in world units
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
   * Update loop called every frame to interpolate camera position and rotation.
   *
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  protected override onTick(deltaTime: number): void {
    if (!this.camera) {
      return;
    }

    // Recalculate interpolation alphas only if deltaTime changed significantly
    // Avoids expensive Math.exp calculations every frame
    if (Math.abs(deltaTime - this.lastDeltaTime) > POSITION_EPSILON) {
      this.lastDeltaTime = deltaTime;

      // Calculate exponential decay interpolation alpha: 1 - e^(-factor * deltaTime)
      // Provides frame-rate independent interpolation
      this.cachedPositionLerpAlpha =
        1 - Math.exp(-this.positionLerpFactor * deltaTime);
      this.cachedRotationLerpAlpha =
        1 - Math.exp(-this.rotationLerpFactor * deltaTime);
    }

    // Calculate target camera position: platform position + spherical offset
    this.desiredPosition.addVectors(
      this.platform.position,
      this.positionOffset,
    );

    // Calculate target look-at point: platform position + look-at offset
    this.desiredLookAt.addVectors(this.platform.position, this.lookAtOffset);

    // Update position only if camera moved significantly
    if (
      this.desiredPosition.distanceToSquared(this.lastCameraPosition) >
      POSITION_EPSILON
    ) {
      this.lastCameraPosition.copy(this.camera.position);

      // Linear interpolation with exponentially calculated alpha
      this.camera.position.lerp(
        this.desiredPosition,
        this.cachedPositionLerpAlpha,
      );
    }

    // Update rotation if rotating or camera needs alignment
    if (
      this.isActiveRotationMode ||
      this.isCameraNeedsAlignment(this.camera, this.desiredLookAt)
    ) {
      // Create look-at matrix from current position to target
      this.tempMatrix.lookAt(
        this.camera.position,
        this.desiredLookAt,
        this.camera.up,
      );

      // Extract quaternion from look-at matrix
      this.desiredQuaternion.setFromRotationMatrix(this.tempMatrix);

      // Spherical linear interpolation (SLERP) between rotations
      this.camera.quaternion.slerp(
        this.desiredQuaternion,
        this.cachedRotationLerpAlpha,
      );

      // Check if rotation still active by comparing with last frame
      this.isActiveRotationMode = !this.lastCameraQuaternion.equals(
        this.camera.quaternion,
      );
      this.lastCameraQuaternion.copy(this.camera.quaternion);
    }
  }

  /**
   * Checks if camera needs rotation alignment using dot product.
   *
   * @param camera - Camera object to check
   * @param target - Target position to look at
   * @returns True if camera needs alignment
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
   * Updates position offset vector based on spherical coordinates.
   * Converts spherical to Cartesian coordinates.
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
