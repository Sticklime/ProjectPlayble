import { Body } from "Libs/Toolbox/Body";
import { Component, Platform } from "Libs/Toolbox/Platform";
import { Trigger, TriggerEvent } from "Libs/Toolbox/Trigger";
import { Quaternion, Vector3, Vector3Like } from "three";

export enum EnemyTriggerHandlerEvent {
  attackContentChanged = "attackContentChanged",
  detectContentChanged = "detectContentChanged",
}

interface BoxDescription {
  size: Vector3Like;
  collisionGroup: number;
  collisionMask: number;
}

interface Parameters {
  selfBody: BoxDescription;
  attackRangeTrigger: BoxDescription;
  detectRangeTrigger: BoxDescription;
}

export class EnemyTriggerHandler extends Component {
  private selfBody: Body;
  private attackRangeTrigger: Trigger;
  private detectRangeTrigger: Trigger;
  private attackRangeContent: Platform[] = [];
  private detectRangeContent: Platform[] = [];
  private tempVector3D = new Vector3();

  public constructor(platform: Platform, parameters: Parameters) {
    super(platform, 300);
    this.selfBody = new Body(
      {
        width: parameters.selfBody.size.x,
        height: parameters.selfBody.size.y,
        depth: parameters.selfBody.size.z,
      },
      {
        isKinematic: true,
        collisionGroup: parameters.selfBody.collisionGroup,
        collisionMask: parameters.selfBody.collisionMask,
      },
      this.platform,
    );
    this.attackRangeTrigger = new Trigger({
      size: parameters.attackRangeTrigger.size,
      position: new Vector3(),
      quaternion: new Quaternion(),
      collisionGroup: parameters.attackRangeTrigger.collisionGroup,
      collisionMask: parameters.attackRangeTrigger.collisionMask,
    });
    this.attackRangeTrigger.on(
      TriggerEvent.enter,
      this.onAttackTriggerEnter,
      this,
    );
    this.attackRangeTrigger.on(
      TriggerEvent.exit,
      this.onAttackTriggerExit,
      this,
    );

    this.detectRangeTrigger = new Trigger({
      size: parameters.detectRangeTrigger.size,
      position: new Vector3(),
      quaternion: new Quaternion(),
      collisionGroup: parameters.detectRangeTrigger.collisionGroup,
      collisionMask: parameters.detectRangeTrigger.collisionMask,
    });
    this.detectRangeTrigger.on(
      TriggerEvent.enter,
      this.onDetectTriggerEnter,
      this,
    );
    this.detectRangeTrigger.on(
      TriggerEvent.exit,
      this.onDetectTriggerExit,
      this,
    );
  }

  public override destroy() {
    super.destroy();
    this.selfBody.destroy();
    this.attackRangeTrigger.destroy();
    this.detectRangeTrigger.destroy();
  }

  private onAttackTriggerEnter(body: { userData?: Platform }) {
    const otherPlatform = body.userData;
    if (otherPlatform instanceof Platform) {
      const index = this.attackRangeContent.indexOf(otherPlatform);
      if (index === -1) {
        this.attackRangeContent.push(otherPlatform);
        this.emit(
          EnemyTriggerHandlerEvent.attackContentChanged,
          this.attackRangeContent.slice(),
        );
      }
    }
  }

  private onAttackTriggerExit(body: { userData?: Platform }) {
    const otherPlatform = body.userData;
    if (otherPlatform instanceof Platform) {
      const index = this.attackRangeContent.indexOf(otherPlatform);
      if (index !== -1) {
        this.attackRangeContent.splice(index, 1);
        this.emit(
          EnemyTriggerHandlerEvent.attackContentChanged,
          this.attackRangeContent.slice(),
        );
      }
    }
  }

  private onDetectTriggerEnter(body: { userData?: Platform }) {
    const otherPlatform = body.userData;
    if (otherPlatform instanceof Platform) {
      const index = this.detectRangeContent.indexOf(otherPlatform);
      if (index === -1) {
        this.detectRangeContent.push(otherPlatform);
        this.emit(
          EnemyTriggerHandlerEvent.detectContentChanged,
          this.detectRangeContent.slice(),
        );
      }
    }
  }

  private onDetectTriggerExit(body: { userData?: Platform }) {
    const otherPlatform = body.userData;
    if (otherPlatform instanceof Platform) {
      const index = this.detectRangeContent.indexOf(otherPlatform);
      if (index !== -1) {
        this.detectRangeContent.splice(index, 1);
        this.emit(
          EnemyTriggerHandlerEvent.detectContentChanged,
          this.detectRangeContent.slice(),
        );
      }
    }
  }

  protected override onTick(deltaTime: number) {
    this.platform.getWorldPosition(this.tempVector3D);
    this.attackRangeTrigger.setPosition(this.tempVector3D);
    this.detectRangeTrigger.setPosition(this.tempVector3D);
    this.selfBody.setPosition(this.tempVector3D);
  }
}
