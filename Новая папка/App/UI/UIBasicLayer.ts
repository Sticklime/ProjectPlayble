import { AssetKeeper } from "Generated/AssetKeeper";
import {
  UIAspectConstraint,
  UIConstraint2DBuilder,
  UIFullscreenLayer,
  UIHorizontalDistanceConstraint,
  UIImage,
  UIInputEvent,
  UIMode,
  UIOrientation,
  UIResizePolicyFixedHeight,
  UIVerticalDistanceConstraint,
} from "laymur";
import {
  UIAppearAnimator,
  UIDisappearAnimator,
  UIJumpCallAnimator,
} from "laymur-animations";
import { UIAttackJoystick, UIAttackJoystickEvent } from "./UIAttackJoystick";
import {
  UIMovementJoystick,
  UIMovementJoystickEvent,
} from "./UIMovementJoystick";
import { UITeamBalanceProgress } from "./UITeamBalanceProgress";

export enum UIBasicLayerEvent {
  ATTACK_JOYSTICK_MOVE,
  ATTACK_JOYSTICK_RELEASE,

  MOVEMENT_JOYSTICK_MOVE,
  MOVEMENT_JOYSTICK_RELEASE,
}

export class UIBasicLayer extends UIFullscreenLayer {
  private readonly logotype = new UIImage(this, AssetKeeper.T_Logotype);
  private readonly downloadButton = new UIImage(
    this,
    AssetKeeper.T_DownloadButton,
    { mode: UIMode.INTERACTIVE },
  );
  private readonly tutorial = new UIImage(this, AssetKeeper.T_DefeatAllEnemies);
  private readonly teamBalanceProgress = new UITeamBalanceProgress(this);
  private readonly attackJoystick = new UIAttackJoystick(this);
  private readonly movementJoystick = new UIMovementJoystick(this);

  constructor() {
    super(new UIResizePolicyFixedHeight(1080, 1920), UIMode.HIDDEN);

    {
      UIConstraint2DBuilder.distance(this, this.logotype, {
        anchorA: { h: 0, v: 1 },
        anchorB: { h: 0, v: 1 },
        distance: { h: 50, v: -50 },
      });

      new UIAspectConstraint(this.downloadButton);
      UIConstraint2DBuilder.distance(this, this.downloadButton, {
        anchorA: { h: 1, v: 0 },
        anchorB: { h: 1, v: 0 },
        distance: { h: -50, v: 50 },
      });
    }

    {
      UIConstraint2DBuilder.distance(this, this.teamBalanceProgress, {
        anchorA: { h: 1, v: 1 },
        anchorB: { h: 1, v: 1 },
        distance: { h: -50, v: -50 },
      });
    }

    {
      new UIHorizontalDistanceConstraint(this, this.tutorial);
      new UIVerticalDistanceConstraint(this, this.tutorial, {
        anchorA: 0.75,
        orientation: UIOrientation.VERTICAL,
      });
      new UIVerticalDistanceConstraint(this, this.tutorial, {
        anchorA: 0,
        anchorB: 0,
        distance: 50,
        orientation: UIOrientation.HORIZONTAL,
      });
    }

    {
      new UIHorizontalDistanceConstraint(this, this.attackJoystick, {
        anchorA: 1,
        anchorB: 1,
      });
      new UIVerticalDistanceConstraint(
        this.downloadButton,
        this.attackJoystick,
        {
          anchorA: 1,
          anchorB: 0,
        },
      );
      UIConstraint2DBuilder.distance(this, this.attackJoystick, {
        anchorA: { h: 0.5, v: 1 },
        anchorB: { h: 0, v: 1 },
      });
    }

    {
      new UIHorizontalDistanceConstraint(this, this.movementJoystick, {
        anchorA: 0,
        anchorB: 0,
      });
      new UIVerticalDistanceConstraint(
        this.downloadButton,
        this.movementJoystick,
        {
          anchorA: 1,
          anchorB: 0,
        },
      );
      UIConstraint2DBuilder.distance(this, this.movementJoystick, {
        anchorA: { h: 0.5, v: 1 },
        anchorB: { h: 1, v: 1 },
      });
    }

    this.downloadButton.on(UIInputEvent.DOWN, () =>
      MraidSDK.open("end screen button"),
    );

    this.attackJoystick.on(
      UIAttackJoystickEvent.MOVE,
      (angle: number, distance: number) =>
        this.emit(UIBasicLayerEvent.ATTACK_JOYSTICK_MOVE, angle, distance),
    );
    this.attackJoystick.on(UIAttackJoystickEvent.RELEASE, () =>
      this.emit(UIBasicLayerEvent.ATTACK_JOYSTICK_RELEASE),
    );

    this.movementJoystick.on(
      UIMovementJoystickEvent.MOVE,
      (angle: number, distance: number) =>
        this.emit(UIBasicLayerEvent.MOVEMENT_JOYSTICK_MOVE, angle, distance),
    );
    this.movementJoystick.on(UIMovementJoystickEvent.RELEASE, () =>
      this.emit(UIBasicLayerEvent.MOVEMENT_JOYSTICK_RELEASE),
    );
  }

  public async show(): Promise<void> {
    this.mode = UIMode.VISIBLE;

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIAppearAnimator.appear(this.logotype, {
        duration,
        xFrom: -100,
        yFrom: 100,
      }),
      this.teamBalanceProgress.show(duration, delay),
      UIAppearAnimator.appear(this.downloadButton, {
        delay: delay * 2,
        duration,
        xFrom: 100,
        yFrom: -100,
      }),
      this.movementJoystick.show(duration, delay * 3),
      this.attackJoystick.show(duration, delay * 4),
      UIAppearAnimator.appear(this.tutorial, {
        delay: delay * 5,
        duration,
        yFrom: this.orientation === UIOrientation.VERTICAL ? 100 : -100,
      }),
    ]);

    UIJumpCallAnimator.jump(this.downloadButton);
    this.mode = UIMode.INTERACTIVE;
  }

  public async hide(): Promise<void> {
    this.mode = UIMode.VISIBLE;

    UIJumpCallAnimator.stopJump(this.downloadButton);

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIDisappearAnimator.disappear(this.tutorial, {
        duration,
        yTo: this.orientation === UIOrientation.VERTICAL ? 100 : -100,
      }),
      this.attackJoystick.hide(duration, delay),
      this.movementJoystick.hide(duration, delay * 2),
      UIDisappearAnimator.disappear(this.downloadButton, {
        delay: delay * 3,
        duration,
        xTo: 100,
        yTo: -100,
      }),
      this.teamBalanceProgress.hide(duration, delay * 4),
      UIDisappearAnimator.disappear(this.logotype, {
        delay: delay * 5,
        duration,
        xTo: -100,
        yTo: 100,
      }),
    ]);

    this.mode = UIMode.HIDDEN;
  }

  public async showCollectLootboxesTutorial() {
    await UIDisappearAnimator.disappear(this.tutorial);
    this.tutorial.texture = AssetKeeper.T_CollectAllLootboxes;
    await UIAppearAnimator.appear(this.tutorial);
  }

  public async hideTutorial() {
    await UIDisappearAnimator.disappear(this.tutorial);
  }
}
