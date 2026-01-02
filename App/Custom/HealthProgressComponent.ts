import { AssetKeeper } from "Generated/AssetKeeper";
import { UIColor, UIImage, UIMode, UIProgress } from "laymur";
import { Component } from "Libs/Platform/Component";
import type { Platform } from "Libs/Platform/Platform";
import type { Object3D } from "three";
import { MathUtils, Vector3, type Texture } from "three";
import { UIGameplayLayer } from "UI/UIGameplayLayer";

const TEMP_POSITION = new Vector3();

export interface ProgressBarComponentProgressHandler {
  value: number;
  maxValue: number;
}

export class HealthProgressComponent extends Component {
  private readonly progress: UIProgress;
  private readonly overlay: UIImage;
  private time = 0;

  constructor(
    platform: Platform,
    texture: Texture,
    private readonly anchor: Object3D,
    private readonly progressHandler: ProgressBarComponentProgressHandler,
    color: number,
  ) {
    super(platform);
    this.progress = new UIProgress(UIGameplayLayer.instance, texture, {
      backgroundTexture: AssetKeeper.T_HealthProgressBackground,
      foregroundColor: new UIColor(color),
    });
    this.overlay = new UIImage(
      UIGameplayLayer.instance,
      AssetKeeper.T_HealthProgressOverlay,
    );
    this.progress.micro.anchorX = 0.5;
    this.progress.micro.anchorY = 0.5;
    this.overlay.micro.anchorX = 0.5;
    this.overlay.micro.anchorY = 0.5;
    this.updateProgressPosition();
  }

  public override destroy(): void {
    this.progress.destroy();
    this.overlay.destroy();
    super.destroy();
  }

  protected override onTick(deltaTime: number): void {
    this.progress.progress =
      this.progressHandler.value / this.progressHandler.maxValue;

    const alpha = Math.min(this.progress.progress / 0.5, 1);
    const timeScale = MathUtils.mapLinear(alpha, 0, 1, 20, 10);
    this.time += deltaTime * timeScale;
    const pulseScale = MathUtils.mapLinear(
      Math.sin(this.time),
      -1,
      1,
      0.85,
      1.15,
    );
    const defaultScale = 1;
    const finalScale = MathUtils.lerp(pulseScale, defaultScale, alpha);

    this.progress.micro.scaleX = finalScale;
    this.progress.micro.scaleY = finalScale;
    this.overlay.micro.scaleX = this.progress.micro.scaleX;
    this.overlay.micro.scaleY = this.progress.micro.scaleY;

    this.updateProgressPosition();
  }

  private updateProgressPosition(): void {
    const camera = App.World?.Camera;
    if (!camera) {
      throw new Error("Camera not found");
    }

    this.anchor.getWorldPosition(TEMP_POSITION);
    const layerLocalPosition = UIGameplayLayer.instance.projectWorldPosition(
      TEMP_POSITION,
      camera,
    );
    this.progress.mode =
      layerLocalPosition.z > 0 && layerLocalPosition.z < 1
        ? UIMode.VISIBLE
        : UIMode.HIDDEN;
    this.progress.centerX = layerLocalPosition.x;
    this.progress.centerY = layerLocalPosition.y;
    this.overlay.centerX = this.progress.centerX;
    this.overlay.centerY = this.progress.centerY;
  }
}
