import {
  Box3,
  BufferAttribute,
  Mesh,
  Quaternion,
  Vector3,
  type Object3D,
  type QuaternionLike,
  type Vector3Like,
} from "three";
import { TimeController } from "../Toolbox/TimeController";
import type { DynamicOptions, StaticOptions } from "./BodyOptions";
import { BodyAxis, isDynamicOptions, isStaticOptions } from "./BodyOptions";
import type { BoxShape, CylinderShape, SphereShape } from "./BodyShape";
import { isBoxShape, isCylinderShape, isSphereShape } from "./BodyShape";
import type { CannonQuaternion, CannonShape } from "./cannonImport";
import {
  CannonBody,
  CannonBox,
  CannonCylinder,
  CannonSphere,
  CannonVec3,
} from "./cannonImport";
import { PhysicsController } from "./PhysicsController";
import type { PhysicsMaterial } from "./PhysicsMaterial";

export class Body {
  private materialInternal?: PhysicsMaterial;

  private readonly body: CannonBody;
  private readonly tempVector0 = new CannonVec3();
  private readonly tempVector1 = new CannonVec3();

  constructor(boxShape: BoxShape, options: StaticOptions | DynamicOptions);
  constructor(
    sphereShape: SphereShape,
    options: StaticOptions | DynamicOptions,
  );
  constructor(
    cylinderShape: CylinderShape,
    options: StaticOptions | DynamicOptions,
  );
  constructor(unknownShape: unknown, unknownOptions: unknown);
  constructor(shape: unknown, options: unknown) {
    let cannonShape: CannonShape;

    if (isBoxShape(shape)) {
      cannonShape = new CannonBox(
        new CannonVec3(shape.width / 2, shape.height / 2, shape.depth / 2),
      );
    } else if (isCylinderShape(shape)) {
      cannonShape = new CannonCylinder(
        shape.radius,
        shape.radius,
        shape.height,
      );
    } else if (isSphereShape(shape)) {
      cannonShape = new CannonSphere(shape.radius);
    } else {
      throw new Error("Unsupported shape type");
    }

    let mass;
    let type;
    let linearFactor = new CannonVec3(1, 1, 1);
    let angularFactor = new CannonVec3(1, 1, 1);

    if (isDynamicOptions(options)) {
      mass = options.mass;
      if (mass <= 0) {
        throw new Error("Mass must be greater than zero");
      }

      type = CannonBody.DYNAMIC;
      const linearLock = options.linearLock ?? 0;
      const angularLock = options.angularLock ?? 0;
      linearFactor.set(
        linearLock & BodyAxis.X ? 0 : 1,
        linearLock & BodyAxis.Y ? 0 : 1,
        linearLock & BodyAxis.Z ? 0 : 1,
      );
      angularFactor.set(
        angularLock & BodyAxis.X ? 0 : 1,
        angularLock & BodyAxis.Y ? 0 : 1,
        angularLock & BodyAxis.Z ? 0 : 1,
      );
    } else if (isStaticOptions(options)) {
      mass = 0;
      type = options.isKinematic ? CannonBody.KINEMATIC : CannonBody.STATIC;
    } else {
      throw new Error("Unsupported body type");
    }

    this.body = new CannonBody({
      mass,
      type,
      shape: cannonShape,
      collisionFilterGroup: options.collision?.group ?? -1,
      collisionFilterMask: options.collision?.mask ?? -1,
      linearFactor,
      angularFactor,
    });

    this.body.material =
      PhysicsController.instance.defaultMaterial["rawCannonMaterial"];
    PhysicsController.instance.rawCannonWorld.addBody(this.body);
  }

  public get material(): PhysicsMaterial | undefined {
    return this.materialInternal;
  }

  public set material(value: PhysicsMaterial | undefined) {
    this.materialInternal = value;
    this.body.material = (this.materialInternal ??
      PhysicsController.instance.defaultMaterial)["rawCannonMaterial"];
  }

  public static buildFromObject(
    object: Object3D,
    options?: StaticOptions | DynamicOptions,
  ): Body {
    const box3 = new Box3();
    const position = new Vector3();

    if (
      object instanceof Mesh &&
      object.geometry.attributes["position"] instanceof BufferAttribute
    ) {
      const positionAttribute = object.geometry.attributes["position"];
      box3.setFromBufferAttribute(positionAttribute);
      box3.getCenter(position);

      const worldPosition = object.getWorldPosition(new Vector3());
      position.add(worldPosition);
    } else {
      box3.setFromObject(object);
      box3.getCenter(position);
    }

    const size = box3.getSize(new Vector3());
    const quaternion = object.getWorldQuaternion(new Quaternion());

    const body = new Body(
      { width: size.x, height: size.y, depth: size.z },
      options,
    );
    body.setTransform(position, quaternion);
    return body;
  }

  public destroy(): void {
    TimeController.instance.once(
      TimeController.Event.TICK,
      () => PhysicsController.instance.rawCannonWorld.removeBody(this.body),
      undefined,
      Infinity,
    );
  }

  public applyForce(force: Vector3Like): void {
    this.tempVector0.set(force.x, force.y, force.z);
    this.body.applyForce(this.tempVector0);
  }

  public applyTorque(torque: Vector3Like): void {
    this.tempVector0.set(torque.x, torque.y, torque.z);
    this.body.applyTorque(this.tempVector0);
  }

  public applyImpulse(impulse: Vector3Like, point?: Vector3Like): void {
    this.tempVector0.set(impulse.x, impulse.y, impulse.z);

    if (point) {
      this.tempVector1.set(point.x, point.y, point.z).vsub(this.body.position);
      this.body.applyImpulse(this.tempVector0, this.tempVector1);
    } else {
      this.body.applyImpulse(this.tempVector0);
    }
  }

  public setVelocity(velocity: Vector3Like): void {
    this.body.velocity.copy(velocity as CannonVec3);
  }

  public setVelocity3f(x: number, y: number, z: number): void {
    this.body.velocity.set(x, y, z);
  }

  public setAngularVelocity(angularVelocity: Vector3Like): void {
    this.body.angularVelocity.copy(angularVelocity as CannonVec3);
  }

  public setAngularVelocity3f(x: number, y: number, z: number): void {
    this.body.angularVelocity.set(x, y, z);
  }

  public setTransform(position: Vector3Like, quaternion: QuaternionLike): void {
    this.body.position.copy(position as CannonVec3);
    this.body.quaternion.copy(quaternion as CannonQuaternion);
    this.body.interpolatedPosition.copy(position as CannonVec3);
    this.body.interpolatedQuaternion.copy(quaternion as CannonQuaternion);
    this.body.updateAABB();
  }

  public setPosition(position: Vector3Like): void {
    this.body.position.copy(position as CannonVec3);
    this.body.interpolatedPosition.copy(position as CannonVec3);
    this.body.updateAABB();
  }

  public setPosition3f(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
    this.body.interpolatedPosition.set(x, y, z);
    this.body.updateAABB();
  }

  public setQuaternion(quaternion: QuaternionLike): void {
    this.body.quaternion.copy(quaternion as CannonQuaternion);
    this.body.interpolatedQuaternion.copy(quaternion as CannonQuaternion);
    this.body.updateAABB();
  }

  public setQuaternion4f(x: number, y: number, z: number, w: number): void {
    this.body.quaternion.set(x, y, z, w);
    this.body.interpolatedQuaternion.set(x, y, z, w);
    this.body.updateAABB();
  }

  public getPosition(result: Vector3): Vector3 {
    return result.copy(this.body.position);
  }

  public getQuaternion(result: Quaternion): Quaternion {
    return result.copy(this.body.quaternion);
  }

  public getVelocity(result: Vector3): Vector3 {
    // return result.copy(this.body.velocity);

    result.x = this.body.velocity.x;
    result.y = this.body.velocity.y;
    result.z = this.body.velocity.z;
    return result;
  }

  public getTransform(
    resultPosition: Vector3,
    resultQuaternion: Quaternion,
  ): Body {
    resultPosition.copy(this.body.position);
    resultQuaternion.copy(this.body.quaternion);
    return this;
  }
}
