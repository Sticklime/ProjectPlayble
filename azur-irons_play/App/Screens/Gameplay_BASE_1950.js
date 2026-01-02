/*
 Это основной файл для написания кода игры. Здесь находится логика геймплея за исключением туториала
 и конечного экрана (их код должен быть написан в Tutorial.js и CallToAction.js соответственно)
*/

import {Enemy} from "Custom/Enemy/Enemy";
import {EnemyAnimationController} from "Custom/Enemy/EnemyAnimationController";
import {EnemyTriggerHandler} from "Custom/Enemy/EnemyTriggerHandler";
import {Fragment} from "Custom/Fragment";
import {
    FragmentCollection,
    FragmentTypeName,
} from "Custom/FragmentCollection";
import {safePromise, safeWait} from "Libs/Toolbox/SafeFunctions";
import {
    FragmentSelector,
    FragmentSelectorEvent,
} from "Custom/FragmentSelector";
import {Hero} from "Custom/Hero/Hero";
import {HeroAnimationController} from "Custom/Hero/HeroAnimationController";
import {HeroTriggerHandler} from "Custom/Hero/HeroTriggerHandler";
import {Object3DOperator} from "Libs/Toolbox/CameraOperator";
import {DirectionMovementController} from "Libs/Toolbox/DirectionMovementController";
import {JoystickGesture, JoystickGestureEvent,} from "Libs/Toolbox/JoystickGesture";
import {Platform} from "Libs/Toolbox/Platform";
import {TargetMovementController} from "Libs/Toolbox/TargetMovementController";
import {TimeHandler} from "Libs/Toolbox/TimeHandler";
import {TriggerPack, TriggerPackEvent} from "Libs/Toolbox/TriggerPack";
import Screen from "Screen";
import {Enumerator, SceneProcessor, SkinnedMeshBaker, Sun} from "three-zoo";
import {clone} from "three/examples/jsm/utils/SkeletonUtils";
import {CoinCollector} from "Custom/CoinCollector";
import {Vector3} from "three";
import {FXSimpleParticleSystem3D} from "Custom/FXSimpleParticleSystem3D";
import * as TinyParticleSystem from "Libs/TinyParticleSystem/index";
import Broadcast from "Broadcast";

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
                    name: "WalletContainer",
                    positionLandscape: [0.99, 0.99],
                    positionPortrait: [0.99, 0.99],
                    LTRBLandscape: "TR",
                    LTRBPortrait: "TR",
                    stickinessLandscape: [0.99, 0.99],
                    stickinessPortrait: [0.99, 0.99],
                    childs: [
                        {
                            name: "T_Wallet_Background",
                            type: "three-image",
                            image: "T_Wallet_Background",
                            position: [-200, -100],
                            childs: [
                                {
                                    name: "T_Coin",
                                    type: "three-image",
                                    image: "T_Coin",
                                    position: [80, 0],
                                    scale: [1, 1],
                                    LTRB: "LT",
                                },
                                {
                                    name: "T_Coin_Text",
                                    type: "three-text",
                                    text: "",
                                    color: "#ffffff",
                                    position: [20, 0],
                                    scale: [1, 1],
                                    LTRB: "RT",
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "DownloadContainer",
                    positionLandscape: [-0.99, -0.99],
                    positionPortrait: [-0.99, -0.99],
                    LTRBLandscape: "BL",
                    LTRBPortrait: "BL",
                    stickinessLandscape: [0.99, 0.99],
                    stickinessPortrait: [0.99, 0.99],
                    childs: [
                        {
                            name: "T_Download_Button",
                            type: "three-image",
                            image: "T_Download_Button",
                            position: [200, 100],
                            event: "download_button",
                        },
                    ],
                },
                {
                    name: "T_Choose_Armor_Text",
                    type: "three-image",
                    image: "T_Choose_Armor_Text",
                    position: [0, 600],
                    scale: [1, 1],
                    LTRB: "RT",
                },
                {
                    name: "T_Infinity",
                    type: "three-image",
                    image: "T_Infinity",
                    position: [0, -500],
                    LTRB: "CD",
                },
                {
                    name: "T_HandOnInfinity",
                    type: "three-image",
                    image: "T_Hand",
                    position: [50, -550],
                    scale: [0.5, 0.5],
                    LTRB: "CC",
                },
                {
                    name: "T_Hand",
                    type: "three-image",
                    image: "T_Hand",
                    position: [-180, -250],
                    scale: [1, 1],
                    LTRB: "CC",
                }
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

            this.collisionGroups = {
                hero: 1 << 0,
                heroAttackRange: 1 << 1,
                enemy: 1 << 2,
                enemyAttackRange: 1 << 3,
                enemyDetectRange: 1 << 4,
                coin: 1 << 5,
            };

            this.fragmentNames = [
                "Huggy_Wuggy",
                "Iron_Man",
                "Mommy",
                "Spider_Man",
                "Venom",
            ];


            this.buildAudio();
            this.buildScene();
            this.buildEnvironment();
            this.buildCoins();
            this.buildAttackEffect();
            this.buildHero();
            this.buildEnemies();
            this.buildFragmentSelector();
            this.buildControls();
            this.buildCamera();
            this.buildParticlesEffect();

            this.showTutorialBuilder();
            this.hideTutorialRun();

            if (window.MraidSDK) MraidSDK.playSound("S_Background", { loop: true });
            else this.playSound("S_Background", { loop: true });

            Broadcast.on(
                "Gameplay download_button Down",
                () => {
                    if (window.MraidSDK) MraidSDK.open("end screen button");
                    else alert("Click Out: end screen button");
                    this.playSound("S_Button");
                },
                this,
            );

            this.hero.getComponent(Hero).onAttack = () => {
                const sounds = [
                    "S_Attack_0",
                    "S_Attack_1",
                    "S_Attack_2",
                    "S_Attack_3",
                    "S_Attack_4"
                ];
                const sound = sounds[Math.floor(Math.random() * sounds.length)];
                this.playSound(sound);
            };

        },

        // Срабатывает на изменение размеров или ориентации экрана
        resize() {
        },


        show() {
            this.updateSettings();
            this.startGame();
        },

        // Срабатывает на каждый тик / каждую перерисовку экрана
        // Тут лучше ничего не писать, так как этот код срабатывает 60 раз в секунду или больше в зависимости от системы пользователя
        // Любой код расположенный здесь будет снижать производительность
        update() {
        },

        // Срабатывает во время скрытия этого экрана
        hide() {
        },
    },

    buildAudio() {

    },


    buildAttackEffect() {
        const stepParticleSystem = new TinyParticleSystem.System(
            {capacity: 512, gravity: {x: 0, y: 0, z: 0}},
            {texture: App.ThreeAssets["T_Armor_Particle"].clone()},
        );

        this.dustEmitter = new TinyParticleSystem.Emitter(
            {
                system: stepParticleSystem,
                playTime: 8192,
                spawnRate: 40,
                playByDefault: false,
            },
            {
                lifeTimeRange: {min: .5, max: .5},

                positionRange: {
                    min: {x: 0, y: 0, z: 0},
                    max: {x: 0, y: 0, z: 0},
                },
                rotationRange: {min: -Math.PI, max: Math.PI},
                scaleOverTime: [
                    {min: .4, max: .4},
                    {min: .1, max: .1},
                ],
                opacityOverTime: [
                    {min: 1, max: 1},
                    {min: 1, max: 1},
                    {min: 0, max: 0},
                ],
                colorOverTime: [
                    new THREE.Color(0x002ffd),
                    new THREE.Color(0x00feaa),
                ],
                velocityRange: {
                    theta: {min: -Math.PI, max: Math.PI},
                    phi: {min: 0, max: 0},
                    magnitude: {min: 2, max: 2},
                },
                angularVelocityRange: {min: -Math.PI * 2, max: Math.PI * 2},
            },
        );
        this.dustEmitter.position.set(1, 2, 1);
        this.dustEmitter.rotation.set(Math.PI / 2, 0, 0);

        this.scene.add(this.dustEmitter);
    },

    buildParticlesEffect() {
        const fragments = this.fragmentsSelector.getActiveFragments();
        const glowTexture = App.ThreeAssets["T_Glow"];
        const particleTexture = App.ThreeAssets["T_Armor_Particle"];
        this.particleSystems = [];
        this.glowSprites = [];

        const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            transparent: true,
        });

        const box3 = new THREE.Box3();
        const spriteScale = new THREE.Vector3(0.6, 0.6, 1);

        for (const fragment of fragments) {
            const sprite = new THREE.Sprite(glowMaterial);
            sprite.center.set(0.5, 0);
            box3.setFromObject(fragment);
            box3.getCenter(sprite.position);
            sprite.position.y = 0;
            sprite.scale.copy(spriteScale);

            this.glowSprites.push(sprite);
            this.scene.add(sprite);

            for (let i = 0; i < 10; i++) {
                const particle = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: particleTexture,
                    transparent: true,
                    opacity: 0.65,
                    depthWrite: false,
                }));

                let angle;
                if (i % 2 === 0) {
                    angle = (150 + Math.random() * 60) * Math.PI / 180;
                } else {
                    angle = (Math.random() * 60 - 30) * Math.PI / 180;
                }

                const radius = 0.25;
                const startX = sprite.position.x + Math.cos(angle) * radius;
                const startZ = sprite.position.z + Math.sin(angle) * radius;
                const startY = sprite.position.y + 0.3;

                const scale = Math.random() * 0.02 + 0.02;
                particle.scale.set(scale, scale, 1);

                this.scene.add(particle);

                const animateParticle = () => {
                    particle.position.set(startX, startY, startZ);
                    particle.material.opacity = 0.75;

                    gsap.to(particle.position, {
                        y: startY + Math.random() * 0.4,
                        duration: Math.random() * 0.8 + 0.8,
                        ease: "sine.in",
                    });
                    gsap.to(particle.material, {
                        opacity: 0,
                        duration: 0.4,
                        delay: 0.8 + Math.random() * 0.8,
                        onComplete: animateParticle,
                    });
                };
                animateParticle();
                this.particleSystems.push(particle);
            }
        }
    },

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


    // Секция событий - здесь прописываются события нажатия на спрайты из секции Containers, а так же глобальные события серез префикс global:
    // Для того чтобы добавить события клика на спрайт ему нужно в секции Containers прописать events: true,
    // а в этой секции написать 'имя спрайта click' и дальше написать код срабатывающий по нажатию на этот спрайт
    updateSettings(name, value) {
        this.resize();
    },

    // Здесь нужно применить заново все настройки созданные для этого проекта
    // Сменить фон в зависимости от настройки, текстуру героя и т.д.
    // Всё что зависит от настроек переделать заново
    startGame() {
        if (window.MraidSDK) MraidSDK.track("Game Starts");
    },

    restoreGame() {
    },

    // Этот метод может вызваться из конечного экрана если нужно произвести возврат в игру
    buildScene() {
        const clone = App.ThreeAssets["Scene"].scene.clone();
        const children = SceneProcessor.process({
            asset: clone,
            castShadowMeshNames: [/SM_Cone/, /SM_Box/, /SM_Door/, "SM_Door_Frame",],
            receiveShadowMeshNames: [
                /SM_Cone/,
                /SM_Box/,
                /SM_Door/,
                "SM_Door_Frame",
                "SM_Room",
                "SM_Platform",
                "SM_Room_Floor",
                "SM_Podium",
            ],
        });

        this.scene.add(...children);

        const platform = this.scene.getObjectByName("SM_Platform");
        if (platform) {
            platform.traverse(child => {
                child.receiveShadow = true;
            });
        }
    },

    buildEnvironment() {
        this.scene.background = new THREE.Color("gray");

        const ambient = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambient);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const sun = new Sun(0xffffff, 2.7);
        sun.position.set(5, 10, 7.5);
        this.scene.add(sun);

        const shadowBox = new THREE.Box3();
        shadowBox.setFromCenterAndSize(
            new THREE.Vector3(0, 3, 0),
            new THREE.Vector3(12, 8, 12),
        );

        sun.castShadow = true;
        sun.shadow.mapSize.width = 512;
        sun.shadow.mapSize.height = 512;
        sun.setShadowMapFromBox3(shadowBox);

        let accumulator = 0;
        const interval = 0.125;

        TimeHandler.instance.on(TimeHandler.Event.tick, (dt) => {
            accumulator += dt;
            if (accumulator >= interval) {
                accumulator = 0;

                const heroPlatform = this.hero;
                if (!heroPlatform) return;

                const heroPos = heroPlatform.position;
                const center = new THREE.Vector3(heroPos.x, 3, heroPos.z);

                shadowBox.setFromCenterAndSize(center, new THREE.Vector3(12, 8, 12));
                sun.setShadowMapFromBox3(shadowBox);
            }
        });
    },

    buildCamera() {
        this.camera.position.set(0, 3.14, 7.8);
        this.camera.rotation.set(THREE.MathUtils.degToRad(-17.8), 0, 0);
        this.camera.fov = 45;
        this.camera.near = 0.2;
        this.camera.far = 100;
        this.camera.updateProjectionMatrix();

        this.cameraOperator = new Object3DOperator(
            this.camera,
            this.lookAtDummy,
            false,
        );
        this.cameraOperator.elevation = 60;
        this.cameraOperator.distance = 6;
        this.cameraOperator.movementSpeed = 10;
    },

    buildCoins() {
        const instancedMesh = this.scene.getObjectByName("SM_Coin");
        if (!instancedMesh) throw new Error("Coin instanced mesh not found");

        this.coinCollect = new CoinCollector(this["T_Coin_Text"]);

        new TriggerPack({
            instancedMesh: instancedMesh,
            triggerScale: new THREE.Vector3(1, 1, 1),
            collisionGroup: this.collisionGroups.coin,
            collisionMask: this.collisionGroups.hero,
        }).on(TriggerPackEvent.enter, this.onCollectCoin, this);

        this.buildCoinParticles(instancedMesh);
    },

    buildCoinParticles(instancedMesh) {
        const dummy = new THREE.Object3D();
        const particleTexture = App.ThreeAssets["T_Armor_Particle"];
        const coinsCount = instancedMesh.count;

        this.coinParticleGroups = [];

        for (let i = 0; i < coinsCount; i++) {
            instancedMesh.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

            const group = new THREE.Group();
            group.position.copy(dummy.position);
            this.scene.add(group);
            this.coinParticleGroups.push(group);

            for (let j = 0; j < 9; j++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.sqrt(Math.random()) * 0.4;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const y = 0.08 + Math.random() * 0.03;

                const particle = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: particleTexture,
                    color: 0xffff00,
                    transparent: true,
                    opacity: 0.8,
                    depthWrite: false,
                }));

                const scale = Math.random() * 0.025 + 0.02;
                particle.scale.set(scale, scale, 1);
                particle.position.set(x, y, z);
                group.add(particle);

                const animate = () => {
                    particle.material.opacity = 0.7 + Math.random() * 0.3;
                    gsap.to(particle.position, {
                        y: particle.position.y + Math.random() * 0.009,
                        duration: 0.7 + Math.random() * 0.8,
                        ease: "sine.in",
                    });
                    gsap.to(particle.material, {
                        opacity: 0,
                        duration: 0.4 + Math.random() * 0.3,
                        delay: 0.6 + Math.random() * 0.5,
                        onComplete: animate,
                    });
                };
                animate();
            }
        }
    },

    buildHero: function () {
        const asset = App.ThreeAssets["SK_Heroes"];
        const armature = Enumerator.getObjectByName(asset.scene, "Armature");
        if (!armature) throw new Error("Armature not found");

        const podium = this.scene.getObjectByName("SM_Platform");

        const container = clone(armature);
        Enumerator.setShadowRecursive(container);

        this.lookAtDummy = new THREE.Object3D();
        this.lookAtDummy.position.set(0, 1.5, 0);

        container.add(this.lookAtDummy);

        const collections = this.fragmentNames.map((name) => new FragmentCollection(
            {container, name, enabled: false}),);

        const idleClip = this.findClip(asset.animations, "A_Idle");
        const runClip = this.findClip(asset.animations, "A_Run");
        const attackClip0 = this.findClip(asset.animations, "A_Attack_0");
        const attackClip1 = this.findClip(asset.animations, "A_Attack_1");
        const attackClip2 = this.findClip(asset.animations, "A_Attack_2");
        const winClip = this.findClip(asset.animations, "A_Win");
        const ready = this.findClip(asset.animations, "A_Ready");
        const showLeg = this.findClip(asset.animations, "A_Show_Leg");
        const showHand = this.findClip(asset.animations, "A_Show_Hand");

        asset.animations.forEach((clip, i) => {
            console.log(`[${i}]`, clip.name, clip);
        });
        const mixer = new THREE.AnimationMixer(container);

        this.movementController = new DirectionMovementController({
            isActive: false,
            initialDirection: new THREE.Vector3(0, 0, 0),
            acceleration: 8,
            deceleration: 8,
            maximumSpeed: 8,
        });

        TimeHandler.instance.on(
            TimeHandler.Event.tick,
            this.movementController.update,
            this.movementController,
        );

        const platform = new Platform();
        this.scene.add(platform);
        this.hero = platform;

        this.animationController = new HeroAnimationController(platform, {
            mixer,
            idleClip,
            runClip,
            attackClips: [attackClip0, attackClip1, attackClip2],
            winClip,
            readyClip: ready,
            showLeg: showLeg,
            showHand: showHand,
        });

        const triggerHandler = new HeroTriggerHandler(platform, {
            selfBody: {
                size: {x: 0.75, y: 1, z: 0.75},
                collisionGroup: this.collisionGroups.hero,
                collisionMask:
                    this.collisionGroups.coin |
                    this.collisionGroups.enemyAttackRange |
                    this.collisionGroups.enemyDetectRange,
            },
            attackRangeTrigger: {
                size: {x: 2, y: 1, z: 2},
                collisionGroup: this.collisionGroups.heroAttackRange,
                collisionMask: this.collisionGroups.enemy,
            },
        });

        const hero = new Hero(platform, {
            object: container,
            collections,
            movementController: this.movementController,
            animationController: this.animationController,
            triggerHandler,
            dustEmitter: this.dustEmitter,
            podium: podium,
        });
    },

    buildEnemies() {
        this.enemies = [];

        const sceneAsset = App.ThreeAssets["Scene"];
        const anchors = Enumerator.filterObjects(sceneAsset.scene, /ANC_Enemy.*/);

        const asset = App.ThreeAssets["SK_Enemies"];
        const armature = Enumerator.getObjectByName(asset.scene, "Armature");
        if (!armature) throw new Error("Armature not found");

        const idleClip = this.findClip(asset.animations, "A_Idle");
        const runClip = this.findClip(asset.animations, "A_Run");
        const attackClip = this.findClip(asset.animations, "A_Attack");
        const deathClip = this.findClip(asset.animations, "A_Death");

        const halfCount = Math.floor(anchors.length / 2);

        for (let i = 0; i < anchors.length; i++) {
            const container = clone(armature);
            Enumerator.setShadowRecursive(container);

            const materialOrange = new THREE.MeshStandardMaterial({
                color: 0xeb9827,
                roughness: 0.5,
                metalness: 0.1,
                emissive: 0x000000,
                side: THREE.DoubleSide
            });

            const materialRed = new THREE.MeshStandardMaterial({
                color: 0xc22021,
                roughness: 0.5,
                metalness: 0.1,
                emissive: 0x000000,
                side: THREE.DoubleSide
            });

            const selectedMaterial = i < halfCount ? materialOrange : materialRed;

            container.traverse((child) => {
                if (child.isMesh) {
                    child.material = selectedMaterial;
                }
            });

            const movementController = new TargetMovementController(anchors[i].position, {
                acceleration: 8,
                deceleration: 8,
                maximumSpeed: 8,
                distance: THREE.MathUtils.randFloat(0.75, 1.4),
                isActive: true,
            });

            TimeHandler.instance.on(
                TimeHandler.Event.tick,
                movementController.update,
                movementController,
            );

            const platform = new Platform();
            this.scene.add(platform);

            const animationController = new EnemyAnimationController(platform, {
                mixer: new THREE.AnimationMixer(container),
                idleClip,
                runClip,
                attackClip,
                deathClip,
            });

            const triggerHandler = new EnemyTriggerHandler(platform, {
                selfBody: {
                    size: {x: 0.75, y: 1, z: 0.75},
                    collisionGroup: this.collisionGroups.enemy,
                    collisionMask: this.collisionGroups.heroAttackRange,
                },
                attackRangeTrigger: {
                    size: {x: 3, y: 1, z: 3},
                    collisionGroup: this.collisionGroups.enemyAttackRange,
                    collisionMask: this.collisionGroups.hero,
                },
                detectRangeTrigger: {
                    size: {x: 5, y: 1, z: 5},
                    collisionGroup: this.collisionGroups.enemyDetectRange,
                    collisionMask: this.collisionGroups.hero,
                },
            });

            const enemy = new Enemy(platform, {
                object: container,
                movementController,
                animationController,
                triggerHandler,
                material: selectedMaterial,
            });

            enemy.onDeath = () => {
                const sounds = ["S_Damage_0", "S_Damage_1", "S_Damage_2"];
                const randomIndex = Math.floor(Math.random() * sounds.length);
                
                if (window.MraidSDK) MraidSDK.playSound(sounds[randomIndex]);
                else this.playSound(sounds[randomIndex]);
            };

            this.enemies.push(enemy);
        }
    },

    buildFragmentSelector() {
        const scene = App.ThreeAssets["Scene"].scene;
        const anchors = [];

        Enumerator.enumerateObjectsByType(scene, THREE.Object3D, (object) => {
            if (object.name.includes("ANC_Fragment")) anchors.push(object);
        });

        const asset = App.ThreeAssets["SK_Heroes"];
        const clip = asset.animations.find((a) => a.name === "A_Idle");
        const armature = asset.scene.getObjectByName("Armature");
        if (!clip || !armature) throw new Error("Clip or armature not found");

        const fragments = anchors.map((anchor, i) => {
            const name = this.fragmentNames[i];
            if (!name) throw new Error("Name not found");

            const container = new THREE.Group();

            for (const fragmentTypeName of Object.values(FragmentTypeName)) {
                const fragmentName = `SK_${name}_${fragmentTypeName}`;
                const mesh = Enumerator.getObjectByName(asset.scene, fragmentName);
                if (!mesh) throw new Error(`Fragment "${fragmentName}" not found`);

                const bakedMesh = SkinnedMeshBaker.bakeAnimationFrame(
                    armature,
                    mesh,
                    1 / 30,
                    clip,
                );
                bakedMesh.castShadow = true;
                bakedMesh.receiveShadow = true;
                container.add(bakedMesh);
            }

            const collection = new FragmentCollection({
                container,
                name,
                enabled: true,
            });

            const fragment = new Fragment({
                container,
                collection,
            });

            fragment.position.copy(anchor.position);

            return fragment;
        });

        this.fragmentsSelector = new FragmentSelector({
            camera: this.camera,
            scene: this.scene,
            fragments,
            clip,
            isActive: true,
        });

        this.fragmentsSelector.setFragment(FragmentTypeName.body);

        this.hero
            .getComponent(Hero)
            .setFragment("Huggy_Wuggy", FragmentTypeName.body);

        this.fragmentsSelector.on(
            FragmentSelectorEvent.select,
            this.onSelectFragment,
            this,
        );

        for (const fragment of fragments) {
            gsap.to(fragment.rotation, {
                y: 2 * Math.PI,
                duration: 10,
                ease: "none",
                repeat: -1,
            });
        }
    },

    buildControls() {
        this.joystickGesture = new JoystickGesture({
            isActive: false,
            sensitivity: 1,
        });

        this.joystickGesture.on(
            JoystickGestureEvent.change,
            this.onJoystickChanged,
            this,
        );

        this.joystickGesture.on(
            JoystickGestureEvent.release,
            this.onJoystickReleased,
            this,
        );
    },

    showTutorialRun() {
        const infinity = this["T_Infinity"];
        const hand = this["T_HandOnInfinity"];

        infinity.visible = true;
        hand.visible = true;
        const duration = 4;

        gsap.to(hand.position, {
            duration: duration,
            repeat: -1,
            ease: "none",
            motionPath: {
                path: [
                    {x: hand.position.x + -60, y: hand.position.y + -50},
                    {x: hand.position.x + -180, y: hand.position.y + 0}, // Начало левой петли
                    {x: hand.position.x + -60, y: hand.position.y + 60},
                    {x: hand.position.x, y: hand.position.y},   // Пересечение в центре
                    {x: hand.position.x + 60, y: hand.position.y + -60},
                    {x: hand.position.x + 180, y: hand.position.y + 0},  // Конец правой петли
                    {x: hand.position.x + 60, y: hand.position.y + 60},
                    {x: hand.position.x, y: hand.position.y},   // Возврат к центру
                ],
                align: "self",
                autoRotate: true
            }
        });
    },

    hideTutorialRun() {
        const infinity = this["T_Infinity"];
        const hand = this["T_HandOnInfinity"];

        gsap.killTweensOf(hand.position);
        hand.visible = false;
        infinity.visible = false;
    },

    showTutorialBuilder() {
        const hand = this["T_Hand"];
        hand.visible = true;

        gsap.to(hand.position, {
            duration: 2,
            repeat: -1,
            ease: "none",
            motionPath: {
                path: [
                    {x: -180, y: -150}, // Левое синее тело
                    {x: -100, y: -150}, // Левое красное тело (с пауком)
                    {x: 0, y: -150},    // Центральное красное тело
                    {x: 380, y: -150},  // Правое розовое тело
                    {x: 150, y: -300},   // Правое чёрное тело
                    {x: -180, y: -300},
                    {x: -180, y: -250},
                ],
                align: "self",
                autoRotate: true
            }
        });
    },

    hideTutorialBuilder() {
        const hand = this["T_Hand"];
        const choseArmor = this["T_Choose_Armor_Text"];

        gsap.killTweensOf(hand.position);
        hand.visible = false;
        choseArmor.visible = false;
    },

    findClip(animations, name) {
        const clip = animations.find((a) => a.name === name);
        if (!clip) throw new Error(`Animation clip "${name}" not found`);
        return clip;
    },

    onCollectCoin(worldTransform, geometry, material) {
        this.coinCollect.collectCoin();

        if (window.MraidSDK) MraidSDK.playSound("S_Coin");
        else this.playSound("S_Coin");

        const coinMesh = new THREE.Mesh(geometry.clone(), material.clone());
        coinMesh.position.copy(worldTransform.position);
        coinMesh.scale.copy(worldTransform.scale);
        this.scene.add(coinMesh);

        const threshold = 0.5;
        let nearestGroup = null;
        let minDist = Infinity;

        for (const group of this.coinParticleGroups) {
            const dist = group.position.distanceTo(worldTransform.position);
            if (dist < threshold && dist < minDist) {
                minDist = dist;
                nearestGroup = group;
            }
        }

        if (nearestGroup) {
            nearestGroup.traverse(child => {
                if (child.isSprite) {
                    gsap.killTweensOf(child.position);
                    gsap.killTweensOf(child.material);
                    child.material.dispose();
                }
            });
            this.scene.remove(nearestGroup);
            nearestGroup.clear();
            this.coinParticleGroups.splice(this.coinParticleGroups.indexOf(nearestGroup), 1);
        }

        gsap.to(coinMesh.position, {
            y: coinMesh.position.y + 10,
            duration: 2,
            ease: "power2.out",
            onComplete: () => {
                this.scene.remove(coinMesh);
                coinMesh.geometry.dispose();
                coinMesh.material.dispose();
            },
        });

        gsap.to(coinMesh.material, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        });
    },

    onJoystickChanged(direciton) {
        this.movementController.setDirection(
            new THREE.Vector3(direciton.x, 0, direciton.y),);

        this.hideTutorialRun();
    },

    onJoystickReleased() {
        this.movementController.setDirection(new THREE.Vector3(0, 0, 0));
    },

    async onSelectFragment(fragment) {
        if (!this.selectionSequenceID) this.selectionSequenceID = 0;

        if (window.MraidSDK) MraidSDK.playSound("S_Boop");
        else this.playSound("S_Boop");

        const fragmentOrder = [
            FragmentTypeName.body,
            FragmentTypeName.arms,
            FragmentTypeName.legs,
            FragmentTypeName.head,
        ];

        const lastType = fragmentOrder[this.selectionSequenceID];
        const nextType = fragmentOrder[this.selectionSequenceID + 1];

        const heroComponent = this.hero.getComponent(Hero);

        if (lastType === FragmentTypeName.body) {
            heroComponent.removeFragment("Huggy_Wuggy", FragmentTypeName.body);
        }

        this.hideTutorialBuilder();

        switch (lastType) {
            case FragmentTypeName.body: {
                this.animateFragmentMagnetism(fragment, new THREE.Vector3(0, -0.64, -2.6), "body");
                await this.animateOtherFragmentsDisappear(fragment);
                await safeWait(0.1);
                if (window.MraidSDK) MraidSDK.playSound("S_Suit_Apply");
                else this.playSound("S_Suit_Apply");
                this.playReadyEffect(new THREE.Vector3(0, 1.5, 0));
                break;
            }
            case FragmentTypeName.arms: {
                this.animateFragmentMagnetism(fragment, new THREE.Vector3(0, -0.8, -2.6), "arms");
                await this.animateOtherFragmentsDisappear(fragment);
                await safeWait(0.1);
                if (window.MraidSDK) MraidSDK.playSound("S_Suit_Apply");
                else this.playSound("S_Suit_Apply");
                this.playReadyEffect(new THREE.Vector3(0.5, 1.5, 0), Math.PI / 3);
                this.playReadyEffect(new THREE.Vector3(-0.5, 1.5, 0), -Math.PI / 3);
                this.animationController.runShowHand();
                this.animationController.runReadyState();
                break;
            }
            case FragmentTypeName.legs: {
                this.animateFragmentMagnetism(fragment, new THREE.Vector3(-0.01, -1.3, -2.6), "legs");
                await this.animateOtherFragmentsDisappear(fragment);
                await safeWait(0.1);
                if (window.MraidSDK) MraidSDK.playSound("S_Suit_Apply");
                else this.playSound("S_Suit_Apply");
                this.playReadyEffect(new THREE.Vector3(0, 0.8, 0));
                this.animationController.runShowLeg();
                break;
            }
            case FragmentTypeName.head: {
                this.animateFragmentMagnetism(fragment, new THREE.Vector3(0, -0.2, -2.6), "head");
                await this.animateOtherFragmentsDisappear(fragment);
                if (window.MraidSDK) MraidSDK.playSound("S_Suit_Apply");
                else this.playSound("S_Suit_Apply");
                await safeWait(0.1);
                this.playReadyEffect(new THREE.Vector3(0, 1.8, 0));
                break;
            }
        }

        if (lastType) {
            heroComponent.setFragment(fragment.collectionName, lastType);
        }


        await safeWait(0.1);
        if (nextType) {
            this.selectionSequenceID += 1;
            this.fragmentsSelector.setFragment(nextType);
            await safeWait(0.5);
            this.animationController.runMovementState();
            await this.animateVisibleFragmentsAppear();
            await safeWait(0.5);
        } else {
            this.fragmentsSelector.disableAll();
            this.fragmentsSelector.off(
                FragmentSelectorEvent.select,
                this.onSelectFragment,
                this,
            );
            this.onCombiningCompleted();
        }
    },

    async animateOtherFragmentsDisappear(exceptFragment) {
        const fragments = this.fragmentsSelector.getActiveFragments();
        const promises = [];

        for (const frag of fragments) {
            if (frag !== exceptFragment) {
                promises.push(this.animateFragmentDisappearance(frag));
            }
        }

        await Promise.all(promises);
    },

    async animateFragmentDisappearance(object) {
        return new Promise((resolve) => {
            gsap.to(object.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.4,
                ease: "power2.in",
                onComplete: () => {
                    object.visible = false;
                    resolve();
                }
            });
        });
    },

    async animateFragmentAppearance(object) {
        object.visible = true;
        object.scale.set(0, 0, 0);
        return new Promise((resolve) => {
            gsap.to(object.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.5,
                ease: "back.out(1.7)",
                onComplete: resolve,
            });
        });
    },

    async animateVisibleFragmentsAppear() {
        const fragments = this.fragmentsSelector.getActiveFragments();
        const promises = [];

        for (const frag of fragments) {
            frag.scale.set(0, 0, 0);
            promises.push(this.animateFragmentAppearance(frag));
        }

        await Promise.all(promises);
    },

    animateFragmentMagnetism(fragment, targetPosition, type) {
        const originalPosition = new THREE.Vector3(0, 0, 0);
        originalPosition.copy(fragment.position);

        gsap.to(fragment.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: 0.54,
            ease: "power2.in",
            onUpdate: () => {
                fragment.rotation.set(0, 0, 0);
            },
            onComplete: () => {
                fragment.position.copy(originalPosition);
                fragment.scale.set(0, 0, 0);
            }
        });
    },

    async onCombiningCompleted() {
        this.animationController.runReadyState();
        await safeWait(0.4);
        this.playReadyEffect(new THREE.Vector3(this.hero.position.x, this.hero.position.y + 1.5, this.hero.position.x));
        this.playReadyEffect(new THREE.Vector3(this.hero.position.x - 0.5, this.hero.position.y + 2, this.hero.position.x));
        await safeWait(1);
        this.animationController.runMovementState();

        this.movementController.isActive = false;
        this.joystickGesture.isActive = false;
        this.cameraOperator.isActive = false;

        this.showTutorialRun();
        this.openDoorAnimation();
        this.runAnimation();
    },

    runAnimation() {
        const heroPlatform = this.hero;
        const heroObject = heroPlatform.getComponent(Hero);

        const heroPosition = heroPlatform.position.clone();
        const targetPosition = new THREE.Vector3(0, 0, -5);

        const runController = new TargetMovementController(heroPosition, {
            acceleration: 8,
            deceleration: 8,
            maximumSpeed: 4,
            distance: 0.5,
            isActive: true,
        });

        this.cameraOperator.isActive = true;
        this.cameraOperator.elevation = 2;
        this.cameraOperator.distance = 2;
        runController.target.copy(targetPosition);
        heroObject.setMovementController(runController);

        const stopMovementIfArrived = async () => {
            const currentPos = heroPlatform.position;
            if (currentPos.distanceTo(targetPosition) <= 0.5) {
                runController.isActive = false;
                TimeHandler.instance.off(TimeHandler.Event.tick, runController.update, runController);
                heroObject.setMovementController(this.movementController);
                this.movementController.position.copy(targetPosition);
                this.movementController.isActive = true;
                this.joystickGesture.isActive = true;
                this.cameraOperator.isActive = true;
                this.cameraOperator.elevation = 40;
                this.cameraOperator.distance = 8;
                heroObject.isActiveMovement = true;

                this.removeSceneObjectsByName(
                    [
                        "SM_Room_Wall",
                        "SM_Door_Top",
                        "SM_Door_Bottom",
                        "SM_Door_Frame"]);

                TimeHandler.instance.off(TimeHandler.Event.tick, stopMovementIfArrived);
                TimeHandler.instance.on(TimeHandler.Event.tick, this.checkChestProximity, this);

                this.movementController.direction = new THREE.Vector3(0, 0, -5);
                await safeWait(0.1);
                this.movementController.direction = new THREE.Vector3(0, 0, 0);
            }
        };
        TimeHandler.instance.on(TimeHandler.Event.tick, runController.update, runController);
        TimeHandler.instance.on(TimeHandler.Event.tick, stopMovementIfArrived);
    },

    checkChestProximity() {

        const chest = this.scene.getObjectByName("SM_Chest");
        const heroPosition = this.movementController.position;
        const chestPosition = chest.position || chest.getWorldPosition(new THREE.Vector3());

        const distance = heroPosition.distanceTo(chestPosition);

        const triggerDistance = 4;

        if (distance <= triggerDistance) {
            this.onChestProximity();
            TimeHandler.instance.off(TimeHandler.Event.tick, this.checkChestProximity, this);
        }
    },

    async onChestProximity() {
        const heroObject = this.hero.getComponent(Hero);
        this.movementController.isActive = false;
        heroObject.playWin();
        await safeWait(2);
        if (window.MraidSDK)
            MraidSDK.open("end screen button");
        else alert("Click Out: end screen button");

    },

    removeSceneObjectsByName(names) {
        for (const name of names) {
            const obj = this.scene.getObjectByName(name);
            if (obj && obj.parent) {
                obj.parent.remove(obj);
            }
        }
    },

    openDoorAnimation() {
        let doorTop = null;
        let doorBottom = null;

        this.scene.traverse((child) => {
            if (child.name === "SM_Door_Top") {
                doorTop = child;
            } else if (child.name === "SM_Door_Bottom") {
                doorBottom = child;
            }
        });

        doorTop.position.z -= 0.2;
        doorBottom.position.z -= 0.2;
        gsap.killTweensOf(doorTop.position);
        gsap.killTweensOf(doorBottom.position);

        gsap.to(doorTop.position, {
            y: doorTop.position.y + 1.5,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
                this.applyMatrixToDoor(doorTop);
            },
            onComplete: () => {
                this.applyMatrixToDoor(doorTop);
            }
        });

        gsap.to(doorBottom.position, {
            y: doorBottom.position.y - 2,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
                this.applyMatrixToDoor(doorBottom);
            },
            onComplete: () => {
                this.applyMatrixToDoor(doorBottom);
            }
        });
    },

    applyMatrixToDoor(door) {
        door.updateMatrix();
        door.updateMatrixWorld(true);

        if (door.parent) {
            door.parent.updateMatrix();
            door.parent.updateMatrixWorld(true);
        }

        this.scene.updateMatrixWorld(true);
        this.scene.traverse((child) => {
            if (child.isMesh) {
                child.geometry.computeBoundingBox();
                child.geometry.computeBoundingSphere();
                child.frustumCulled = false;
            }
        });
    },

    playReadyEffect(center, tiltX = 0) {
        const texture = App.ThreeAssets["T_Armor_Particle"];
        const count = 10;
        const radius = 0.2;

        const stretchCount = 4;
        const flyCount = count - stretchCount;

        const types = Array(stretchCount).fill("stretch").concat(Array(flyCount).fill("fly"));
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }

        for (let i = 0; i < count; i++) {
            let angle = Math.random() * Math.PI * 2;
            const r = radius * (0.5 + Math.random() * 0.5);

            let x = Math.cos(angle) * r;
            let z = Math.sin(angle) * r;
            let y = x * Math.tan(tiltX);

            x += (Math.random() - 0.5) * 0.04;
            y += (Math.random() - 0.5) * 0.1;
            z += (Math.random() - 0.5) * 0.04;

            x += center.x;
            y += center.y;
            z += center.z;

            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                color: 0xffae00,
                opacity: 0.7,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(x, y, z);

            const startScaleX = 0.07;
            const startScaleY = 0.18;
            sprite.scale.set(startScaleX, startScaleY, 1);

            this.scene.add(sprite);

            const type = types[i];

            if (type === "fly") {
                const targetY = y + 0.13 + Math.random() * 0.12;
                const targetX = x + (Math.random() - 0.5) * 0.04;
                const targetZ = z + (Math.random() - 0.5) * 0.04;
                gsap.to(sprite.position, {
                    x: targetX,
                    y: targetY,
                    z: targetZ,
                    duration: 0.5,
                    ease: "power2.out"
                });
            } else {
                const stretchTargetX = x + (Math.random() - 0.5) * 0.04;
                const stretchTargetZ = z + (Math.random() - 0.5) * 0.04;
                const stretchTargetY = y + (Math.random() - 0.5) * 0.04;

                gsap.to(sprite.scale, {
                    x: startScaleX * (0.4 + Math.random() * 0.18),
                    y: startScaleY * (2.5 + Math.random()),
                    duration: 0.018,
                    ease: "expo.in"
                });
                gsap.to(sprite.position, {
                    x: stretchTargetX,
                    y: stretchTargetY,
                    z: stretchTargetZ,
                    duration: 0.018,
                    ease: "sine.inOut"
                });
            }

            gsap.to(sprite.material, {
                opacity: 0,
                duration: 0.18 + Math.random() * 0.09,
                delay: 0.22 + Math.random() * 0.17,
                onComplete: () => {
                    this.scene.remove(sprite);
                    sprite.material.dispose();
                }
            });
        }
    },
});
