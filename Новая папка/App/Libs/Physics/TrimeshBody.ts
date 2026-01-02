import type { Quaternion, Vector3 } from "three";
import { type QuaternionLike, type Vector3Like } from "three";
import { TimeController } from "../Toolbox/TimeController";
import type { Collision } from "./BodyOptions";
import { PhysicsController } from "./PhysicsController";
import type { CannonQuaternion, CannonVec3 } from "./cannonImport";
import { CannonBody, CannonTrimesh } from "./cannonImport";

export class TrimeshBody {
  private readonly body: CannonBody;

  constructor(vertices: number[], indices: number[], collision?: Collision) {
    const shape = new CannonTrimesh(vertices, indices);

    this.body = new CannonBody({
      type: CannonBody.STATIC,
      shape,
      collisionFilterGroup: collision?.group ?? -1,
      collisionFilterMask: collision?.mask ?? -1,
    });

    PhysicsController.instance.rawCannonWorld.addBody(this.body);
  }

  public destroy(): void {
    TimeController.instance.once(
      TimeController.Event.TICK,
      () => PhysicsController.instance.rawCannonWorld.removeBody(this.body),
      undefined,
      Infinity,
    );
  }

  public setTransform(position: Vector3Like, quaternion: QuaternionLike): void {
    this.body.position.copy(position as CannonVec3);
    this.body.quaternion.copy(quaternion as CannonQuaternion);
  }

  public setPosition(position: Vector3Like): void {
    this.body.position.copy(position as CannonVec3);
    this.body.interpolatedPosition.copy(position as CannonVec3);
  }

  public setQuaternion(quaternion: QuaternionLike): void {
    this.body.quaternion.copy(quaternion as CannonQuaternion);
    this.body.interpolatedQuaternion.copy(quaternion as CannonQuaternion);
  }

  public getPosition(result: Vector3): Vector3 {
    return result.copy(this.body.position);
  }

  public getQuaternion(result: Quaternion): Quaternion {
    return result.copy(this.body.quaternion);
  }

  public getTransform(position: Vector3, quaternion: Quaternion): TrimeshBody {
    position.copy(this.body.position);
    quaternion.copy(this.body.quaternion);
    return this;
  }
}
