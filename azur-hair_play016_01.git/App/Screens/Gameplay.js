/*
 Это основной файл для написания кода игры. Здесь находится логика геймплея за исключением туториала
 и конечного экрана (их код должен быть написан в Tutorial.js и CallToAction.js соответственно)
*/

import {TimeController} from 'Libs/Toolbox/TimeController';
import Screen from 'Screen';
import {DecalGeometry} from 'three/examples/jsm/geometries/DecalGeometry.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {AnimatedModelController} from "Libs/AnimatedModelController";
import {BeardController} from "BeardController";
import {RazorTool} from 'RazorTool';
import * as THREE from 'three';
import {Enumerator, SceneProcessor, SkinnedMeshBaker, Sun} from "three-zoo";
import Broadcast from "Broadcast";

App.Gameplay = new Screen({

    raycaster: new THREE.Raycaster(),
    ndc: new THREE.Vector2(),
    followTool: false,
    skinHoverOffset: 0.006,
    // Имя этого экрана - оно используется как префикс для событий (менять не нужно)
    Name: 'Gameplay',

    cutSounds: ['och', 'y-ct-m', "it-hrts"],
    idleSounds: ['wlldn', 'grt'],
    isShaving: false,

    idleGapSec: 2,
    idleSoundCooldownSec: 3,

    lastCutAt: 0,
    nextIdleSoundAt: 0,
    cutSoundCooldownSec: 0.25, // 250 мс между звуками реза
    lastCutSoundAt: 0,


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
        {
            raycaster: new THREE.Raycaster(),
            ndc: new THREE.Vector2(),
            followTool: false,
            skinHoverOffset: 0.006,

            // ← добавь сюда:
            lastToolPos: new THREE.Vector3(),
            lastToolTime: 0,
            toolSpeed: 0,
            woundCooldown: 0,

            SCRATCH_MAT: null,
            SCRATCH_TEX: null,

            name: 'MainContainer',
            scaleStrategyLandscape: ['fit-to-screen', 1920, 1080],
            scaleStrategyPortrait: ['fit-to-screen', 1080, 1920],
            childs: [
                {name: 'game container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: []},
                {name: 'light_ambient', type: 'three-ambient-light', color: '#ffffff'},
                {name: 'fx_container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: []},
            ]
        },

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
            name: 'UIContainer', type: 'three-ui', childs: [
                {
                    SHAVE_LAYER: 2,     // слой для запечённой головы (raycast)
                    RENDER_LAYER: 0,    // обычный рендер-слой камеры

                    name: 'brush-blue',
                    position: [0, 800],
                    LTRB: "B",
                    childs: [
                        {
                            name: 'shave-blue',
                            type: 'three-image',
                            image: 'shave-blue',
                            position: [-300, 0],

                        },
                        {
                            name: 'shave-white',
                            type: 'three-image',
                            image: 'shave-white',
                            position: [-300, 0],
                            visible: false,
                        },
                        {
                            name: 'brush-blue1',
                            type: 'three-image',
                            image: 'brush-blue',
                            position: [-100, 0],

                        },
                        {
                            name: 'brush-white',
                            type: 'three-image',
                            image: 'brush-white',
                            position: [-100, 0],

                        },
                        {
                            name: 'shower-white 2',
                            type: 'three-image',
                            image: 'shower-white 2',
                            position: [100, 0],

                        }, {
                            name: 'dryer-white 2',
                            type: 'three-image',
                            image: 'dryer-white 2',
                            position: [300, 0],

                        },
                    ],

                },


                {
                    name: 'refs',
                    position: [-400, 500],
                    LTRB: "TR",
                    childs: [
                        {
                            name: 'ref_1',
                            type: 'three-image',
                            image: 'ref_1',
                            position: [0, 0],

                        }, {
                            name: 'ref_2',
                            type: 'three-image',
                            image: 'ref_2',
                            position: [0, 0],

                        },
                    ],
                },

                {
                    name: 'drag',
                    position: [0, -700],
                    childs: [
                        {
                            name: 'drag 1',
                            type: 'three-image',
                            image: 'drag 1',
                            position: [0, 0],

                        }, {
                            name: 'hand 1',
                            type: 'three-image',
                            image: 'hand 4',
                            position: [50, -100],

                        }, {
                            name: 'Drag2',
                            type: 'three-image',
                            image: 'Drag',
                            position: [0, 60],

                        },
                    ],
                },
                {
                    name: 'done',
                    position: [0, -700],
                    childs: [
                        {
                            name: 'button 2',
                            type: 'three-image',
                            image: 'button 2',
                            position: [0, 0],
                            event: "Done"

                        }, {
                            name: 'Done1',
                            type: 'three-image',
                            image: 'Done',
                            position: [0, 10],

                        }, {
                            name: 'hand 2',
                            type: 'three-image',
                            image: 'hand 4',
                            position: [250, -60],

                        },
                    ],
                },
                {
                    name: 'choose color BG',
                    type: 'three-image',
                    position: [0, -980],
                    image: 'podlozka',
                    scale: [2, 2, 1],
                },

                {
                    name: 'choose color',
                    position: [0, -700],
                    childs: [
                        {
                            name: 'line',
                            type: 'three-image',
                            image: 'line',
                            position: [0, 300],
                            scale: [1., 1, 1],

                        }, {
                            name: 'blue_white 1',
                            type: 'three-image',
                            image: 'blue_white 1',
                            position: [0, 0],
                            event: "blue_white"

                        }, {
                            name: 'purple 1',
                            type: 'three-image',
                            image: 'purple 1',
                            position: [-350, 0],
                            event: "purple"

                        }, {
                            name: 'red 1',
                            type: 'three-image',
                            image: 'red 1',
                            position: [350, 0],
                            event: "red"
                        },
                        {
                            name: 'choose-color 2',
                            type: 'three-image',
                            image: 'choose-color 2',
                            position: [0, 300],
                            child: []
                        },
                        {
                            name: 'Choose color 7',
                            type: 'three-image',
                            image: 'Choose color',
                            position: [0, 300],

                        },
                        {
                            name: 'hand 3',
                            type: 'three-image',
                            image: 'hand 4',
                            position: [75, -100],

                        },
                    ],
                }
            ]
        },


    ],

    // Секция хуков - стандартных обработчив запускаемых на разных стадиях работы экрана (Screen)
    Hooks: {
        // Срабатывает перед созданием спрайтов из секции Containers
        // Здесь можно что-то динамически изменить в Containers если нужно перед их созданием
        beforeBuild() {
            this.updateChildParamsByName(Settings[this.Name]);
            this.isBackgroundMusicPlaying = false;
        },

        // Срабатывает сразу после создания спрайтов из секции Containers
        build() {
            this.resize();
            this.endRaze = false;
            this.lastScratchPoint = null;
            this.lastScratchNormal = null;
            this.scratchSpacing = 0.006;

            this.pullActive = false;
            this.pullStartPoint = null;
            this.pullStartNormal = null;
            this.pullStartTime = 0;

            this.pulseDone();


            this.isZoomed = false;
            this["choose color"].visible = false;
            this["choose color BG"].visible = false;
            this["done"].visible = false;
            this['ref_1'].visible = false;
            this['ref_2'].visible = false;
            this['shave-blue'].visible = true;
            this['shave-white'].visible = false;
            this['drag'].visible = false;
            App.World.Renderer.setClearColor("#ffffff", 1);
            this.bounceHand("hand 2");
            this.bounceHand("hand 3");
            this.bounceHandInfinity("hand 1");

            Broadcast.on(
                "Gameplay Done Down",
                () => {
                    this.NextSetp = true;
                    if (window.MraidSDK) MraidSDK.playSound("click");

                    this['ref_1'].visible = false;
                    this['ref_2'].visible = true;
                    this["done"].visible = false;
                    this["brush-blue1"].visible = true;
                    this["brush-white"].visible = false;
                    this['shave-blue'].visible = false;
                    this['shave-white'].visible = true;
                    this.razorRoot.visible = false;
                    this.endRaze = true;
                    this._cutPlayedThisFrame = false;

                    this.manClone.traverse(x => {

                        if (x.name === "kist001") {
                            x.visible = true;
                        }

                        if (x.name.includes("ruchka")) {
                            x.visible = true;
                        }

                        if (x.name.includes("kraska")) {
                            x.visible = true;
                            x.visible = true;
                        }
                    });

                    this.zoomToPoint(0.05, 0.5, 0.2, new THREE.Vector3(this.manClone.position.x + 0.01,
                        this.manClone.position.y + 0.49,
                        this.manClone.position.z));

                    this["choose color"].visible = true;
                    this["choose color BG"].visible = true;
                },
                this,
            );
            Broadcast.on(
                "Gameplay blue_white Down",
                () => {
                    if (this.endGame === true) {
                        if (window.MraidSDK) MraidSDK.open("end screen button");
                        return;
                    }
                    this.endGame = true;
                    if (window.MraidSDK) {
                        MraidSDK.playSound("canRoll");
                    }
                },
                this,
            );
            Broadcast.on(
                "Gameplay purple Down",
                () => {
                    if (this.endGame === true) {
                        if (window.MraidSDK) MraidSDK.open("end screen button");
                        return;
                    }
                    this.endGame = true;
                    if (window.MraidSDK) {
                        MraidSDK.playSound("canRoll");
                    }
                },
                this,
            );
            Broadcast.on(
                "Gameplay red Down",
                () => {
                    if (this.endGame === true) {
                        if (window.MraidSDK) MraidSDK.open("end screen button");
                        return;
                    }
                    this.endGame = true;
                    if (window.MraidSDK) {
                        MraidSDK.playSound("canRoll");
                    }
                    this.razorRoot.visible = false;
                },
                this,
            );


        },


        // Срабатывает на изменение размеров или ориентации экрана
        resize() {
            this.resizeSceneBackground();
            if (App.IsLandscape) {

                const w = window.innerWidth;
                const h = window.innerHeight;
                const ar = w / h;

                this["done"].position.set(0, -400, 0)
                this["drag"].position.set(0, -400, 0)

                this["refs"].position.set(-700, 150, 0);

                this["brush-blue"].position.set(0, 800 - (w / 1.2 - h / 1.35), 0);


                this["choose color BG"].position.set(0, -840, 0)
                this["choose color"].position.set(0, -550, 0)

                this["choose color"].traverse(x => {
                    if (x.name === "blue_white 1") {
                        x.scale.set(0.7, 0.7);
                        x.position.y = 120;
                    }

                    if (x.name === "purple 1") {
                        x.scale.set(0.7, 0.7);
                        x.position.y = 120;
                    }

                    if (x.name === "red 1") {
                        x.scale.set(0.7, 0.7);
                        x.position.y = 120;
                    }
                    if (x.name === "choose-color 2") {
                        x.scale.set(0.8, 0.8);

                    }

                    if (x.name === "hand 3") {
                        x.position.y = 250;
                        x.position.x = -59;
                        x.rotation.set(0, 0, Math.PI);
                        this.bounceHand(x.name)

                    }
                });
                this["done"].scale.set(0.8, 0.8, 0.8)
                this.camera.fov = 52;

            } else {
                this["refs"].position.set(-400, 500, 0);
                this["brush-blue"].position.set(0, 800, 0);
                this["drag"].position.set(0, -700, 0)
                this["done"].position.set(0, -700, 0)

                this["choose color BG"].position.set(0, -980, 0)
                this["choose color"].position.set(0, -700, 0)

                this["done"].scale.set(0.8, 0.8, 0.8)

                this["choose color"].traverse(x => {
                    if (x.name === "blue_white 1") {
                        x.scale.set(1, 1);
                        x.position.y = 0;
                    }

                    if (x.name === "purple 1") {
                        x.scale.set(1, 1);
                        x.position.y = 0;
                    }

                    if (x.name === "red 1") {
                        x.scale.set(1, 1);
                        x.position.y = 0;
                    }

                    if (x.name === "choose-color 2") {
                        x.scale.set(1, 1);
                    }

                    if (x.name === "hand 3") {
                        x.position.y = -100;
                        x.position.x = 50;
                        x.rotation.set(0, 0, 0);
                        this.bounceHand(x.name)
                    }

                });
                this.camera.fov = 57;
            }


        },

        // Срабатывает во время показа экрана (есть ещё и hided - срабатывает во время скрытия экрана)
        show() {

            this.spawnScene();
            this.spawnMan();
            this.spawnTools();
            this.lastTime = performance.now();
            this.timeScale = 1;


            this.toolSpeed = 0;        // ← число
            this.woundCooldown = 0;       // ← число (сек)
            this.lastToolTime = 0;        // ← число (сек)
            this.lastToolPos = null;
            this.startGame();
            this.initScratches(this['game container'], 'scratch_texture');

            this.dirLight = new THREE.DirectionalLight(Settings["directional-light-color"], Settings['directional-light-intensity']); // цвет бежевый, интенсивность 3
            this["game container"].add(this.dirLight);

            this.dirLight.position.set(-0.441, 1.866, 2.781);

            App.World.Renderer.shadowMap.enabled = true;

            App.World.Renderer.shadowMap.needsUpdate = true;

            App.World.Renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            App.World.Renderer.localClippingEnabled = true;

            App.World.Renderer.sortObjects = true;

            this.dirLight.shadow.bias = -0.0001;
            this.dirLight.shadow.normalBias = 0.005;

            this.dirLight.castShadow = true;
            this.dirLight.shadow.radius = 0;

            this.dirLight.target.position.set(
                this.manClone.position.x,
                this.manClone.position.y + 0.5,
                this.manClone.position.z
            );

            this.dirLight.position.set(
                Settings["directional-light-pos-x"],
                Settings["directional-light-pos-y"],
                Settings["directional-light-pos-z"]
            );
            this["light_ambient"].position.set(
                Settings["ambient-light-pos-x"],
                Settings["ambient-light-pos-y"],
                Settings["ambient-light-pos-z"]
            );
            this.dirLight.color.set(Settings["directional-light-color"]);

            this['light_ambient'].color.set(Settings["ambient-light-color"]);
            this['light_ambient'].intensity = Settings["ambient-light-intensity"];

            this.manClone.traverse(o => {
                if (o.isMesh) {
                    o.material.roughness = Settings["roughnessMan"];
                    o.material.metalness = Settings["metalnessMan"];
                }
            });

            this.sceneClone.traverse(o => {
                if (o.isMesh) {
                    o.material.roughness = Settings["roughnessScene"];
                    o.material.metalness = Settings["metalnessScene"];
                }
            });

            this.manClone.traverse(o => {
                if (o.isMesh || o.isSkinnedMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
            });

            this.sceneClone.traverse(o => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
            });

            this.toolsClone.traverse(o => {
                if (o.isMesh) o.castShadow = true;
            });


            this.updateSettings();
            this.resize();
        },


        // Срабатывает на каждый тик / каждую перерисовку экрана
        // Тут лучше ничего не писать, так как этот код срабатывает 60 раз в секунду или больше в зависимости от системы пользователя
        // Любой код расположенный здесь будет снижать производительность
        update() {

            if (this.animationController) {
                const t = performance.now();
                this.rawDeltaTime = (t - this.lastTime) / 1000;
                this.lastTime = t;
                this.animationController.update(this.rawDeltaTime * this.timeScale);
            }

            if (this.razor) {
                this.razor.update();
            }

            if (this.isZoomed === true && this.followTool === true && this.camera && this.sceneClone) {
                if (!this.zoomBaseCamPos) this.zoomBaseCamPos = this.camera.position.clone();

                const bladeX = (this.razorRoot ? this.razorRoot.position.x : 0) * 15;

                const pivot = new THREE.Vector3(
                    this.sceneClone.position.x + 0.01,
                    this.sceneClone.position.y + 0.50,
                    this.sceneClone.position.z
                );

                const radius = 0.2;
                const baseAngle = 0;
                const maxAngle = Math.PI / 4;
                const angle = baseAngle + bladeX * maxAngle;

                const targetX = pivot.x + Math.sin(angle) * radius;
                const targetZ = pivot.z + Math.cos(angle) * radius;

                if (this.camera && this.camera.position) {
                    this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
                    this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
                    this.camera.lookAt(pivot);
                }

                if (this.beardController && this.beardController.getHairCount() <= 35) {
                    this["done"].visible = true;
                    this['drag'].visible = false;
                }
            } else {
                this.zoomBaseCamPos = null;
            }
            if (this.beardController.getHairCount() > 40) {
                if (this.isShaving) {
                    const now = performance.now() * 0.001;
                    if (now - this.lastCutAt >= this.idleGapSec && now >= this.nextIdleSoundAt) {
                        this.onNoCut();
                    }
                }
            }

            // если нужно, чтобы baked следовал idle/любой анимации
            if (this.__idleBake && this.shaveSurface) {
                // 0 — не пересчитывать нормали; 10 — пересчитывать раз в 10 кадров
                this.updateBakedHeadPerFrame(0);
            }


            this._cutPlayedThisFrame = false;
        },

        // Срабатывает во время скрытия этого экрана
        hide() {
        },


    },

    // Секция событий - здесь прописываются события нажатия на спрайты из секции Containers, а так же глобальные события серез префикс global:
    // Для того чтобы добавить события клика на спрайт ему нужно в секции Containers прописать events: true,
    // а в этой секции написать 'имя спрайта click' и дальше написать код срабатывающий по нажатию на этот спрайт
    Events: {
        'global:Stage Press Down': function (_event, position) {
            if (window.MraidSDK) MraidSDK.interaction();
            if (!this.isBackgroundMusicPlaying) {
                this.isBackgroundMusicPlaying = true;
                if (window.MraidSDK) MraidSDK.playSound("bg");
                else this.playSound("sound-bg");
            }

            const hit = this.pickHit(position);
            if (!hit) return;

            let n = new THREE.Vector3(0, 1, 0);
            if (hit.face) n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
            const hover = this.skinHoverOffset || 0.006;
            const targetPosY = hit.point.clone().addScaledVector(n, hover).y;
            if (targetPosY < 0.45 || targetPosY > 0.49) return;




            if (this.endGame === true) {
                if (window.MraidSDK) MraidSDK.open("end screen button");
                return;
            }

            if (this.endRaze === true)
                return;

            if (this.NextSetp) return;
            if (!this.isStartGame) return;
            this.firstType = true;

            this.followTool = true;
            this.stickRazorToHit(hit);
            this.lastHit = hit;
            this.startPull(hit);
            this.razor.start();
            this.startShaveTimer();

            this.razorRoot.visible = true;
        },

        'global:Stage Press Move': function (_event, position) {
            if (this.endGame === true) return;
            const hit = this.pickHit(position);
            if (!hit) return;

            if (!this.isStartGame) return;
            if (this.endRaze === true)
                return;


            // проверяем МИРОВОЙ Y до движения
            let n = new THREE.Vector3(0, 1, 0);
            if (hit.face) n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
            const hover = this.skinHoverOffset || 0.006;
            const targetPosY = hit.point.clone().addScaledVector(n, hover).y;
            if (targetPosY < 0.45 || targetPosY > 0.49) return;

            if (this.firstType === false)
                return;

            this.stickRazorToHit(hit);

            this.isMoving = true;
            this.lastHit = hit;

            if (this.updatePull(hit)) {
                this.followTool = false;
                this.pullActive = false;
                this.tryPlaceScratch(hit);
            }

        },

        'global:Stage Move': function (_event, position) {
            if (!this.followTool) return;
            const hit = this.pickHit(position);
            if (!hit) return;
            if (!this.isStartGame) return;
            if (this.endRaze === true)
                return;
            if (this.firstType === false)
                return;


            if (hit.object.name === "nakidka") {
                return;
            }
            let n = new THREE.Vector3(0, 1, 0);
            if (hit.face) n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
            const hover = this.skinHoverOffset || 0.006;
            const targetPosY = hit.point.clone().addScaledVector(n, hover).y;
            if (targetPosY < 0.45 || targetPosY > 0.49) return;

            if (this.updatePull(hit)) {
                this.followTool = false;
                this.pullActive = false;
                this.tryPlaceScratch(hit);
            }
        },


        'global:Stage Press Up': function () {
            this.followTool = false;
            if (this.razor && this.razor.stop) this.razor.stop();
            this.stopShaveTimer();


            if (this.endRaze === true)
                return;

            // Бритва "отлетает" от кожи
            if (this.lastHit) {
                const hoverOffset = 0.01; // насколько далеко отлетает
                const normalW = new THREE.Vector3(0.01, 0, 0);


                const target = this.razorRoot.position.clone().addScaledVector(normalW, hoverOffset);

                gsap.to(this.razorRoot.position, {
                    duration: 0.5,
                    x: target.x,
                    y: target.y,
                    z: target.z,
                    ease: "power2.out"
                });
            }
        },
    },

    startPull(hit) {
        this.pullActive = false;
        this.pullStartPoint = hit.point.clone();
        this.pullStartNormal = hit.face
            ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize()
            : new THREE.Vector3(0, 1, 0);
        this.pullStartTime = performance.now() * 0.001;
        this.lastScratchPoint = null; // сброс линии
        this.lastScratchNormal = null;
    },

    // Универсальный запуск звука из имени/массива имён
    playSoundFromArray(arrOrName) {
        if (!arrOrName) return;
        const name = Array.isArray(arrOrName)
            ? arrOrName[Math.floor(Math.random() * arrOrName.length)]
            : arrOrName;
        if (!name) return;

        if (window.MraidSDK && typeof MraidSDK.playSound === 'function') {
            MraidSDK.playSound(name);           // имя = ключ звука в SDK
        } else if (this.playSound) {
            this.playSound(name);               // твой локальный фолбэк (если нужен)
        }
    },

    onCut(sounds = this.cutSounds) {
        const now = performance.now() * 0.001;

        // обновляем «активность», чтобы idle-звук не срабатывал
        this.lastCutAt = now;
        this.nextIdleSoundAt = now + this.idleGapSec;

        // ← кулдаун на звуки реза
        if (now - (this.lastCutSoundAt || 0) < (this.cutSoundCooldownSec || 0)) return;
        this.lastCutSoundAt = now;

        if (this._cutPlayedThisFrame) return;
        this._cutPlayedThisFrame = true;

        this.playSoundFromArray(sounds);
    },

    onNoCut(sounds = this.idleSounds) {
        const now = performance.now() * 0.001;
        this.playSoundFromArray(sounds);

        this.nextIdleSoundAt = now + this.idleSoundCooldownSec;
    },


    updateSettings() {
        this.manClone.traverse(x => {
            if (x.name.includes("Mesh010")) {
                if (x.isMesh) {
                    x.material.color.set(Settings["Face-color"])
                }

            }

            if (x.name.includes("nakidka")) {
                if (x.isMesh) {
                    x.material.color.set(Settings["Cape-color"])
                }
            }

        })
        this.manClone.traverse(o => {
            if (o.isMesh) {
                o.material.roughness = Settings["roughnessMan"];
                o.material.metalness = Settings["metalnessMan"];
            }
        });

        this.sceneClone.traverse(o => {
            if (o.isMesh) {
                o.material.roughness = Settings["roughnessScene"];
                o.material.metalness = Settings["metalnessScene"];
            }
        });

        this["light_ambient"].position.set(
            Settings["ambient-light-pos-x"],
            Settings["ambient-light-pos-y"],
            Settings["ambient-light-pos-z"]
        );

        this['light_ambient'].color.set(Settings["ambient-light-color"]);
        this['light_ambient'].intensity = Settings["ambient-light-intensity"];

    },

    startShaveTimer() {
        const now = performance.now() * 0.001;
        this.isShaving = true;
        this.lastCutAt = now;                    // отсчёт «тишины» с момента касания
        this.nextIdleSoundAt = now + this.idleGapSec;
    },

    stopShaveTimer() {
        this.isShaving = false;
        this.nextIdleSoundAt = Number.POSITIVE_INFINITY;
    },

    updatePull(hit) {
        if (!this.pullStartPoint) return false;


        const now = performance.now() * 0.001;
        const dt = Math.max(1e-4, now - this.pullStartTime);

        // вектор от старта до текущей точки
        const d = hit.point.clone().sub(this.pullStartPoint);
        // убираем компонент вдоль нормали (оставляем движение "по коже")
        const tang = d.addScaledVector(this.pullStartNormal, -d.dot(this.pullStartNormal));
        const dist = tang.length();
        const speed = dist / dt;

        // Пороги «рывка» (подбирай под сцену)
        const PULL_DIST = 0.015; // на сколько оторвались от старта в мире (м)
        const PULL_TIME = 0.20;  // в течение какого времени должен случиться рывок (с)
        const PULL_SPEED = 0.25;  // минимальная скорость по поверхности (м/с)

        if (!this.pullActive) {

            if ((dist >= PULL_DIST && dt <= PULL_TIME) || speed >= PULL_SPEED) {
                this.pullActive = true;
                this.lastScratchPoint = null; // начнем линию заново
            }
        } else {
            // опционально — выключать при замедлении/возврате к старту
            const OFF_SPEED = 0.12;
            const OFF_DIST = 0.5 * PULL_DIST;
            if (speed < OFF_SPEED && dist < OFF_DIST) {
                this.pullActive = false;
                this.lastScratchPoint = null;
            }
        }
        return this.pullActive;
    },

    clampRazorTarget(pos) {
        const axis = this.RAZOR_LIMIT_AXIS || 'z';
        const min = this.RAZOR_MIN ?? 4.8;
        const max = this.RAZOR_MAX ?? 5.1;

        if (axis === 'x') pos.x = THREE.MathUtils.clamp(pos.x, min, max);
        else if (axis === 'y') pos.y = THREE.MathUtils.clamp(pos.y, min, max);
        else pos.z = THREE.MathUtils.clamp(pos.z, min, max);

        return pos;
    },

    initScratches(root) {

        this.SCRATCH_TEX = App.ThreeAssets["scratch_texture"];
        this.SCRATCH_TEX.anisotropy = 4;

        this.SCRATCH_MAT = new THREE.MeshPhongMaterial({
            map: this.SCRATCH_TEX,
            color: new THREE.Color(Settings["Scratches-color"]),
            transparent: true,
            depthTest: true,
            depthWrite: false,     // не пишем в глубину, чтобы не мерцало
            polygonOffset: true,
            polygonOffsetFactor: -4
        });

        root.__scratchContainer = new THREE.Group();
        root.add(root.__scratchContainer);
    },

    addScratchAtHit(root, hit, opts = {}) {
        if (!this.SCRATCH_MAT || !this.SCRATCH_TEX) return;
        let n = new THREE.Vector3(0, 1, 0);
        const hover = this.skinHoverOffset || 0.006;
        const targetPosY = hit.point.clone().addScaledVector(n, hover).y;
        if (targetPosY < 0.468 || targetPosY > 0.49) return;
        if (!hit || !hit.object) return;
        if (hit.object.visible === false) {
            return; // не меш — выходим
        }

        const minLen = 0.01;
        const maxLen = 0.02;
        const minWid = 0.002;
        const maxWid = 0.003;
        const opacity = opts.opacity ?? 1.0;
        const randomRot = opts.randomRot ?? true;
        const fadeOutSec = opts.fadeOutSec ?? 0;

        const len = THREE.MathUtils.randFloat(minLen, maxLen);
        const wid = THREE.MathUtils.randFloat(minWid, maxWid);
        const depth = len;

        const size = new THREE.Vector3(len, wid, depth);

        // используем заданную ориентацию (для линий), иначе — случайный поворот
        const rot = opts.orientation
            ? opts.orientation
            : new THREE.Euler(0, 0, (randomRot ? THREE.MathUtils.randFloat(0, Math.PI) : 0));

        // --- целевой меш + бейк для SkinnedMesh ---
        let targetMesh = hit.object;
        let bakedTemp = null;

        if (targetMesh.isSkinnedMesh) {
            try {
                bakedTemp = this.makeBakedStaticMeshFromSkinned(targetMesh);
                targetMesh = bakedTemp;
            } catch (e) {
                console.warn('[scratch] bake failed:', e);
                return;
            }
        } else {
            targetMesh.updateMatrixWorld(true);
        }

        // --- строим декаль ---
        let geom = new DecalGeometry(targetMesh, hit.point.clone(), rot, size);

        // если пусто — пробуем увеличить размер (мелкие штрихи часто «промахиваются»)
        let ok = geom?.attributes?.position?.count > 0;
        if (!ok) {
            const bigger = size.clone().multiplyScalar(1.8);
            const geom2 = new DecalGeometry(targetMesh, hit.point.clone(), rot, bigger);
            ok = geom2?.attributes?.position?.count > 0;
            if (!ok) {
                if (bakedTemp) bakedTemp.geometry.dispose();
                return;
            }
            geom.dispose();
            geom = geom2;
        }

        const mat = this.SCRATCH_MAT.clone();
        mat.opacity = opacity;

        const decal = new THREE.Mesh(geom, mat);
        decal.renderOrder = 2;
        decal.frustumCulled = false;

        const parent = root.__scratchContainer || root;
        parent.add(decal);

        if (bakedTemp) bakedTemp.geometry.dispose();

        if (fadeOutSec > 0) {
            if (typeof gsap !== 'undefined') {
                gsap.to(mat, {
                    opacity: 0,
                    duration: fadeOutSec,
                    delay: 0.8,
                    onComplete: () => {
                        geom.dispose();
                        mat.map = null;
                        mat.dispose();
                        parent.remove(decal);
                    }
                });
            } else {
                setTimeout(() => {
                    geom.dispose();
                    mat.map = null;
                    mat.dispose();
                    parent.remove(decal);
                }, (0.8 + fadeOutSec) * 1000);
            }
        }
    },


    // В utils или прямо рядом:
    makeBakedStaticMeshFromSkinned(skinned) {
        skinned.updateWorldMatrix(true, false);
        if (skinned.skeleton) skinned.skeleton.update();

        const srcGeo = skinned.geometry;
        const geo = srcGeo.index ? srcGeo.toNonIndexed() : srcGeo.clone();

        const pos = geo.getAttribute('position');
        const skinIndex = geo.getAttribute('skinIndex');
        const skinWeight = geo.getAttribute('skinWeight');
        if (!skinIndex || !skinWeight) throw new Error('geometry has no skinIndex/skinWeight');

        const skeleton = skinned.skeleton;
        const boneMatrices = skeleton.boneMatrices;        // Float32Array
        const boneMatrix = new THREE.Matrix4();

        const bindMatrix = skinned.bindMatrix;
        const bindMatrixInverse = skinned.bindMatrixInverse;

        const out = new Float32Array(pos.count * 3);

        const base = new THREE.Vector3();
        const tmp = new THREE.Vector3();
        const sum = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            // v в пространстве bindMatrix
            base.fromBufferAttribute(pos, i).applyMatrix4(bindMatrix);

            sum.set(0, 0, 0);

            // 4 влияющих кости
            for (let k = 0; k < 4; k++) {
                const idx =
                    k === 0 ? skinIndex.getX(i) :
                        k === 1 ? skinIndex.getY(i) :
                            k === 2 ? skinIndex.getZ(i) :
                                skinIndex.getW(i);

                const w =
                    k === 0 ? skinWeight.getX(i) :
                        k === 1 ? skinWeight.getY(i) :
                            k === 2 ? skinWeight.getZ(i) :
                                skinWeight.getW(i);

                if (w > 0) {
                    boneMatrix.fromArray(boneMatrices, idx * 16);
                    tmp.copy(base).applyMatrix4(boneMatrix);
                    sum.addScaledVector(tmp, w);
                }
            }

            // обратно из bind-пространства и в мир
            sum.applyMatrix4(bindMatrixInverse).applyMatrix4(skinned.matrixWorld);

            out[i * 3 + 0] = sum.x;
            out[i * 3 + 1] = sum.y;
            out[i * 3 + 2] = sum.z;
        }

        const bakedGeo = new THREE.BufferGeometry();
        bakedGeo.setAttribute('position', new THREE.BufferAttribute(out, 3));
        if (geo.getAttribute('uv')) bakedGeo.setAttribute('uv', geo.getAttribute('uv').clone());
        bakedGeo.computeVertexNormals();

        const bakedMesh = new THREE.Mesh(bakedGeo, new THREE.MeshBasicMaterial());
        bakedMesh.matrixAutoUpdate = false;
        bakedMesh.updateMatrixWorld(true);
        return bakedMesh;
    },

    startGame() {
        this.camera = App.World.Camera
        if (window.MraidSDK) MraidSDK.track("Game Starts");
        this.camera.position.set(0.4, 0.35, 1);
        this.camera.lookAt(new THREE.Vector3(this.sceneClone.position.x, this.sceneClone.position.y + 0.35, this.sceneClone.position.z));
        const now = performance.now() * 0.001;
        this.lastCutAt = now;                          // стартовое значение
        this.nextIdleSoundAt = now + this.idleGapSec;
    },

    restoreGame() {
    },

    resizeSceneBackground() {

    },


    spawnScene() {
        const sceneGLB = App.ThreeAssets["Scene"];

        this.sceneClone = sceneGLB.scene.clone();
        this['game container'].add(this.sceneClone);


        this.sceneClone.traverse(x => {
            if (x.name === "blade") {
                x.visible = false;
            }

            if (x.name === "Cube") {
                x.visible = false;

            }

            if (x.name === "kist001") {
                x.visible = false;
            }
        });

    },

    bounceHandInfinity(name) {
        const hand = this[name];
        if (!hand) return;

        gsap.killTweensOf(hand); // убить старую анимацию

        const baseX = hand.position.x;
        const baseY = hand.position.y;
        const radius = 100;   // размер "восьмерки"
        const speed = 2;     // скорость (чем меньше число, тем быстрее)

        gsap.to({t: 0}, {
            t: Math.PI * 2,
            duration: speed,
            repeat: -1,
            ease: "linear",
            onUpdate: function () {
                const t = this.targets()[0].t;

                // формула восьмерки (лемниската Бернулли)
                const x = radius * Math.sin(t);
                const y = radius * Math.sin(t) * Math.cos(t);

                hand.position.x = baseX + x;
                hand.position.y = baseY + y;
            }
        });
    },

    spawnMan() {
        const manGLB = App.ThreeAssets["pers-na-stule"];


        this.manClone = SkeletonUtils.clone(manGLB.scene);
        this['game container'].add(this.manClone);


        const rootMan = this.manClone;

        const clips = manGLB.animations || [];

        this.manClone.traverse(x => {
            if (x.name === "blade") {
                x.visible = false;
            }

            if (x.name === "kist001") {
                x.visible = false;
            }

            if (x.name.includes("ruchka")) {
                x.visible = false;
            }

            if (x.name.includes("kraska")) {
                x.visible = false;
            }

            if (x.name === "Cube") {
                x.visible = false;

            }

            this.faceTargets = [];
            this.manClone.traverse((o) => {
                const isMesh = o.isMesh || o.isSkinnedMesh;
                if (!isMesh) return;
                const n = (o.name || '');

                if (/face|head|Mesh010/i.test(n) || o.userData?.isFace) {
                    this.faceTargets.push(o);
                }
            });
            if (this.faceTargets.length === 0) this.faceTargets = [this.manClone];


        });

        const retarget = (clip, fromPrefix, toPrefix) => {
            const tracks = clip.tracks.map(t => {
                const nt = t.clone();
                nt.name = nt.name.replace(fromPrefix, toPrefix);
                return nt;
            });
            return new THREE.AnimationClip(clip.name, clip.duration, tracks);
        };

        const fixedClips = clips.map(c => {
            const needsFix = c.tracks.length && c.tracks[0].name.includes('root_man.001/');
            return needsFix ? retarget(c, 'root_man.001/', 'root_man/') : c;
        });

        this.animationController = new AnimatedModelController(rootMan, fixedClips);

        const base = fixedClips[0];

        this.animationController.setBaseClip(base);

        const FPS = 24;
        this.animationController.createAnimationSegment('idle', 0, 10, 24, fixedClips[3]);
        this.animationController.createAnimationSegment('greeting', 0, 80, 24, fixedClips[0]);

        this.idleClipFull = fixedClips[3];

        setTimeout(() => {
            const action = this.animationController.playAnimation('greeting', {
                loop: THREE.LoopOnce,
                clampWhenFinished: true,
                forceRestart: true,
            });

            action.timeScale = 1.4;
        }, 100)


        setTimeout(() => {
            this.zoomToPoint(0.05, 0.5, 0.2, new THREE.Vector3(this.manClone.position.x + 0.01,
                this.manClone.position.y + 0.5,
                this.manClone.position.z));

            this.playIdleWithPause();
            setTimeout(() => {
                this.isStartGame = true;
                this['drag'].visible = true;
                this['ref_1'].visible = true;
                this['ref_2'].visible = false;
                this.prepareBakedHead();
            }, 1000);
        }, 1500);
        this.beardController = new BeardController(this.manClone);
    },

    bakeIdleSnapshot(tSec = 0.0) {
        if (!this.manClone || !this.idleClipFull) return;

        // временный миксер, чтобы выставить позу на tSec
        const mixer = new THREE.AnimationMixer(this.manClone);
        const action = mixer.clipAction(this.idleClipFull);
        action.reset().play();
        action.paused = true;
        const dur = this.idleClipFull.duration || 1;
        action.time = ((tSec % dur) + dur) % dur; // безопасный модуль
        mixer.update(0); // применить позу в кости

        // запечь текущую позу головы
        this.prepareBakedHead();

        // подчистить
        mixer.stopAllAction();
        mixer.uncacheRoot(this.manClone);
    },

    pulseDone() {
        const done = this["done"];
        if (!done) return;

        gsap.killTweensOf(done.scale);

        gsap.to(done.scale, {
            x: 0.9,
            y: 0.9,
            duration: 0.8,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
    },

    prepareBakedHead({ followIdle = true } = {}) {
        if (!this.manClone) return;

        // 1) найти голову (skinned)
        let headSkinned = null;
        this.manClone.traverse(o => { if (!headSkinned && o.isSkinnedMesh && o.name === 'Mesh010') headSkinned = o; });
        if (!headSkinned) { console.warn('[bake] Mesh010 not found'); return; }

        headSkinned.updateWorldMatrix(true, false);
        headSkinned.skeleton?.update();

        // 2) создаём запечённый узел (можешь оставить three-zoo, но геометрию заменим)
        const baked = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
        baked.name = 'Mesh010_Baked';
        baked.layers.set(this.SHAVE_LAYER);

        // ставим baked в ту же локаль, что и исходная голова
        const parent = headSkinned.parent || this.manClone;
        parent.updateWorldMatrix(true, false);
        baked.applyMatrix4(headSkinned.matrixWorld);
        baked.applyMatrix4(new THREE.Matrix4().copy(parent.matrixWorld).invert());
        parent.add(baked);
        baked.castShadow = baked.receiveShadow = false;

        // 3) подготовим геометрию под онлайн-апдейт (non-indexed)
        const srcGeo = headSkinned.geometry.index ? headSkinned.geometry.toNonIndexed() : headSkinned.geometry;
        const vcount = srcGeo.attributes.position.count;

        const bakedGeo = new THREE.BufferGeometry();
        bakedGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vcount * 3), 3));
        if (srcGeo.getAttribute('uv')) bakedGeo.setAttribute('uv', srcGeo.getAttribute('uv').clone());
        bakedGeo.computeVertexNormals(); // первичная нормаль (потом можно не считать каждый кадр)
        baked.geometry = bakedGeo;

        // 4) сохранить ссылки и кеши для быстрого апдейта
        this.shaveSurface = baked;
        this.__idleBake = {
            skinned: headSkinned,
            baked: baked,
            parentInv: new THREE.Matrix4().copy(parent.matrixWorld).invert(),
            posSrc: srcGeo.getAttribute('position'),
            skinIndex: srcGeo.getAttribute('skinIndex'),
            skinWeight: srcGeo.getAttribute('skinWeight'),
            posDst: bakedGeo.getAttribute('position'),
            bindMatrix: headSkinned.bindMatrix.clone(),
            bindMatrixInverse: headSkinned.bindMatrixInverse.clone(),
            tmpBase: new THREE.Vector3(),
            tmp: new THREE.Vector3(),
            sum: new THREE.Vector3(),
            boneMatrix: new THREE.Matrix4(),
        };

        baked.material = new THREE.MeshBasicMaterial({
            colorWrite: false,
            depthWrite: false,
            transparent: true,
            opacity: 0
        });


        this.updateBakedHeadPerFrame();

    },

    updateBakedHeadPerFrame(recomputeNormalsEveryN = 0) {
        const ctx = this.__idleBake;
        if (!ctx) return;

        const {
            skinned, baked, parentInv,
            posSrc, skinIndex, skinWeight, posDst,
            bindMatrix, bindMatrixInverse,
            tmpBase, tmp, sum, boneMatrix
        } = ctx;

        skinned.updateWorldMatrix(true, false);
        if (skinned.skeleton) skinned.skeleton.update();

        const boneMatrices = skinned.skeleton.boneMatrices;
        const dst = posDst.array;
        const count = posSrc.count;

        for (let i = 0; i < count; i++) {
            // v в пространстве bindMatrix
            tmpBase.fromBufferAttribute(posSrc, i).applyMatrix4(bindMatrix);
            sum.set(0, 0, 0);

            // 4 влияющих кости
            const idx0 = skinIndex.getX(i), w0 = skinWeight.getX(i);
            const idx1 = skinIndex.getY(i), w1 = skinWeight.getY(i);
            const idx2 = skinIndex.getZ(i), w2 = skinWeight.getZ(i);
            const idx3 = skinIndex.getW(i), w3 = skinWeight.getW(i);

            if (w0 > 0) { boneMatrix.fromArray(boneMatrices, idx0 * 16); tmp.copy(tmpBase).applyMatrix4(boneMatrix); sum.addScaledVector(tmp, w0); }
            if (w1 > 0) { boneMatrix.fromArray(boneMatrices, idx1 * 16); tmp.copy(tmpBase).applyMatrix4(boneMatrix); sum.addScaledVector(tmp, w1); }
            if (w2 > 0) { boneMatrix.fromArray(boneMatrices, idx2 * 16); tmp.copy(tmpBase).applyMatrix4(boneMatrix); sum.addScaledVector(tmp, w2); }
            if (w3 > 0) { boneMatrix.fromArray(boneMatrices, idx3 * 16); tmp.copy(tmpBase).applyMatrix4(boneMatrix); sum.addScaledVector(tmp, w3); }

            // из bind-пространства → локаль родителя головы
            sum.applyMatrix4(bindMatrixInverse).applyMatrix4(skinned.matrixWorld).applyMatrix4(parentInv);

            const o = i * 3;
            dst[o] = sum.x; dst[o + 1] = sum.y; dst[o + 2] = sum.z;
        }

        posDst.needsUpdate = true;

        // (опц) иногда пересчитывать нормали (дорого)
        if (recomputeNormalsEveryN > 0) {
            this.__idleNormalsTick = (this.__idleNormalsTick || 0) + 1;
            if (this.__idleNormalsTick % recomputeNormalsEveryN === 0) {
                baked.geometry.computeVertexNormals();
                baked.geometry.normalizeNormals();
            }
        }

        // baked трансформ не меняем — он уже в локали родителя
        baked.updateMatrixWorld(true);
    },

    debugLogMesh(mesh) {
        if (!mesh) return console.warn('[debug] mesh not found');
        mesh.updateWorldMatrix(true, false);

        // Мировой bbox и центр
        const bbox = new THREE.Box3().setFromObject(mesh);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());

        console.log('[debug] mesh:', mesh.name);
        console.log('[debug] world center:', center);
        console.log('[debug] bbox size:', size);

        // Поставим маленькую сферу в центр, чтобы увидеть точку
        const s = new THREE.Mesh(
            new THREE.SphereGeometry(0.005),
            new THREE.MeshBasicMaterial({wireframe:false})
        );
        s.position.copy(center);
        this['game container'].add(s);

        // Обрисуем bbox
        const helper = new THREE.Box3Helper(bbox, 0xff00ff);
        this['game container'].add(helper);

        // Оси локальные – прямо на меш
        const axes = new THREE.AxesHelper(0.05);
        mesh.add(axes);

        // Обновлялка bbox, если надо анимировать кадры
        helper.update = () => {
            bbox.setFromObject(mesh);
            helper.box.copy(bbox);
            helper.updateMatrixWorld(true);
        };
    },


    tryPlaceScratch(hit) {
        const tiny = {
            minLen: 0.004, maxLen: 0.007,
            minWid: 0.0007, maxWid: 0.0012,
            opacity: 0.95,
            randomRot: false,
            fadeOutSec: 0
        };

        if (hit.object.name !== "Mesh010") {
            return;
        }

        const isShaveTarget =
            (hit.object === this.shaveSurface) ||
            /^(Mesh010|Mesh010_Baked)$/i.test(hit.object?.name || '');

        if (!isShaveTarget) return;
        const p = hit.point.clone();
        let placedAny = false; // <-- добавили

        if (!this.lastScratchPoint) {
            const normalW = hit.face
                ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize()
                : new THREE.Vector3(0, 1, 0);
            const tangentW = new THREE.Vector3(1, 0, 0).projectOnPlane(normalW).normalize();

            tiny.orientation = this.orientationFromNormalAndTangent(normalW, tangentW);
            this.addScratchAtHit(this['game container'], hit, tiny);
            placedAny = true; // <-- положили штрих

            this.lastScratchPoint = p;
            this.lastScratchNormal = normalW;

            if (placedAny) this.onCut();
            return;
        }

        const dist = p.distanceTo(this.lastScratchPoint);
        if (dist < this.scratchSpacing) return;

        const dir = p.clone().sub(this.lastScratchPoint);
        const normalW = hit.face
            ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize()
            : (this.lastScratchNormal || new THREE.Vector3(0, 1, 0));

        const tangentW = dir.clone().addScaledVector(normalW, -dir.dot(normalW)).normalize();
        if (tangentW.lengthSq() < 1e-8) return;

        tiny.orientation = this.orientationFromNormalAndTangent(normalW, tangentW);

        const steps = Math.max(1, Math.floor(dist / this.scratchSpacing));
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const interp = this.lastScratchPoint.clone().lerp(p, t);
            const fakeHit = {...hit, point: interp};
            this.addScratchAtHit(this['game container'], fakeHit, tiny);
            placedAny = true; // <-- хотя бы один штрих положили
        }

        this.lastScratchPoint = p;
        this.lastScratchNormal = normalW;
    },

    orientationFromNormalAndTangent(normalW, tangentW) {
        const z = normalW.clone().normalize();                 // ось проекции декали
        let x = tangentW.clone();
        // проекция на плоскость, перпендикулярную нормали
        x.addScaledVector(z, -x.dot(z)).normalize();
        if (x.lengthSq() < 1e-8) { // запасной вариант
            x.set(1, 0, 0).addScaledVector(z, -z.dot(new THREE.Vector3(1, 0, 0))).normalize();
        }
        const y = new THREE.Vector3().crossVectors(z, x).normalize();

        const m = new THREE.Matrix4().makeBasis(x, y, z);
        const q = new THREE.Quaternion().setFromRotationMatrix(m);
        return new THREE.Euler().setFromQuaternion(q);
    },

    playIdleWithPause() {
        const duration = 2; // сколько секунд проигрывать
        const pause = 1;    // сколько секунд заморозки

        const playCycle = () => {
            // включаем анимацию
            this.animationController.playAnimation('idle', {
                loop: THREE.LoopOnce,

                onFinish: () => {
                    // ждем паузу, потом снова запускаем
                    setTimeout(playCycle, pause * 4000);
                }
            });

            // остановим её через duration секунд
            setTimeout(() => {
                if (this.animationController.currentAction) {
                    this.animationController.currentAction.paused = true; // заморозить
                }
            }, duration * 1000);
        };

        playCycle();
    },

    spawnTools() {
        const toolsGLB = App.ThreeAssets["britva-i-kict"];

        this.toolsClone = toolsGLB.scene.clone(true);
        this["game container"].add(this.toolsClone);

        this.toolsClone.traverse((x) => {
            if (x.name === "Cube") x.visible = false;
            else x.visible = true;
        });

        // ----- Бритва -----
        const blade = this.toolsClone.getObjectByName("blade");
        blade.geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        blade.geometry.boundingBox.getCenter(center);
        blade.geometry.translate(-center.x, -center.y, -center.z);
        blade.position.set(0, 0.5, 0);
        blade.scale.set(0.7, 0.7, 0.7);

        this.razor = new RazorTool(this.toolsClone, this.beardController, {
            bladeName: "blade",
            thickness: 0.012,
            maxCutsPerFrame: 12,
            active: false,
        });

        this.razorRoot = blade;
        this.razorRoot.visible = false;

        // ===== КИСТОЧКА =====
        // Пытаемся найти по нескольким вариантам имени
        let brush = this.toolsClone.getObjectByName("kist001")
            || this.toolsClone.getObjectByName("kist")
            || this.toolsClone.getObjectByName("brush");

        console.log(brush)

        if (!brush) {
            // запасной поиск по подстроке
            this.toolsClone.traverse(o => {
                if (!brush && o.name && /kist|brush/i.test(o.name)) brush = o;
            });
        }

        this.brushRoot = brush || null;

        if (this.brushRoot) {
            // нормализуем pivot (как делали для blade), если есть геометрия
            if (this.brushRoot.geometry && this.brushRoot.geometry.computeBoundingBox) {
                this.brushRoot.geometry.computeBoundingBox();
                const c = new THREE.Vector3();
                this.brushRoot.geometry.boundingBox.getCenter(c);
                this.brushRoot.geometry.translate(-c.x, -c.y, -c.z);
            }

            // стартовая поза/масштаб — подправь при необходимости
            this.brushRoot.position.set(-0.15, 0.48, 0.28);
            this.brushRoot.scale.set(0.7, 0.7, 0.7);

            // по умолчанию спрятана до нажатия Done
            this.brushRoot.visible = false;
        } else {
            console.warn('[Gameplay] Brush not found in tools GLB');
        }
    },

    bounceHand(name) {
        const hand = this[name];
        if (!hand) return;


        const baseY = hand.position.y;
        gsap.killTweensOf(hand.position);


        gsap.to(hand.position, {
            y: baseY - 30,
            duration: 0.6,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
    },

    // Предположим, что у вас есть THREE в скоупе
// Один раз в конструкторе/инициализации:

    zoomToPoint(x, y, z, lookAtPoint = null, duration = 1.8) {
        if (!this.camera) return;

        this.isZoomed = false;

        const ease = "power3.inOut";
        const targetPos = {x, y, z};

        gsap.killTweensOf(this.camera.position);

        const camPos = this.camera.position.clone();
        const forward = this.camera.getWorldDirection(new THREE.Vector3());

        const startTarget = lookAtPoint
            ? camPos.clone().add(forward.multiplyScalar(camPos.distanceTo(new THREE.Vector3(x, y, z)) || 1))
            : camPos.clone().add(forward.multiplyScalar(1));

        const lookProxy = {x: startTarget.x, y: startTarget.y, z: startTarget.z};
        const finalLook = lookAtPoint
            ? {x: lookAtPoint.x, y: lookAtPoint.y, z: lookAtPoint.z}
            : null;

        const tl = gsap.timeline({
            defaults: {ease, overwrite: "auto"},
            onUpdate: () => {
                if (finalLook) {
                    this.camera.lookAt(lookProxy.x, lookProxy.y, lookProxy.z);
                } else {
                    const fwd = this.camera.getWorldDirection(new THREE.Vector3());
                    const ahead = this.camera.position.clone().addScaledVector(fwd, 1);
                    this.camera.lookAt(ahead);
                }
            },
            onComplete: () => {
                if (finalLook) {
                    this.zoomBaseCamPos = this.camera.position.clone();
                    this.isZoomed = true;
                }
                this.isStartGame = true;
            }
        });

        // Параллельно двигаем позицию камеры
        tl.to(this.camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration
        }, 0);

        // И (если надо) — синхронно твинем точку взгляда к целевой
        if (finalLook) {
            tl.to(lookProxy, {
                x: finalLook.x,
                y: finalLook.y,
                z: finalLook.z,
                duration
            }, 0);
        }
    },


    screenRayFromPosition(position, el) {
        const canvas =
            document.querySelector('canvas');

        const rect = canvas.getBoundingClientRect();
        const x = (position.x - rect.left) / rect.width;
        const y = (position.y - rect.top) / rect.height;

        this.ndc.x = x * 2 - 1;
        this.ndc.y = -(y * 2 - 1);
        this.raycaster.setFromCamera(this.ndc, this.camera);
        return this.raycaster.ray;
    },

    pickHit(position) {
        this.screenRayFromPosition(position);

        const prevMask = this.raycaster.layers.mask;
        if (typeof this.SHAVE_LAYER === 'number') {
            this.raycaster.layers.enable(this.SHAVE_LAYER);
        }

        if (this.manClone) {
            const hits = this.raycaster.intersectObject(this.manClone, true);

            this.raycaster.layers.mask = prevMask;

            if (this.shaveSurface) {

                const idx = hits.find(h => h === "Mesh010_Baked");
                console.log(idx)
                if (idx >= 0) {
                    return hits[idx];
                }
            }

            hits.forEach(h => console.log(h.object.name, h.distance));
            return hits.length ? hits[0] : null;
        }

        // вернуть маску обратно (на всякий случай)
        this.raycaster.layers.mask = prevMask;
        return null;
    },

    stickRazorToHit(hit) {
        if (!this.razorRoot || !hit) return;

        // 1. Нормаль
        let normalW = new THREE.Vector3(0, 1, 0);
        if (hit.face) {
            normalW = hit.face.normal.clone()
                .transformDirection(hit.object.matrixWorld)
                .normalize();
        }

        const hover = this.skinHoverOffset || 0.006;
        const targetPos = hit.point.clone().addScaledVector(normalW, hover);

        // 3. Поворот
        const lookAtTarget = targetPos.clone().add(normalW);
        const dummy = new THREE.Object3D();
        dummy.position.copy(this.razorRoot.position);
        dummy.lookAt(lookAtTarget);
        const rotateLeft = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 3);
        dummy.quaternion.multiply(rotateLeft);

        // 4. Позиция
        gsap.to(this.razorRoot.position, {
            duration: 0.2,
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            ease: "power2.out"
        });

        // 5. Кватернион
        const startQuat = this.razorRoot.quaternion.clone();
        const endQuat = dummy.quaternion.clone();
        const razor = this.razorRoot;

        gsap.to({t: 0}, {
            t: 1,
            duration: 0.2,
            ease: "power2.out",
            onUpdate: function () {
                razor.quaternion.copy(startQuat).slerp(endQuat, this.targets()[0].t);
            }
        });
    },
});