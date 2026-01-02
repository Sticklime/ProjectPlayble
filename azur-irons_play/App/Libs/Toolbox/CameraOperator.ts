import { TimeHandler } from "Libs/Toolbox/TimeHandler";
import { MathUtils, Object3D, Quaternion, Vector3 } from "three";

export class Object3DOperator {
  public target?: Object3D;
  public readonly priority: number = 2000;

  public aimingSpeed: number = 8;
  public movementSpeed: number = 2;

  private _elevation: number = 20;
  private _azimuth: number = 0;
  private _distance: number = 15;

  private camera: Object3D;
  private _isActive: boolean;

  private lastTargetPosition = new Vector3();
  private lastCameraPosition = new Vector3();

  private forwardVector = new Vector3(0, 0, -1);
  private cameraOffset = new Vector3();

  private tempVector3_1 = new Vector3();
  private tempVector3_0 = new Vector3();
  private tempQuaternion_1 = new Quaternion();
  private tempQuaternion_0 = new Quaternion();

  public constructor(
    camera: Object3D,
    target?: Object3D,
    isActive: boolean = false,
  ) {
    this.camera = camera;
    this.target = target;

    this.updateCameraOffset();
    this._isActive = isActive ?? false;

    if (this._isActive) {
      this.subscribe();
    }
  }

  public destroy(): void {
    this.unsubscribe();
  }

  private subscribe() {
    TimeHandler.instance.on(
      TimeHandler.Event.tick,
      this.onTick,
      this,
      this.priority,
    );
  }

  private unsubscribe() {
    TimeHandler.instance.off(TimeHandler.Event.tick, this.onTick, this);
  }

  private onTick(deltaTime: number): void {
    if (this.target) this.target.getWorldPosition(this.lastTargetPosition);
    this.lastCameraPosition.copy(this.camera.position);

    this.updateCameraPosition(deltaTime);
    this.updateRotation(deltaTime);
  }

  private updateCameraPosition(deltaTime: number): void {
    const cameraTargetPosition = this.tempVector3_0.addVectors(
      this.lastTargetPosition,
      this.cameraOffset,
    );

    const cameraLerpedPosition = this.tempVector3_1.lerpVectors(
      this.lastCameraPosition,
      cameraTargetPosition,
      Math.min(1, this.movementSpeed * deltaTime),
    );

    this.camera.position.copy(cameraLerpedPosition);
  }

  private updateRotation(deltaTime: number): void {
    const cameraTargetForward = this.tempVector3_0
      .subVectors(this.lastTargetPosition, this.lastCameraPosition)
      .normalize();

    const cameraTargetQuaternion = this.tempQuaternion_0.setFromUnitVectors(
      this.forwardVector,
      cameraTargetForward,
    );

    const cameraCurrentQuaternion = this.camera.getWorldQuaternion(
      this.tempQuaternion_1,
    );

    cameraCurrentQuaternion.slerp(
      cameraTargetQuaternion,
      Math.min(1, this.aimingSpeed * deltaTime),
    );

    this.camera.quaternion.copy(cameraCurrentQuaternion);
  }

  private updateCameraOffset(): void {
    const elevation = MathUtils.degToRad(this._elevation);
    const azimuth = MathUtils.degToRad(this._azimuth);

    this.cameraOffset
      .set(
        Math.cos(elevation) * Math.sin(azimuth),
        Math.sin(elevation),
        Math.cos(elevation) * Math.cos(azimuth),
      )
      .multiplyScalar(this._distance);
  }

  public warp(power: number = 1): Object3DOperator {
    if (!this.target) {
      throw new Error("Teleporting without a target is not allowed");
    }

    this.target.getWorldPosition(this.lastTargetPosition);
    this.lastCameraPosition.copy(this.camera.position);

    this.updateCameraPosition(power);
    this.updateRotation(power);

    return this;
  }

  public get elevation(): number {
    return this._elevation;
  }

  public set elevation(value: number) {
    this._elevation = value;
    this.updateCameraOffset();
  }

  public get azimuth(): number {
    return this._azimuth;
  }

  public set azimuth(value: number) {
    this._azimuth = value;
    this.updateCameraOffset();
  }

  public get distance(): number {
    return this._distance;
  }

  public set distance(value: number) {
    this._distance = value;
    this.updateCameraOffset();
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public set isActive(value: boolean) {
    if (this._isActive === value) return;
    this._isActive = value;

    if (this._isActive) {
      this.subscribe();
    } else {
      this.unsubscribe();
    }
  }
}
