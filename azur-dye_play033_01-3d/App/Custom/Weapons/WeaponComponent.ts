import { Component } from "Libs/Platform/Component";
import type { Platform } from "Libs/Platform/Platform";
import type { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import { TimeController } from "Libs/Toolbox/TimeController";
import type { Object3D } from "three";
import { MathUtils, Vector3 } from "three";
import type { BehaviorComponent } from "../BehaviorComponent";
import { Flow } from "../Flow";

const TEMP_DIRECTION = new Vector3();

export interface WeaponComponentOptions {
  range: number;
  damage: number;
  damageSector: number;
  flowColor: number;
  flowAnchor: Object3D;
  flowGroundOffset: number;
  flowParticleSystem: TinyParticleSystem;
}

export class WeaponComponent extends Component {
  public readonly range: number;
  public readonly damage: number;
  private readonly damageSectorDot: number;
  private readonly flow: Flow;
  private behaviorComponents: BehaviorComponent[] = [];
  private lastTimePlaySound = -1;

  constructor(platform: Platform, options: WeaponComponentOptions) {
    super(platform);
    this.range = options.range;
    this.damage = options.damage;
    this.damageSectorDot = Math.cos(MathUtils.degToRad(30));
    this.flow = new Flow(
      options.flowAnchor,
      options.flowColor,
      options.range,
      options.flowGroundOffset,
      options.flowParticleSystem,
    );
  }

  public get isEnable(): boolean {
    return this.flow.isEnable;
  }

  public set isEnable(value: boolean) {
    this.flow.isEnable = value;
  }

  public setAvailableBehaviorComponents(
    behaviorComponents: BehaviorComponent[],
  ) {
    this.behaviorComponents = behaviorComponents;
  }

  public override destroy(): void {
    this.flow.destroy();
    super.destroy();
  }

  protected override onFixedTick(fixedDeltaTime: number): void {
    this.flow.update(fixedDeltaTime);

    if (this.flow.isEnable) {
      if (TimeController.instance.time - this.lastTimePlaySound > 0.35) {
        this.lastTimePlaySound = TimeController.instance.time;
        MraidSDK.playSound("S_Water");
      }
      for (const behaviorComponent of this.behaviorComponents) {
        TEMP_DIRECTION.subVectors(
          behaviorComponent.platform.position,
          this.platform.position,
        );
        TEMP_DIRECTION.y = 0;
        TEMP_DIRECTION.normalize();

        const dot = this.flow.direction.dot(TEMP_DIRECTION);
        if (dot > this.damageSectorDot) {
          behaviorComponent.healthDescriptor.applyDamage(
            this.damage * dot * fixedDeltaTime,
          );
        }
      }
    } else {
      this.lastTimePlaySound = -1;
    }
  }
}
