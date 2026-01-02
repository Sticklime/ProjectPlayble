import { AssetKeeper } from "Generated/AssetKeeper";
import { gsap } from "gsap";
import {
  UIConstraint2DBuilder,
  UIFullscreenLayer,
  UIImage,
  UIInputEvent,
  UIMode,
  UIResizePolicyFixedHeight,
  UIText,
} from "laymur";
import {
  UIAppearAnimator,
  UIDisappearAnimator,
  UISpinCallAnimator,
} from "laymur-animations";
import { Localizator } from "Libs/Toolbox/Localizator";
import { safePromise } from "Libs/Toolbox/safeFunctions";
import { MathUtils, Vector2, type Vector2Like } from "three";

export enum UIBasicLayerEvent {
  CLICK = "click",
}

export class UIBasicLayer extends UIFullscreenLayer {
  private readonly logotype = new UIImage(this, ...AssetKeeper.T_Logotype);
  private readonly download = new UIImage(this, ...AssetKeeper.T_Download);
  private readonly walletBackground = new UIImage(
    this,
    ...AssetKeeper.T_Wallet,
  );
  private readonly walletCoin = new UIImage(this, ...AssetKeeper.T_Coin);
  private readonly walletValue = new UIText(this, "0", {
    commonStyle: Localizator.readLaymurMessage("WALLET_VALUE").style,
    padding: { top: 10, bottom: 10, left: 10, right: 10 },
  });
  private readonly tutorial = new UIImage(this, ...AssetKeeper.T_Too_Many_Cars);
  private readonly hand = new UIImage(this, ...AssetKeeper.T_Hand_Click);
  private readonly handInscription = new UIImage(
    this,
    ...AssetKeeper.T_Tap_To_Start,
  );

  private readonly coinPool: UIImage[] = [];

  private readonly collectCoinsInscription = new UIText(this, "+250", {
    commonStyle: Localizator.readLaymurMessage("COLLECT_COINS").style,
    padding: { top: 10, bottom: 10, left: 10, right: 10 },
  });

  private readonly spendCoinsInscription = new UIText(this, "-250", {
    commonStyle: Localizator.readLaymurMessage("SPEND_COINS").style,
    padding: { top: 10, bottom: 10, left: 10, right: 10 },
  });

  private tutorialTimeline?: gsap.core.Timeline;

  private currentWalletValue = 0;

  constructor() {
    super(new UIResizePolicyFixedHeight(1080, 1920), UIMode.HIDDEN);

    for (let i = 0; i < 10; i++) {
      const image = new UIImage(this, ...AssetKeeper.T_Coin);
      image.mode = UIMode.HIDDEN;
      image.zIndex = this.walletCoin.zIndex - 1;
      this.coinPool.push(image);
    }

    UIConstraint2DBuilder.distance(this, this.logotype, {
      anchorA: { h: 0, v: 1 },
      anchorB: { h: 0, v: 1 },
      distance: { h: 50, v: -50 },
    });

    UIConstraint2DBuilder.distance(this, this.download, {
      anchorA: { h: 0, v: 0 },
      anchorB: { h: 0, v: 0 },
      distance: { h: 50, v: 50 },
    });

    UIConstraint2DBuilder.distance(this, this.walletBackground, {
      anchorA: { h: 1, v: 1 },
      anchorB: { h: 1, v: 1 },
      distance: { h: -50, v: -50 },
    });

    UIConstraint2DBuilder.distance(
      this.walletBackground,
      this.spendCoinsInscription,
      {
        anchorA: { h: 0.5, v: 0 },
        anchorB: { h: 0.5, v: 1 },
        distance: { h: 0, v: -50 },
      },
    );

    UIConstraint2DBuilder.distance(this.walletBackground, this.walletCoin, {
      anchorA: { h: 0.25, v: 0.5 },
      anchorB: { h: 1, v: 0.5 },
    });

    UIConstraint2DBuilder.distance(this.walletBackground, this.walletValue, {
      anchorA: { h: 0.9, v: 0.5 },
      anchorB: { h: 1, v: 0.5 },
    });

    UIConstraint2DBuilder.distance(this, this.hand);

    UIConstraint2DBuilder.distance(this.hand, this.handInscription, {
      anchorB: { h: 0.5, v: 0 },
      distance: { h: 0, v: 100 },
    });

    UIConstraint2DBuilder.distance(this, this.tutorial, {
      anchorA: { h: 0.5, v: 0.75 },
    });

    this.download.mode = UIMode.INTERACTIVE;
    this.download.on(UIInputEvent.CLICK, () =>
      MraidSDK.open("end screen button"),
    );
  }

  public async show(): Promise<void> {
    this.mode = UIMode.VISIBLE;
    this.hand.color.a = 0;

    this.tutorial.mode = UIMode.HIDDEN;
    this.handInscription.mode = UIMode.HIDDEN;
    this.hand.mode = UIMode.HIDDEN;

    this.collectCoinsInscription.mode = UIMode.HIDDEN;
    this.spendCoinsInscription.mode = UIMode.HIDDEN;

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIAppearAnimator.appear(this.logotype, {
        duration,
        xFrom: -100,
        yFrom: 100,
      }),
      UIAppearAnimator.appear(
        [this.walletBackground, this.walletCoin, this.walletValue],
        {
          delay,
          duration,
          xFrom: 100,
          yFrom: 100,
        },
      ),
      UIAppearAnimator.appear(this.download, {
        delay: delay * 2,
        duration,
        xFrom: -100,
        yFrom: -100,
      }),
    ]);

    UISpinCallAnimator.spin(this.download);
  }

  public async runTutorialSequence(): Promise<void> {
    this.tutorial.mode = UIMode.VISIBLE;
    this.handInscription.mode = UIMode.VISIBLE;
    this.hand.mode = UIMode.VISIBLE;

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIAppearAnimator.appear(this.tutorial, {
        duration,
      }),
      UIAppearAnimator.appear(this.handInscription, {
        delay: delay * 2,
        duration,
      }),
    ]);

    {
      const duration = 0.35;
      const ease = "power2.inOut";

      this.tutorialTimeline = gsap
        .timeline()
        .to(this.hand.color, {
          duration,
          a: 1,
          yoyo: true,
          repeat: -1,
          ease,
        })
        .to(
          this.hand.micro,
          {
            duration,
            scaleX: 0.9,
            scaleY: 0.9,
            angle: 10,
            yoyo: true,
            repeat: -1,
            ease,
          },
          0,
        );
    }

    this.mode = UIMode.INTERACTIVE;

    const onPointerDown = () => {
      window.removeEventListener("pointerdown", onPointerDown);
      MraidSDK.playSound("S_Click");
      this.hideTutorial()
        .then(() => this.emit(UIBasicLayerEvent.CLICK))
        .catch((e) => console.error("Error hiding tutorial:", e));
    };

    window.addEventListener("pointerdown", onPointerDown);
  }

  public async hide(): Promise<void> {
    this.mode = UIMode.VISIBLE;
    this.tutorialTimeline?.kill();
    UISpinCallAnimator.stopSpin(this.download);

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIDisappearAnimator.disappear(this.download, {
        duration,
        xTo: -100,
        yTo: 100,
      }),
      UIDisappearAnimator.disappear([this.walletBackground, this.walletValue], {
        delay,
        duration,
        xTo: 100,
        yTo: -100,
      }),
      UIDisappearAnimator.disappear(this.logotype, {
        delay: delay * 2,
        duration,
        xTo: -100,
        yTo: 100,
      }),
    ]);

    this.mode = UIMode.HIDDEN;
  }

  private async hideTutorial(): Promise<void> {
    this.tutorialTimeline?.kill();

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIDisappearAnimator.disappear(this.handInscription, {
        duration,
      }),
      UIDisappearAnimator.disappear(this.hand, {
        delay,
        duration,
      }),
      UIDisappearAnimator.disappear(this.tutorial, {
        delay: delay * 2,
        duration,
      }),
    ]);
  }

  public async collectCoins(
    screenPosition: Vector2Like,
    targetWalletValue: number,
  ): Promise<void> {
    const origin = new Vector2(
      screenPosition.x * this.width,
      screenPosition.y * this.height,
    );
    const destination = new Vector2(this.walletCoin.x, this.walletCoin.y);
    const direction = new Vector2().subVectors(destination, origin).normalize();
    const normal = new Vector2(-direction.y, direction.x);

    const originWalletValue = this.currentWalletValue;
    const delta = targetWalletValue - originWalletValue;

    this.showInscription(delta, origin);
    MraidSDK.playSound("S_Coins");

    await Promise.all(
      this.coinPool.map(async (image, i) => {
        await this.transferImage(
          image,
          origin,
          destination,
          normal,
          i * 0.01,
          0.35,
        );
        await safePromise((resolve) => {
          gsap
            .timeline({
              onComplete: () => {
                this.lerpCurrentWalletValue(
                  originWalletValue,
                  targetWalletValue,
                  (i + 1) / this.coinPool.length,
                );
                resolve(undefined);
              },
            })
            .to(this.walletCoin.micro, {
              scaleX: 1.25,
              scaleY: 1.25,
              duration: 0.05,
              ease: "power2.inOut",
            })
            .to(this.walletCoin.micro, {
              scaleX: 1,
              scaleY: 1,
              duration: 0.15,
              ease: "power2.inOut",
            });
        });
      }),
    );
  }

  public async spendCoins(
    screenPosition: Vector2Like,
    targetWalletValue: number,
  ): Promise<void> {
    this.spendCoinsInscription.mode = UIMode.VISIBLE;
    this.spendCoinsInscription.content = `-${this.currentWalletValue - targetWalletValue}`;

    this.currentWalletValue = targetWalletValue;
    this.walletValue.content = String(Math.round(this.currentWalletValue));

    return safePromise((resolve) => {
      const duration = 0.75;
      gsap
        .timeline()
        .fromTo(
          this.spendCoinsInscription.micro,
          { y: 0 },
          {
            y: -100,
            duration,
          },
        )
        .fromTo(
          this.spendCoinsInscription.color,
          { a: 0 },
          {
            a: 1,
            duration: duration / 3,
          },
          0,
        )
        .to(
          this.spendCoinsInscription.color,
          {
            a: 0,
            duration: duration / 3,
            onComplete: () => {
              this.spendCoinsInscription.mode = UIMode.HIDDEN;
              resolve();
            },
          },
          duration - duration / 3,
        );
    });
  }

  public async transferImage(
    image: UIImage,
    origin: Vector2,
    destination: Vector2,
    normal: Vector2,
    delay: number,
    duration: number,
  ): Promise<void> {
    return safePromise((resolve) => {
      const tempVector = new Vector2();
      const helper = { t: 0 };
      const magnitude = 200;
      const offset = MathUtils.randFloat(-magnitude, magnitude);

      gsap.to(helper, {
        t: 1,
        delay,
        duration,
        onStart: () => {
          image.mode = UIMode.VISIBLE;
        },
        onUpdate: () => {
          const t = Math.sin(Math.PI * helper.t);
          {
            const scale = MathUtils.lerp(0.25, 1, t);
            image.micro.scaleX = scale;
            image.micro.scaleY = scale;
          }
          {
            tempVector.lerpVectors(origin, destination, helper.t);
            tempVector.addScaledVector(normal, offset * t);
          }
          {
            image.x = tempVector.x;
            image.y = tempVector.y;
          }
        },
        onComplete: () => {
          image.mode = UIMode.HIDDEN;
          resolve();
        },
      });
    });
  }

  private lerpCurrentWalletValue(from: number, to: number, t: number): void {
    this.currentWalletValue = MathUtils.lerp(from, to, t);
    this.walletValue.content = String(Math.round(this.currentWalletValue));
  }

  private showInscription(value: number, position: Vector2Like) {
    this.collectCoinsInscription.mode = UIMode.VISIBLE;
    this.collectCoinsInscription.content = `+${value}`;

    this.collectCoinsInscription.x =
      position.x - this.collectCoinsInscription.width / 2 - 100;
    this.collectCoinsInscription.y =
      position.y - this.collectCoinsInscription.height / 2 + 75;

    const duration = 0.75;

    gsap
      .timeline()
      .fromTo(
        this.collectCoinsInscription.micro,
        { y: 0 },
        {
          y: 100,
          duration,
        },
      )
      .fromTo(
        this.collectCoinsInscription.color,
        { a: 0 },
        {
          a: 1,
          duration: duration / 3,
        },
        0,
      )
      .to(
        this.collectCoinsInscription.color,
        {
          a: 0,
          duration: duration / 3,
          onComplete: () => {
            this.collectCoinsInscription.mode = UIMode.HIDDEN;
          },
        },
        duration - duration / 3,
      );
  }
}
