import * as CANNON from "cannon-es";
import { Emitter } from "eventail";
import { Quaternion, QuaternionLike, Vector3, Vector3Like } from "three";
import { bodyOwnerSymbol } from "./Body";
import { PhysicsHandler } from "./PhysicsHandler";
import { TimeHandler } from "./TimeHandler";

export enum TriggerEvent {
  enter = "TriggerEvent:ENTER",
  stay = "TriggerEvent:STAY",
  exit = "TriggerEvent:EXIT",
}

export class Trigger extends Emitter {
  private body: CANNON.Body;
  private listenerContactBegin: Function;
  private listenerContactEnd: Function;
  private contacts: Map<number, CANNON.Body> = new Map();

  constructor(options: {
    size: Vector3Like;
    position: Vector3Like;
    quaternion: QuaternionLike;
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

    TimeHandler.instance.on(TimeHandler.Event.tick, this.onTick, this);
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.Event.tick, this.onTick, this);

    TimeHandler.instance.once(
      TimeHandler.Event.tick,
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
    let otherBody: CANNON.Body | undefined;

    if (event.bodyA?.id === this.body.id && event.bodyB) {
      otherBody = event.bodyB;
    } else if (event.bodyB?.id === this.body.id && event.bodyA) {
      otherBody = event.bodyA;
    }

    if (otherBody && !this.contacts.has(otherBody.id)) {
      this.contacts.set(otherBody.id, otherBody);
      const owner = (otherBody as any)[bodyOwnerSymbol];
      this.emit(TriggerEvent.enter, owner, this, otherBody);
    }
  }

  private onContactEnd(event: { bodyA?: CANNON.Body; bodyB?: CANNON.Body }) {
    let otherBody: CANNON.Body | undefined;

    if (event.bodyA?.id === this.body.id && event.bodyB) {
      otherBody = event.bodyB;
    } else if (event.bodyB?.id === this.body.id && event.bodyA) {
      otherBody = event.bodyA;
    }

    if (otherBody && this.contacts.has(otherBody.id)) {
      this.contacts.delete(otherBody.id);
      const owner = (otherBody as any)[bodyOwnerSymbol];
      this.emit(TriggerEvent.exit, owner, this, otherBody);
    }
  }

  private onTick(deltaTime: number) {
    for (const body of this.contacts.values()) {
      const owner = (body as any)[bodyOwnerSymbol];
      this.emit(TriggerEvent.stay, owner, this, body);
    }
  }

  public getPosition(position: Vector3): this {
    position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    );
    return this;
  }

  public getQuaternion(quaternion: Quaternion): this {
    quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w,
    );
    return this;
  }

  public setPosition(position: Vector3Like): this {
    this.body.position.set(position.x, position.y, position.z);
    this.body.interpolatedPosition.copy(this.body.position);
    return this;
  }

  public setQuaternion(quaternion: QuaternionLike): this {
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
