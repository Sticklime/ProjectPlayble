import type { Object3D } from "three";
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { Component } from "./Component";

const POSITION_EPSILON = 0.00001;
const ROTATION_EPSILON = 0.99999;

/**
 * Camera operator using spherical coordinates (azimuth, elevation, distance).
 *
 * Smoothly interpolates camera position and rotation around target platform.
 */
export class OperatorComponent extends Component {
  public camera?: Object3D;
  public positionLerpFactor = 4;
  public rotationLerpFactor = 16;
  public readonly lookAtOffset = new Vector3(0, 0, 0);

  private readonly positionOffset = new Vector3(1, 1, 1);
  private readonly desiredLookAt = new Vector3();
  private readonly desiredPosition = new Vector3();
  private readonly desiredQuaternion = new Quaternion();
  private cachedPositionLerpAlpha = 0;
  private cachedRotationLerpAlpha = 0;
  private readonly lastCameraPosition = new Vector3();
  private readonly lastCameraQuaternion = new Quaternion();
  private isActiveRotationMode = false;
  private lastDeltaTime = -1;
  private azimuthRadians = 0;
  private elevationRadians = 0;
  private azimuthInternal = 0;
  private elevationInternal = 0;
  private distanceInternal = 0;
  private readonly tempMatrix = new Matrix4();
  private readonly tempVector0 = new Vector3();
  private readonly tempVector1 = new Vector3();

  /**
   * Azimuth angle (degrees).
   */
  public get azimuth(): number {
    return this.azimuthInternal;
  }

  /**
   * Elevation angle (degrees).
   */
  public get elevation(): number {
    return this.elevationInternal;
  }

  /**
   * Distance from target.
   */
  public get distance(): number {
    return this.distanceInternal;
  }

  /**
   * Azimuth angle (degrees).
   */
  public set azimuth(value: number) {
    this.azimuthInternal = value;
    this.azimuthRadians = MathUtils.degToRad(value);
    this.updatePositionOffset();
  }

  /**
   * Elevation angle (degrees).
   */
  public set elevation(value: number) {
    this.elevationInternal = value;
    this.elevationRadians = MathUtils.degToRad(value);
    this.updatePositionOffset();
  }

  /**
   * Distance from target.
   */
  public set distance(value: number) {
    this.distanceInternal = value;
    this.updatePositionOffset();
  }

  /**
   * Sets azimuth and elevation simultaneously.
   *
   * @param azimuth - Angle (degrees)
   * @param elevation - Angle (degrees)
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
   * @param azimuth - Angle (degrees)
   * @param elevation - Angle (degrees)
   * @param distance - Distance from target
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

  protected override onFixedTick(deltaTime: number): void {
    if (!this.camera) {
      return;
    }

    if (Math.abs(deltaTime - this.lastDeltaTime) > POSITION_EPSILON) {
      this.lastDeltaTime = deltaTime;
      this.cachedPositionLerpAlpha =
        1 - Math.exp(-this.positionLerpFactor * deltaTime);
      this.cachedRotationLerpAlpha =
        1 - Math.exp(-this.rotationLerpFactor * deltaTime);
    }

    this.desiredPosition.addVectors(
      this.platform.position,
      this.positionOffset,
    );
    this.desiredLookAt.addVectors(this.platform.position, this.lookAtOffset);

    if (
      this.desiredPosition.distanceToSquared(this.lastCameraPosition) >
      POSITION_EPSILON
    ) {
      this.lastCameraPosition.copy(this.camera.position);
      this.camera.position.lerp(
        this.desiredPosition,
        this.cachedPositionLerpAlpha,
      );
    }

    if (
      this.isActiveRotationMode ||
      this.isCameraNeedsAlignment(this.camera, this.desiredLookAt)
    ) {
      this.tempMatrix.lookAt(
        this.camera.position,
        this.desiredLookAt,
        this.camera.up,
      );
      this.desiredQuaternion.setFromRotationMatrix(this.tempMatrix);
      this.camera.quaternion.slerp(
        this.desiredQuaternion,
        this.cachedRotationLerpAlpha,
      );
      this.isActiveRotationMode = !this.lastCameraQuaternion.equals(
        this.camera.quaternion,
      );
      this.lastCameraQuaternion.copy(this.camera.quaternion);
    }
  }

  private isCameraNeedsAlignment(camera: Object3D, target: Vector3): boolean {
    return (
      camera
        .getWorldDirection(this.tempVector0)
        .dot(this.tempVector1.subVectors(camera.position, target).normalize()) <
      ROTATION_EPSILON
    );
  }

  private updatePositionOffset(): void {
    const cosElevation = Math.cos(this.elevationRadians);
    this.positionOffset.set(
      this.distanceInternal * cosElevation * Math.sin(this.azimuthRadians),
      this.distanceInternal * Math.sin(this.elevationRadians),
      this.distanceInternal * cosElevation * Math.cos(this.azimuthRadians),
    );
  }
}
