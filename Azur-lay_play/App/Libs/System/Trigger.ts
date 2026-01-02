import * as CANNON from "cannon-es";
import * as PhysicsHandler from "PhysicsHandler";
import * as THREE from "three";
import { TimeHandler } from "TimeHandler";
import EventHandler from "./EventHandler";

export enum TriggerEvent {
  ENTER = "TriggerEvent:ENTER",
  STAY = "TriggerEvent:STAY",
  EXIT = "TriggerEvent:EXIT",
}

export class Trigger extends EventHandler {
  private body: CANNON.Body;
  private listenerContactBegin: Function;
  private listenerContactEnd: Function;
  private contacts: Set<CANNON.Body> = new Set();

  constructor(options: {
    size: THREE.Vector3Like;
    position: THREE.Vector3Like;
    quaternion: THREE.QuaternionLike;
    collisionGroup?: number;
    collisionMask?: number;
  }) {
    super();

    const halfExtents = new CANNON.Vec3(
      options.size.x / 2,
      options.size.y / 2,
      options.size.z / 2,
    );

    this.body = new CANNON.Body({
      isTrigger: true,
      shape: new CANNON.Box(halfExtents),
      position: new CANNON.Vec3(
        options.position.x,
        options.position.y,
        options.position.z,
      ),
      quaternion: new CANNON.Quaternion(
        options.quaternion.x,
        options.quaternion.y,
        options.quaternion.z,
        options.quaternion.w,
      ),
      allowSleep: false,
      collisionFilterGroup: options.collisionGroup ?? -1,
      collisionFilterMask: options.collisionMask ?? -1,
    });

    PhysicsHandler.instance.addBody(this.body);

    this.listenerContactBegin = this.onContactBegin.bind(this);
    this.listenerContactEnd = this.onContactEnd.bind(this);

    PhysicsHandler.instance.addEventListener(
      "beginContact",
      this.listenerContactBegin,
    );

    PhysicsHandler.instance.addEventListener(
      "endContact",
      this.listenerContactEnd,
    );

    TimeHandler.instance.on(TimeHandler.EEvent.TICK, this.onTick, this);
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);

    TimeHandler.instance.once(
      TimeHandler.EEvent.TICK,
      () => {
        PhysicsHandler.instance.removeEventListener(
          "beginContact",
          this.listenerContactBegin,
        );

        PhysicsHandler.instance.removeEventListener(
          "endContact",
          this.listenerContactEnd,
        );

        PhysicsHandler.instance.removeBody(this.body);
      },
      this.body,
      Infinity,
    );
  }

  private onContactBegin(event: { bodyA: CANNON.Body; bodyB: CANNON.Body }) {
    if (event.bodyA !== this.body && event.bodyB !== this.body) return;
    const otherBody = event.bodyA === this.body ? event.bodyA : event.bodyB;

    if (!this.contacts.has(otherBody)) {
      this.contacts.add(otherBody);
      this.emit(TriggerEvent.ENTER, this, otherBody);
    }
  }

  private onContactEnd(event: { bodyA: CANNON.Body; bodyB: CANNON.Body }) {
    if (event.bodyA !== this.body && event.bodyB !== this.body) return;
    const otherBody = event.bodyA !== this.body ? event.bodyA : event.bodyB;

    if (this.contacts.has(otherBody)) {
      this.contacts.delete(otherBody);
      this.emit(TriggerEvent.EXIT, this, otherBody);
    }
  }

  private onTick(deltaTime: number) {
    this.contacts.forEach((body) => {
      this.emit(TriggerEvent.STAY, this, body);
    });
  }

  public getPosition(position: THREE.Vector3): this {
    position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    );
    return this;
  }

  public getQuaternion(quaternion: THREE.Quaternion): this {
    quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w,
    );
    return this;
  }

  public setPosition(position: THREE.Vector3Like): this {
    this.body.position.set(position.x, position.y, position.z);
    this.body.interpolatedPosition.copy(this.body.position);
    return this;
  }

  public setQuaternion(quaternion: THREE.QuaternionLike): this {
    this.body.quaternion.set(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
    );
    this.body.interpolatedQuaternion.copy(this.body.quaternion);
    return this;
  }
}
