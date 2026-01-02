import { AssetKeeper } from "Generated/AssetKeeper";
import {
  UIAspectConstraint,
  UIConstraint2DBuilder,
  UIFullscreenLayer,
  UIHorizontalDistanceConstraint,
  UIImage,
  UIInputEvent,
  UIMode,
  UIRelation,
  UIResizePolicyFixedHeight,
} from "laymur";
import { UIAppearAnimator, UIPulseCallAnimator } from "laymur-animations";

export class UICTALayer extends UIFullscreenLayer {
  private readonly logotype = new UIImage(this, ...AssetKeeper.T_CTA_Logotype);
  private readonly button = new UIImage(this, ...AssetKeeper.T_Play_Now);
  private readonly inscription = new UIImage(
    this,
    ...AssetKeeper.T_Catch_Them_All,
  );

  constructor() {
    super(new UIResizePolicyFixedHeight(1080, 1920), UIMode.HIDDEN);

    UIConstraint2DBuilder.distance(this, this.logotype, {
      anchorA: { h: 0.5, v: 0.9 },
      anchorB: { h: 0.5, v: 1 },
    });

    UIConstraint2DBuilder.distance(this, this.button, {
      anchorA: { h: 0.5, v: 0.1 },
      anchorB: { h: 0.5, v: 0 },
    });

    UIConstraint2DBuilder.distance(this.logotype, this.inscription, {
      anchorA: { h: 0.5, v: 0 },
      anchorB: { h: 0.5, v: 1 },
      distance: { h: 0, v: -100 },
    });

    new UIAspectConstraint(this.inscription);

    new UIHorizontalDistanceConstraint(this, this.inscription, {
      anchorA: 0,
      anchorB: 0,
      distance: 50,
      relation: UIRelation.GREATER_THAN,
    });

    this.button.mode = UIMode.INTERACTIVE;
    this.button.on(UIInputEvent.CLICK, () =>
      MraidSDK.open("end screen button"),
    );
  }

  public async show(): Promise<void> {
    this.mode = UIMode.VISIBLE;

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIAppearAnimator.appear(this.logotype, {
        duration,
        yFrom: 100,
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
    ]);

    UIPulseCallAnimator.pulse(this.button, { cooldown: 0 });
    this.mode = UIMode.INTERACTIVE;
  }
}
