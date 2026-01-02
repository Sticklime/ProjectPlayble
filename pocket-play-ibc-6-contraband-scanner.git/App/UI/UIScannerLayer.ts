import { AssetKeeper } from "Generated/AssetKeeper";
import type { UIVerticalDistanceConstraint } from "laymur";
import {
  UIConstraint2DBuilder,
  UICoverConstraintBuilder,
  UIFullscreenLayer,
  UIImage,
  UIInputEvent,
  UIMicroAnchorMode,
  UIMode,
  UIResizePolicyFixedHeight,
} from "laymur";
import {
  UIAppearAnimator,
  UIClickAnimator,
  UIDisappearAnimator,
  UIPulseCallAnimator,
} from "laymur-animations";
import { safePromise, safeWait } from "Libs/Toolbox/safeFunctions";
import type { Texture } from "three";
import { MathUtils } from "three";
import { UIAnimatedImage } from "./UIAnimatedImage";

export enum UIScannerLayerEvent {
  SHOW_NEXT_CAR = 0,
  COINS_COLLECTED = 1,
  COINS_SPENT = 2,
}

export class UIScannerLayer extends UIFullscreenLayer {
  private readonly background = new UIImage(
    this,
    AssetKeeper.T_Scanner_Background,
  );

  private readonly screenBackground = new UIImage(this, AssetKeeper.T_Screen);
  private readonly screenContent = new UIImage(this, AssetKeeper.T_Screen);
  private readonly screenGlow = new UIImage(this, ...AssetKeeper.T_Screen_Glow);
  private readonly screenBattery = new UIImage(
    this,
    ...AssetKeeper.T_Battery_2,
  );
  private readonly screenBeam = new UIImage(
    this,
    ...AssetKeeper.T_Scanner_Beam,
  );

  private readonly scanerSiren = new UIAnimatedImage(this, [
    ...Array.from({ length: 26 }, (_, i) => ({
      texture: App.Gameplay?.getThreeTexture(
        `T_Siren_${String(i + 1).padStart(2, "0")}.png`,
      ) as Texture,
      dimensions: { x: 542, y: 542 },
    })),
  ]);
  private readonly scanner = new UIImage(this, AssetKeeper.T_Scanner_0);
  private readonly scannerGreenButtonGlow = new UIImage(
    this,
    ...AssetKeeper.T_Scanner_0_Green_Button_Glow,
  );
  private readonly scannerGreenButtonPressed = new UIImage(
    this,
    ...AssetKeeper.T_Scanner_0_Green_Button_Pressed,
  );
  private readonly scannerRedButtonGlow = new UIImage(
    this,
    ...AssetKeeper.T_Scanner_0_Red_Button_Glow,
  );
  private readonly scannerRedButtonPressed = new UIImage(
    this,
    ...AssetKeeper.T_Scanner_0_Red_Button_Pressed,
  );

  private readonly enhancedScanner = new UIImage(
    this,
    AssetKeeper.T_Enhanced_Scanner,
  );

  private readonly confiscateTutorial = new UIImage(
    this,
    ...AssetKeeper.T_Tap_To_Confiscate,
  );
  private readonly letTutorial = new UIImage(
    this,
    ...AssetKeeper.T_Tap_To_Let_Through,
  );
  private readonly handTutorial = new UIImage(this, ...AssetKeeper.T_Hand);

  private readonly cardOverlay = new UIImage(this, ...AssetKeeper.T_Overlay);
  private readonly card = new UIImage(this, ...AssetKeeper.T_Level_2_Card);
  private readonly cardButton = new UIImage(this, ...AssetKeeper.T_Button_200);
  private readonly cardHand = new UIImage(this, ...AssetKeeper.T_Hand);

  private scannerVerticalConstraint: UIVerticalDistanceConstraint;
  private enhancedScannerVerticalConstraint: UIVerticalDistanceConstraint;

  private readonly starPool: UIImage[] = [];

  constructor() {
    super(new UIResizePolicyFixedHeight(1920, 1920), UIMode.HIDDEN);

    this.createStarPool();

    // Common
    {
      UICoverConstraintBuilder.build(this, this.background, {
        keepActiveAspect: true,
      });
    }

    // Scanner
    {
      const { v } = UIConstraint2DBuilder.distance(this, this.scanner, {
        anchorA: { h: 0.5, v: 0 },
        anchorB: { h: 0.5, v: 0 },
      });
      this.scannerVerticalConstraint = v;

      UIConstraint2DBuilder.distance(this.scanner, this.scanerSiren, {
        anchorA: { h: 0.5, v: 1 },
        anchorB: { h: 0.5, v: 0.16 },
        distance: { h: 0, v: -5 },
      });

      UIConstraint2DBuilder.distance(
        this.scanner,
        this.scannerGreenButtonGlow,
        {
          anchorA: { h: 902 / 1524, v: 1 - 1085 / 1452 },
        },
      );

      UIConstraint2DBuilder.distance(
        this.scanner,
        this.scannerGreenButtonPressed,
        {
          anchorA: { h: 902 / 1524, v: 1 - 1085 / 1452 },
        },
      );

      UIConstraint2DBuilder.distance(this.scanner, this.scannerRedButtonGlow, {
        anchorA: { h: 620 / 1524, v: 1 - 1085 / 1452 },
      });

      UIConstraint2DBuilder.distance(
        this.scanner,
        this.scannerRedButtonPressed,
        {
          anchorA: { h: 620 / 1524, v: 1 - 1085 / 1452 },
        },
      );
    }

    {
      const { v } = UIConstraint2DBuilder.distance(this, this.enhancedScanner, {
        anchorA: { h: 0.5, v: 0 },
        anchorB: { h: 0.5, v: 0 },
      });
      this.enhancedScannerVerticalConstraint = v;
    }

    //Tutorial
    {
      UIConstraint2DBuilder.distance(this.scanner, this.confiscateTutorial, {
        anchorA: { h: 0.5, v: 0.4 },
      });
      UIConstraint2DBuilder.distance(this.scanner, this.letTutorial, {
        anchorA: { h: 0.5, v: 0.4 },
      });
    }

    // Screen
    {
      UIConstraint2DBuilder.distance(this.scanner, this.screenBackground, {
        anchorA: { h: 0.5, v: 0.665 },
      });

      UIConstraint2DBuilder.distance(this.scanner, this.screenContent, {
        anchorA: { h: 0.5, v: 0.665 },
      });

      UIConstraint2DBuilder.distance(this.scanner, this.screenGlow, {
        anchorA: { h: 0.5, v: 0.665 },
      });

      UIConstraint2DBuilder.distance(this.scanner, this.screenBeam, {
        anchorA: { h: 0.5, v: 0.9 },
      });

      UIConstraint2DBuilder.distance(this.scanner, this.screenBattery, {
        anchorA: { h: 0.685, v: 0.835 },
      });
    }

    // Card
    {
      UICoverConstraintBuilder.build(this, this.cardOverlay);
      UIConstraint2DBuilder.distance(this, this.card);
      UIConstraint2DBuilder.distance(this.card, this.cardButton, {
        anchorA: { h: 0.5, v: 0.25 },
      });
      UIConstraint2DBuilder.distance(this.cardButton, this.cardHand, {
        anchorA: { h: 0.85, v: 0.5 },
        anchorB: { h: 0, v: 0 },
      });
    }

    {
      this.handTutorial.micro.anchorX = 0.2;
      this.handTutorial.micro.anchorY = 0.8;
      this.handTutorial.micro.anchorMode =
        UIMicroAnchorMode.POSITION_ROTATION_SCALE;

      this.cardHand.micro.anchorX = 0.2;
      this.cardHand.micro.anchorY = 0.8;
      this.cardHand.micro.anchorMode =
        UIMicroAnchorMode.POSITION_ROTATION_SCALE;
    }
  }

  public async show(): Promise<void> {
    this.mode = UIMode.VISIBLE;

    this.cardOverlay.mode = UIMode.HIDDEN;
    this.card.mode = UIMode.HIDDEN;
    this.cardButton.mode = UIMode.HIDDEN;
    this.cardHand.mode = UIMode.HIDDEN;

    this.scannerGreenButtonGlow.mode = UIMode.HIDDEN;
    this.scannerGreenButtonPressed.mode = UIMode.HIDDEN;
    this.scannerRedButtonGlow.mode = UIMode.HIDDEN;
    this.scannerRedButtonPressed.mode = UIMode.HIDDEN;

    this.confiscateTutorial.mode = UIMode.HIDDEN;
    this.letTutorial.mode = UIMode.HIDDEN;
    this.handTutorial.mode = UIMode.HIDDEN;

    this.enhancedScanner.mode = UIMode.HIDDEN;

    const duration = 0.35;
    const delay = duration / 2;

    await Promise.all([
      UIAppearAnimator.appear(this.background, {
        duration,
        scaleFrom: 1.25,
      }),
      safePromise((resolve) => {
        gsap.fromTo(
          this.scannerVerticalConstraint,
          {
            anchorA: -1,
          },
          {
            anchorA: 0,
            delay,
            duration: 0.75,
            ease: "back.out",
            onComplete: resolve,
          },
        );
      }),
    ]);

    this.mode = UIMode.INTERACTIVE;
  }

  public async hide(): Promise<void> {
    this.mode = UIMode.VISIBLE;

    const duration = 0.35;
    const scannerDuration = 0.75;

    await Promise.all([
      safePromise((resolve) => {
        gsap.to(
          [
            this.enhancedScannerVerticalConstraint,
            this.scannerVerticalConstraint,
          ],
          {
            anchorA: -1,
            duration: scannerDuration,
            ease: "back.in",
            onComplete: resolve,
          },
        );
      }),
      UIDisappearAnimator.disappear(this.background, {
        delay: scannerDuration - duration / 2,
        duration,
        scaleTo: 1.25,
      }),
    ]);

    this.mode = UIMode.HIDDEN;
  }

  public async runScanSequence(): Promise<void> {
    // Car 0
    {
      await safeWait(0.05);
      await this.setupScreenCarImage(AssetKeeper.T_Car_0_0);
      await this.setupScreenImageScale(AssetKeeper.T_Car_0_1);
      await this.animateBeam(0.7);
      this.screenContent.texture = AssetKeeper.T_Car_0_2;
      this.scanerSiren.play();
      await this.runButtonSequence(
        this.scannerRedButtonGlow,
        this.scannerRedButtonPressed,
        this.confiscateTutorial,
      );
      void this.setupScreenImageSoft(AssetKeeper.T_Car_0_3);
      this.scanerSiren.stop();
      this.emit(UIScannerLayerEvent.COINS_COLLECTED, {
        x: this.scannerRedButtonGlow.centerX / this.width,
        y: this.scannerRedButtonGlow.centerY / this.height,
      });
      await safeWait(0.75);
      await Promise.all([
        this.setupScreenImage(AssetKeeper.T_Screen),
        this.setupBatteryImage(...AssetKeeper.T_Battery_1),
      ]);
    }

    await this.hide();
    this.emit(UIScannerLayerEvent.SHOW_NEXT_CAR);
    await safeWait(1);
    await this.show();

    // Car 1
    {
      await safeWait(0.05);
      MraidSDK.playSound("S_Horn");
      await this.setupScreenCarImage(AssetKeeper.T_Car_1_0);
      await this.setupScreenImageScale(AssetKeeper.T_Car_1_1);
      await this.animateBeam();
      await this.runButtonSequence(
        this.scannerGreenButtonGlow,
        this.scannerGreenButtonPressed,
        this.letTutorial,
      );
      this.emit(UIScannerLayerEvent.COINS_COLLECTED, {
        x: this.scannerGreenButtonGlow.centerX / this.width,
        y: this.scannerGreenButtonGlow.centerY / this.height,
      });
      await safeWait(0.75);
      await Promise.all([
        this.setupScreenImage(AssetKeeper.T_Screen),
        this.setupBatteryImage(...AssetKeeper.T_Battery_0),
      ]);
    }

    // Card
    {
      await this.runCardSequence();
      await this.showEnhancedScanner();
      await this.showStarsAnimation();
    }
  }

  private async runCardSequence(): Promise<void> {
    const duration = 0.35;
    const delay = duration / 2;

    this.cardOverlay.mode = UIMode.VISIBLE;
    this.card.mode = UIMode.VISIBLE;
    this.cardButton.mode = UIMode.VISIBLE;
    this.cardHand.mode = UIMode.VISIBLE;

    await Promise.all([
      UIAppearAnimator.appear(this.cardOverlay, {
        duration,
        scaleFrom: 1,
      }),
      UIAppearAnimator.appear(this.card, {
        delay,
        duration,
      }),
      UIAppearAnimator.appear([this.cardButton, this.cardHand], {
        delay: delay * 2,
        duration,
      }),
    ]);

    UIPulseCallAnimator.pulse(this.cardHand, { cooldown: 0 });

    return safePromise((resolve) => {
      this.cardButton.mode = UIMode.INTERACTIVE;
      this.cardButton.once(UIInputEvent.CLICK, async () => {
        this.cardButton.mode = UIMode.VISIBLE;
        MraidSDK.playSound("S_Upgrade");

        await UIClickAnimator.click(this.cardButton, {
          xScale: 0.5,
          yScale: 0.5,
        });

        const item = this.cardButton;
        this.emit(UIScannerLayerEvent.COINS_SPENT, {
          x: (item.x + item.width * 0.15) / this.width,
          y: (item.y + item.height * 0.5) / this.height,
        });

        UIPulseCallAnimator.stopPulse(this.cardButton);

        await Promise.all([
          UIDisappearAnimator.disappear(
            [this.card, this.cardButton, this.cardHand],
            {
              duration,
            },
          ),
          UIDisappearAnimator.disappear(this.cardOverlay, {
            delay,
            duration,
            scaleTo: 1,
          }),
        ]);
        this.cardOverlay.mode = UIMode.HIDDEN;
        this.card.mode = UIMode.HIDDEN;
        this.cardButton.mode = UIMode.HIDDEN;
        resolve();
      });
    });
  }

  private createStarPool(): void {
    const poolSize = 64;
    const textures = [AssetKeeper.T_Star_0, AssetKeeper.T_Star_1];

    for (let i = 0; i < poolSize; i++) {
      const star = new UIImage(this, ...textures[i % 2]!);
      star.mode = UIMode.HIDDEN;
      this.starPool.push(star);
    }
  }

  private async showStarsAnimation(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < this.starPool.length; i++) {
      const star = this.starPool[i] as UIImage;
      const x = MathUtils.randFloat(
        this.enhancedScanner.x + 0.25,
        this.enhancedScanner.oppositeX - 0.25,
      );
      const y = MathUtils.randFloat(
        this.enhancedScanner.y,
        this.enhancedScanner.oppositeY - 0.4,
      );

      promises.push(
        safePromise((resolve) => {
          star.mode = UIMode.VISIBLE;
          star.x = x;
          star.y = y;
          const scale = MathUtils.randFloat(0.25, 1);
          star.micro.scaleX = scale;
          star.micro.scaleY = scale;

          star.color.a = 1;

          star.color.a = 0;
          gsap.timeline({ onComplete: resolve }).to(star.color, {
            a: 1,
            delay: Math.random(),
            duration: 0.5,
            ease: "power2.inOut",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              star.mode = UIMode.HIDDEN;
            },
          });
        }),
      );
    }

    await Promise.all(promises);
  }

  private async showEnhancedScanner(): Promise<void> {
    this.mode = UIMode.VISIBLE;

    this.scannerGreenButtonGlow.mode = UIMode.HIDDEN;
    this.scannerGreenButtonPressed.mode = UIMode.HIDDEN;
    this.scannerRedButtonGlow.mode = UIMode.HIDDEN;
    this.scannerRedButtonPressed.mode = UIMode.HIDDEN;

    const duration = 0.35;
    const delay = duration / 2;

    await safePromise((resolve) => {
      gsap.to(this.scannerVerticalConstraint, {
        anchorA: -1,
        delay,
        duration: 0.75,
        ease: "back.in",
        onComplete: resolve,
      });
    });
    MraidSDK.playSound("S_Claps");

    await safePromise((resolve) => {
      gsap.fromTo(
        this.enhancedScannerVerticalConstraint,
        { anchorA: -1 },
        {
          anchorA: 0,
          delay,
          duration: 0.75,
          ease: "back.out",
          onStart: () => {
            this.enhancedScanner.mode = UIMode.VISIBLE;
          },
          onComplete: resolve,
        },
      );
    });

    this.mode = UIMode.INTERACTIVE;
  }

  private async animateBeam(factor: number = 1): Promise<void> {
    return safePromise((resolve) => {
      this.screenBeam.color.a = 1;
      gsap
        .timeline()
        .fromTo(
          this.screenBeam.micro,
          {
            y: 0,
          },
          {
            y: -650 * factor,
            duration: 1.5,
            ease: "none",
            onComplete: resolve,
          },
        )
        .to(this.screenBeam.color, {
          a: 0,
          duration: 0.25,
          ease: "none",
        });
    });
  }

  private async setupBatteryImage(
    texture: Texture,
    dimensions: { width: number; height: number },
  ): Promise<void> {
    const duration = 0.05;
    return safePromise((resolve) => {
      gsap
        .timeline()
        .to(this.screenBattery.color, {
          a: 0,
          duration,
          ease: "power2.inOut",
          onComplete: () => {
            this.screenBattery.texture = texture;
            this.screenBattery.width = dimensions.width;
            this.screenBattery.height = dimensions.height;
          },
        })
        .to(this.screenBattery.color, {
          a: 1,
          duration,
          ease: "power2.inOut",
          onComplete: resolve,
        });
    });
  }

  private async setupScreenCarImage(texture: Texture): Promise<void> {
    this.screenContent.texture = texture;

    return safePromise((resolve) => {
      const duration = 1.5;
      gsap
        .timeline()
        .fromTo(
          this.screenContent.micro,
          { x: -250 },
          {
            x: 150,
            duration,
            ease: "power1.out",
          },
        )
        .fromTo(
          this.screenContent.color,
          { a: 0 },
          {
            a: 1,
            duration: duration / 4,
            ease: "power1.out",
          },
          0,
        )
        .to(
          this.screenContent.micro,
          {
            scaleX: 1.25,
            scaleY: 1.25,
            duration: duration / 2,
          },
          duration / 2,
        )
        .to(
          this.screenContent.color,
          {
            a: 0,
            duration: duration / 4,
            onComplete: resolve,
          },
          duration * 0.75,
        );
    });
  }

  private async setupScreenImageScale(texture: Texture): Promise<void> {
    return safePromise((resolve) => {
      this.screenContent.texture = texture;
      this.screenContent.micro.x = 0;
      this.screenContent.micro.y = 0;
      this.screenContent.micro.scaleX = 1;
      this.screenContent.micro.scaleY = 1;
      gsap.timeline().to(this.screenContent.color, {
        a: 1,
        duration: 0.25,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  private async setupScreenImage(texture: Texture): Promise<void> {
    return safePromise((resolve) => {
      gsap
        .timeline()
        .to(this.screenContent.micro, {
          scaleX: 0.5,
          scaleY: 0,
          duration: 0.1,
          ease: "power2.inOut",
          onComplete: () => {
            MraidSDK.playSound("S_Screen");
            this.screenContent.texture = texture;
          },
        })
        .to(this.screenContent.micro, {
          scaleX: 1,
          scaleY: 1,
          duration: 0.15,
          ease: "power2.inOut",
          onComplete: resolve,
        });
    });
  }

  private async setupScreenImageSoft(texture: Texture): Promise<void> {
    return safePromise((resolve) => {
      gsap
        .timeline()
        .to(this.screenContent.color, {
          a: 0,
          duration: 0.15,
          ease: "power1.inOut",
          onComplete: () => {
            this.screenContent.texture = texture;
          },
        })
        .to(this.screenContent.color, {
          a: 1,
          duration: 0.15,
          ease: "power1.inOut",
          onComplete: resolve,
        });
    });
  }

  private async runButtonSequence(
    glow: UIImage,
    pressed: UIImage,
    inscription: UIImage,
  ): Promise<void> {
    return safePromise(async (resolve) => {
      const timeline = gsap.fromTo(
        glow.color,
        {
          a: 0,
        },
        {
          a: 1,
          duration: 0.25,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        },
      );

      inscription.mode = UIMode.VISIBLE;
      this.handTutorial.mode = UIMode.VISIBLE;
      glow.mode = UIMode.INTERACTIVE;

      const onResize = () => {
        this.handTutorial.x = glow.centerX + this.handTutorial.width * 0.25;
        this.handTutorial.y = glow.centerY - this.handTutorial.height * 0.25;
      };

      onResize();
      window.addEventListener("resize", onResize);

      await UIAppearAnimator.appear([inscription, this.handTutorial]);
      UIPulseCallAnimator.pulse(this.handTutorial, { cooldown: 0 });

      glow.once(UIInputEvent.CLICK, async () => {
        window.removeEventListener("resize", onResize);

        timeline.kill();
        glow.mode = UIMode.VISIBLE;
        pressed.mode = UIMode.VISIBLE;
        MraidSDK.playSound("S_Click");

        UIPulseCallAnimator.stopPulse(this.handTutorial);
        await UIDisappearAnimator.disappear([inscription, this.handTutorial]);

        const durationIn = 0.25;

        gsap
          .timeline()
          .to(glow.color, {
            a: 0,
            duration: 0.15,
            ease: "power1.inOut",
            onComplete: () => {
              glow.mode = UIMode.HIDDEN;
            },
          })
          .fromTo(
            pressed.color,
            {
              a: 0,
            },
            {
              a: 1,
              duration: durationIn,
              ease: "power1.inOut",
              repeat: 1,
              yoyo: true,
              onComplete: () => {
                pressed.mode = UIMode.HIDDEN;
              },
            },
            0,
          );

        await safeWait(durationIn);
        resolve();
      });
    });
  }
}
