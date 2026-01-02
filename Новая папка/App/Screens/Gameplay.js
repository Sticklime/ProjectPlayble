import {
  BehaviorMediator,
  BehaviorMediatorEvent,
} from "Custom/BehaviorMediator";
import { CollisionHandler } from "Custom/CollisionHandler";
import { EnemyPrefab } from "Custom/Enemy/EnemyPrefab";
import { EnemySpawner } from "Custom/Enemy/EnemySpawner";
import { HealthDescriptorEvent } from "Custom/HealthDescriptor";
import { HeroPrefab } from "Custom/Hero/HeroPrefab";
import { LootboxSpawner } from "Custom/Lootbox/LootboxSpawner";
import { TurretEnemyTeamDescriptor } from "Custom/Turret/TurretEnemyTeamDescriptor";
import { TurretHeroTeamDescriptor } from "Custom/Turret/TurretHeroTeamDescriptor";
import { TurretPrefab } from "Custom/Turret/TurretPrefab";
import { WaveSpawnerEvent } from "Custom/WaveSpawner";
import { RifleWeaponComponent } from "Custom/Weapons/RifleWeaponComponent";
import { AnchorKeeper } from "Generated/AnchorKeeper";
import { AssetKeeper } from "Generated/AssetKeeper";
import { Body } from "Libs/Physics/Body";
import { BodyBuilder } from "Libs/Physics/BodyBuilder";
import { BodyAxis } from "Libs/Physics/BodyOptions";
import { Trigger, TriggerEvent } from "Libs/Physics/Trigger";
import { safePromise, safeWait } from "Libs/Toolbox/safeFunctions";
import { TimeController } from "Libs/Toolbox/TimeController";
import Screen from "Screen";
import {
  AmbientLight,
  AxesHelper,
  Box3,
  Color,
  HemisphereLight,
  MathUtils,
  Mesh,
  PCFSoftShadowMap,
  Quaternion,
  RepeatWrapping,
  Vector2,
  Vector3,
} from "three";
import { DualFovCamera, SceneTraversal, Sun } from "three-zoo";
import { UIBasicLayer, UIBasicLayerEvent } from "UI/UIBasicLayer";
import { UICollectingLayer } from "UI/UICollectingLayer";
import { UILoseLayer } from "UI/UILoseLayer";
import { UIWinLayer } from "UI/UIWinLayer";
import { UIGameplayLayer } from "UI/UIGameplayLayer";
import { WaterMaterial } from "Custom/WaterMaterial";
import { Shared } from "Custom/Shared";
import { PaintableMaterialApplier } from "Custom/PaintableMaterialApplier";

App.Gameplay = new Screen({
  Name: "Gameplay",

  Containers: [],

  Hooks: {
    beforeBuild() {
      this.updateChildParamsByName(Settings[this.Name]);
    },

    build() {
      this.buildEnvironment();
      this.buildPhysics();
      this.buildUI();
      this.buildHero();
      this.buildEnemySpawner();
      this.buildLootboxSpawner();
      this.buildTurrets();
    },

    resize() {
      App.World.Camera.fov = this.calculateZoomOutFOV();
      App.World.Camera.updateProjectionMatrix();
    },

    show() {
      this.updateSettings();
      this.startGame();
    },

    update() {
      if (this.paintableMaterial) {
        Shared.levelPaintingCanvas.flush();
        const painTexture = Shared.levelPaintingCanvas.getTexture();

        for (const paintableMaterial of this.paintableMaterial) {
          paintableMaterial.setPaintTexture(painTexture);
        }
      }
    },

    hide() {},
  },

  Events: {
    "global:Stage Press Down": function (event, position) {
      MraidSDK.interaction();
      if (!this._isBackgroundMusicPlaying) {
        this._isBackgroundMusicPlaying = true;
        MraidSDK.playSound("S_Music");
      }
    },
  },

  "global:Setting Changed": function (name, value) {
    this.updateSettings(name, value);
  },

  updateSettings(name, value) {
    this.resize();
  },

  async startGame() {
    MraidSDK.track("Game Starts");

    await safeWait(0.5);
    await this.basicLayer.show();
    this.enemySpawner.continue();
  },

  restoreGame() {},

  buildEnvironment() {
    {
      App.World.Renderer.shadowMap.enabled = true;
      App.World.Renderer.shadowMap.type = PCFSoftShadowMap;
      App.World.Scene.background = new Color(0x082ce8);
    }
    {
      const clonedScene = AssetKeeper.Scene.scene.clone();
      App.World.Scene.add(...clonedScene.children);

      SceneTraversal.enumerateObjectsByType(App.World.Scene, Mesh, (mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
    }
    {
      const sun = new Sun(0xffffff, 2.5);
      App.World.Scene.add(sun);

      sun.position.set(10, 20, 10);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      sun.shadow.bias = -0.00175;

      const shadowBoxMesh = SceneTraversal.getObjectByName(
        App.World.Scene,
        "SM_Shadow_Box",
      );
      const shadowBox = new Box3().setFromObject(shadowBoxMesh);
      shadowBoxMesh.removeFromParent();
      sun.configureShadowsForBoundingBox(shadowBox);
    }
    {
      const hemisphere = new HemisphereLight(0xf0f8ff, 0xc8b090, 0.8);
      App.World.Scene.add(hemisphere);

      const ambient = new AmbientLight(0xffffff, 0.35);
      App.World.Scene.add(ambient);
    }
    {
      const defaultWaterMaterial = SceneTraversal.getMaterialByName(
        App.World.Scene,
        "water-texture",
      );
      if (defaultWaterMaterial) {
        const waterMaterialUsers = SceneTraversal.findMaterialUsers(
          App.World.Scene,
          [defaultWaterMaterial],
        );

        const waterNormalMap = defaultWaterMaterial.normalMap;
        waterNormalMap.wrapS = RepeatWrapping;
        waterNormalMap.wrapT = RepeatWrapping;

        const newWaterMaterial = new WaterMaterial({
          color: defaultWaterMaterial.color,
          roughness: 0,
          normalMap: waterNormalMap,
        });

        for (const waterMaterialUser of waterMaterialUsers) {
          waterMaterialUser.material = newWaterMaterial;
        }
      }
    }
    if (Settings["enable-painting"]) {
      this.paintableMaterial = PaintableMaterialApplier.apply(App.World.Scene, [
        "Checker_purple",
        "Ramp",
        "FloorR_ao",
        "FloorL_ao",
        "DontCross",
        "white",
        "FloorF",
        "Floor1-3_AO",
        "WallAO",
        "Block.001",
        "DntCross.001",
        "Cone.004",
        "WheelsShadows",
        "MetalFence",
        "Cone",
      ]);
    }
  },

  buildPhysics() {
    const colliders = SceneTraversal.filterObjects(
      AssetKeeper.ScenePhysics.scene,
      (o) => o.name.includes("Box"),
    );
    for (const collider of colliders) {
      BodyBuilder.buildBoxBody(collider, CollisionHandler.platform);
    }
  },

  buildHero() {
    this.hero = HeroPrefab.instantiate(
      AnchorKeeper.Scene.ANC_Hero_Spawn.position,
      AnchorKeeper.Scene.ANC_Hero_Spawn.quaternion,
    );

    this.hero.components.behavior.healthDescriptor.on(
      HealthDescriptorEvent.DEATH,
      () => {
        this.ctaReason = "lose";
        MraidSDK.showEndScreen(this.reason);
      },
    );
  },

  buildEnemySpawner() {
    this.enemySpawner = new EnemySpawner([
      {
        waitForContinue: true,
        delayBeforeWave: 0,
        delayBetweenSpawns: 0,
        count: 1,
        strengthMultiplier: 0.25,
      },
      {
        waitForContinue: true,
        delayBeforeWave: 0,
        delayBetweenSpawns: 5,
        count: 3,
        strengthMultiplier: 0.35,
      },
      {
        waitForContinue: false,
        delayBeforeWave: 0,
        delayBetweenSpawns: 5,
        count: 3,
        strengthMultiplier: 0.45,
      },
      {
        waitForContinue: false,
        delayBeforeWave: 0,
        delayBetweenSpawns: 5,
        count: 3,
        strengthMultiplier: 0.55,
      },
      {
        waitForContinue: false,
        delayBeforeWave: 0,
        delayBetweenSpawns: 5,
        count: 3,
        strengthMultiplier: 0.65,
      },
    ]);

    this.enemySpawner.once(WaveSpawnerEvent.WAVE_COMPLETE, () => {
      this.lootboxSpawner.continue();
      this.hero.components.behavior.healthDescriptor.maxValue = 1000;
    });
  },

  buildLootboxSpawner() {
    const durationIn = 0.25;
    const durationPresent = 2;
    const durationOut = 0.25;

    this.lootboxSpawner = new LootboxSpawner([
      {
        waitForContinue: true,
        delayBeforeWave: 0,
        delayBetweenSpawns: 0,
        count: 1,
        radius: 3,
        collectCallback: () => {
          this.basicLayer.hideTutorial();
          this.presentLoot(AssetKeeper.T_SharkHat, async () => {
            await this.hero.components.visualizer.showSharkHat(0.75);
          });
        },
      },
      {
        waitForContinue: false,
        delayBeforeWave: 10,
        delayBetweenSpawns: 0,
        count: 1,
        radius: 3,
        collectCallback: () => {
          this.presentLoot(AssetKeeper.T_KingClothes, async () => {
            await this.hero.components.visualizer.showKingClothes(0.75);
          });
        },
      },
      {
        waitForContinue: false,
        delayBeforeWave: 10,
        delayBetweenSpawns: 0,
        count: 1,
        radius: 3,
        collectCallback: () => {
          this.presentLoot(AssetKeeper.T_FirstAidKit, async () => {
            this.hero.components.visualizer.showStars();
            await this.hero.components.behavior.healthDescriptor.restore(0.75);
          });
        },
      },
      {
        waitForContinue: false,
        delayBeforeWave: 10,
        delayBetweenSpawns: 0,
        count: 1,
        radius: 3,
        collectCallback: () => {
          this.presentLoot(AssetKeeper.T_Rifle, async () => {
            this.hero.components.visualizer.showStars();
            this.hero.components.weapon.destroy();
            this.hero.components.weapon = new RifleWeaponComponent(
              this.hero.platform,
              this.hero.components.visualizer.weaponAnchor,
              200,
              new Color(Shared.heroTeamColor),
              Shared.heroParticleSystem,
            );
            await safeWait(0.75);
          });

          this.lootboxSpawner.once(WaveSpawnerEvent.WAVE_START, () => {
            this.ctaReason = "win";
            MraidSDK.showEndScreen(this.reason);
          });
        },
      },
      {
        waitForContinue: false,
        delayBeforeWave: 10,
        delayBetweenSpawns: 0,
        count: 1,
        radius: 3,
      },
    ]);

    this.lootboxSpawner.once(WaveSpawnerEvent.WAVE_START, () =>
      this.basicLayer.showCollectLootboxesTutorial(),
    );

    this.lootboxSpawner.once(WaveSpawnerEvent.WAVE_COMPLETE, () =>
      this.enemySpawner.continue(),
    );
  },

  buildTurrets() {
    const heroTeamDescriptor = new TurretHeroTeamDescriptor();
    const enemyTeamDescriptor = new TurretEnemyTeamDescriptor();

    for (const transform of [
      AnchorKeeper.Scene.ANC_Turret_Ally,
      AnchorKeeper.Scene["ANC_Turret_Ally.001"],
    ]) {
      TurretPrefab.instantiate({
        transform,
        color: Shared.heroTeamColor,
        teamDescriptor: heroTeamDescriptor,
        particleSystem: Shared.heroParticleSystem,
      });
    }

    for (const transform of [
      AnchorKeeper.Scene.ANC_Turret_Enemy,
      AnchorKeeper.Scene["ANC_Turret_Enemy.001"],
      AnchorKeeper.Scene["ANC_Turret_Enemy.002"],
      AnchorKeeper.Scene["ANC_Turret_Enemy.003"],
    ]) {
      TurretPrefab.instantiate({
        transform,
        color: Shared.enemyTeamColor,
        teamDescriptor: enemyTeamDescriptor,
        particleSystem: Shared.enemyParticleSystem,
      });
    }
  },

  buildUI() {
    this.gameplayLayer = UIGameplayLayer.instance;
    App.layers.push(this.gameplayLayer);

    this.basicLayer = new UIBasicLayer();
    App.layers.push(this.basicLayer);

    const directionUp = new Vector3(0, 1, 0);

    {
      const tempCameraDirection = new Vector3();

      this.basicLayer.on(
        UIBasicLayerEvent.MOVEMENT_JOYSTICK_MOVE,
        (angle, value) => {
          const direction =
            App.World.Camera.getWorldDirection(tempCameraDirection);
          direction.y = 0;
          direction.normalize().applyAxisAngle(directionUp, angle);
          this.hero.components.pawn.direction = direction;

          const k = 2;
          this.hero.components.pawn.maximumSpeedFactor =
            (Math.exp(k * value) - 1) / (Math.exp(k) - 1);
        },
      );
      this.basicLayer.on(UIBasicLayerEvent.MOVEMENT_JOYSTICK_RELEASE, () => {
        this.hero.components.pawn.direction = undefined;
      });
    }

    {
      const tempCameraDirection = new Vector3();

      this.basicLayer.on(
        UIBasicLayerEvent.ATTACK_JOYSTICK_MOVE,
        (angle, value) => {
          const direction =
            App.World.Camera.getWorldDirection(tempCameraDirection);
          direction.y = 0;
          direction.normalize().applyAxisAngle(directionUp, angle);
          this.hero.components.pawn.orientation = direction;
          this.hero.components.weapon.isEnable = true;
        },
      );
      this.basicLayer.on(UIBasicLayerEvent.ATTACK_JOYSTICK_RELEASE, () => {
        this.hero.components.pawn.orientation = undefined;
        this.hero.components.weapon.isEnable = false;
      });
    }

    this.collectingLayer = new UICollectingLayer();
    App.layers.push(this.collectingLayer);

    MraidSDK.on("Show Native End Screen", (reason) => {
      if (this.ctaReason !== undefined) {
        this.ctaReason === "win" ? this.showWinLayer() : this.showLoseLayer();
      } else {
        Settings["is-win-default"] ? this.showWinLayer() : this.showLoseLayer();
      }
    });
  },

  async showLoseLayer() {
    if (!this.loseLayer) {
      this.setTimeScale(0, 0.5);
      this.hero.components.weapon.isEnable = false;
      this.hero.components.pawn.direction = undefined;
      UIGameplayLayer.instance.hide();
      await this.basicLayer.hide();
      MraidSDK.playSound("S_Lose");
      this.loseLayer = new UILoseLayer();
      App.layers.push(this.loseLayer);
      await this.loseLayer.show();
    }
  },

  async showWinLayer() {
    if (!this.ctaWinLayer) {
      this.setTimeScale(0, 0.5);
      this.hero.components.weapon.isEnable = false;
      this.hero.components.pawn.direction = undefined;
      UIGameplayLayer.instance.hide();
      await this.basicLayer.hide();
      MraidSDK.playSound("S_Win");
      this.ctaWinLayer = new UIWinLayer();
      App.layers.push(this.ctaWinLayer);
      await this.ctaWinLayer.show();
    }
  },

  setTimeScale(value, duration = 0.5, delay = 0, tag = "global") {
    return safePromise((resolve) => {
      const helper = { value: 1 };
      gsap.to(helper, {
        value,
        delay,
        duration,
        ease: "power1.inOut",
        onUpdate: () => TimeController.instance.setTimeScale(tag, helper.value),
        onComplete: resolve,
      });
    });
  },

  setCameraFOV(value, duration = 0.5, delay = 0) {
    return safePromise((resolve) => {
      gsap.to(App.World.Camera, {
        fov: value,
        delay,
        duration,
        ease: "power1.inOut",
        onUpdate: () => App.World.Camera.updateProjectionMatrix(),
        onComplete: resolve,
      });
    });
  },

  calculateZoomInFOV() {
    return window.innerWidth > window.innerHeight ? 10 : 20;
  },

  calculateZoomOutFOV() {
    return window.innerWidth > window.innerHeight ? 25 : 45;
  },

  async presentLoot(texture, callback) {
    MraidSDK.playSound("S_Collect");

    const appearDuration = 0.5;

    await Promise.all([
      this.setTimeScale(0, appearDuration),
      this.setCameraFOV(this.calculateZoomInFOV(), appearDuration),
      this.collectingLayer.showItem(texture, appearDuration * 3),
    ]);

    await callback();

    await Promise.all([
      this.setTimeScale(1, 0.35),
      this.setCameraFOV(this.calculateZoomOutFOV(), 0.35),
    ]);
  },
});
