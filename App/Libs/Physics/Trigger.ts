import { Eventail } from "eventail";
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
import type { Collision } from "./BodyOptions";
import { isSphereShape, type BoxShape, type SphereShape } from "./BodyShape";
import { PhysicsController } from "./PhysicsController";
import type { TransformUnitScale } from "./Transform";
import {
  CannonBody,
  CannonBox,
  CannonQuaternion,
  CannonSphere,
  CannonVec3,
} from "./cannonImport";

export enum TriggerEvent {
  ENTER = "enter",
  EXIT = "exit",
}

export interface TriggerOptions {
  shape: BoxShape | SphereShape;
  collision: Collision;
  automaticDestroyShape: boolean;
}

export class Trigger extends Eventail {
  private readonly body: CannonBody;
  private readonly contactBodies: Set<CannonBody> = new Set();
  private readonly automaticDestroyShape: boolean;

  constructor(
    transform: TransformUnitScale,
    options: Partial<TriggerOptions> = {},
  ) {
    super();
    this.automaticDestroyShape = options.automaticDestroyShape ?? true;

    const rawShape = options.shape ?? { radius: 1 };
    const shape = isSphereShape(rawShape)
      ? new CannonSphere(rawShape.radius)
      : new CannonBox(
          new CannonVec3(
            rawShape.width / 2,
            rawShape.height / 2,
            rawShape.depth / 2,
          ),
        );

    this.body = new CannonBody({
      isTrigger: true,
      shape,
      position: new CannonVec3(
        transform.position.x,
        transform.position.y,
        transform.position.z,
      ),
      quaternion: new CannonQuaternion(
        transform.quaternion.x,
        transform.quaternion.y,
        transform.quaternion.z,
        transform.quaternion.w,
      ),
      allowSleep: false,
      collisionFilterGroup: options.collision?.group ?? -1,
      collisionFilterMask: options.collision?.mask ?? -1,
    });

    PhysicsController.instance.rawCannonWorld.addBody(this.body);

    PhysicsController.instance.rawCannonWorld.addEventListener(
      "beginContact",
      this.onContactBegin,
    );

    PhysicsController.instance.rawCannonWorld.addEventListener(
      "endContact",
      this.onContactEnd,
    );
  }

  public static buildFromObject(
    object: Object3D,
    options: Partial<{
      shape: BoxShape | SphereShape;
      collision: Collision;
      automaticDestroyShape: boolean;
    }>,
  ): Trigger {
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

    const quaternion = object.getWorldQuaternion(new Quaternion());

    return new Trigger(
      {
        position,
        quaternion,
      },
      {
        shape: options.shape,
        collision: options.collision,
        automaticDestroyShape: options.automaticDestroyShape,
      },
    );
  }

  public destroy(): void {
    TimeController.instance.once(
      TimeController.Event.TICK,
      () => {
        PhysicsController.instance.rawCannonWorld.removeEventListener(
          "beginContact",
          this.onContactBegin,
        );
        PhysicsController.instance.rawCannonWorld.removeEventListener(
          "endContact",
          this.onContactEnd,
        );
        PhysicsController.instance.rawCannonWorld.removeBody(this.body);
      },
      this.body,
      Infinity,
    );
  }

  public getPosition(position: Vector3): Trigger {
    position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    );
    return this;
  }

  public getQuaternion(quaternion: Quaternion): Trigger {
    quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w,
    );
    return this;
  }

  public setPosition(position: Vector3Like): Trigger {
    this.body.position.set(position.x, position.y, position.z);
    this.body.interpolatedPosition.copy(this.body.position);
    return this;
  }

  public setQuaternion(quaternion: QuaternionLike): Trigger {
    this.body.quaternion.set(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
    );
    this.body.interpolatedQuaternion.copy(this.body.quaternion);
    return this;
  }

  private readonly onContactBegin = (event: {
    bodyA: CannonBody;
    bodyB: CannonBody;
  }): void => {
    if (event.bodyA !== this.body && event.bodyB !== this.body) {
      return;
    }
    const otherBody = event.bodyA === this.body ? event.bodyA : event.bodyB;

    if (!this.contactBodies.has(otherBody)) {
      this.contactBodies.add(otherBody);
      this.emit(TriggerEvent.ENTER, this, otherBody);

      if (this.automaticDestroyShape) {
        this.destroy();
      }
    }
  };

  private readonly onContactEnd = (event: {
    bodyA: CannonBody;
    bodyB: CannonBody;
  }): void => {
    if (event.bodyA !== this.body && event.bodyB !== this.body) {
      return;
    }
    const otherBody = event.bodyA !== this.body ? event.bodyA : event.bodyB;

    if (this.contactBodies.has(otherBody)) {
      this.contactBodies.delete(otherBody);
      this.emit(TriggerEvent.EXIT, this, otherBody);
    }
  };
}
