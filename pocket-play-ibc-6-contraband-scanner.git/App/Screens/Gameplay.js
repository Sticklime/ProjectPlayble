import { CarQueue } from "Entities/CarQueue";
import { AnchorKeeper } from "Generated/AnchorKeeper";
import { AssetKeeper } from "Generated/AssetKeeper";
import { TinyParticleEmitter } from "Libs/TinyParticleSystem/TinyEmitter";
import { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import { safePromise, safeWait } from "Libs/Toolbox/safeFunctions";
import { TimeController } from "Libs/Toolbox/TimeController";
import { once } from "lodash";
import Screen from "Screen";
import {
  AdditiveBlending,
  AmbientLight,
  Box3,
  Color,
  HemisphereLight,
  MathUtils,
  Mesh,
  PCFSoftShadowMap,
  Vector3,
} from "three";
import { DualFovCamera, SceneTraversal, Sun } from "three-zoo";
import { UIBasicLayer, UIBasicLayerEvent } from "UI/UIBasicLayer";
import { UICTALayer } from "UI/UICTALayer";
import { UIScannerLayer, UIScannerLayerEvent } from "UI/UIScannerLayer";

App.Gameplay = new Screen({
  Name: "Gameplay",

  Containers: [],

  Hooks: {
    beforeBuild() {
      this.updateChildParamsByName(Settings[this.Name]);
    },

    build() {
      this.carQueue = new CarQueue(5);

      this.starParticleSystem0 = new TinyParticleSystem(
        {
          capacity: 128,
          gravity: { x: 0, y: 0, z: 0 },
        },
        {
          texture: AssetKeeper.T_Star_0[0],
          color: new Color(0xffffff),
          blending: AdditiveBlending,
        },
      );

      this.starParticleSystem1 = new TinyParticleSystem(
        {
          capacity: 128,
          gravity: { x: 0, y: 0, z: 0 },
        },
        {
          texture: AssetKeeper.T_Star_1[0],
          color: new Color(0xffd700),
          blending: AdditiveBlending,
        },
      );

      this.buildUI();
      this.buildEnvironment();

      MraidSDK?.on("Show Native End Screen", this.transferToCTA.bind(this));
    },

    resize() {},

    show() {
      this.updateSettings();
      this.startGame();
    },

    update() {
      if (App.World.Camera && this.gameplayCameraTarget) {
        const target = this.gameplayCameraTarget.clone();
        const time = TimeController.instance.time;
        target.x += Math.sin(time) * 0.1;
        target.y += Math.cos(time) * 0.1;
        App.World.Camera.lookAt(target);
      }
    },

    hide() {},
  },

  Events: {
    "global:Stage Press Down": function (event, position) {
      if (window.MraidSDK) MraidSDK.interaction();
      if (!this._isBackgroundMusicPlaying) {
        this._isBackgroundMusicPlaying = true;
        MraidSDK.playSound("S_Music");
      }
    },

    "global:Setting Changed": function (name, value) {
      this.updateSettings(name, value);
    },
  },

  updateSettings(name, value) {
    this.resize();
  },

  async startGame() {
    if (window.MraidSDK) MraidSDK.track("Game Starts");

    await safeWait(0.5);

    await this.basicLayer.show();
    this.carQueue.move();
    await safeWait(1.5);
    MraidSDK.playSound("S_Horn");
    await this.basicLayer.runTutorialSequence();

    let gameplaySequencePromise;
    await safePromise((resolve) =>
      this.basicLayer.once(UIBasicLayerEvent.CLICK, async () => {
        await this.scannerLayer.show();
        gameplaySequencePromise = this.scannerLayer.runScanSequence();
        resolve();
      }),
    );

    this.carQueue.flushPendingCar();

    await safePromise((resolve) =>
      this.scannerLayer.once(
        UIScannerLayerEvent.COINS_COLLECTED,
        async (screenPosition) => {
          await this.basicLayer.collectCoins(screenPosition, 100);
          resolve();
        },
      ),
    );

    await safePromise((resolve) =>
      this.scannerLayer.once(
        UIScannerLayerEvent.SHOW_NEXT_CAR,
        async (screenPosition) => {
          this.carQueue.move();
          resolve();
        },
      ),
    );

    await safePromise((resolve) =>
      this.scannerLayer.once(
        UIScannerLayerEvent.COINS_COLLECTED,
        async (screenPosition) => {
          await this.basicLayer.collectCoins(screenPosition, 350);
          resolve();
        },
      ),
    );

    this.carQueue.flushPendingCar();
    this.carQueue.switchToHappyParticles();

    await safePromise((resolve) =>
      this.scannerLayer.once(
        UIScannerLayerEvent.COINS_SPENT,
        async (screenPosition) => {
          await this.basicLayer.spendCoins(screenPosition, 100);
          resolve();
        },
      ),
    );

    await gameplaySequencePromise;
    await safeWait(1);
    await this.scannerLayer.hide();
    await this.showEnhancedScanner();

    this.ctaLayer = new UICTALayer();
    App.layers.push(this.ctaLayer);

    this.carQueue.move();
    MraidSDK.playSound("S_Win");

    await Promise.all([
      this.basicLayer.hide(),
      this.transferCameraToCTAPosition(),
    ]);

    if (MraidSDK) MraidSDK.showEndScreen("win");
    else this.transferToCTA();
  },

  restoreGame() {},

  buildUI() {
    this.scannerLayer = new UIScannerLayer();
    App.layers.push(this.scannerLayer);

    this.basicLayer = new UIBasicLayer();
    App.layers.push(this.basicLayer);
  },

  buildEnvironment() {
    App.World.Scene.background = new Color(0x94bb1c);

    const scene = App.ThreeAssets["Scene"].scene.clone();
    App.World.Scene.add(scene);

    SceneTraversal.enumerateObjectsByType(scene, Mesh, (mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    const ambient = new AmbientLight(0xffffff, 0.6);
    App.World.Scene.add(ambient);

    const hemisphere = new HemisphereLight(0xf0f8ff, 0x888888, 0.8);
    App.World.Scene.add(hemisphere);

    const sun = new Sun(0xffffff, 2.5);
    sun.position.set(14.899, 20, 3.873);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.intensity = 1; // 0.58
    sun.shadow.bias = -0.0025;
    App.World.Scene.add(sun);

    const box3 = new Box3().setFromObject(scene);
    sun.configureShadowsForBoundingBox(box3);

    App.World.Renderer.shadowMap.enabled = true;
    App.World.Renderer.shadowMap.type = PCFSoftShadowMap;

    this.scanner0 = SceneTraversal.getObjectByName(scene, "SM_Scanner_0");
    this.scanner1 = SceneTraversal.getObjectByName(scene, "SM_Scanner_1");

    this.scanner1.visible = false;

    const fov = 3;
    const camera = new DualFovCamera(fov, fov);
    camera.near = 250;
    camera.far = 450;
    camera.updateProjectionMatrix();
    App.World.Camera = camera;

    App.World.Camera.position
      .copy(AnchorKeeper.Scene.ANC_Camera_Main.position)
      .multiplyScalar(10);

    this.gameplayCameraTarget = this.scanner0.getWorldPosition(new Vector3());
    camera.lookAt(this.gameplayCameraTarget);
  },

  async transferCameraToCTAPosition() {
    const cameraTarget = AnchorKeeper.Scene.ANC_Camera_CTA.position
      .clone()
      .multiplyScalar(10);

    await safePromise((resolve) => {
      const duration = 1.5;
      gsap.timeline({ onComplete: resolve }).to(App.World.Camera.position, {
        duration,
        x: cameraTarget.x,
        y: cameraTarget.y,
        z: cameraTarget.z,
        ease: "power2.inOut",
      });
    });
  },

  async showEnhancedScanner() {
    {
      const createEmitter = (system, key) => {
        const emitter = new TinyParticleEmitter({
          system,
          playByDefault: true,
        });
        App.World.Scene.add(emitter);
        emitter.position.copy(AnchorKeeper.Scene.ANC_Scanner.position);
        emitter.position.y += 2;
        this[key] = emitter;
      };
      createEmitter(this.starParticleSystem0, "particleEmitter0");
      createEmitter(this.starParticleSystem1, "particleEmitter1");
    }

    return safePromise((resolve) => {
      const duration = 0.5;
      gsap
        .timeline()
        .to(this.scanner0.scale, {
          duration,
          x: 0,
          y: 0,
          z: 0,
          ease: "back.in",
          onComplete: () => {
            this.scanner0.visible = false;
          },
        })
        .fromTo(
          this.scanner1.scale,
          {
            x: 0,
            y: 0,
            z: 0,
          },
          {
            duration,
            x: 1,
            y: 1,
            z: 1,
            ease: "back.out",
            onStart: () => {
              this.scanner1.visible = true;
            },
            onComplete: resolve,
          },
        );
    });
  },

  transferToCTA() {
    this.ctaLayer.show();
  },
});
