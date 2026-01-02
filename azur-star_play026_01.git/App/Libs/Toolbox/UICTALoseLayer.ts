import {AssetKeeper} from "Generated/AssetKeeper";

import {
    UIConstraint2DBuilder,
    UIFullscreenLayer,
    UIImage,
    UIMode,
    UIResizePolicyFixedWidth,
} from "laymur";
import {UIAppearAnimator} from "laymur-animations";

export class UICTALoseLayer extends UIFullscreenLayer {

    private readonly defeatAllEnemies: UIImage;
    private readonly replayButton: UIImage;

    constructor() {
        // Используем правильные размеры для портретной и ландшафтной ориентации
        const isPortrait = (typeof App !== 'undefined' && App.IsPortrait) || window.innerHeight > window.innerWidth;
        super(new UIResizePolicyFixedWidth(isPortrait ? 1300 : 1920, isPortrait ? 1920 : 1080), UIMode.HIDDEN);

        const loseEndTexture = AssetKeeper.I_Lose_End;
        const replayTexture = AssetKeeper.I_Button_Replay;
        
        this.defeatAllEnemies = new UIImage(this, loseEndTexture, {
            x: 0,
            y: 0,
        });

        this.replayButton = new UIImage(this, replayTexture, {
            x: 0,
            y: 0,
        });

        UIConstraint2DBuilder.distance(this, this.defeatAllEnemies, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        UIConstraint2DBuilder.distance(this.defeatAllEnemies, this.replayButton, {
            anchorA: {h: 0.5, v: 0},
            anchorB: {h: 0.5, v: 0},
            distance: {h: 0, v: 200},
        });
    }

    public async show(): Promise<void> {
        this.mode = UIMode.VISIBLE;

        const duration = 0.35;

        await Promise.all([
            UIAppearAnimator.appear(this.defeatAllEnemies, {
                xFrom: 0,
                yFrom: 0,
                duration,
            }),
            UIAppearAnimator.appear(this.replayButton, {
                xFrom: 0,
                yFrom: 100,
                duration,
            }),
        ]);

        this.mode = UIMode.INTERACTIVE;
    }
}

