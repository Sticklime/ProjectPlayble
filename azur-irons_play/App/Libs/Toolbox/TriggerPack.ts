import * as CANNON from "cannon-es";
import { Emitter } from "eventail";
import { PhysicsHandler } from "Libs/Toolbox/PhysicsHandler";
import { TimeHandler } from "Libs/Toolbox/TimeHandler";
import { Transform } from "Libs/Toolbox/Transform";
import {
  Box3,
  BufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";

export enum TriggerPackEvent {
  enter = "TriggerPackEvent:ENTER",
  empty = "TriggerPackEvent:EMPTY",
}

interface Trigger {
  localMatrix: Matrix4;
  worldTransform: Transform;
  body: CANNON.Body;
  listener: Function;
}

export class TriggerPack extends Emitter {
  private instancedMesh: InstancedMesh;
  private triggers: Map<number, Trigger> = new Map();
  private listenerContactBegin: Function;

  public constructor(options: {
    instancedMesh: InstancedMesh;
    triggerScale: Vector3;
    collisionGroup: number;
    collisionMask: number;
  }) {
    super();
    const { instancedMesh, triggerScale, collisionGroup, collisionMask } =
      options;

    this.instancedMesh = instancedMesh;
    const attribute = this.instancedMesh.geometry.attributes["position"];

    if (!(attribute instanceof BufferAttribute)) {
      throw new Error("Position attribute is not a BufferAttribute");
    }

    const box3 = new Box3();
    box3.setFromBufferAttribute(attribute);

    const size = new Vector3();
    box3.getSize(size);

    const halfExtents = new CANNON.Vec3(
      (size.x / 2) * triggerScale.x,
      (size.y / 2) * triggerScale.y,
      (size.z / 2) * triggerScale.z,
    );

    const count = instancedMesh.count;
    const tempVector3_0 = new Vector3();
    const tempVector3_1 = new Vector3();
    const tempQuaternion_0 = new Quaternion();

    for (let i = 0; i < count; i++) {
      const localMatrix = new Matrix4();
      instancedMesh.getMatrixAt(i, localMatrix);

      const worldMatrix = new Matrix4().multiplyMatrices(
        instancedMesh.matrixWorld,
        localMatrix,
      );

      worldMatrix.decompose(tempVector3_0, tempQuaternion_0, tempVector3_1);

      const body = new CANNON.Body({
        isTrigger: true,
        shape: new CANNON.Box(halfExtents),
        position: new CANNON.Vec3(
          tempVector3_0.x,
          tempVector3_0.y,
          tempVector3_0.z,
        ),
        quaternion: new CANNON.Quaternion(
          tempQuaternion_0.x,
          tempQuaternion_0.y,
          tempQuaternion_0.z,
          tempQuaternion_0.w,
        ),
        allowSleep: false,
        collisionFilterGroup: collisionGroup,
        collisionFilterMask: collisionMask,
      });

      const trigger = {
        localMatrix: localMatrix,
        worldTransform: {
          position: tempVector3_0.clone(),
          quaternion: tempQuaternion_0.clone(),
          scale: tempVector3_1.clone(),
        },
        body: body,
        listener: this.onContactBegin.bind(this),
      };

      this.triggers.set(body.id, trigger);
      PhysicsHandler.instance.addBody(body);
    }

    this.listenerContactBegin = this.onContactBegin.bind(this);
    PhysicsHandler.instance.addEventListener(
      "beginContact",
      this.listenerContactBegin,
    );
  }

  public destroy() {
    this.instancedMesh.parent?.remove(this.instancedMesh);
    this.instancedMesh.dispose();

    TimeHandler.instance.once(
      TimeHandler.Event.tick,
      () => {
        PhysicsHandler.instance.removeEventListener(
          "beginContact",
          this.listenerContactBegin,
        );

        for (const trigger of this.triggers.values()) {
          PhysicsHandler.instance.removeBody(trigger.body);
        }
      },
      null,
      Infinity,
    );
  }

  private onContactBegin(event: {
    bodyA: CANNON.Body;
    bodyB: CANNON.Body;
  }): void {
    const triggerA = this.triggers.get(event.bodyA.id);
    const triggerB = this.triggers.get(event.bodyB.id);

    const trigger = triggerA || triggerB;
    if (triggerA === triggerB || !trigger) return;

    this.triggers.delete(trigger.body.id);

    TimeHandler.instance.once(
      TimeHandler.Event.tick,
      () => {
        PhysicsHandler.instance.removeBody(trigger.body);
        this.updateInstancedMesh();

        this.emit(
          TriggerPackEvent.enter,
          trigger.worldTransform,
          this.instancedMesh.geometry,
          this.instancedMesh.material,
          this,
        );

        if (this.triggers.size === 0) {
          this.emit(TriggerPackEvent.empty, this);
        }
      },
      trigger.body,
      Infinity,
    );
  }

  private updateInstancedMesh(): void {
    this.instancedMesh.count = this.triggers.size;

    Array.from(this.triggers.values()).forEach((trigger, i) => {
      this.instancedMesh.setMatrixAt(i, trigger.localMatrix);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
