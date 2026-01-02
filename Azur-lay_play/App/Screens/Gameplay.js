/*
 Это основной файл для написания кода игры. Здесь находится логика геймплея за исключением туториала
 и конечного экрана (их код должен быть написан в Tutorial.js и CallToAction.js соответственно)
*/

import { Body } from "Body";
import { BossBuilder } from "BossBuilder";
import { CharacterBuilder } from "CharacterBuilder";
import {
  CharacterStepHandler,
  ECharacterStepHandlerEvent,
} from "Custom/Character/CharacterStepHandler";
import { TargetMovementController } from "Custom/TargetMovementController";
import { DirectionMovementController } from "DirectionMovementController";
import { FracturedBossBuilder } from "FracturedBossBuilder";
import { FracturedObstacle } from "FracturedObstacle";
import { GestureHandler } from "GestureHandler";
import { gsap } from "gsap";
import {
  HorizontalControlGesture,
  HorizontalControlGestureEvent,
} from "HorizontalControlGesture";
import * as SimpleParticleSystem from "Libs/SimpleParticleSystem/index";
import { Object3DOperator } from "Object3DOperator";
import { Object3DToolbox } from "Object3DToolbox";
import { RingCollector } from "RingCollector";
import { safePromise, safeWait } from "SafeFunctions";
import { SceneProcessor } from "SceneProcessor";
import Screen from "Screen";
import { Sun } from "Sun";
import * as THREE from "three";
import { TimeHandler } from "TimeHandler";
import { Trigger, TriggerEvent } from "Trigger";
import { TriggerPack, TriggerPackEvent } from "TriggerPack";

App.Gameplay = new Screen({
  // Имя этого экрана - оно используется как префикс для событий (менять не нужно)
  Name: "Gameplay",

  // Секция Containers это дерево элементов для рендеринга - здесь нужно прописать все спрайты, тексты и другие отображаемые элементы для этого экрана,
  // за исключением динамически создаваемых и уничтожаемых элементов геймплея.
  // Весь интерфейс создаётся здесь сразу, даже если не все его элементы всегда отображаются на экране
  Containers: [
    // На первом уровне должен быть один или, обычно, несколько главных контейнеров.
    // Им прописывается свойство scaleStrategy, которое управляет скейлом всего что внутри.
    // Есть 2 основных scaleStrategy: cover-screen и fit-to-screen.
    // cover-screen покрывает весь экран содержимым и обычно используется только для фоновых изображений
    // fit-to-screen вписывает всё что у него внутри в экран не давая элементам выйти за границы экрана - обычно используется для всего остального кроме фоновых изображений

    // Все свойства которые написаны здесь будут переустанавливаться спрайтам и контейнерам каждый раз
    // при изменении размеров вьюпорта поэтому не стоит здесь писать alpha: 0 с целью скрыть элемент на старте
    // лучше сделать это в событии build
    // {
    //   name: "MainContainer",
    //   scaleStrategyLandscape: ["fit-to-screen", 1920, 1080],
    //   scaleStrategyPortrait: ["fit-to-screen", 1080, 1920],
    //   childs: [],
    // },

    // type: 'three-ui' - это контейнер (layout) для ThreeGUI, если оно подключено в Deploy.js
    //
    // Это не обычная 3D-группа и крайне желательно использовать только ОДИН такой контейнер в сцене (т.е. в Интро свой, в Геймплее свой, на СТА - свой, но не плодить их несколько штук в геймплее)
    // 'three-ui' контенер нельзя вставлять друг в друга.
    //
    // Все новые настройки позиционирования (LTRB и stickness) будут работать только на первом уровне вложенности дочерних объектов!
    // Т.е. если внутри 'three-ui' есть круппа внутри которой расположен объект с новыми параметрами позиционирования, то они просто проигнорируются.
    //
    // Описание ThreeGUI есть в самом файле App/Libs/Three/ThreeGUI.js
    //
    // Новые параметры позиционирования:
    //
    //      LTRB - указывает к какому краю должен липнуть элемент. Может принимать значения 'L', 'T', 'R', 'B', '' (а также 'LT', 'RT' и т.д. для прилипания сразу к двум краям экрана)
    //      stickiness - указывает насколько сильно будет липнуть элемент. Может быть 0..1. Если 0 - элемент будет оставаться на своём дефолтном месте, если 1 - элемент будет липнуть к соответствующим краям на 100%
    //      position, positionPortrait, positionLandscape - дефолтные позици элементы от центра экрана. Массив из двух значений [x, y].
    //                                                      Вверх по Y идут отрицательные значения, по X всё как обычно (слева минус, справа +).
    //                                                      Если значение позиции < 1, то оно становится множителем и позиция вычисляется, как @половина_экрана * значение.
    //
    //      в position можно использовать два параметра (x, y). Третий параметр работать не будет!
    //
    // x: -ВЛЕВО, +ВПРАВО   y: +ВВЕРХ, -ВНИЗ    z: +ВПЕРЁД, -НАЗАД
    //
    //              Y+
    //               |
    //        Math.PI / 2 rad
    //               |
    // X- <-- 0 rad -+---------> X+
    //               |
    //               |
    //              Y-
    {
      name: "UIContainer",
      type: "three-ui",
      childs: [
        {
          name: "UITutorialLayout",
          positionLandscape: [0, -0.99],
          positionPortrait: [0, -0.99],
          LTRBLandscape: "B",
          LTRBPortrait: "B",
          stickinessLandscape: [0.99, 0.99],
          stickinessPortrait: [0.99, 0.99],
          childs: [
            {
              name: "UIStartTutorialContainer",
              position: [0, 500],
              childs: [
                {
                  name: "ui_hand_start",
                  type: "three-image",
                  image: "T_Hand",
                  position: [150, 0],
                  anchor: [0.3, 0],
                },
                {
                  name: "ui_text_start",
                  type: "three-image",
                  image: "T_Text_Start",
                  position: [0, -300],
                },
              ],
            },
            {
              name: "UIMovementTutorialContainer",
              position: [0, 350],
              childs: [
                {
                  name: "ui_arrow_movement",
                  type: "three-image",
                  image: "T_Double_Arrow",
                },
                {
                  name: "ui_hand_movement",
                  type: "three-image",
                  image: "T_Hand",
                  anchor: [0.3, 0],
                },
                {
                  name: "ui_text_movement",
                  type: "three-image",
                  image: "T_Text_Movement",
                  position: [0, -250],
                },
              ],
            },
            {
              name: "UITapTutorialContainer",
              position: [0, 500],
              childs: [
                {
                  name: "ui_hand_tap",
                  type: "three-image",
                  image: "T_Hand",
                  position: [200, 0],
                  anchor: [0.3, 0],
                },
                {
                  name: "ui_text_tap",
                  type: "three-image",
                  image: "T_Text_Tap",
                  position: [0, -300],
                },
              ],
            },
          ],
        },
        {
          name: "ui_frame",
          type: "three-image",
          image: "T_Frame",
          material: { opacity: 0 },
        },
      ],
    },
  ],

  // Секция хуков - стандартных обработчив запускаемых на разных стадиях работы экрана (Screen)
  Hooks: {
    // Срабатывает перед созданием спрайтов из секции Containers
    // Здесь можно что-то динамически изменить в Containers если нужно перед их созданием
    beforeBuild() {
      this.updateChildParamsByName(Settings[this.Name]);
    },

    // Срабатывает сразу после создания спрайтов из секции Containers
    build() {
      this.scene = App.World.Scene;
      this.camera = App.World.Camera;
      this.renderer = App.World.Renderer;

      this.cameraWrapper = new THREE.Group();
      this.scene.add(this.cameraWrapper);
      this.cameraWrapper.add(this.camera);

      this.cameraWrapper.position.copy(this.camera.position);
      this.camera.position.set(0, 0, 0);

      this.cameraWrapper.quaternion.copy(this.camera.quaternion);
      this.camera.quaternion.identity();

      this.camera.far = 160;
      this.camera.near = 1;
      this.camera.updateProjectionMatrix();

      this.collisionGroups = {
        player: 1 << 0,
        ring: 1 << 1,
        obstacle: 1 << 2,
        trigger: 1 << 3,
        fragment: 1 << 4,
        platform: 1 << 5,
        bossFragments: 1 << 6,
      };

      this.buildScene();
      this.buildEnvironment();
      this.buildTriggers();
      this.buildMovement();
      this.buildBoss();
      this.buildBossExplosionParticleSystem();
      this.buildCharacter();

      this["ui_hand_start"].visible = false;
      this["ui_text_start"].visible = false;

      this["ui_arrow_movement"].visible = false;
      this["ui_hand_movement"].visible = false;
      this["ui_text_movement"].visible = false;

      this["ui_text_tap"].visible = false;
      this["ui_hand_tap"].visible = false;

      this["ui_frame"].visible = false;
    },

    // Срабатывает на изменение размеров или ориентации экрана
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

    // Срабатывает во время показа экрана (есть ещё и hided - срабатывает во время скрытия экрана)
    show() {
      this.updateSettings();
      this.startGame();
    },

    // Срабатывает на каждый тик / каждую перерисовку экрана
    // Тут лучше ничего не писать, так как этот код срабатывает 60 раз в секунду или больше в зависимости от системы пользователя
    // Любой код расположенный здесь будет снижать производительность
    update() {},

    // Срабатывает во время скрытия этого экрана
    hide() {},
  },

  // Секция событий - здесь прописываются события нажатия на спрайты из секции Containers, а так же глобальные события серез префикс global:
  // Для того чтобы добавить события клика на спрайт ему нужно в секции Containers прописать events: true,
  // а в этой секции написать 'имя спрайта click' и дальше написать код срабатывающий по нажатию на этот спрайт
  Events: {
    "global:Stage Press Down": function (event, position) {
      if (window.MraidSDK) MraidSDK.interaction();

      if (!this.isBackgroundMusicPlaying) {
        this.isBackgroundMusicPlaying = true;
        if (window.MraidSDK) MraidSDK.playSound("S_Background", { loop: true });
        else this.playSound("S_Background", { loop: true });
      }
    },

    "global:Setting Changed": function (name, value) {
      //Здесь нужно автоматически применить изменения в настройках Settings
      //Это нужно только для Dashboard чтобы не перезагружать фрейм игры

      this.updateSettings(name, value);
    },
  },

  // Здесь нужно применить заново все настройки созданные для этого проекта
  // Сменить фон в зависимости от настройки, текстуру героя и т.д.
  // Всё что зависит от настроек переделать заново
  updateSettings(name, value) {
    this.resize();
  },

  async startGame() {
    if (window.MraidSDK) MraidSDK.track("Game Starts");
    console.log(
      `Current tutorial value: ${Settings["enable-first-tap-tutorial"]}`,
    );

    if (Settings["enable-first-tap-tutorial"]) {
      await safeWait(0.5);
      this.showStartTutorial();
      this.showCollectTutorial();

      GestureHandler.instance.once(GestureHandler.IEvent.START, async () => {
        this.hideStartTutorial();
        this.movementController.isActive = true;

        await safeWait(1);
        await this.setTimeScaleAnimated("global", 0.1, 0.5);

        await safeWait(0.25);

        this.showMovementTutorial();
        this.buildControl();

        GestureHandler.instance.once(GestureHandler.IEvent.START, () => {
          this.setTimeScaleAnimated("global", 1, 0.5);
          this.hideMovementTutorial();
        });
      });
    } else {
      await safeWait(0.5);
      this.showCollectTutorial();
      this.movementController.isActive = true;

      await safeWait(1);
      await this.setTimeScaleAnimated("global", 0.1, 0.5);

      await safeWait(0.25);

      this.showMovementTutorial();
      this.buildControl();

      GestureHandler.instance.once(GestureHandler.IEvent.START, () => {
        this.setTimeScaleAnimated("global", 1, 0.5);
        this.hideMovementTutorial();
      });
    }
  },

  // Этот метод может вызваться из конечного экрана если нужно произвести возврат в игру
  restoreGame() {},

  showStartTutorial() {
    const hand = this["ui_hand_start"];
    const text = this["ui_text_start"];

    gsap.timeline().fromTo(
      [hand.material, text.material],
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.25,
        ease: "power1.inOut",
        onStart: () => {
          hand.visible = true;
          text.visible = true;
        },
      },
    );

    this.handScaleAnimation = gsap.timeline().fromTo(
      hand.scale,
      {
        x: 0.75,
        y: 0.75,
        z: 0.75,
      },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        yoyo: true,
        ease: "power2.inOut",
        repeat: -1,
      },
    );
  },

  hideStartTutorial() {
    this.handScaleAnimation?.kill();
    this.handScaleAnimation = null;

    const hand = this["ui_hand_start"];
    const text = this["ui_text_start"];

    gsap.timeline().to([hand.material, text.material], {
      opacity: 0,
      duration: 0.25,
      ease: "power1.inOut",
      onComplete: () => {
        hand.visible = false;
        text.visible = false;
      },
    });
  },

  showMovementTutorial() {
    const arrow = this["ui_arrow_movement"];
    const hand = this["ui_hand_movement"];
    const text = this["ui_text_movement"];

    this.handScaleAnimation = gsap.timeline().fromTo(
      [hand.scale, text.scale, arrow.scale],
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 1,
        ease: "elastic.out(1, 0.5)",
        onStart: () => {
          arrow.visible = true;
          hand.visible = true;
          text.visible = true;
        },
      },
    );

    const range = 300;
    const duration = 1;

    this.handMovementAnimation = gsap.timeline().to(hand.position, {
      x: -range,
      duration,
      ease: "power1.inOut",
      onComplete: () => {
        this.handMovementAnimation = gsap
          .timeline()
          .to(hand.position, {
            x: range,
            duration,
            yoyo: true,
            repeat: -1,
            ease: "power1.inOut",
          })
          .to(
            hand.rotation,
            {
              z: Math.degToRad(15),
              duration,
              yoyo: true,
              repeat: -1,
              ease: "power1.inOut",
            },
            0,
          );
      },
    });
  },

  hideMovementTutorial() {
    this.handScaleAnimation?.kill();
    this.handScaleAnimation = null;

    const arrow = this["ui_arrow_movement"];
    const hand = this["ui_hand_movement"];
    const text = this["ui_text_movement"];

    this.handScaleAnimation = gsap
      .timeline()
      .to([hand.scale, text.scale, arrow.scale], {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5,
        ease: "elastic.in(1, 0.5)",
        onComplete: () => {
          arrow.visible = false;
          hand.visible = false;
          text.visible = false;
          this.handMovementAnimation?.kill();
          this.handMovementAnimation = null;
        },
      });
  },

  showTapTutorial() {
    const hand = this["ui_hand_tap"];
    const text = this["ui_text_tap"];

    gsap.timeline().fromTo(
      [hand.material, text.material],
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.25,
        ease: "power1.inOut",
        onStart: () => {
          hand.visible = true;
          text.visible = true;
        },
      },
    );

    this.handScaleAnimation = gsap.timeline().fromTo(
      hand.scale,
      {
        x: 0.75,
        y: 0.75,
        z: 0.75,
      },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.1,
        yoyo: true,
        ease: "power2.inOut",
        repeat: -1,
      },
    );
  },

  hideTapTutorial() {
    this.handScaleAnimation?.kill();
    this.handScaleAnimation = null;

    const hand = this["ui_hand_tap"];
    const text = this["ui_text_tap"];

    gsap.timeline().to([hand.material, text.material], {
      opacity: 0,
      duration: 0.25,
      ease: "power1.inOut",
      onComplete: () => {
        hand.visible = false;
        text.visible = false;
      },
    });
  },

  showCollectTutorial() {
    this.collectAnimation?.kill();

    gsap.fromTo(
      this.collect.material,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.25,
        ease: "power1.inOut",
        onStart: () => {
          this.collect.visible = true;
        },
      },
    );

    this.collectAnimation = gsap.to(this.collect.scale, {
      x: "*=1.1",
      y: "*=1.1",
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut",
    });
  },

  hideCollectTutorial() {
    this.collectAnimation?.kill();
    this.collectAnimation = null;

    gsap.to(this.collect.material, {
      opacity: 0,
      duration: 0.125,
      ease: "power1.inOut",
    });
  },

  showAvoidTutorial() {
    this.avoidAnimation?.kill();

    gsap.fromTo(
      this.avoid.material,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.25,
        ease: "power1.inOut",
        onStart: () => {
          this.avoid.visible = true;
        },
      },
    );

    this.avoidAnimation = gsap.fromTo(
      this.avoid.rotation,
      { y: -0.025 },
      {
        y: 0.025,
        duration: 0.25,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut",
      },
    );
  },

  hideAvoidTutorial() {
    this.avoidAnimation?.kill();
    this.avoidAnimation = null;

    gsap.to(this.avoid.material, {
      opacity: 0,
      duration: 0.125,
      ease: "power1.inOut",
    });
  },

  buildScene() {
    const castShadow = [
      "SK_Hero",
      "SK_Boss",
      "SM_Gate",
      "SM_Obstacle",
      "SM_Ring_Blue",
      "SM_Ring_Green",
      "SM_Ring_Pink",
      "SM_Ring_Red",
      "SM_Ring_Violet",
      "SM_Ring_Yellow",
      "SM_Platform",
      "SM_Flag",
    ];

    const receiveShadow = [
      "SK_Hero",
      "SK_Boss",
      "SM_Gate",
      "SM_Obstacle",
      "SM_Ring_Blue",
      "SM_Ring_Green",
      "SM_Ring_Pink",
      "SM_Ring_Red",
      "SM_Ring_Violet",
      "SM_Ring_Yellow",
      "SM_Platform",
      "SM_Flag",
    ];

    const asset = App.ThreeAssets["Scene"].scene;
    const scene = SceneProcessor.process(asset, castShadow, receiveShadow);
    scene.getObjectByName("SM_Platform").material.doubleSided = true;
    this.scene.add(...scene.children);

    const transparent = [
      "M_Gate_Green",
      "M_Gate_Red",
      "M_Gate_Green_Text",
      "M_Gate_Red_Text",
      "M_Avoid",
      "M_Collect",
    ];

    Object3DToolbox.enumerateMaterials(this.scene, (material) => {
      if (transparent.includes(material.name)) {
        material.transparent = true;
      }
    });

    const platform = this.scene.getObjectByName("SM_Platform");
    if (platform) {
      const box3 = new THREE.Box3().setFromObject(platform);
      const center = box3.getCenter(new THREE.Vector3());
      const size = box3.getSize(new THREE.Vector3());

      this.platformBody = new Body(
        { width: size.x, height: size.y, depth: size.z },
        {
          isKinematic: false,
          collisionGroup: this.collisionGroups.platform,
          collisionMask:
            this.collisionGroups.player | this.collisionGroups.obstacleFragment,
        },
      );

      const offset = new THREE.Vector3(0, -0.3, 0);
      this.platformBody.setPosition(center.add(offset));
    }

    this.collect = this.scene.getObjectByName("SM_Collect");
    this.avoid = this.scene.getObjectByName("SM_Avoid");
    this.collect.visible = false;
    this.avoid.visible = false;
  },

  buildEnvironment() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const asset = App.ThreeAssets["T_Background"];
    asset.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = asset;

    const sun = new Sun(0xffffff, 1.38);
    this.scene.add(sun);
    sun.position.set(5, 10, 7.5);

    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.normalBias = 0.075;

    //Wtf? Why everything crushing if we don't calculate bounds?
    Object3DToolbox.calculateBounds(this.scene);

    const box3 = new THREE.Box3();
    const distance = 50;

    setInterval(() => {
      if (!this.character) return;

      box3.setFromCenterAndSize(
        new THREE.Vector3(0, 1, this.character.position.z - (distance / 2 - 5)),
        new THREE.Vector3(8, 5, distance),
      );

      sun.setShadowMapFromBox3(box3);
    }, 100);

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x6db3df, 1.48);
    this.scene.add(hemisphere);

    const ambient = new THREE.AmbientLight(0x222222, 44.08);
    this.scene.add(ambient);

    this.scene.fog = new THREE.FogExp2(0xcce9ff, 0.003);
  },

  buildTriggers() {
    //Rings
    [
      "SM_Ring_Blue",
      "SM_Ring_Green",
      "SM_Ring_Pink",
      "SM_Ring_Red",
      "SM_Ring_Violet",
      "SM_Ring_Yellow",
    ].forEach((name) =>
      new TriggerPack({
        instancedMesh: this.scene.getObjectByName(name),
        triggerScale: new THREE.Vector3(1.25, 1.25, 8),
        collisionGroup: this.collisionGroups.trigger,
        collisionMask: this.collisionGroups.player,
      })
        .on(TriggerPackEvent.ENTER, this.onCollideRing, this)
        .once(TriggerPackEvent.EMPTY, (trigger) => trigger.destroy(), this),
    );

    //Obstacles
    ["SM_Obstacle", "SM_Gate"].forEach((name) =>
      new TriggerPack({
        instancedMesh: this.scene.getObjectByName(name),
        triggerScale: new THREE.Vector3(0.75, 0.75, 1),
        collisionGroup: this.collisionGroups.obstacle,
        collisionMask: this.collisionGroups.player,
      })
        .on(
          TriggerPackEvent.ENTER,
          name === "SM_Gate" ? this.onCollideGate : this.onCollideObstacle,
          this,
        )
        .once(TriggerPackEvent.EMPTY, (trigger) => trigger.destroy(), this),
    );

    const gate = this.scene.getObjectByName("SM_Gate_Left");

    //Increase
    new Trigger({
      size: new THREE.Vector3(2.5, 4, 1),
      position: new THREE.Vector3(-1.5, 1, gate.position.z),
      quaternion: new THREE.Quaternion(),
      collisionGroup: this.collisionGroups.trigger,
      collisionMask: this.collisionGroups.player,
    }).once(
      TriggerEvent.ENTER,
      (trigger) => {
        trigger.destroy();
        this.onIncreaseTrigger();
      },
      this,
    );

    //Decrease
    new Trigger({
      size: new THREE.Vector3(2.5, 4, 1),
      position: new THREE.Vector3(1.5, 1, gate.position.z),
      quaternion: new THREE.Quaternion(),
      collisionGroup: this.collisionGroups.trigger,
      collisionMask: this.collisionGroups.player,
    }).once(
      TriggerEvent.ENTER,
      (trigger) => {
        trigger.destroy();
        this.onDecreaseTrigger();
      },
      this,
    );

    //Finish
    new Trigger({
      size: new THREE.Vector3(7, 4, 4),
      position: new THREE.Vector3(0, 2, -100),
      quaternion: new THREE.Quaternion(),
      collisionGroup: this.collisionGroups.trigger,
      collisionMask: this.collisionGroups.player,
    }).once(
      TriggerEvent.ENTER,
      (trigger) => {
        trigger.destroy();
        this.targetMovementController.velocity.copy(
          this.character.movementController.velocity,
        );
        this.targetMovementController.position.copy(
          this.character.movementController.position,
        );
        this.character.movementController.isActive = false;
        this.character.movementController = this.targetMovementController;
        this.character.movementController.isActive = true;
        setTimeout(() => {
          this.onFinishTrigger();
        }, 750);
      },
      this,
    );
  },

  buildMovement() {
    this.movementController = new DirectionMovementController(
      new THREE.Vector3(0, 0, 0),
      {
        acceleration: 20,
        deceleration: 20,
        maximumSpeed: 10,
        direction: new THREE.Vector3(0, 0, -1),
        isActive: false,
      },
    );

    this.movementControllerListener = () => {
      this.movementController.position.x = Math.min(
        2.9,
        Math.max(-2.9, this.movementController.position.x),
      );
    };

    TimeHandler.instance.on(
      TimeHandler.EEvent.TICK,
      this.movementControllerListener,
      null,
      10,
    );

    this.targetMovementController = new TargetMovementController(
      new THREE.Vector3(0, 0, 0),
      {
        acceleration: 20,
        deceleration: 20,
        maximumSpeed: 10,
      },
    );
    this.targetMovementController.targetPosition.set(0, 0, -107);
  },

  buildControl() {
    this.gesture = new HorizontalControlGesture({
      range: 1,
      sensitivity: 1 / 0.6,
      resetWhenReleased: true,
      isActive: true,
    });

    const exponentialCurve = (input, exponent) => {
      return Math.pow(Math.clamp01(input), exponent);
    };

    const maximumAngle = Math.PI / 4;

    this.gesture.on(
      HorizontalControlGestureEvent.CHANGE,
      (position) => {
        const sign = Math.sign(position);
        const power = Math.abs(position);
        const exponential = exponentialCurve(power, 1.5) * sign;
        const angle = maximumAngle * exponential;

        if (!this.movementController.direction) {
          this.movementController.direction = new THREE.Vector3();
        }

        this.movementController.direction.set(
          Math.sin(angle),
          0,
          -Math.cos(angle),
        );
      },
      this,
    );

    this.gesture.on(
      HorizontalControlGestureEvent.RESET,
      () => this.movementController.direction.set(0, 0, -1),
      this,
    );
  },

  buildBoss() {
    this.boss = BossBuilder.build(App.ThreeAssets["SK_Boss"]);
    this.boss.position.set(0, -6, -125);
  },

  buildFracturedBoss(callback) {
    const head = this.boss.rawObject3D.getObjectByName("head");
    const body = this.boss.rawObject3D.getObjectByName("spine003");
    const pelvis = this.boss.rawObject3D.getObjectByName("spine001");
    const sword = this.boss.rawObject3D.getObjectByName("SM_Sword");
    const handLeft = this.boss.rawObject3D.getObjectByName("forearmL");
    const handRight = this.boss.rawObject3D.getObjectByName("forearmR");
    const legLeft = this.boss.rawObject3D.getObjectByName("shinL");
    const legRight = this.boss.rawObject3D.getObjectByName("shinR");

    if (
      !head ||
      !body ||
      !pelvis ||
      !sword ||
      !handLeft ||
      !handRight ||
      !legLeft ||
      !legRight
    ) {
      throw new Error("Missing required parts for fractured boss");
    }

    head.updateMatrixWorld(true);
    body.updateMatrixWorld(true);
    pelvis.updateMatrixWorld(true);
    sword.updateMatrixWorld(true);
    handLeft.updateMatrixWorld(true);
    handRight.updateMatrixWorld(true);
    legLeft.updateMatrixWorld(true);
    legRight.updateMatrixWorld(true);

    const previousHeadMatrix = head.matrixWorld.clone();
    const previousBodyMatrix = body.matrixWorld.clone();
    const previousPelvisMatrix = pelvis.matrixWorld.clone();
    const previousSwordMatrix = sword.matrixWorld.clone();
    const previousHandLeftMatrix = handLeft.matrixWorld.clone();
    const previousHandRightMatrix = handRight.matrixWorld.clone();
    const previousLegLeftMatrix = legLeft.matrixWorld.clone();
    const previousLegRightMatrix = legRight.matrixWorld.clone();

    const timestamp = performance.now();
    const maxDropFrameCount = 2;
    let dropFrameCount = 0;

    return safePromise((resolve) => {
      const listener = () => {
        dropFrameCount += 1;
        if (dropFrameCount < maxDropFrameCount) return;

        TimeHandler.instance.off(TimeHandler.EEvent.TICK, listener);
        const deltaTime = (performance.now() - timestamp) / 1000;

        head.updateMatrixWorld(true);
        body.updateMatrixWorld(true);
        pelvis.updateMatrixWorld(true);
        handLeft.updateMatrixWorld(true);
        handRight.updateMatrixWorld(true);
        legLeft.updateMatrixWorld(true);
        legRight.updateMatrixWorld(true);

        const currentHeadMatrix = head.matrixWorld.clone();
        const currentBodyMatrix = body.matrixWorld.clone();
        const currentPelvisMatrix = pelvis.matrixWorld.clone();
        const currentSwordMatrix = sword.matrixWorld.clone();
        const currentHandLeftMatrix = handLeft.matrixWorld.clone();
        const currentHandRightMatrix = handRight.matrixWorld.clone();
        const currentLegLeftMatrix = legLeft.matrixWorld.clone();
        const currentLegRightMatrix = legRight.matrixWorld.clone();

        this.fracturedBoss = FracturedBossBuilder.build({
          asset: App.ThreeAssets["SM_Boss_Fractured"],

          head: {
            previousMatrix: previousHeadMatrix,
            currentMatrix: currentHeadMatrix,
          },
          body: {
            previousMatrix: previousBodyMatrix,
            currentMatrix: currentBodyMatrix,
          },
          pelvis: {
            previousMatrix: previousPelvisMatrix,
            currentMatrix: currentPelvisMatrix,
          },
          sword: {
            previousMatrix: previousSwordMatrix,
            currentMatrix: currentSwordMatrix,
          },
          handLeft: {
            previousMatrix: previousHandLeftMatrix,
            currentMatrix: currentHandLeftMatrix,
          },
          handRight: {
            previousMatrix: previousHandRightMatrix,
            currentMatrix: currentHandRightMatrix,
          },
          legLeft: {
            previousMatrix: previousLegLeftMatrix,
            currentMatrix: currentLegLeftMatrix,
          },
          legRight: {
            previousMatrix: previousLegRightMatrix,
            currentMatrix: currentLegRightMatrix,
          },
          deltaTime,

          collisionGroup: this.collisionGroups.bossFragments,
          collisionMask: 0,
        });

        resolve([
          head.getWorldPosition(new THREE.Vector3()),
          body.getWorldPosition(new THREE.Vector3()),
          pelvis.getWorldPosition(new THREE.Vector3()),
          sword.getWorldPosition(new THREE.Vector3()),
          handLeft.getWorldPosition(new THREE.Vector3()),
          handRight.getWorldPosition(new THREE.Vector3()),
          legLeft.getWorldPosition(new THREE.Vector3()),
          legRight.getWorldPosition(new THREE.Vector3()),
        ]);
      };
      TimeHandler.instance.on(TimeHandler.EEvent.TICK, listener);
    });
  },

  buildCharacter() {
    this.stepHandler = new CharacterStepHandler({
      stepFrequency: 3,
      maximumSpeed: this.movementController.maximumSpeed,
    });

    const asset = App.ThreeAssets["SK_Character"];

    this.character = CharacterBuilder.build({
      asset,
      collisionGroup: this.collisionGroups.player,
      collisionMask:
        this.collisionGroups.ring |
        this.collisionGroups.obstacle |
        this.collisionGroups.obstacleFragment |
        this.collisionGroups.trigger,
      movementController: this.movementController,
      stepHandler: this.stepHandler,
    });

    const stepParticleSystem = new SimpleParticleSystem.System(
      { capacity: 512, gravity: { x: 0, y: 0, z: 0 } },
      { texture: App.ThreeAssets["T_Dust"] },
    );

    const dustEmitter = new SimpleParticleSystem.Emitter(
      {
        system: stepParticleSystem,
        playTime: 0.05,
        spawnRate: 256,
        playByDefault: false,
      },
      {
        lifeTimeRange: { min: 0.25, max: 0.75 },

        positionRange: {
          min: { x: -0.1, y: -0.1, z: -0.1 },
          max: { x: 0.1, y: 0.1, z: 0.1 },
        },
        rotationRange: { min: -Math.PI, max: Math.PI },
        scaleOverTime: [
          { min: 0.05, max: 0.1 },
          { min: 0.1, max: 0.2 },
          { min: 0, max: 0 },
        ],
        opacityOverTime: [
          { min: 0, max: 0 },
          { min: 1, max: 1 },
          { min: 0, max: 0 },
        ],

        velocityRange: {
          theta: { min: 0, max: Math.PI * 2 },
          phi: { min: 0, max: 0.4 },
          magnitude: { min: 0.5, max: 2 },
        },
        angularVelocityRange: { min: -Math.PI2, max: Math.PI2 },
      },
    );

    this.character.rawObject3D.add(dustEmitter);
    dustEmitter.position.set(0, 0, 0.5);

    this.stepHandler.on(ECharacterStepHandlerEvent.STEP, () => {
      dustEmitter.play();
      if (window.MraidSDK) MraidSDK.playSound("S_Step");
      else this.playSound("S_Step");
    });

    const lookAtDummy = new THREE.Object3D();
    this.character.rawObject3D.attach(lookAtDummy);
    lookAtDummy.position.set(0, 4, 0);

    this.cameraOperator = new Object3DOperator(
      this.cameraWrapper,
      lookAtDummy,
      true,
    );
    this.cameraOperator.warp();

    const container = new THREE.Object3D();
    const head = this.character.rawObject3D.getObjectByName("head_end");
    head.attach(container);
    container.position.set(0, 17, 20);
    container.rotation.set(0, Math.PI, 0);

    const defaultScale = 0.45;
    const scaleStep = 0.025;

    this.ringCollector = new RingCollector(container, defaultScale, scaleStep);
  },

  async buildFracturedObstacle(asset, transform, lifetime = 5) {
    const fracturedObstacle = new FracturedObstacle({
      asset,
      transform,
      hitPosition: this.character.position,
      hitDirection: new THREE.Vector3(0, 0, -1),
      collisionGroup: this.collisionGroups.obstacleFragment,
      collisionMask:
        this.collisionGroups.obstacleFragment |
        this.collisionGroups.player |
        this.collisionGroups.platform,
    });

    await safeWait(lifetime);
    fracturedObstacle.destroy();
  },

  buildBossExplosionParticleSystem() {
    this.bossExplosionWaveParticleSystem = new SimpleParticleSystem.System(
      { capacity: 128, gravity: { x: 0, y: 0, z: 0 } },
      {
        texture: App.ThreeAssets["T_Explosion_Wave"],
        blending: THREE.AdditiveBlending,
      },
    );

    this.bossExplosionFragmentsParticleSystem = new SimpleParticleSystem.System(
      { capacity: 1024, gravity: { x: 0, y: -10, z: 0 } },
      { texture: App.ThreeAssets["T_Explosion_Fragment"] },
    );
  },

  async runBossExplosion(positions) {
    this.playSound("S_Explosion");

    const waveEmitters = [];
    const fragmentEmitters = [];

    for (const position of positions) {
      const waveEmitter = new SimpleParticleSystem.Emitter(
        {
          system: this.bossExplosionWaveParticleSystem,
          playTime: 0.1,
          spawnRate: 10,
          playByDefault: true,
        },
        {
          lifeTimeRange: { min: 0.75, max: 1 },

          positionRange: {
            min: { x: -0.05, y: -0.05, z: -0.05 },
            max: { x: 0.05, y: 0.05, z: 0.05 },
          },
          rotationRange: { min: -Math.PI, max: Math.PI },
          scaleOverTime: [
            { min: 0, max: 0 },
            { min: 8, max: 12 },
          ],
          opacityOverTime: [
            { min: 0, max: 0 },
            { min: 1, max: 1 },
            { min: 0, max: 0 },
          ],

          velocityRange: {
            theta: { min: 0, max: 0 },
            phi: { min: 0, max: 0 },
            magnitude: { min: 0, max: 0 },
          },
          angularVelocityRange: { min: -Math.PI / 2, max: Math.PI / 2 },
        },
      );

      const fragmentEmitter = new SimpleParticleSystem.Emitter(
        {
          system: this.bossExplosionFragmentsParticleSystem,
          playTime: 0.25,
          spawnRate: 256,
          playByDefault: true,
        },
        {
          lifeTimeRange: { min: 2, max: 4 },

          positionRange: {
            min: { x: -0.1, y: -0.1, z: -0.1 },
            max: { x: 0.1, y: 0.1, z: 0.1 },
          },
          rotationRange: { min: -Math.PI, max: Math.PI },
          scaleOverTime: [
            { min: 0.5, max: 0.75 },
            { min: 0, max: 0 },
          ],
          opacityOverTime: [
            { min: 0, max: 0 },
            { min: 1, max: 1 },
            { min: 0, max: 0 },
          ],

          velocityRange: {
            theta: { min: -Math.PI, max: Math.PI },
            phi: { min: -Math.PI, max: Math.PI },
            magnitude: { min: -20, max: 20 },
          },
          angularVelocityRange: { min: -Math.PI2, max: Math.PI2 },
        },
      );

      waveEmitter.position.copy(position);
      waveEmitters.push(waveEmitter);

      fragmentEmitter.position.copy(position);
      fragmentEmitters.push(fragmentEmitter);
    }

    await safeWait(16);

    for (const emitter of waveEmitters) {
      emitter.destroy();
    }

    for (const emitter of fragmentEmitters) {
      emitter.destroy();
    }

    this.bossExplosionWaveParticleSystem.destroy();
    this.bossExplosionFragmentsParticleSystem.destroy();
  },

  runCameraShakeAnimation() {
    const shakeAmount = 0.05;
    const shakeDuration = 0.15;

    if (!this.cameraOriginalRotation) {
      this.cameraOriginalRotation = this.camera.rotation.clone();
    }

    if (this.cameraShakeAnimation) {
      this.cameraShakeAnimation.kill();
    }

    this.cameraShakeAnimation = gsap.to(this.camera.rotation, {
      x: this.cameraOriginalRotation.x + (Math.random() - 0.5) * shakeAmount,
      y: this.cameraOriginalRotation.y + (Math.random() - 0.5) * shakeAmount,
      z: this.cameraOriginalRotation.z + (Math.random() - 0.5) * shakeAmount,
      duration: shakeDuration,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(this.camera.rotation, {
          x: this.cameraOriginalRotation.x,
          y: this.cameraOriginalRotation.y,
          z: this.cameraOriginalRotation.z,
          duration: shakeDuration,
          ease: "power2.in",
        });
      },
    });
  },

  runCameraAlignAnimation(targetPosition, viewDirection, fov) {
    const wrapper = this.cameraWrapper;

    const fromPosition = wrapper.position.clone();
    const toPosition = targetPosition.clone();

    const fromQuaternion = wrapper.quaternion.clone();
    const toQuaternion = new THREE.Quaternion().setFromView(viewDirection);

    const fromFov = this.camera.fov;
    const toFov = fov;

    const helper = { t: 0 };
    gsap.to(helper, {
      t: 1,
      duration: 1,
      ease: "power2.inOut",
      onUpdate: () => {
        wrapper.position.lerpVectors(fromPosition, toPosition, helper.t);
        wrapper.quaternion.slerpQuaternions(
          fromQuaternion,
          toQuaternion,
          helper.t,
        );

        this.camera.fov = Math.lerp(fromFov, toFov, helper.t);
        this.camera.updateProjectionMatrix();
      },
    });
  },

  runFrameFlashAnimation() {
    const frame = this["ui_frame"];

    this.frameFlashAnimation?.kill();
    this.frameFlashAnimation = gsap
      .timeline()
      .to(frame.material, {
        opacity: "+=0.25",
        duration: 0.25,
        ease: "power2.inOut",
        onStart: () => {
          frame.visible = true;
        },
      })
      .to(frame.material, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          frame.visible = false;
          this.frameFlashAnimation = null;
        },
      });
  },

  async setTimeScaleAnimated(name, value, duration, onComplete) {
    return safePromise((resolve) => {
      const helper = { value: TimeHandler.instance.getTimeScale(name) };
      gsap.to(helper, {
        duration,
        value,
        onUpdate: () => TimeHandler.instance.setTimeScale(name, helper.value),
        onComplete: resolve,
      });
    });
  },

  onCollideRing(transform, geometry, material) {
    if (!this.isAvoidTutorialShowedAtLeastOnce) {
      this.isAvoidTutorialShowedAtLeastOnce = true;
      this.showAvoidTutorial();
    }

    if (!this.lastTimeCollectSoundPlayed) this.lastTimeCollectSoundPlayed = 0;

    const currentTime = TimeHandler.instance.rawTime;
    const delay = 0.075;

    if (currentTime - this.lastTimeCollectSoundPlayed > delay) {
      this.lastTimeCollectSoundPlayed = TimeHandler.instance.rawTime;
      if (window.MraidSDK) MraidSDK.playSound("S_Collect");
      else this.playSound("S_Collect");
    }

    this.hideCollectTutorial();
    this.ringCollector.collect(transform, geometry, material);
  },

  onCollideObstacle(transform) {
    this.hideAvoidTutorial();
    this.runFrameFlashAnimation();

    const sound = ["S_Break_Wall_0", "S_Break_Wall_1"].randomElement();
    if (window.MraidSDK) MraidSDK.playSound(sound);
    else this.playSound(sound);

    this.runCameraShakeAnimation();
    this.movementController.scaleVelocity(0.25);

    for (let i = 0; i < 5; i++) {
      const result = this.ringCollector.remove();
      if (!result) break;
      //TODO: add dropped rings
    }

    this.buildFracturedObstacle(
      App.ThreeAssets["SM_Obstacle_Fractured"],
      transform,
    );
  },

  onCollideGate(transform) {
    this.buildFracturedObstacle(
      App.ThreeAssets["SM_Gate_Fractured"],
      transform,
    );
  },

  onIncreaseTrigger() {
    this.playSound("S_Gate");
    const count = Math.min(this.ringCollector.count, 25);
    this.ringCollector.collectFromNowhere(count);
  },

  onDecreaseTrigger() {
    this.playSound("S_Gate");
    for (let i = 0; i < 15; i++) {
      const result = this.ringCollector.remove();
      if (!result) break;
    }
  },

  async onFinishTrigger() {
    this.gesture.isActive = false;
    this.movementController.isActive = false;

    this.cameraOperator.isActive = false;
    this.runCameraAlignAnimation(
      new THREE.Vector3(0, 4, -100),
      new THREE.Vector3(0, 0, -1).normalize(),
      65,
    );

    TimeHandler.instance.off(
      TimeHandler.EEvent.TICK,
      this.movementControllerListener,
      null,
    );

    if (this.ringCollector.count > 0) {
      this.showTapTutorial();
      this.character.runAttackState();

      const failTimeoutHandler = setTimeout(async () => {
        GestureHandler.instance.off(GestureHandler.IEvent.START, tapListener);
        this.hideTapTutorial();
        await this.setTimeScaleAnimated("global", 1, 0.5);
        this.runFailSequence();
      }, 6000);

      const ringCountByTap = 8;
      const ringRequiredToWin = 50;
      let ringCount = 0;

      const tapListener = async () => {
        let result;
        for (let i = 0; i < ringCountByTap; i++) {
          const info = this.ringCollector.attack(new THREE.Vector3(0, 5, -140));
          if (!info) break;

          result = info;
          ringCount += 1;

          if (window.MraidSDK) MraidSDK.playSound("S_Throw");
          else this.playSound("S_Throw");
        }

        if (result) {
          const { geometry, material } = result;
          this.boss.wrapRing(geometry, material);
          this.boss.runHitState();
          this.runCameraShakeAnimation();
        }

        if (ringCount >= ringRequiredToWin) {
          GestureHandler.instance.off(GestureHandler.IEvent.START, tapListener);
          clearTimeout(failTimeoutHandler);
          this.hideTapTutorial();
          await this.setTimeScaleAnimated("global", 1, 0.5);
          this.runWinSequence();
        } else if (!result) {
          GestureHandler.instance.off(GestureHandler.IEvent.START, tapListener);
          clearTimeout(failTimeoutHandler);
          await this.setTimeScaleAnimated("global", 1, 0.5);
          this.hideTapTutorial();
          this.runFailSequence();
        }
      };

      await this.setTimeScaleAnimated("global", 0.5, 0.5);
      GestureHandler.instance.on(GestureHandler.IEvent.START, tapListener);
    } else {
      this.runFailSequence();
    }
  },

  async runWinSequence() {
    this.boss.runDeathState();

    await safeWait(0.75);
    const limbsPosition = await this.buildFracturedBoss();
    this.runBossExplosion(limbsPosition);

    this.character.runWinState();
    this.boss.destroy();

    await this.setTimeScaleAnimated("global", 0.5, 0.5);

    if (window.MraidSDK) {
      App.CallToAction.reason = "win";
      MraidSDK.on("Show Native End Screen", () => App.CallToAction.show("win"));
    }

    if (window.MraidSDK) MraidSDK.showEndScreen("win");
    else App.CallToAction.show("win");
  },

  async runFailSequence() {
    this.boss.runAttackState();
    while (this.ringCollector.remove()) {}

    await safeWait(0.5);
    this.playSound("S_Sword");
    await safeWait(0.5);
    this.playSound("S_Body_Drop");
    this.character.runDeathState();
    await safeWait(1.25);
    this.boss.runWinState();

    await this.setTimeScaleAnimated("global", 0.5, 0.5);

    if (window.MraidSDK) {
      App.CallToAction.reason = "fail";
      MraidSDK.on("Show Native End Screen", () =>
        App.CallToAction.show("fail"),
      );
    }

    if (window.MraidSDK) MraidSDK.showEndScreen("fail");
    else App.CallToAction.show("fail");
  },
});
