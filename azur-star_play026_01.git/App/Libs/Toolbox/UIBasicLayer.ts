import { AssetKeeper } from "Generated/AssetKeeper";

import {
  UIConstraint2DBuilder,
  UIFullscreenLayer,
  UIImage,
  UIMode,
  UIResizePolicyFixedWidth,
} from "laymur";
import { UIAppearAnimator } from "laymur-animations";

export class UIBasicLayer extends UIFullscreenLayer {
  private readonly downloadButton = new UIImage(
    this,
    AssetKeeper.I_Button_Download
  );
  private readonly scoreText = new UIImage(
    this,
    AssetKeeper.I_Score_5_Goals_Against_Your_Opponent
  );

  constructor() {
    // Используем правильные размеры для портретной и ландшафтной ориентации
    const isPortrait = (typeof App !== 'undefined' && App.IsPortrait) || window.innerHeight > window.innerWidth;
    super(new UIResizePolicyFixedWidth(isPortrait ? 1300 : 1920, isPortrait ? 1920 : 1080), UIMode.HIDDEN);

    UIConstraint2DBuilder.distance(this, this.downloadButton, {
      anchorA: { h: 0, v: 0 },
      anchorB: { h: 0, v: 0 },
      distance: { h: 50, v: 50 },
    });

    UIConstraint2DBuilder.distance(this, this.scoreText, {
      anchorA: { h: 0.5, v: 1 },
      anchorB: { h: 0.5, v: 1 },
      distance: { h: 0, v: -50 },
    });
  }

  public async show(): Promise<void> {
    this.mode = UIMode.VISIBLE;

    const duration = 0.35;
    await Promise.all([
      UIAppearAnimator.appear(this.downloadButton, {
        xFrom: -100,
        yFrom: 100,
        duration,
      }),
      UIAppearAnimator.appear(this.scoreText, {
        xFrom: 0,
        yFrom: -100,
        duration,
      }),
    ]);

    this.mode = UIMode.INTERACTIVE;
  }
  public hideScoreText(){
    this.scoreText.mode = UIMode.HIDDEN;
  }
}

