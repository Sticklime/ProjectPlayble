import * as CANNON from "cannon-es";
import * as PhysicsHandler from "PhysicsHandler";
import { AnyShape, isBoxShape, isCylinderShape, isSphereShape } from "Shape";
import * as THREE from "three";
import { TimeHandler } from "TimeHandler";

export enum Axis {
  X = 1 << 0,
  Y = 1 << 1,
  Z = 1 << 2,
}

interface DynamicOptions {
  mass: number;

  linearLock?: Axis;
  angularLock?: Axis;

  collisionGroup?: number;
  collisionMask?: number;
}

interface StaticOptions {
  isKinematic: boolean;

  collisionGroup?: number;
  collisionMask?: number;
}

type AnyOptions = DynamicOptions | StaticOptions;

function isDynamicOptions(obj: any): obj is DynamicOptions {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "mass" in obj &&
    !("isKinematic" in obj) &&
    typeof obj.mass === "number"
  );
}

function isStaticOptions(obj: any): obj is StaticOptions {
  return (
    typeof obj === "object" &&
    obj !== null &&
    !("mass" in obj) &&
    "isKinematic" in obj &&
    typeof obj.isKinematic === "boolean"
  );
}

export class Body {
  private body: CANNON.Body;
  private tempVector3_0: CANNON.Vec3 = new CANNON.Vec3();
  private tempVector3_1: CANNON.Vec3 = new CANNON.Vec3();
  private tempQuaternion: CANNON.Quaternion = new CANNON.Quaternion();

  public constructor(shape: AnyShape, options: AnyOptions) {
    let cannonShape: CANNON.Shape;

    if (isBoxShape(shape)) {
      const { width, height, depth } = shape;
      cannonShape = new CANNON.Box(
        new CANNON.Vec3(width / 2, height / 2, depth / 2),
      );
    } else if (isSphereShape(shape)) {
      const { radius } = shape;
      cannonShape = new CANNON.Sphere(radius);
    } else if (isCylinderShape(shape)) {
      const { radius, height } = shape;
      cannonShape = new CANNON.Cylinder(radius, radius, height);
    } else {
      throw new Error("Unsupported shape type");
    }

    let mass;
    let type;
    let linearFactor = new CANNON.Vec3(1, 1, 1);
    let angularFactor = new CANNON.Vec3(1, 1, 1);

    if (isDynamicOptions(options)) {
      mass = options.mass;
      if (mass <= 0) throw new Error("Mass must be greater than zero");

      type = CANNON.Body.DYNAMIC;
      const linearLock = options.linearLock ?? 0;
      const angularLock = options.angularLock ?? 0;
      linearFactor.set(
        linearLock & Axis.X ? 0 : 1,
        linearLock & Axis.Y ? 0 : 1,
        linearLock & Axis.Z ? 0 : 1,
      );
      angularFactor.set(
        angularLock & Axis.X ? 0 : 1,
        angularLock & Axis.Y ? 0 : 1,
        angularLock & Axis.Z ? 0 : 1,
      );
    } else if (isStaticOptions(options)) {
      mass = 0;
      type = options.isKinematic ? CANNON.Body.KINEMATIC : CANNON.Body.STATIC;
    } else {
      throw new Error("Unsupported body type");
    }

    this.body = new CANNON.Body({
      mass,
      type,
      shape: cannonShape,
      collisionFilterGroup: options.collisionGroup,
      collisionFilterMask: options.collisionMask,
      linearFactor,
      angularFactor,
    });

    PhysicsHandler.instance.addBody(this.body);
  }

  public destroy() {
    TimeHandler.instance.once(
      TimeHandler.EEvent.TICK,
      () => PhysicsHandler.instance.removeBody(this.body),
      null,
      Infinity,
    );
  }

  public applyForce(force: THREE.Vector3Like) {
    this.tempVector3_0.set(force.x, force.y, force.z);
    this.body.applyForce(this.tempVector3_0);
  }

  public applyTorque(torque: THREE.Vector3Like) {
    this.tempVector3_0.set(torque.x, torque.y, torque.z);
    this.body.applyTorque(this.tempVector3_0);
  }

  public applyImpulse(impulse: THREE.Vector3Like, point?: THREE.Vector3Like) {
    this.tempVector3_0.set(impulse.x, impulse.y, impulse.z);

    if (point) {
      this.tempVector3_1
        .set(point.x, point.y, point.z)
        .vsub(this.body.position);

      this.body.applyImpulse(this.tempVector3_0, this.tempVector3_1);
    } else {
      this.body.applyImpulse(this.tempVector3_0);
    }
  }

  public setVelocity(velocity: THREE.Vector3Like) {
    //@ts-ignore
    this.body.velocity.copy(velocity);
  }

  public setAngularVelocity(angularVelocity: THREE.Vector3Like) {
    //@ts-ignore
    this.body.angularVelocity.copy(angularVelocity);
  }

  public setTransform(
    position: THREE.Vector3Like,
    quaternion: THREE.QuaternionLike,
  ) {
    //@ts-ignore
    this.body.position.copy(position);
    //@ts-ignore
    this.body.quaternion.copy(quaternion);
    //@ts-ignore
    this.body.interpolatedPosition.copy(position);
    //@ts-ignore
    this.body.interpolatedQuaternion.copy(quaternion);
  }

  public setPosition(position: THREE.Vector3Like) {
    //@ts-ignore
    this.body.position.copy(position);
    //@ts-ignore
    this.body.interpolatedPosition.copy(position);
  }

  public setQuaternion(quaternion: THREE.QuaternionLike) {
    //@ts-ignore
    this.body.quaternion.copy(quaternion);
    //@ts-ignore
    this.body.interpolatedQuaternion.copy(quaternion);
  }

  public getPosition(result: THREE.Vector3): THREE.Vector3 {
    return result.copy(this.body.position);
  }

  public getQuaternion(result: THREE.Quaternion): THREE.Quaternion {
    return result.copy(this.body.quaternion);
  }

  public getVelocity(result: THREE.Vector3): THREE.Vector3 {
    return result.copy(this.body.velocity);
  }
}
