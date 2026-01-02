import type { UILayer } from "laymur";
import { UIImage } from "laymur";
import type { Texture, Vector2Like } from "three";

export interface UIAnimatedImageTextureDescriptor {
  texture: Texture;
  dimensions: Vector2Like;
}

export class UIAnimatedImage extends UIImage {
  private intervalHandler?: ReturnType<typeof setInterval>;
  private currentIndex = 0;

  constructor(
    layer: UILayer,
    private readonly descriptors: UIAnimatedImageTextureDescriptor[],
  ) {
    const descriptor = descriptors[0] as UIAnimatedImageTextureDescriptor;
    super(layer, descriptor.texture);
    this.setupTexture(descriptor);
  }

  public override destroy(): void {
    this.stop();
    super.destroy();
  }

  public play(fps: number = 24): void {
    if (this.intervalHandler) {
      return;
    }

    MraidSDK.playSound("S_Siren");

    this.intervalHandler = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.descriptors.length;
      this.setupTexture(
        this.descriptors[this.currentIndex] as UIAnimatedImageTextureDescriptor,
      );
    }, 1000 / fps);
  }

  public stop(): void {
    if (this.intervalHandler) {
      clearInterval(this.intervalHandler);
      this.currentIndex = 0;
      this.setupTexture(
        this.descriptors[this.currentIndex] as UIAnimatedImageTextureDescriptor,
      );
      MraidSDK.stopSound("S_Siren");
    }
  }

  private setupTexture(descriptor: UIAnimatedImageTextureDescriptor): void {
    descriptor.texture.updateMatrix();
    this.texture = descriptor.texture;
    this.width = descriptor.dimensions.x;
    this.height = descriptor.dimensions.y;
  }
}
