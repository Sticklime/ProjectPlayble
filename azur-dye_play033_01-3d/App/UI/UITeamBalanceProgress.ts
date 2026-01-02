import {
  BehaviorMediator,
  BehaviorMediatorEvent,
} from "Custom/BehaviorMediator";
import { Shared } from "Custom/Shared";
import { AssetKeeper } from "Generated/AssetKeeper";
import type { UILayer } from "laymur";
import {
  UIColor,
  UIConstraint2DBuilder,
  UIImage,
  UIProgress,
  UIProgressMaskFunction,
} from "laymur";
import { UIAppearAnimator, UIDisappearAnimator } from "laymur-animations";
import type { WebGLRenderer } from "three";
import { MathUtils } from "three";

export class UITeamBalanceProgress extends UIImage {
  private readonly progress = new UIProgress(
    this.layer,
    AssetKeeper.T_CircleProgress,
    {
      backgroundTexture: AssetKeeper.T_CircleProgress,
      maskFunction: UIProgressMaskFunction.CIRCLE_TOP,
      foregroundColor: new UIColor(Shared.heroTeamColor),
      backgroundColor: new UIColor(Shared.enemyTeamColor),
    },
  );

  private targerProgressValue = 1;

  constructor(layer: UILayer) {
    super(layer, AssetKeeper.T_CircleProgressUnderlay);

    UIConstraint2DBuilder.distance(this, this.progress);

    BehaviorMediator.instance.on(
      BehaviorMediatorEvent.SUBSCRIBE,
      this.onUpdateTeamBalance,
    );
    BehaviorMediator.instance.on(
      BehaviorMediatorEvent.UNSUBSCRIBE,
      this.onUpdateTeamBalance,
    );
  }

  public async show(duration: number = 0.35, delay: number = 0): Promise<void> {
    await UIAppearAnimator.appear([this, this.progress], {
      delay,
      duration,
      xFrom: 100,
      yFrom: 100,
    });
  }

  public async hide(duration: number = 0.35, delay: number = 0): Promise<void> {
    await UIDisappearAnimator.disappear([this, this.progress], {
      delay,
      duration,
      xTo: 100,
      yTo: 100,
    });
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    this.progress.progress = MathUtils.lerp(
      this.progress.progress,
      this.targerProgressValue,
      1 - Math.exp(-4 * deltaTime),
    );

    super.onWillRender(renderer, deltaTime);
  }

  private readonly onUpdateTeamBalance = (): void => {
    let heroCount = 0;
    let enemyCount = 0;

    for (const component of BehaviorMediator.instance.behaviorComponents) {
      if (component.teamDescriptor.tag === "HeroTeamDescriptor") {
        heroCount += 1;
      } else if (component.teamDescriptor.tag === "EnemyTeamDescriptor") {
        enemyCount += 1;
      }
    }

    this.targerProgressValue = heroCount / (heroCount + enemyCount);
  };
}
