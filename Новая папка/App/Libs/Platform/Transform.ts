import type { Object3D } from "three";
import { Quaternion, Vector3 } from "three";

/**
 * Wrapper for Object3D transforms (analogous to Transform in Unity).
 *
 * Provides convenient getters and setters for world and local position, rotation, and scale.
 */
export class Transform {
  private readonly cachedPosition = new Vector3();
  private readonly cachedQuaternion = new Quaternion();
  private readonly cachedScale = new Vector3(1, 1, 1);

  private readonly cachedUp = new Vector3();
  private readonly cachedForward = new Vector3();
  private readonly cachedRight = new Vector3();

  private isDirty = false;

  constructor(private readonly object: Object3D) {}

  // World transforms

  /**
   * World position.
   */
  get position(): Vector3 {
    this.object.getWorldPosition(this.cachedPosition);
    return this.cachedPosition;
  }

  /**
   * World position.
   */
  set position(value: Vector3) {
    this.cachedPosition.copy(value);
    this.isDirty = true;
  }

  /**
   * World quaternion rotation.
   */
  get quaternion(): Quaternion {
    this.object.getWorldQuaternion(this.cachedQuaternion);
    return this.cachedQuaternion;
  }

  /**
   * World quaternion rotation.
   */
  set quaternion(value: Quaternion) {
    this.cachedQuaternion.copy(value);
    this.isDirty = true;
  }

  /**
   * World scale.
   */
  get scale(): Vector3 {
    this.object.getWorldScale(this.cachedScale);
    return this.cachedScale;
  }

  /**
   * World scale.
   */
  set scale(value: Vector3) {
    this.cachedScale.copy(value);
    this.isDirty = true;
  }

  /**
   * Sets world position from components.
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   */
  public setPosition3f(x: number, y: number, z: number): void {
    this.cachedPosition.set(x, y, z);
    this.isDirty = true;
  }

  /**
   * Sets world quaternion rotation from components.
   *
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @param w - W component
   */
  public setQuaternion4f(x: number, y: number, z: number, w: number): void {
    this.cachedQuaternion.set(x, y, z, w);
    this.isDirty = true;
  }

  /**
   * Sets world scale from components.
   *
   * @param x - X scale
   * @param y - Y scale
   * @param z - Z scale
   */
  public setScale3f(x: number, y: number, z: number): void {
    this.cachedScale.set(x, y, z);
    this.isDirty = true;
  }

  /**
   * World up direction.
   */
  get up(): Vector3 {
    this.cachedUp.set(0, 1, 0);
    this.cachedUp.applyQuaternion(this.quaternion);
    return this.cachedUp;
  }

  /**
   * World forward direction.
   */
  get forward(): Vector3 {
    this.cachedForward.set(0, 0, -1);
    this.cachedForward.applyQuaternion(this.quaternion);
    return this.cachedForward;
  }

  /**
   * World right direction.
   */
  get right(): Vector3 {
    this.cachedRight.set(1, 0, 0);
    this.cachedRight.applyQuaternion(this.quaternion);
    return this.cachedRight;
  }

  // Local transforms

  /**
   * Local position relative to parent.
   */
  get localPosition(): Vector3 {
    return this.object.position;
  }

  /**
   * Local position relative to parent.
   */
  set localPosition(value: Vector3) {
    this.object.position.copy(value);
  }

  /**
   * Local quaternion rotation relative to parent.
   */
  get localQuaternion(): Quaternion {
    return this.object.quaternion;
  }

  /**
   * Local quaternion rotation relative to parent.
   */
  set localQuaternion(value: Quaternion) {
    this.object.quaternion.copy(value);
  }

  /**
   * Local scale relative to parent.
   */
  get localScale(): Vector3 {
    return this.object.scale;
  }

  /**
   * Local scale relative to parent.
   */
  set localScale(value: Vector3) {
    this.object.scale.copy(value);
  }

  /**
   * Sets local position from components.
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate
   */
  public setLocalPosition3f(x: number, y: number, z: number): void {
    this.object.position.set(x, y, z);
  }

  /**
   * Sets local quaternion rotation from components.
   *
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @param w - W component
   */
  public setLocalQuaternion4f(
    x: number,
    y: number,
    z: number,
    w: number,
  ): void {
    this.object.quaternion.set(x, y, z, w);
  }

  /**
   * Sets local scale from components.
   *
   * @param x - X scale
   * @param y - Y scale
   * @param z - Z scale
   */
  public setLocalScale3f(x: number, y: number, z: number): void {
    this.object.scale.set(x, y, z);
  }

  /**
   * Applies cached world transforms to object.
   */
  protected applyTransform(): void {
    if (!this.isDirty) {
      return;
    }

    if (this.object.parent) {
      this.object.parent.updateMatrixWorld();

      const parentMatrixInverse = this.object.parent.matrixWorld
        .clone()
        .invert();

      const localPosition = this.cachedPosition
        .clone()
        .applyMatrix4(parentMatrixInverse);
      this.object.position.copy(localPosition);

      const parentQuaternionInverse = new Quaternion();
      this.object.parent.getWorldQuaternion(parentQuaternionInverse).invert();
      const localQuaternion = this.cachedQuaternion
        .clone()
        .premultiply(parentQuaternionInverse);
      this.object.quaternion.copy(localQuaternion);

      const parentScale = new Vector3();
      this.object.parent.getWorldScale(parentScale);
      const localScale = this.cachedScale.clone().divide(parentScale);
      this.object.scale.copy(localScale);
    } else {
      this.object.position.copy(this.cachedPosition);
      this.object.quaternion.copy(this.cachedQuaternion);
      this.object.scale.copy(this.cachedScale);
    }

    this.isDirty = false;
  }
}
