/*
 Это основной файл для написания кода игры. Здесь находится логика геймплея за исключением туториала
 и конечного экрана (их код должен быть написан в Tutorial.js и CallToAction.js соответственно)
*/

import {TimeController} from 'Libs/Toolbox/TimeController';
import Screen from 'Screen';
import {OrigamiPaper} from "Libs/Toolbox/OrigamiOptions";
import Broadcast from "Broadcast";

App.Gameplay = new Screen({

    // Имя этого экрана - оно используется как префикс для событий (менять не нужно)
    Name: 'Gameplay',

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
            name: 'MainContainer',
            scaleStrategyLandscape: ['fit-to-screen', 1920, 1080],
            scaleStrategyPortrait: ['fit-to-screen', 1080, 1920],
            childs: [
                // Вместо твоих двух directional light, сделай так:
                {
                    name: 'main_light',
                    type: 'three-directional-light',
                    color: '#ffffff',
                    intensity: 2,
                },
                {
                    name: 'ambient_light',
                    type: 'three-ambient-light',
                    color: '#ffeedd',
                    intensity: 2,
                },

                {name: 'game container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: []},
                {name: 'paper container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: []},

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
                    name: 'FOLD THE PICTURE.png',
                    type: 'three-image',
                    image: 'FOLD THE PICTURE.png',
                    position: [0, 700, 0],
                },

                {
                    name: 'hand',
                    type: 'three-image',
                    image: 'hand.png',
                    position: [300, -150, 0],
                    scale: 0.5,
                    LTRB: "LB",
                },

                {
                    name: "soundContainer",
                    type: 'three-group',
                    position: [-500, -700],
                    childs: [
                        {
                            name: 'sound-off',
                            type: 'three-image',
                            image: 'sound-off.png',
                            visible: false,
                            event: "sound_off",
                        }, {
                            name: 'sound-on',
                            type: 'three-image',
                            image: 'sound-on.png',
                            event: "sound_on",
                        },
                    ]
                },

                {
                    name: 'CTAGroup.png',
                    type: 'three-group',
                    position: [0, 0, 0],
                    visible: false,
                    scaleStrategy: 'cover-screen',
                    childs: [
                        {
                            name: 'CTAFronts.png',
                            type: 'three-image',
                            image: 'CTAFront.png',

                            event: "CTAFronts.png"
                        },
                        {
                            name: 'CTAbg.png',
                            type: 'three-image',
                            image: 'CTA.png',
                            event: "CTAbg.png"
                        },
                        {
                            name: 'CTAbg2.png',
                            type: 'three-image',
                            image: 'icon-logo.png',
                            scale: 1.2,
                            event: "CTAbg2.png"

                        },

                        {
                            name: 'icon-1.png',
                            type: 'three-image',
                            image: 'icon-1.png',
                            LTRB: "TB",
                            position: [-250, -500],
                            scale: 0.8,
                            renderOrder: 1,
                            event: "icon-1.png"
                        },
                        {
                            name: 'icon-2.png',
                            type: 'three-image',
                            image: 'icon-2.png',
                            LTRB: "TB",
                            position: [250, -500],
                            scale: 0.8,
                            renderOrder: 1,
                            event: "icon-2.png"
                        },
                        {
                            name: 'YOU WIN!.png',
                            type: 'three-image',
                            image: 'YOU WIN!.png',
                            LTRB: "TB",
                            position: [0, -100],
                            renderOrder: 1,
                            event: "YOU WIN!.png"
                        }, {
                            name: 'CHOOSE NEW LEVEL',
                            type: 'three-image',
                            image: 'CHOOSE NEW LEVEL.png',
                            LTRB: "TB",
                            position: [0, -200],
                            renderOrder: 1,
                            event: "CHOOSE NEW LEVEL"
                        },
                        {
                            name: 'hand2',
                            type: 'three-image',
                            image: 'hand.png',
                            position: [300, -500],
                            scale: 0.5,
                            LTRB: "TB",
                            renderOrder: 15,
                        },

                    ]
                },


                {
                    name: 'confetti-1.png',
                    type: 'three-image',
                    image: 'confetti-1.png',
                    visible: false,
                    position: [0, 0],
                    scale: 0.3
                }, {
                    name: 'confetti-2.png',
                    type: 'three-image',
                    image: 'confetti-2.png',
                    visible: false,
                    position: [0, 0],
                    scale: 0.3
                }, {
                    name: 'confetti-3.png',
                    type: 'three-image',
                    image: 'confetti-3.png',
                    visible: false,
                    position: [0, 0],
                    scale: 0.3
                },


            ]
        },
    ],

    // Секция хуков - стандартных обработчив запускаемых на разных стадиях работы экрана (Screen)
    Hooks: {
        // Срабатывает перед созданием спрайтов из секции Containers
        // Здесь можно что-то динамически изменить в Containers если нужно перед их созданием
        beforeBuild() {
            this.camera = App.World.Camera
            this.countFold = 0;
        },

        // Срабатывает сразу после создания спрайтов из секции Containers
        build() {
            this.stopGame = false;
            this._soundEnabled = true;
            this.paperInst = this.createOrigamiModel(this["paper container"]);
            this.camera.position.set(this["paper container"].position.x, 10, this["paper container"].position.z);
            this.camera.lookAt(this["paper container"].position);

            this.animatePulse(this["FOLD THE PICTURE.png"]);
            console.log('UIContainer:', this["UIContainer"]);


            const bgTexture = App.ThreeAssets['bg.png'];
            const planeGeo = new THREE.PlaneGeometry(200, 200);

            bgTexture.wrapS = THREE.RepeatWrapping;
            bgTexture.wrapT = THREE.RepeatWrapping;

// Сколько раз повторять по X и Y (например, 4x4)
            bgTexture.repeat.set(2, 2);

            const mat = new THREE.MeshStandardMaterial({
                map: bgTexture,
                side: THREE.DoubleSide
            });

            const bgMesh = new THREE.Mesh(planeGeo, mat);
            bgMesh.position.set(0, -70, 0);
            bgMesh.rotation.set(-1.6, 0, 0);

            this['game container'].add(bgMesh);

            this.handHint = this['hand'];
            this.handHint.visible = false;

            bgMesh.receiveShadow = true;

            this["main_light"].castShadow = true;
            this["main_light"].shadow.bias = -0.001; // опционально, если нужны мягкие тени
            this["main_light"].shadow.mapSize.width = 2048;
            this["main_light"].shadow.mapSize.height = 2048;

            Broadcast.on("Gameplay sound_on Down", () => {
                this.setSoundEnabled(false);
            }, this);

            Broadcast.on("Gameplay sound_off Down", () => {
                this.setSoundEnabled(true);
            }, this);

            Broadcast.on("Gameplay CTAGroup.png Down", () => {
                if (window.MraidSDK) {
                    MraidSDK.open("end screen button");
                }
                console.log("work")
            }, this);

            Broadcast.on("Gameplay icon-1.png Down", () => {
                if (window.MraidSDK) {
                    MraidSDK.open("end screen button");
                }

            }, this);

            Broadcast.on("Gameplay icon-2.png Down", () => {
                if (window.MraidSDK) {
                    MraidSDK.open("end screen button");
                }
            }, this);

            Broadcast.on("Gameplay CTAbg.png Down", () => {
                if (window.MraidSDK) {
                    MraidSDK.open("end screen button");
                }
            }, this);

            Broadcast.on("Gameplay CTAbg2.png Down", () => {
                if (window.MraidSDK) {
                    MraidSDK.open("end screen button");
                }
            }, this);

            Broadcast.on("Gameplay CTAFronts.png Down", () => {
                if (window.MraidSDK) {
                    MraidSDK.open("end screen button");
                }
            }, this);

            const isLandscape = window.innerWidth > window.innerHeight;

            if(isLandscape) {
                this.foldHints = [
                    {foldName: "folds_2", position: new THREE.Vector3(250, -150, 0)},
                    {foldName: "folds_4", position: new THREE.Vector3(0, -500, 0)},
                    {foldName: "folds_6", position: new THREE.Vector3(-225, -150, 0)},
                    {foldName: "folds_8", position: new THREE.Vector3(0, 200, 0)}
                ];
            }
            else {
                this.foldHints = [
                    {foldName: "folds_2", position: new THREE.Vector3(300, -200, 0)},
                    {foldName: "folds_4", position: new THREE.Vector3(0, -700, 0)},
                    {foldName: "folds_6", position: new THREE.Vector3(-300, -200, 0)},
                    {foldName: "folds_8", position: new THREE.Vector3(0, 200, 0)}
                ];
            }

            this.currentHintStep = 0;
            setTimeout(() => this.updateHandHint(), 1000);
        },


        // Срабатывает на изменение размеров или ориентации экрана
        resize: function () {
            this.resizeSceneBackground();
            const isLandscape = window.innerWidth > window.innerHeight;
            const foldPng = this["FOLD THE PICTURE.png"];

            if(isLandscape) {
                this.foldHints = [
                    {foldName: "folds_2", position: new THREE.Vector3(250, -150, 0)},
                    {foldName: "folds_4", position: new THREE.Vector3(0, -500, 0)},
                    {foldName: "folds_6", position: new THREE.Vector3(-225, -150, 0)},
                    {foldName: "folds_8", position: new THREE.Vector3(0, 200, 0)}
                ];
            }
            else {
                this.foldHints = [
                    {foldName: "folds_2", position: new THREE.Vector3(300, -200, 0)},
                    {foldName: "folds_4", position: new THREE.Vector3(0, -700, 0)},
                    {foldName: "folds_6", position: new THREE.Vector3(-300, -200, 0)},
                    {foldName: "folds_8", position: new THREE.Vector3(0, 200, 0)}
                ];
            }

            const offsetY = isLandscape ? 500 : 700;

            let offsetX = 0;

            if (isLandscape) {
                this.paperInst.model.position.set(0, 3, 0.5)
            } else {
                this.paperInst.model.position.set(0, 0, 1)
            }

            if (isLandscape) {
                const foldPng = this["FOLD THE PICTURE.png"];
                const foldWidth = foldPng.width || (foldPng.getBounds && foldPng.getBounds().width) || 0;
                const foldHeight = foldPng.height || (foldPng.getBounds && foldPng.getBounds().height) || 0;

// Считаем позицию относительно центра сцены:
                const posX = -window.innerWidth / 1.3 + foldWidth / 2;
                const posY = window.innerHeight / 1.3 - foldHeight / 2;

                foldPng.position.set(posX, posY, 0);
            } else {
                // Логика для портретного режима (оставь свою)
                // Например:
                foldPng.position.set(0, 700, 0);
            }
            const sound = this["soundContainer"];


            if (isLandscape) {
                const soundWidth = sound.width || (sound.getBounds && sound.getBounds().width) || 0;
                const soundHeight = sound.height || (sound.getBounds && sound.getBounds().height) || 0;

                // Левый нижний угол:
                const posX = -window.innerWidth / 1.3 + soundWidth / 2 - 220;
                const posY = -window.innerHeight / 1.3 + soundHeight / 2;

                sound.position.set(posX, posY, 0);
            } else {
                // Логика для портретного режима (например, по центру внизу)
                sound.position.set(0, -window.innerHeight / 2 + sound.height / 2, 0);
            }

            if (!isLandscape) {
                const x = -window.innerWidth / 2 - 200;
                const y = -window.innerHeight / 2 - 590;
                sound.position.set(x, y, 0);
            }


            this.paperInst.refreshOriginalTransforms();

            const cta = this["CTAGroup.png"];

            const ratio = window.innerWidth / window.innerHeight;
            const is4by3 = ratio > 0.9 && ratio < 1.1; // 0.05 — допуск, можешь увеличить/уменьшить

            if (is4by3) {
                if (this["CTAbg2.png"]) this["CTAbg2.png"].visible = false;
                if (this["CTAbg.png"]) this["CTAbg.png"].visible = true;
                if (this["CtaFronts.png"]) this["CtaFronts.png"].visible = false;
                if (this["CTAbg.png"]) this["CTAbg.png"].scale.set(0.7, 0.7, 0);
            } else if (isLandscape) {
                if (this["CTAbg2.png"]) this["CTAbg2.png"].visible = false;
                if (this["CtaFronts.png"]) this["CtaFronts.png"].visible = true;
                if (this["CTAbg.png"]) this["CTAbg.png"].visible = false;
            } else {
                if (this["CTAbg2.png"]) this["CTAbg2.png"].visible = false;
                if (this["CtaFronts.png"]) this["CtaFronts.png"].visible = false;
                if (this["CTAbg.png"]) this["CTAbg.png"].visible = true;
                if (this["CTAbg.png"]) this["CTAbg.png"].scale.set(1, 1, 1);
            }


            if (cta) {
                // Список имён дочерних элементов, которые надо сдвигать
                const screenW = window.innerWidth;
                const screenH = window.innerHeight;
                const moving = [
                    "icon-1.png",
                    "icon-2.png",
                    "YOU WIN!.png",
                    "CHOOSE NEW LEVEL",
                    "hand2"
                ];
                // Определи смещение
                const deltaY = screenW / 3;
                const deltaX = isLandscape ? 140 : 0;
                const scale = isLandscape ? 0.9 : 1;

                moving.forEach(name => {
                    const obj = cta.getObjectByName ? cta.getObjectByName(name) : cta[name];
                    if (obj) {
                        if (obj.name === "CTAbg2.png" || obj.name === "CTAbg.png" || obj.name === "CTAFronts.png") {
                            return;
                        }
                        let baseY = 0;
                        let baseX = 0;
                        if (name === "icon-1.png" || name === "icon-2.png" || name === "hand2") baseY = -500;
                        if (name === "YOU WIN!.png") baseY = -100;
                        if (name === "CHOOSE NEW LEVEL") baseY = -200;

                        if (name === "hand2")
                            return;

                        obj.position.x = baseX + deltaX;

                        if (name === "icon-1.png") {
                            obj.position.x = baseX + deltaX - 220;
                        }
                        if (name === "icon-2.png") {
                            obj.position.x = baseX + deltaX + 220;
                        }

                        obj.position.y = baseY + deltaY;

                        if (is4by3) {
                            if (name === "icon-1.png" && obj.scale) {
                                obj.position.x = baseX + deltaX - 180;
                                obj.scale.set(0.7, 0.7, 0.7);
                            }
                            if (name === "icon-2.png" && obj.scale) {
                                obj.position.x = baseX + deltaX + 180;
                                obj.scale.set(0.7, 0.7, 0.7);
                            }

                            if (name === "YOU WIN!.png") {
                                obj.position.y -= 100;

                                obj.scale.set(0.7, 0.7, 0.7);
                            }

                            if (name === "CHOOSE NEW LEVEL") {
                                obj.position.y -= 90;

                                obj.scale.set(0.7, 0.7, 0.7);
                            }
                            obj.position.y -= 70;
                        }

                    }
                });
            }

            // Разрешение близко к 976x732 (±20px допуска)


            const w = window.innerWidth;
            const h = window.innerHeight;
            const ctaFronts = this["CTAFronts.png"];

// Горизонтальный режим:
            const ratio1 = w / h;
            console.log(w)
            console.log(h)
            if (w > 1400 || h > w) {
                ctaFronts.position.x = 0;
            } else if (ratio1 > 1.31 && ratio1 < 1.35) {
                console.log(ratio1)// примерно 4:3 (1.333...)
                console.log(ratio1)// примерно 4:3 (1.333...)
                ctaFronts.position.x = 200;
            } else {
                ctaFronts.position.x = 0;
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
        update() {

            if (this.paperInst.isFail === true) {
                this.paperInst.isFail = false;
                this._playSound("sound-error", false);
                this.shakeCamera();
            }

            if (this.stopGame === true)
                return;

            if (this.paperInst.isWin === true) {
                this.stopGame = true
                this.endScreen(true)
            }

            if (this.countFold >= 7) {
                this.stopGame = true;
                if (window.MraidSDK) MraidSDK.open("end screen button");
            }
        },

        // Срабатывает во время скрытия этого экрана
        hide() {
        }
    },

    // Секция событий - здесь прописываются события нажатия на спрайты из секции Containers, а так же глобальные события серез префикс global:
    // Для того чтобы добавить события клика на спрайт ему нужно в секции Containers прописать events: true,
    // а в этой секции написать 'имя спрайта click' и дальше написать код срабатывающий по нажатию на этот спрайт
    Events: {
        'global:Stage Press Down': function (event, position) {

            if (window.MraidSDK) MraidSDK.interaction();

            const mouse = new THREE.Vector2();
            mouse.x = (position.x / window.innerWidth) * 2 - 1;
            mouse.y = -(position.y / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);

            const meshes = [];
            this.paperInst.model.traverse(obj => {
                if (obj.isMesh) meshes.push(obj);
            });

            if (this.handHint) {
                this.handHint.visible = false;
                if (this.handTween) {
                    gsap.ticker.remove(this.handTween);
                    this.handTween = null;
                }
            }
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = setTimeout(() => {
                if (!this.stopGame) {
                    this.updateHandHint();
                }

            }, 2000);

            const intersects = raycaster.intersectObjects(meshes, true);

            if (this.stopGame === true)
                return;

            if (intersects.length > 0) {
                const target = intersects[0].object;
                if (!target?.name) return;

                const baseName = target.name.replace(/_(front|back|1|2)$/, '');

                console.log('Clicked on:', target.name, '=> Fold name:', baseName);

                if (this.paperInst && typeof this.paperInst.foldByName === 'function') {
                    this.paperInst.foldByName(baseName);
                    this.countFold++;

                    if (baseName === 'folds_2') {
                        this._playSound("S_Rock_1", false);
                    } else if (baseName === 'folds_4') {
                        this._playSound("S_Rock_2", false);
                    } else if (baseName === 'folds_6') {
                        this._playSound("S_Rock_3", false);
                    } else if (baseName === 'folds_8') {
                        this._playSound("S_Rock_4", false);
                    }
                }
            }


        },

        'global:Setting Changed': function (name, value) {
            this.updateSettings(name, value);
        },

        'CTAbg.png click': function () {
            if (window.MraidSDK) {

                MraidSDK.open("end screen button");
            }
        },

        'CTAFronts.png click': function () {
            if (window.MraidSDK) {
                MraidSDK.open("end screen button");
            }
            console.log(this["CTAFronts.png"]);
        },

        'FOLD THE PICTURE.png click': function () {
            alert('Клик по FOLD THE PICTURE!');
        },

        'sound-on click': function () {
            App.Gameplay.setSoundEnabled(false);
        },

        'sound-off click': function () {
            App.Gameplay.setSoundEnabled(true);
        },

        'CHOOSE NEW LEVEL click': function () {
            if (window.MraidSDK) {
                MraidSDK.open("end screen button");
            }
        },

        'icon-1.png click': function () {
            if (window.MraidSDK) {
                MraidSDK.open("end screen button");
            }
        },
        'icon-2.png click': function () {
            if (window.MraidSDK) {
                MraidSDK.open("end screen button");
            }
        },
        'CTAgroup.png click': function () {
            if (window.MraidSDK) {
                MraidSDK.open("end screen button");
            }
        },

    },

    updateHandHint() {
        const doneFolds = this.paperInst.getFoldPaper(); // массив Object3D
        const doneNames = doneFolds.map(obj => obj.name);
        let nextStep = 0;

        for (let i = 0; i < this.foldHints.length; i++) {
            if (!doneNames.includes(this.foldHints[i].foldName)) {
                nextStep = i;
                break;
            }
        }

        this.currentHintStep = nextStep;

        const nextHint = this.foldHints[this.currentHintStep];
        if (nextHint) {
            this.showHandHintForFold(nextHint.foldName, nextHint.position);
        } else {
            if (this.handHint) this.handHint.visible = false;
        }
    },


    // Здесь нужно применить заново все настройки созданные для этого проекта
    // Сменить фон в зависимости от настройки, текстуру героя и т.д.
    // Всё что зависит от настроек переделать заново
    updateSettings(name, value) {
        this.resize();

        this["main_light"].position.set(
            Settings["directional-light-pos-x"],
            Settings["directional-light-pos-y"],
            Settings["directional-light-pos-z"]
        );

        this["ambient_light"].position.set(
            Settings["directional-light-pos-x"],
            Settings["directional-light-pos-y"],
            Settings["directional-light-pos-z"]
        );
    },

    setSoundEnabled(enabled) {
        const soundOn = this["sound-on"];
        const soundOff = this["sound-off"];

        if (!soundOn || !soundOff) return;

        soundOn.visible = enabled;
        soundOff.visible = !enabled;

        // Пример взаимодействия с внешним SDK или глобальной переменной
        if (window.MraidSDK) {
            MraidSDK.setSoundEnabled?.(enabled);
        }


        this._soundEnabled = enabled;
    },

    startGame() {
        if (window.MraidSDK) MraidSDK.track("Game Starts");
    },

    // Этот метод может вызваться из конечного экрана если нужно произвести возврат в игру
    restoreGame() {
    },

    resizeSceneBackground() {

    },

    animatePulse(obj, min = 0.95, max = 1.05, duration = 0.9) {
        let growing = true;
        const origX = obj.scale.x, origY = obj.scale.y;
        let tween;

        function pulse() {
            tween = gsap.to(obj.scale, {
                x: growing ? origX * max : origX * min,
                y: growing ? origY * max : origY * min,
                duration: duration / 2,
                ease: "sine.inOut",
                onComplete: () => {
                    growing = !growing;
                    pulse();
                }
            });
        }

        pulse();
        return () => {
            if (tween) tween.kill();
            obj.scale.x = origX;
            obj.scale.y = origY;
        };
    },

    showHandHintForFold(foldName, position) {
        if (!this.handHint) return;

        const foldObj = this.paperInst.model.getObjectByName(foldName);
        if (!foldObj) return;

        function worldToUiPosition(obj, camera) {
            const worldPosition = obj.getWorldPosition(new THREE.Vector3()).clone();
            worldPosition.project(camera);
            return {
                x: worldPosition.x * (window.innerWidth / 2),
                y: -worldPosition.y * (window.innerHeight / 2)
            };
        }

        let center;
        if (position) {
            center = position.clone ? position.clone() : new THREE.Vector3().copy(position);
        } else {
            const uiPos = worldToUiPosition(foldObj, this.camera);
            center = new THREE.Vector3(uiPos.x, uiPos.y, 0);
        }

        if (this.handHint._circularTween) {
            gsap.ticker.remove(this.handHint._circularTween);
            this.handHint._circularTween = null;
        }

        this.handHint.visible = true;

        const radius = 42;
        let angle = 0;
        const initialX = center.x + Math.cos(angle) * radius;
        const initialY = center.y + Math.sin(angle) * radius;
        this.handHint.position.x = initialX;
        this.handHint.position.y = initialY;

        const speed = 0.1;
        let prevX = initialX;
        let prevY = initialY;
        let handTilt = 0;

        const animate = () => {
            angle += speed;
            const newX = center.x + Math.cos(angle) * radius;
            const newY = center.y + Math.sin(angle) * radius;

            this.handHint.position.x = newX;
            this.handHint.position.y = newY;

            const dx = newX - prevX;
            const targetTilt = dx * 0.7;
            handTilt += (targetTilt - handTilt) * 0.01;

            this.handHint.rotation.z = handTilt;

            prevX = newX;
            prevY = newY;
        };

        this.handHint._circularTween = animate;
        gsap.ticker.add(animate);
    },

    createOrigamiModel(parent) {
        const glb_asset = App.ThreeAssets['folds-model'];
        const model = this.cloneModel(glb_asset.scene.children[0]);
        const textureFront = App.ThreeAssets['front-side.png'];
        const textureBack = App.ThreeAssets['wrong-side.png'];
        const foldGroups = [];


        parent.add(model);

        model.position.set(0, 0, 0.8);
        model.rotation.set(0, Math.PI, 0);

        model.traverse(x => {
            if (x.name.startsWith('folds_')) {
                foldGroups.push(x.name);
            }

            if (x.isMesh) {
                if (x.name.endsWith('1')) {
                    x.material = new THREE.MeshStandardMaterial({
                        map: textureBack,
                    });
                }
                if (x.name.endsWith('2')) {
                    x.material = new THREE.MeshStandardMaterial({
                        map: textureFront,
                    });
                }
            }
        });

        model.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = false;
            }
        });

        const origami = new OrigamiPaper({
            model: model,
            folds: foldGroups,
            parent: parent,
            frontTexture: textureFront,
            backTexture: textureBack,
        });


        return origami;
    },

    endScreen(isWin) {
        if (isWin) {
            this.zoomInCamera(1, {x: 0, y: -1, z: 0});
            this.showConfeti();
            this._playSound("sound-correct", false);
            setTimeout(() => {
                this.showCTA();
            }, 2100);

        } else {

        }
    },

    zoomInCamera(duration = 1, targetOffset = {x: 0, y: 3, z: 5}) {
        if (!this.camera) return;
        // Текущая позиция
        const from = {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z
        };

        const to = {
            x: from.x + (targetOffset.x || 0),
            y: from.y + (targetOffset.y || 0),
            z: from.z - (targetOffset.z || 0)
        };

        gsap.to(this.camera.position, {
            x: to.x,
            y: to.y,
            z: to.z,
            duration,
            ease: "power2.out"
        });
    },

    _playSound(name, loop) {
        if (name === "sound-correct" || name === "sound-error") {
            if (window.MraidSDK) MraidSDK.playSound(name, {loop: loop});
            return;
        }
        if (this._currentSoundName && window.MraidSDK.stopSound) {
            MraidSDK.stopSound(this._currentSoundName);
            this._currentSoundName = null;
        }
        if (window.MraidSDK && this._soundEnabled) {
            MraidSDK.playSound(name, {loop: loop});
            this._currentSoundName = name;
        }
    },

    shakeCamera() {
        if (!this.camera || this._isShakingCamera) return;

        this._isShakingCamera = true;

        const camera = this.camera;
        const origPosition = camera.position.clone();
        let shakeAmount = 0.18;
        let shakes = 0;
        const maxShakes = 10;

        const shake = () => {
            if (shakes >= maxShakes) {
                camera.position.copy(origPosition);
                this._isShakingCamera = false;
                return;
            }
            const x = origPosition.x + (Math.random() - 0.5) * shakeAmount;
            const y = origPosition.y + (Math.random() - 0.5) * shakeAmount;
            const z = origPosition.z + (Math.random() - 0.5) * shakeAmount * 0.7;
            camera.position.set(x, y, z);
            shakes++;
            setTimeout(shake, 16); // 16ms ~ 60fps
        };

        shake();
    },

    animateHandOverIcons() {
        const hand = this["hand2"];
        const icon1 = this["icon-1.png"];
        const icon2 = this["icon-2.png"];

        if (!hand || !icon1 || !icon2) return;
        const iconScaleDefault = icon1.scale.x; // или .y
        const iconScaleHover = iconScaleDefault + 0.1;
        const hoverRadius = 100;


        let lastHandX = hand.position.x; // для вычисления направления

        const checkHover = (handX, handY) => {
            const handPos = new THREE.Vector2(handX, handY);

            [icon1, icon2].forEach(icon => {
                const iconPos = new THREE.Vector2(icon.position.x, icon.position.y);
                const dist = handPos.distanceTo(iconPos);

                if (dist < hoverRadius) {
                    if (!icon._hovered) {
                        icon._hovered = true;
                        gsap.to(icon.scale, {
                            x: iconScaleHover,
                            y: iconScaleHover,
                            duration: 0.3,
                            ease: "back.out(1.7)"
                        });
                    }
                } else {
                    if (icon._hovered) {
                        icon._hovered = false;
                        gsap.to(icon.scale, {
                            x: iconScaleDefault,
                            y: iconScaleDefault,
                            duration: 0.3,
                            ease: "back.in(1.7)"
                        });
                    }
                }
            });

            // ==== Анимация поворота руки ====
            const dx = handX - lastHandX; // смещение по X
            const maxTilt = 0.40; // максимальный наклон в радианах (≈23°)
            let targetRotation = 0;

            // если рука движется вправо — наклон вправо, влево — влево
            if (Math.abs(dx) > 2) { // небольшой порог для фильтрации мелких движений
                targetRotation = Math.max(-maxTilt, Math.min(maxTilt, dx * 0.03)); // подбери коэффициент под свой макет
            }

            // Плавно анимируем к целевому углу
            gsap.to(hand.rotation, {
                z: targetRotation,
                duration: 0.18,
                ease: "sine.out"
            });

            lastHandX = handX;
        };

        const moveToIcon = (targetIcon) => {
            gsap.to(hand.position, {
                x: targetIcon.position.x,
                y: targetIcon.position.y,
                duration: 1,
                ease: "sine.inOut",
                onUpdate: () => {
                    checkHover(hand.position.x, hand.position.y);
                },
                onComplete: () => {
                    // По завершении — чуть вернём наклон к 0 (естественно)
                    gsap.to(hand.rotation, {z: 0, duration: 0.3, ease: "sine.inOut"});

                    setTimeout(() => {
                        moveToIcon(targetIcon === icon1 ? icon2 : icon1);
                    }, 200);
                }
            });
        };

        // Стартуем с icon1
        moveToIcon(icon1);
    },

    showCTA() {

        this.animatePulse(this["YOU WIN!.png"]);
        this.animatePulse(this["CHOOSE NEW LEVEL"]);
        const cta = this["CTAGroup.png"];
        if (cta) {
            cta.visible = true;

            const ratio = window.innerWidth / window.innerHeight;
            const isLandscape = window.innerWidth > window.innerHeight;
            const is4by3 = ratio > 0.95 && ratio < 1.45; // 0.05 — допуск, можешь увеличить/уменьшить

            if (is4by3) {
                if (this["CTAbg2.png"]) this["CTAbg2.png"].visible = false;
                if (this["CTAbg.png"]) this["CTAbg.png"].visible = true;
                if (this["CtaFronts.png"]) this["CtaFronts.png"].visible = false;
                if (this["CTAbg.png"]) this["CTAbg.png"].scale.set(0.7, 0.7, 0);
            } else if (isLandscape) {
                if (this["CTAbg2.png"]) this["CTAbg2.png"].visible = false;
                if (this["CtaFronts.png"]) this["CtaFronts.png"].visible = true;
                if (this["CTAbg.png"]) this["CTAbg.png"].visible = false;
            } else {
                if (this["CTAbg2.png"]) this["CTAbg2.png"].visible = false;
                if (this["CtaFronts.png"]) this["CtaFronts.png"].visible = false;
                if (this["CTAbg.png"]) this["CTAbg.png"].visible = true;
                if (this["CTAbg.png"]) this["CTAbg.png"].scale.set(1, 1, 1);
            }

            // Убедимся, что материал прозрачный


            this.animateHandOverIcons();

            const w = window.innerWidth;
            const h = window.innerHeight;
            const ctaFronts = this["CTAFronts.png"];

// Горизонтальный режим:
            const ratio1 = w / h;
            if (w > 1400 || h > w) {
                ctaFronts.position.x = 0;
            } else if (ratio1 > 1.31 && ratio1 < 1.35) { // примерно 4:3 (1.333...)
                ctaFronts.position.x = 200;
            } else {
                ctaFronts.position.x = 0;
            }
            this.resize();
        }
    },


    showConfeti() {
        const ui = this['UIContainer'];
        if (!ui) return;

        for (let i = 0; i < 100; i++) {
            const base = this[`confetti-${(i % 3) + 1}.png`];
            if (!base) continue;

            const sprite = base.clone();
            sprite.visible = true;
            const scale = 0.3 + Math.random() * 0.3;
            sprite.scale.set(scale, scale, 1);

            const isLeft = i % 2 === 0;
            const startX = isLeft ? -500 : 500;
            const startY = -1000;
            sprite.position.set(startX, startY, 0);

            const color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 60%)`);
            sprite.tint = color;
            sprite.alpha = 0;
            ui.add(sprite);

            const startDelay = Math.random() * 0.7;

            const shootAngle = (Math.random() - 0.5) * (Math.PI / 7);
            const shootSpeed = 1100 + Math.random() * 400;

            const peakX = startX + Math.sin(shootAngle) * shootSpeed;
            const peakY = startY + Math.cos(shootAngle) * shootSpeed + 600;

            const burstAngle = Math.random() * Math.PI * 2;
            const burstSpeed = 700 + Math.random() * 400;

            const endX = peakX + Math.cos(burstAngle) * burstSpeed;
            const endY = peakY - 400 - Math.random() * 300 - 1000;

            const durationUp = 0.3 + Math.random() * 0.1;
            const durationDown = 0.7 + Math.random() * 0.2;

            gsap.to(sprite, {
                alpha: 1,
                duration: 0.2,
                delay: startDelay,
                ease: 'linear'
            });

            gsap.to(sprite.position, {
                x: peakX,
                y: peakY,
                duration: durationUp,
                delay: startDelay,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(sprite.position, {
                        x: endX,
                        y: endY,
                        duration: durationDown,
                        ease: 'power1.in',
                        onComplete: () => {
                            sprite.visible = false;
                            ui.remove(sprite);
                            // Освобождаем анимации
                            gsap.killTweensOf(sprite);
                            gsap.killTweensOf(sprite.position);
                            gsap.killTweensOf(sprite.rotation);
                            // Можно добавить полный destroy, если поддерживается:
                            if (sprite.dispose) sprite.dispose();
                        }
                    });
                }
            });

            gsap.to(sprite.rotation, {
                z: (Math.random() - 0.5) * Math.PI * 8,
                duration: durationUp + durationDown,
                delay: startDelay,
                ease: 'linear'
            });
        }
    },
});