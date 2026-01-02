import {AssetKeeper} from "Generated/AssetKeeper";

import {
    UIConstraint2DBuilder,
    UIFullscreenLayer,
    UIImage,
    UIMode,
    UIResizePolicyFixedWidth,
} from "laymur";
import {UIAppearAnimator} from "laymur-animations";

export class UICTAWinLayer extends UIFullscreenLayer {

    private readonly winEnd: UIImage;
    private readonly progressWin: UIImage;
    private readonly goalFootballComplete: UIImage;
    private readonly button: UIImage;

    constructor() {
        super(new UIResizePolicyFixedWidth(1920, 1920), UIMode.HIDDEN);

        const winEndTexture = AssetKeeper.I_Win_End;
        const progressWinTexture = AssetKeeper.I_Progress_Win;
        const goalFootballCompleteTexture = AssetKeeper.I_Goal_Football_Complete;
        const buttonTexture = AssetKeeper.I_Button;
        
        this.winEnd = new UIImage(this, winEndTexture, {
            x: 0,
            y: 0,
        });

        this.progressWin = new UIImage(this, progressWinTexture, {
            x: 0,
            y: 0,
        });

        this.goalFootballComplete = new UIImage(this, goalFootballCompleteTexture, {
            x: 0,
            y: 0,
        });

        this.button = new UIImage(this, buttonTexture, {
            x: 0,
            y: 0,
        });

        UIConstraint2DBuilder.distance(this, this.winEnd, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 0, v: 0},
        });

        UIConstraint2DBuilder.distance(this.winEnd, this.progressWin, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: 30, v: 0},
        });

        UIConstraint2DBuilder.distance(this.progressWin, this.goalFootballComplete, {
            anchorA: {h: 0.5, v: 0.5},
            anchorB: {h: 0.5, v: 0.5},
            distance: {h: -200, v: 0},
        });

        UIConstraint2DBuilder.distance(this.winEnd, this.button, {
            anchorA: {h: 0.5, v: 0},
            anchorB: {h: 0.5, v: 0},
            distance: {h: 0, v: 150},
        });
    }

    public async show(): Promise<void> {
        this.mode = UIMode.VISIBLE;

        const duration = 0.35;

        await Promise.all([
            UIAppearAnimator.appear(this.winEnd, {
                xFrom: 0,
                yFrom: 0,
                duration,
            }),
            UIAppearAnimator.appear(this.progressWin, {
                xFrom: 0,
                yFrom: -100,
                duration,
            }),
            UIAppearAnimator.appear(this.goalFootballComplete, {
                xFrom: 100,
                yFrom: 0,
                duration,
            }),
            UIAppearAnimator.appear(this.button, {
                xFrom: 0,
                yFrom: 100,
                duration,
            }),
        ]);

        this.mode = UIMode.INTERACTIVE;
    }
}

