import { Body } from "Body";
import { CharacterAnimationController } from "CharacterAnimationController";
import { GraphicsHandler } from "GraphicsHandler";
import { ITransformReadonly } from "ITransform";
import EventHandler from "Libs/System/EventHandler";
import { IMovementController } from "Libs/System/IMovementController";
import { Object3D, Quaternion, Vector3 } from "three";
import { TimeHandler } from "TimeHandler";
import { CharacterStepHandler } from "./CharacterStepHandler";

export enum ECharacterEvent {
  STEP = "ECharacterEvent:STEP",
}

interface IOptions {
  object: Object3D;
  body: Body;
  bodyOffset: Vector3;
  movementController: IMovementController;
  animationController: CharacterAnimationController;
  stepHandler: CharacterStepHandler;
  priority?: number;
}

export class Character extends EventHandler implements ITransformReadonly {
  private object: Object3D;
  private body: Body;
  private bodyOffset: Vector3;

  public movementController: IMovementController;
  private animationController: CharacterAnimationController;
  private stepHandler: CharacterStepHandler;

  private transformPosition: Vector3 = new Vector3();
  private transformQuaternion: Quaternion = new Quaternion();
  private transformScale: Vector3 = new Vector3(1, 1, 1);

  private tempVector3: Vector3 = new Vector3();

  protected constructor(options: IOptions) {
    super();

    this.object = options.object;
    this.body = options.body;
    this.bodyOffset = options.bodyOffset;
    this.movementController = options.movementController;
    this.animationController = options.animationController;
    this.stepHandler = options.stepHandler;

    TimeHandler.instance.on(
      TimeHandler.EEvent.TICK,
      this.onTick,
      this,
      options.priority,
    );
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);
    GraphicsHandler.instance.scene.remove(this.object);
  }

  private onTick(deltaTime: number) {
    const currentSpeed = this.movementController.currentSpeed;
    this.animationController.setMovementSpeed(currentSpeed);
    this.stepHandler.updateState(currentSpeed, deltaTime);

    this.tempVector3.addVectors(
      this.movementController.position,
      this.bodyOffset,
    );
    this.body.setPosition(this.tempVector3);
    this.object.position.copy(this.movementController.position);

    const direction = this.movementController.velocity.clone();

    if (direction.lengthSq() < 1e-5) {
      direction.copy(this.movementController.direction);
    }

    if (direction.lengthSq() > 1e-5) {
      direction.negate();
      this.object.quaternion.setFromView(direction);
    }
  }

  public setMovementDirection(direction: Vector3) {
    this.movementController.direction = direction;
  }

  public runAttackState() {
    this.animationController.runAttackState();
  }

  public runDeathState() {
    this.animationController.runDeathState();
  }

  public runWinState() {
    this.animationController.runWinState();
  }

  public get rawObject3D(): Object3D {
    return this.object;
  }

  public get position(): Vector3 {
    this.transformPosition.copy(this.object.position);
    return this.transformPosition;
  }

  public get quaternion(): Quaternion {
    this.transformQuaternion.copy(this.object.quaternion);
    return this.transformQuaternion;
  }

  public get scale(): Vector3 {
    this.transformScale.copy(this.object.scale);
    return this.transformScale;
  }
}
