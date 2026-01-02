import { AssetKeeper } from "Generated/AssetKeeper";
import {
  UIColor,
  UIConstraint2DBuilder,
  UICoverConstraintBuilder,
  UIFullscreenLayer,
  UIGraphics,
  UIImage,
  UIInputEvent,
  UIMode,
  UIResizePolicyFixedHeight,
} from "laymur";
import { UIAppearAnimator, UIPulseCallAnimator } from "laymur-animations";

export class UILoseLayer extends UIFullscreenLayer {
  private readonly underlay = new UIGraphics(this).clear(
    new UIColor("black", 0.75),
  );
  private readonly inscription = new UIImage(this, AssetKeeper.T_YouLose);
  private readonly logotype = new UIImage(this, AssetKeeper.T_CTALogotype);
  private readonly button = new UIImage(this, AssetKeeper.T_TryAgainButton);

  constructor() {
    super(new UIResizePolicyFixedHeight(1080, 1920), UIMode.HIDDEN);

    UICoverConstraintBuilder.build(this, this.underlay, {
      keepActiveAspect: false,
    });
    UIConstraint2DBuilder.distance(this, this.logotype);
    UIConstraint2DBuilder.distance(this.logotype, this.button, {
      anchorA: { h: 0.5, v: 0 },
      anchorB: { h: 0.5, v: 1 },
      distance: { h: 0, v: -50 },
    });
    UIConstraint2DBuilder.distance(this.logotype, this.inscription, {
      anchorA: { h: 0.5, v: 1 },
      anchorB: { h: 0.5, v: 0 },
      distance: { h: 0, v: 50 },
    });

    this.button.on(UIInputEvent.DOWN, () => MraidSDK.open("end screen button"));

    this.button.mode = UIMode.INTERACTIVE;
    this.underlay.mode = UIMode.INTERACTIVE;
  }

  public async show(): Promise<void> {
    this.mode = UIMode.VISIBLE;

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIAppearAnimator.appear(this.underlay, {
        duration,
        scaleFrom: 1,
        scaleTo: 1,
      }),
      UIAppearAnimator.appear(this.inscription, {
        delay,
        duration,
        yFrom: 100,
      }),
      UIAppearAnimator.appear(this.button, {
        delay: delay * 2,
        duration,
        yFrom: -100,
      }),
      UIAppearAnimator.appear(this.logotype, {
        delay: delay * 3,
        duration,
      }),
    ]);

    UIPulseCallAnimator.pulse(this.button, { cooldown: 0 });
    this.mode = UIMode.INTERACTIVE;
  }
}
