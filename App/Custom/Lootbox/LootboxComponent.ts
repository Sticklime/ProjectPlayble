import { Shared } from "Custom/Shared";
import { AssetKeeper } from "Generated/AssetKeeper";
import { UIImage, UIMode } from "laymur";
import { Trigger, TriggerEvent } from "Libs/Physics/Trigger";
import { Component } from "Libs/Platform/Component";
import type { Platform } from "Libs/Platform/Platform";
import { TinyParticleEmitter } from "Libs/TinyParticleSystem/TinyEmitter";
import { Sprite, SpriteMaterial, Vector3 } from "three";
import { UIGameplayLayer } from "UI/UIGameplayLayer";
import { CollisionHandler } from "../CollisionHandler";

const TEMP_POSITION = new Vector3();

export enum LootboxComponentEvent {
  COLLECT,
}

export class LootboxComponent extends Component {
  public static lootboxes: LootboxComponent[] = [];

  private readonly emitter = new TinyParticleEmitter(
    {
      playByDefault: true,
      playTime: 8192,
      spawnRate: 10,
      system: Shared.lootboxParticleSystem,
      useRawTime: true,
    },
    {
      lifeTimeRange: { min: 0.25, max: 0.5 },
      positionRange: {
        min: {
          x: this.platform.position.x - 2,
          y: this.platform.position.y - 2,
          z: this.platform.position.z - 2,
        },
        max: {
          x: this.platform.position.x + 2,
          y: this.platform.position.y + 2,
          z: this.platform.position.z + 2,
        },
      },
      rotationRange: { min: -Math.PI, max: Math.PI },
      scaleOverTime: [{ min: 1, max: 1 }],
      opacityOverTime: [
        { min: 0, max: 0 },
        { min: 1, max: 1 },
        { min: 0, max: 0 },
      ],
      velocityRange: {
        theta: { min: -Math.PI, max: Math.PI },
        phi: { min: -Math.PI / 4, max: Math.PI / 4 },
        magnitude: { min: 0.5, max: 1 },
      },
      angularVelocityRange: { min: -1, max: 1 },
    },
  );

  private readonly trigger = new Trigger(this.platform, {
    shape: { radius: 2 },
    automaticDestroyShape: true,
    collision: CollisionHandler.trigger,
  });

  private readonly tutorial: UIImage;
  private readonly sprite: Sprite;

  constructor(platform: Platform) {
    super(platform);
    this.trigger.once(TriggerEvent.ENTER, () => {
      this.emit(LootboxComponentEvent.COLLECT);
      this.platform.destroy();
    });
    this.tutorial = new UIImage(
      UIGameplayLayer.instance,
      AssetKeeper.T_CollectYourReward,
    );

    this.sprite = new Sprite(
      new SpriteMaterial({
        map: AssetKeeper.T_Glow,
        depthTest: false,
        depthWrite: false,
        opacity: 0.75,
      }),
    );
    const scale = 2.5;
    this.sprite.position.y += 0.5;
    this.sprite.scale.set(scale, scale, scale);
    this.platform.add(this.sprite);

    LootboxComponent.lootboxes.push(this);

    this.platform.scale.set(0, 0, 0);
    this.tutorial.micro.scaleX = 0;
    this.tutorial.micro.scaleY = 0;

    const helper = { scale: 0 };
    gsap.to(helper, {
      scale: 1,
      duration: 0.75,
      ease: "back.out(2.5)",
      onUpdate: () => {
        this.platform.scale.set(helper.scale, helper.scale, helper.scale);
        this.tutorial.micro.scaleX = helper.scale;
        this.tutorial.micro.scaleY = helper.scale;
      },
    });
  }

  public override destroy(): void {
    const index = LootboxComponent.lootboxes.indexOf(this);
    if (index !== -1) {
      LootboxComponent.lootboxes.splice(index, 1);
    }
    this.tutorial.destroy();
    this.emitter.destroy();
    super.destroy();
  }

  protected override onTick(deltaTime: number): void {
    this.updateProgressPosition();
    this.sprite.material.rotation += deltaTime;
  }

  private updateProgressPosition(): void {
    const camera = App.World?.Camera;
    if (!camera) {
      throw new Error("Camera not found");
    }

    this.platform.getWorldPosition(TEMP_POSITION);
    const layerLocalPosition = UIGameplayLayer.instance.projectWorldPosition(
      TEMP_POSITION,
      camera,
    );
    this.tutorial.mode =
      layerLocalPosition.z > 0 && layerLocalPosition.z < 1
        ? UIMode.VISIBLE
        : UIMode.HIDDEN;
    this.tutorial.centerX = layerLocalPosition.x;
    this.tutorial.oppositeY = layerLocalPosition.y - 50;
  }
}
