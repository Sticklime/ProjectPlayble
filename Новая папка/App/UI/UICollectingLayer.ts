import { AssetKeeper } from "Generated/AssetKeeper";
import {
  UIColor,
  UIConstraint2DBuilder,
  UICoverConstraintBuilder,
  UIFullscreenLayer,
  UIGraphics,
  UIImage,
  UIMode,
  UIResizePolicyFixedHeight,
} from "laymur";
import { UIAppearAnimator, UIDisappearAnimator } from "laymur-animations";
import { safeWait } from "Libs/Toolbox/safeFunctions";
import type { Texture } from "three";

export class UICollectingLayer extends UIFullscreenLayer {
  private readonly underlay = new UIGraphics(this).clear(
    new UIColor("black", 0.5),
  );
  private readonly rays = new UIImage(this, AssetKeeper.T_Rays);
  private readonly item = new UIImage(this, AssetKeeper.T_SharkHat);
  private readonly text = new UIImage(this, AssetKeeper.T_LootCollected);

  constructor() {
    super(new UIResizePolicyFixedHeight(1080, 1920), UIMode.HIDDEN);

    UICoverConstraintBuilder.build(this, this.underlay, {
      keepActiveAspect: false,
    });
    UIConstraint2DBuilder.distance(this, this.rays);
    UIConstraint2DBuilder.distance(this, this.item);
    UIConstraint2DBuilder.distance(this.item, this.text, {
      anchorA: { h: 0.5, v: 1 },
      anchorB: { h: 0.5, v: 0 },
      distance: { h: 0, v: 50 },
    });
  }

  public async showItem(
    texture: Texture,
    totalDuration: number,
  ): Promise<void> {
    this.mode = UIMode.VISIBLE;
    this.item.texture = texture;

    gsap.fromTo(
      this.rays.micro,
      { angle: 0 },
      {
        angle: 90 * totalDuration,
        duration: totalDuration,
        ease: "none",
      },
    );

    const appearDuration = totalDuration * 0.1;
    const appearDelay = appearDuration / 2;

    await Promise.all([
      UIAppearAnimator.appear(this.underlay, {
        duration: appearDuration,
        scaleFrom: 1,
      }),
      UIAppearAnimator.appear(this.rays, {
        delay: appearDelay,
        duration: appearDuration,
      }),
      UIAppearAnimator.appear(this.item, {
        delay: appearDelay * 2,
        duration: appearDuration,
      }),
      UIAppearAnimator.appear(this.text, {
        delay: appearDelay * 3,
        duration: appearDuration,
      }),
    ]);

    await safeWait(totalDuration * 0.5);

    await Promise.all([
      UIDisappearAnimator.disappear(this.text, {
        duration: appearDuration,
      }),
      UIDisappearAnimator.disappear(this.item, {
        delay: appearDelay,
        duration: appearDuration,
      }),
      UIDisappearAnimator.disappear(this.rays, {
        delay: appearDelay * 2,
        duration: appearDuration,
      }),
      UIDisappearAnimator.disappear(this.underlay, {
        delay: appearDelay * 3,
        duration: appearDuration,
        scaleTo: 1,
      }),
    ]);

    this.mode = UIMode.HIDDEN;
  }
}
