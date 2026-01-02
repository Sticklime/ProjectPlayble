import { AssetKeeper } from "Generated/AssetKeeper";
import type { UILayer } from "laymur";
import {
  UIConstraint2DBuilder,
  UIGraphics,
  UIHorizontalDistanceConstraint,
  UIImage,
  UIInputEvent,
  UIMode,
  UIVerticalDistanceConstraint,
} from "laymur";
import { UIAppearAnimator, UIDisappearAnimator } from "laymur-animations";
import { Vector2 } from "three";

export enum UIAttackJoystickEvent {
  MOVE = "move",
  RELEASE = "release",
}

export class UIAttackJoystick extends UIGraphics {
  private readonly tutorialJoystick = new UIImage(
    this.layer,
    AssetKeeper.T_Joystick,
  );
  private readonly tutorialJoystickCap = new UIImage(
    this.layer,
    AssetKeeper.T_AttackJoystickCap,
  );
  private readonly tutorialJoystickText = new UIImage(
    this.layer,
    AssetKeeper.T_HoldToShoot,
  );
  private readonly tutorialJoystickHand = new UIImage(
    this.layer,
    AssetKeeper.T_Hand,
  );

  private readonly joystick = new UIImage(this.layer, AssetKeeper.T_Joystick, {
    mode: UIMode.HIDDEN,
  });
  private readonly joystickCap = new UIImage(
    this.layer,
    AssetKeeper.T_AttackJoystickCap,
    { mode: UIMode.HIDDEN },
  );

  private pointerIdentifier?: number;
  private readonly tempVector2 = new Vector2();

  private tutorialJoystickTimeout?: ReturnType<typeof setTimeout>;
  private tutorialJoystickAnimation?: gsap.core.Tween;
  private tutorialJoystickShowAnimation?: gsap.core.Tween;
  private tutorialJoystickHideAnimation?: gsap.core.Tween;

  constructor(layer: UILayer) {
    super(layer, { mode: UIMode.INTERACTIVE });

    UIConstraint2DBuilder.distance(this, this.tutorialJoystick, {
      anchorA: { h: 1, v: 0 },
      anchorB: { h: 1, v: 0 },
      distance: { h: -50, v: 50 },
    });

    UIConstraint2DBuilder.distance(
      this.tutorialJoystick,
      this.tutorialJoystickCap,
    );

    new UIHorizontalDistanceConstraint(
      this.tutorialJoystick,
      this.tutorialJoystickText,
    );

    new UIVerticalDistanceConstraint(
      this.tutorialJoystick,
      this.tutorialJoystickText,
      {
        anchorA: 1,
        anchorB: 0,
        distance: 50,
      },
    );

    UIConstraint2DBuilder.distance(
      this.tutorialJoystick,
      this.tutorialJoystickHand,
      {
        anchorB: { h: 0.4, v: 0.9 },
      },
    );

    this.tutorialJoystickHand.micro.anchorX = 0.4;
    this.tutorialJoystickHand.micro.anchorY = 0.9;
    this.tutorialJoystickHand.micro.angle = 45;

    this.on(UIInputEvent.DOWN, this.onJoystickDown);
    this.layer.on(UIInputEvent.MOVE, this.onJoystickMove);
    this.layer.on(UIInputEvent.UP, this.onJoystickUp);
  }

  public async show(duration: number = 0.35, delay: number = 0): Promise<void> {
    await UIAppearAnimator.appear(
      [
        this.tutorialJoystick,
        this.tutorialJoystickCap,
        this.tutorialJoystickText,
        this.tutorialJoystickHand,
      ],
      {
        delay,
        duration,
        xFrom: 100,
        yFrom: -100,
      },
    );

    this.showTutorial();
  }

  public async hide(duration: number = 0.35, delay: number = 0): Promise<void> {
    this.unscheduleTutorial();
    this.tutorialJoystickAnimation?.kill();
    this.pointerIdentifier = undefined;

    await UIDisappearAnimator.disappear(
      [
        this.tutorialJoystick,
        this.tutorialJoystickCap,
        this.tutorialJoystickText,
        this.tutorialJoystickHand,
      ],
      {
        delay,
        duration,
        xTo: 100,
        yTo: -100,
      },
    );
  }

  private readonly onJoystickDown = (
    x: number,
    y: number,
    identifier: number,
  ) => {
    if (this.pointerIdentifier === undefined) {
      this.hideTutorial();
      this.rescheduleTutorial(3);

      this.pointerIdentifier = identifier;
      this.joystick.centerX = x;
      this.joystick.centerY = y;
      this.joystickCap.centerX = x;
      this.joystickCap.centerY = y;

      this.joystick.mode = UIMode.VISIBLE;
      this.joystickCap.mode = UIMode.VISIBLE;
      this.showInteractiveJoystick();
    }
  };

  private readonly onJoystickMove = (
    x: number,
    y: number,
    identifier: number,
  ) => {
    if (this.pointerIdentifier === identifier) {
      this.hideTutorial();
      this.rescheduleTutorial(3);

      const joystickRadius = this.joystick.height * 0.5;
      const value = this.tempVector2
        .set(x - this.joystick.centerX, y - this.joystick.centerY)
        .clampLength(0, joystickRadius);

      this.joystickCap.centerX = this.joystick.centerX + value.x;
      this.joystickCap.centerY = this.joystick.centerY + value.y;

      value.divideScalar(joystickRadius);
      this.emit(
        UIAttackJoystickEvent.MOVE,
        value.angle() - Math.PI / 2,
        value.length(),
      );
    }
  };

  private readonly onJoystickUp = (
    x: number,
    y: number,
    identifier: number,
  ) => {
    if (this.pointerIdentifier === identifier) {
      this.hideTutorial();
      this.rescheduleTutorial(3);

      this.pointerIdentifier = undefined;
      this.emit(UIAttackJoystickEvent.RELEASE);
      this.hideInteractiveJoystick();
    }
  };

  private showInteractiveJoystick(): void {
    void UIAppearAnimator.appear([this.joystick, this.joystickCap], {
      duration: 0.25,
    });
  }

  private hideInteractiveJoystick(): void {
    const duration = 0.35;
    gsap
      .timeline({
        onComplete: () => {
          this.joystick.mode = UIMode.HIDDEN;
          this.joystickCap.mode = UIMode.HIDDEN;
        },
      })
      .to(this.joystickCap, {
        centerX: this.joystick.centerX,
        centerY: this.joystick.centerY,
        duration: duration / 2,
        ease: "elastic.out",
      })
      .to([this.joystick.color, this.joystickCap.color], {
        a: 0,
        duration: duration / 2,
      });
  }

  private unscheduleTutorial(): void {
    if (this.tutorialJoystickTimeout) {
      clearTimeout(this.tutorialJoystickTimeout);
      this.tutorialJoystickTimeout = undefined;
    }
  }

  private rescheduleTutorial(delay: number): void {
    this.unscheduleTutorial();

    this.tutorialJoystickTimeout = setTimeout(
      this.showTutorial.bind(this),
      delay * 1000,
    );
  }

  private hideTutorial(): void {
    this.tutorialJoystickShowAnimation?.kill();
    this.tutorialJoystickShowAnimation = undefined;

    this.tutorialJoystickAnimation?.kill();
    this.tutorialJoystickAnimation = undefined;

    if (!this.tutorialJoystickHideAnimation) {
      this.tutorialJoystickHideAnimation = gsap.to(
        [
          this.tutorialJoystick.color,
          this.tutorialJoystickCap.color,
          this.tutorialJoystickText.color,
          this.tutorialJoystickHand.color,
        ],
        {
          a: 0,
          duration: 0.25,
          onComplete: () => {
            this.tutorialJoystickHideAnimation = undefined;
          },
        },
      );
    }
  }

  private showTutorial(): void {
    this.tutorialJoystickHideAnimation?.kill();
    this.tutorialJoystickHideAnimation = undefined;

    if (!this.tutorialJoystickShowAnimation) {
      this.tutorialJoystickShowAnimation = gsap.to(
        [
          this.tutorialJoystick.color,
          this.tutorialJoystickCap.color,
          this.tutorialJoystickText.color,
          this.tutorialJoystickHand.color,
        ],
        {
          a: 1,
          duration: 0.25,
          onComplete: () => {
            this.tutorialJoystickShowAnimation = undefined;
          },
        },
      );
    }

    const radius = this.tutorialJoystick.width / 2;
    const helper = { t: 0 };

    this.tutorialJoystickHand.micro.x = 0;
    this.tutorialJoystickHand.micro.y = 0;

    this.tutorialJoystickAnimation = gsap.to(helper, {
      t: Math.PI * 2,
      duration: 4,
      repeat: -1,
      ease: "power2.inOut",
      onUpdate: () => {
        const x = radius * Math.sin(helper.t);
        const y = radius * Math.sin(helper.t) * Math.cos(helper.t);

        this.tutorialJoystickHand.micro.x = x;
        this.tutorialJoystickHand.micro.y = y;
      },
    });
  }
}
