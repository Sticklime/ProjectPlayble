import { Object3DToolbox } from "Object3DToolbox";
import Screen from "Screen";
import * as THREE from "three";
import { FXSimpleParticleSystem2D } from "FXSimpleParticleSystem2D";
import { safeWait } from "SafeFunctions";

App.CallToAction = new Screen({
  Name: "CallToAction",

  Containers: [
    {
      name: "UIContainer",
      type: "three-ui",
      childs: [
        {
          name: "UIOverlayContainer",
          childs: [
            {
              name: "ui_overlay",
              type: "three-image",
              image: "T_Overlay",
              scale: 8192,
              material: {
                opacity: 0.4,
              },
            },
          ],
        },
        {
          name: "ui_frame",
          type: "three-image",
          image: "T_Frame",
        },
        {
          name: "UIMainLayout",
          positionLandscape: [0, 0],
          positionPortrait: [0, 0],
          stickinessLandscape: [0.99, 0.99],
          stickinessPortrait: [0.99, 0.99],
          childs: [
            {
              name: "UIGlowContainer",
              position: [0, 200],
              childs: [
                {
                  name: "ui_glow_red",
                  type: "three-image",
                  image: "T_Glow_Red",
                },
                {
                  name: "ui_glow_white",
                  type: "three-image",
                  image: "T_Glow_White",
                },
                {
                  name: "ui_rays",
                  type: "three-image",
                  image: "T_Rays",
                  material: {
                    blending: THREE.AdditiveBlending,
                  },
                },
              ],
            },
            {
              name: "UIConfettiContainer",
              position: [0, 300],
              childs: [],
            },
            {
              name: "UITitleContainer",
              position: [0, 200],
              childs: [
                {
                  name: "ui_title_win",
                  type: "three-image",
                  image: "T_Title_Win",
                },
                {
                  name: "ui_title_fail",
                  type: "three-image",
                  image: "T_Title_Fail",
                },
              ],
            },
          ],
        },
        {
          name: "UIButtonLayout",
          positionLandscape: [0, -0.999],
          positionPortrait: [0, -0.999],
          LTRBLandscape: "B",
          LTRBPortrait: "B",
          stickinessLandscape: [0.999, 0.999],
          stickinessPortrait: [0.999, 0.999],
          childs: [
            {
              name: "UIButtonContainer",
              positionLandscape: [0, 200],
              positionPortrait: [0, 500],
              childs: [
                {
                  name: "ui_button_next_level",
                  type: "three-image",
                  image: "T_Button_Next_Level",
                  event: "button_next_level",
                },
                {
                  name: "ui_button_retry",
                  type: "three-image",
                  image: "T_Button_Retry",
                  event: "button_retry",
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  Hooks: {
    beforeBuild() {
      this.updateChildParamsByName(Settings[this.Name]);
    },

    build() {
      this["ui_overlay"].visible = false;
      this["ui_frame"].visible = false;

      this["ui_button_next_level"].visible = false;
      this["ui_button_retry"].visible = false;

      this["ui_glow_red"].visible = false;
      this["ui_glow_white"].visible = false;
      this["ui_rays"].visible = false;

      this["ui_title_win"].visible = false;
      this["ui_title_fail"].visible = false;

      Broadcast.on(
        "CallToAction button_next_level Down",
        () => {
          if (window.MraidSDK) MraidSDK.open("end screen button");
          else alert("Click Out: end screen button");
        },
        this,
      );

      Broadcast.on(
        "CallToAction button_retry Down",
        () => {
          if (window.MraidSDK) MraidSDK.open("end screen button");
          else alert("Click Out: end screen button");
        },
        this,
      );
    },

    show(reason) {
      this.resize();
      this.bringToTop();
      App.Gameplay.hide();

      const resultReason = reason ?? this.reason;

      if (resultReason === "win") {
        this.runWinSequence();
      } else if (resultReason === "fail") {
        this.runFailSequence();
      } else {
        throw new Error(`Invalid reason: ${resultReason}`);
      }
    },

    resize() {
      const frame = this["ui_frame"];

      const width =
        App.World.ThreeGUI.camera.right - App.World.ThreeGUI.camera.left;
      const height =
        App.World.ThreeGUI.camera.top - App.World.ThreeGUI.camera.bottom;
      const aspect = width / height;

      if (App.IsPortrait) {
        Object3DToolbox.calculateBounds(frame).width = width;
        frame.scale.y = width / aspect / 1920;
      } else {
        Object3DToolbox.calculateBounds(frame).height = height;
        frame.scale.x = (height * aspect) / 1920;
      }
    },
  },

  Events: {
    "cta up": function (container, e) {
      if (window.MraidSDK) MraidSDK.open("end screen button");
      else alert("Click Out: end screen button");
    },

    "cta all up": function (container, e) {
      if (window.MraidSDK) MraidSDK.open("end screen all");
      else alert("Click Out: end screen all");
    },

    // "try again click": function () {
    //   // Сообщаем в MraidSDK что хотим сделать перезапуск
    //   // MraidSDK проверит настройки связанные с возможностью перезапуска (Settings["try-again"] и Settings["cta-only"]) и вызовет событие Start Replay, если можно
    //   // Самому проверить можно ли делать возврат в игру можно через метод MraidSDK.isReplayAvailable()
    //   if (window.MraidSDK) MraidSDK.processReplay();
    // },

    // Это событие может вызвать MraidSDK, если нужно будет произвести возврат в игру
    // "global:Start Replay": function () {
    //   App.CallToAction.hide();
    //   App.Gameplay.restoreGame();
    // },
  },

  animateHide() {
    this.hide();
  },

  runWinSequence() {
    this.playSound("S_Win");

    gsap.fromTo(
      this["ui_rays"].rotation,
      { x: 0, y: 0, z: 0 },
      {
        x: 0,
        y: 0,
        z: Math.PI2,
        duration: 5,
        ease: "none",
        repeat: -1,
      },
    );

    const opacity = this["ui_overlay"].params.material.opacity;
    gsap
      .timeline()
      .fromTo(
        this["ui_overlay"].material,
        { opacity: 0 },
        {
          opacity: opacity,
          duration: 0.5,
          onStart: () => {
            this["ui_overlay"].visible = true;
          },
        },
      )
      .fromTo(
        [
          this["ui_glow_white"].scale,
          this["ui_rays"].scale,
          this["ui_title_win"].scale,
        ],
        { x: 0, y: 0, z: 0 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
          onStart: () => {
            this["ui_glow_white"].visible = true;
            this["ui_rays"].visible = true;
            this["ui_title_win"].visible = true;

            this.runConfetti();
          },
        },
      )
      .fromTo(
        this["ui_button_next_level"].scale,
        { x: 0, y: 0, z: 0 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
          onStart: () => {
            this["ui_button_next_level"].visible = true;
          },
        },
      );

    gsap.to(this["UIButtonContainer"].scale, {
      x: 1.1,
      y: 1.1,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut",
    });
  },

  runFailSequence() {
    this.playSound("S_Fail");

    const opacity = this["ui_overlay"].params.material.opacity;
    gsap
      .timeline()
      .fromTo(
        [this["ui_overlay"].material, this["ui_frame"].material],
        { opacity: 0 },
        {
          opacity: opacity,
          duration: 0.5,
          onStart: () => {
            this["ui_overlay"].visible = true;
          },
        },
      )
      .fromTo(
        [this["ui_glow_red"].scale, this["ui_title_fail"].scale],
        { x: 0, y: 0, z: 0 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
          onStart: () => {
            this["ui_glow_red"].visible = true;
            this["ui_title_fail"].visible = true;
          },
        },
      )
      .fromTo(
        this["ui_button_retry"].scale,
        { x: 0, y: 0, z: 0 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
          onStart: () => {
            this["ui_button_retry"].visible = true;
          },
        },
      );

    gsap.to(this["UIButtonContainer"].scale, {
      x: 1.1,
      y: 1.1,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut",
    });
  },

  async runConfetti() {
    const confettiWhite = new FXSimpleParticleSystem2D({
      container: this["UIConfettiContainer"],
      texture: App.ThreeAssets["T_Confetti_White"],
      gravity: new THREE.Vector2(0, -100),
      isTimeScaled: false,
      emitters: [
        {
          count: 16,
          position: new THREE.Vector2(-350, 0),

          positionRange: { min: { x: -100, y: -100 }, max: { x: 100, y: 100 } },
          rotationRange: { min: -Math.PI, max: Math.PI },
          scaleRange: { min: 0.5, max: 1 },

          velocityRange: {
            angle: { min: Math.PIH - 0.25, max: Math.PIH + 0.25 },
            magnitude: { min: -200, max: 200 },
          },
          angularVelocityRange: { min: -Math.PI2, max: Math.PI2 },
        },
        {
          count: 16,
          position: new THREE.Vector2(350, 0),

          positionRange: { min: { x: -100, y: -100 }, max: { x: 100, y: 100 } },
          rotationRange: { min: -Math.PI, max: Math.PI },
          scaleRange: { min: 0.5, max: 1 },

          velocityRange: {
            angle: { min: Math.PIH - 0.25, max: Math.PIH + 0.25 },
            magnitude: { min: -200, max: 200 },
          },
          angularVelocityRange: { min: -Math.PI2, max: Math.PI2 },
        },
      ],
    });

    const confettiYellow = new FXSimpleParticleSystem2D({
      container: this["UIConfettiContainer"],
      texture: App.ThreeAssets["T_Confetti_Yellow"],
      gravity: new THREE.Vector2(0, -100),
      isTimeScaled: false,
      emitters: [
        {
          count: 16,
          position: new THREE.Vector2(-300, 0),

          positionRange: { min: { x: -100, y: -100 }, max: { x: 100, y: 100 } },
          rotationRange: { min: -Math.PI, max: Math.PI },
          scaleRange: { min: 0.5, max: 1 },

          velocityRange: {
            angle: { min: Math.PIH - 0.25, max: Math.PIH + 0.25 },
            magnitude: { min: -200, max: 200 },
          },
          angularVelocityRange: { min: -Math.PI2, max: Math.PI2 },
        },
        {
          count: 16,
          position: new THREE.Vector2(300, 0),

          positionRange: { min: { x: -100, y: -100 }, max: { x: 100, y: 100 } },
          rotationRange: { min: -Math.PI, max: Math.PI },
          scaleRange: { min: 0.5, max: 1 },

          velocityRange: {
            angle: { min: Math.PIH - 0.25, max: Math.PIH + 0.25 },
            magnitude: { min: -200, max: 200 },
          },
          angularVelocityRange: { min: -Math.PI2, max: Math.PI2 },
        },
      ],
    });

    await safeWait(24);

    confettiWhite.destroy();
    confettiYellow.destroy();
  },
});
