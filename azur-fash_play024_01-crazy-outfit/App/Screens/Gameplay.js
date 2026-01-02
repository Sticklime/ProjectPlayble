import gsap from 'gsap';
import Screen from 'Screen';
import {OrbitControls, Reflector} from 'three/examples/jsm/Addons.js';
import {AnimatedModelController} from '../Libs/Character';
import * as SimpleParticleSystem from "../Libs/SimpleParticleSystem/index";
import {Vector3} from "three";
import ThreeText from "ThreeText";

App.Gameplay = new Screen({

    Name: 'Gameplay',

    Containers: [
        {
            name: 'MainContainer',
            scaleStrategyLandscape: ['fit-to-screen', 1920, 1080],
            scaleStrategyPortrait: ['fit-to-screen', 1080, 1920],
            childs: [
                {name: 'light_ambient', type: 'three-ambient-light', color: '#ffffff'},
                {name: 'light_directional', type: 'three-directional-light', color: '#ffffff', position: [1, 5, -5]},

                {
                    name: 'world', childs: [
                        {name: 'girl'},
                        {name: 'enemy'},
                        {name: 'spawn hands 1', position: [0, 0, 0]},
                        {name: 'spawn hands 2', position: [0, 0, 0]}
                    ]
                },

                {name: 'fx_container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: []},
            ]
        },

        {
            name: 'UIContainer', type: 'three-ui', childs: [

                {},
                {
                    name: 'choice progress cont',
                    position: [-17, 2000],
                    LTRB: "TR",
                    childs: [
                        {name: 'top panel cont', type: 'three-image', image: 'top-banner', LTRB: "TR"},
                        {
                            name: 'choice progress bg',
                            type: 'three-image',
                            image: 'progress-bg-for-clothes',
                            position: [0, -200],
                            rotation: [0, 0, Math.PI / 2],
                        },
                        {
                            name: 'choice progress line',
                            type: 'three-image',
                            image: 'progress-line-for-clothes',
                            position: [0, -200],
                            rotation: [0, 0, Math.PI / 2],
                        },

                        {
                            name: 'smail-bar-1',
                            type: 'three-image',
                            image: 'smail-bar-1',
                            position: [-85, -200],
                        },
                        {
                            name: 'smail-bar-2',
                            type: 'three-image',
                            image: 'smail-bar-2',
                            position: [80, -200],
                        },
                        {
                            name: 'smail-bar-3',
                            type: 'three-image',
                            image: 'smail-bar-3',
                            position: [240, -200],
                        },
                    ]
                },

                {
                    name: 'cloth panel cont', childs: [
                        {name: 'cloth panel', type: 'three-image', image: "cloth-panel"},
                        {
                            name: 'progress cont', position: [0, 125], childs: [
                                {name: 'progress bg', type: 'three-image', image: 'progress-bg'},
                                {name: 'progress line', type: 'three-image', image: 'progress-line'}
                            ]
                        },
                        {
                            name: 'button 1',
                            cloth: 0,
                            position: [-250, -25],
                            type: 'three-image',
                            image: 'cloth-button',
                            childs: [
                                {scale: 2.5, type: 'three-image', image: "cloth-button-correct"},
                                {name: 'icon 1'}
                            ]
                        },
                        {
                            name: 'button 2',
                            cloth: 1,
                            position: [0, -25],
                            type: 'three-image',
                            image: 'cloth-button',
                            childs: [
                                {scale: 2.5, type: 'three-image', image: "cloth-button-correct"},
                                {name: 'icon 2'}
                            ]
                        },
                        {
                            name: 'button 3',
                            cloth: 2,
                            position: [250, -25],
                            type: 'three-image',
                            image: 'cloth-button',
                            childs: [
                                {scale: 2.5, type: 'three-image', image: "cloth-button-correct"},
                                {name: 'icon 3'}
                            ]
                        }
                    ]
                },

                {
                    name: 'text effect', childs: [
                        {type: 'three-image', image: "text-reason-1"},
                        {type: 'three-image', image: "text-reason-1V2"},
                        {type: 'three-image', image: "text-reason-1V3"},
                        {type: 'three-image', image: "text-reason-2"},
                        {type: 'three-image', image: "text-reason-3"},
                        {type: 'three-image', image: "text-reason-4"}
                    ]
                },

                {
                    name: 'top cta panel cont', childs: [
                        {anchor: [0, 0], type: 'three-image', image: "cta-win-top"},
                        {anchor: [0, 0], type: 'three-image', image: "cta-fail-top"}
                    ]
                },

                {name: 'crazyLook', scale: [2.2, 2.2], position: [0, -750]},

                {
                    name: 'buttons cta cont', childs: [
                        {type: 'three-image', image: "button-next-level", event: 'next_level'},
                        {type: 'three-image', image: "button-try-again", event: 'next_level'},
                    ]
                },

                {name: 'star plashka cont'},

                {name: 'arrows cont'},

                {name: 'text title'},

                {name: 'left bottom corner'},
                {name: 'right bottom corner'},

                {
                    name: 'hand cont', childs: [
                        {name: 'hand', anchor: [0.039, 0.027], type: 'three-image', image: 'hand-tutorial'}
                    ]
                }
            ]
        },
    ],

    Hooks: {
        beforeBuild() {

            this.updateChildParamsByName(Settings[this.Name]);

            this.choiceProgress = 0;

            for (const key in App.ThreeAssets) {
                const object = App.ThreeAssets[key];
                if (!object.image) continue;

                object.minFilter = THREE.LinearMipmapLinearFilter;
                object.colorSpace = THREE.SRGBColorSpace;
            }

            App.World.Renderer.shadowMap.enabled = true;

            App.World.Renderer.shadowMap.needsUpdate = true;

            App.World.Renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            App.World.Renderer.localClippingEnabled = true;

            App.World.Renderer.sortObjects = true;

            this.collectedStyles = new Set();

            App.World.Scene.background = new THREE.Color(Settings["background-color"]);

            this.isAnimate = false

            this.step = 1

            this.isCreative = false

            this.currentWaypoint = '0';

            this.speed = 2;

            this.lastTime = 0;

            this.timeScale = 1;

            this.time = 0;

            this.rotationSpeed = 2;

            this.checkpoints = {
                '0': null,
                '1': null,
                '2': null,
                '3': null,
                '4': null,
            }

            this.correctSubject = {
                '1': 0,
                '2': 2,
                '3': 1,
            }

            this.currentProgress = 1

            this.currentGirl = 1

            this.clock = new THREE.Clock();

            this.bottomPodium = []

            this.topPodium = []
        },

        // Срабатывает сразу после создания спрайтов из секции Containers
        build() {
            this.createShadow()

            this.createPodium()
            this.bounceHand()

            this.updateCamera()

            this.createPlaneProgress()

            //this.createMirror()

            this.createChoiceProgressBar();

            this.controllerYou = this.preassetGirl('YOU', this['girl'])

            this.controllerEnemy = this.preassetGirl(_.sample(['EMMA', 'MIA', 'LIZA']), this['enemy'])

            this.controllerYou.configFirstBase();
            this['hand cont'].visible = false

            const Text = new ThreeText("Create the craziest look", {
                styles: {
                    fontFamily: "BebasNeue",
                    fontSize: 40,
                },

            })

            this['crazyLook'].add(Text)

            setTimeout(() => {
                gsap.to(this['choice progress cont'].position, {
                    y: 750,
                    duration: 1,
                    ease: "bounce.out"
                });
            }, 1000)

            this['light_ambient'].intensity = Settings["ambient-light-intensity"]

            this['light_directional'].intensity = Settings["directional-light-intensity"]

            this.camera.rotation.y =

                Broadcast.on(
                    "Gameplay next_level Down",
                    () => {
                        if (window.MraidSDK) MraidSDK.open("end screen button");
                        else alert("Click Out: end screen button");
                    },
                    this,
                );

            this.updateProgress(this.currentProgress)
        },

        resize() {
            let topLeft = App.World.ThreeGUI.convertStageTouch({x: 0, y: 0});

            let bottomPanel = (App.IsLandscape ? 0.5 : 1)


            this['cloth panel cont'].position.x = (App.IsLandscape ? topLeft.x + 450 : 0)

            this['cloth panel cont'].position.y = -topLeft.y + (App.IsLandscape ? 250 : 275)

            if (this['cloth panel cont'].scale.x > 0) {
                let scale = App.IsPortrait ? 1.5 : 1
                this['cloth panel cont'].scale.set(scale, scale, scale)
            }

            if (this.TutorialAnimation) this.tutorialTimeout(0)

            this['hand cont'].scale.set(bottomPanel, bottomPanel, bottomPanel)

            this['top cta panel cont'].scale.set(bottomPanel, bottomPanel, bottomPanel)

            this['buttons cta cont'].scale.set(bottomPanel, bottomPanel, bottomPanel)

            this['top cta panel cont'].position.x = topLeft.x

            this['top cta panel cont'].position.y = topLeft.y

            this['buttons cta cont'].position.y = -topLeft.y + (300 * bottomPanel)

            this['left bottom corner'].position.x = topLeft.x

            this['left bottom corner'].position.y = -topLeft.y + 100

            this['right bottom corner'].position.x = -topLeft.x

            this['right bottom corner'].position.y = -topLeft.y + 100


        },

        show() {
            this['buttons cta cont'].children.forEach(e => {
                e.scale.set(0, 0, 0)
            })

            this['text effect'].children.forEach(e => {
                e.scale.set(0, 0, 0)
            })

            this['top cta panel cont'].children.forEach(e => {
                e.scale.set(0, 0, 0)
            })

            this['cloth panel cont'].scale.set(0, 0, 0)

            this.updateSettings();

            this.startGame();

            if (this.isCreative) this.flyMode(this.startPoint.x, this.startPoint.y, this.startPoint.z)

            const newTarget = new THREE.Vector3(this.startPoint.x + 0.2, this.startPoint.y + 1, this.startPoint.z);

            this.camera.lookAt(newTarget);
        },

        update() {
            const time = this.getTime()

            const delta = this.deltaTime

            if (this.control) this.syncCameraWithControls()

            if (this.starEmmiter && this.starEmmiter.isPlaying) {
                this.starEmmiter.onTick(this.time)
                this.shiningEmmiter.onTick(this.time)
            }

            if (this.starParticleSystem) {
                this.starParticleSystem.onTick(delta)
                this.shiningParticleSystem.onTick(delta)
            }

            this.moveTargetPosition(this['girl'], this['enemy'])

            if (this.controllerYou) this.controllerYou.update(delta)

            if (this.controllerEnemy) this.controllerEnemy.update(delta)
        },

        hide() {

        }

    },

    Events: {

        'global:Stage Press Down': function (event, position) {

            if (this.isAnimate) return;

            if (window.MraidSDK) MraidSDK.interaction();

            if (!this.isBackgroundMusicPlaying) {
                this.isBackgroundMusicPlaying = true;
                if (window.MraidSDK) MraidSDK.playSound("sound-bg", {loop: true});
                else this.playSound("sound-bg", {loop: true});
            }

            const pos = App.World.ThreeGUI.convertStageTouch(event)

            if (this.step === 1) {
                this.playGame();
                return;
            }

            if (this.isPointOnPlane(this['button 1'], pos)) this.choiceSubject(this['button 1'])
            else if (this.isPointOnPlane(this['button 2'], pos)) this.choiceSubject(this['button 2'])
            else if (this.isPointOnPlane(this['button 3'], pos)) this.choiceSubject(this['button 3'])
            else {
                if (this.step > 2) return;
                if (!this['girl'].children.length) return;

                this.isDragging = true;
                this.previousMouseX = pos.x;
            }
        },

        'global:Stage Press Move': function (event, position) {
            if (!this.isDragging) return;

            const pos = App.World.ThreeGUI.convertStageTouch(event)

            const deltaX = pos.x - this.previousMouseX;

            this['girl'].children[0].rotation.y += deltaX * 0.01; // Измените знак для изменения направления

            this.previousMouseX = pos.x;
        },

        'global:Stage Press Up': function (event, position) {
            this.isDragging = false
        },

        'global:Setting Changed': function (name, value) {

            this.updateSettings(name, value);

        }

    },

    animationCTAscreen(end) {
        this.step = 5

        this["choice progress cont"].visible = false;
        if (end) {
            gsap.timeline()
                .to(this['top cta panel cont'].children[0].scale, {x: 1, y: 1, z: 1, duration: 0.3})
                .to(this['buttons cta cont'].children[0].scale, {
                    x: 1, y: 1, z: 1, duration: 0.3, onComplete: () => {
                        gsap.timeline().to(this['buttons cta cont'].children[0].scale, {
                            x: 0.9,
                            y: 0.9,
                            z: 0.9,
                            duration: 0.7,
                            repeat: -1,
                            yoyo: true
                        })
                    }
                }, 0.1)
        } else {
            gsap.timeline()
                .to(this['top cta panel cont'].children[1].scale, {x: 1, y: 1, z: 1, duration: 0.3})
                .to(this['buttons cta cont'].children[1].scale, {
                    x: 1, y: 1, z: 1, duration: 0.3, onComplete: () => {
                        gsap.timeline().to(this['buttons cta cont'].children[1].scale, {
                            x: 0.9,
                            y: 0.9,
                            z: 0.9,
                            duration: 0.7,
                            repeat: -1,
                            yoyo: true
                        })
                    }
                }, 0.1)
        }
    },
    bounceHand() {
        gsap.to(this['hand'].scale, {
            x: 1.2,
            y: 1.2,
            z: 1.2,
            duration: 0.6,
            ease: "back.out",
            yoyo: true,
            repeat: -1
        });

        this['hand'].position.y -= 350;
    },

    createArrows(score, pos, index) {
        const converted_coord = this.convertWorldToGUI(pos, this);

        const parent = this['arrows cont']

        const cont = new THREE.Group()

        const arrow = this.buildThreeChild(cont, {
            anchor: [1, 0],
            size: [100, 300],
            type: 'three-image',
            image: 'arrow'
        })

        arrow.rotation.z = Math.PI / 2 + 0.25

        const emoji = this.buildThreeChild(cont, {
            size: [100, 100],
            type: 'three-image',
            image: score === 6 ? _.sample(['emoji_1', 'emoji_2']) : 'emoji_3'
        })

        emoji.position.x = 275

        cont.position.copy(converted_coord)

        cont.scale.set(0, 0, 0)

        gsap.timeline().to(cont.scale, {x: 1, y: 1, z: 1, duration: 0.4}, index * 0.1)

        parent.add(cont)

        return cont
    },

    moveTargetPosition(girl, enemy) {
        if (!this.isMoved) return;

        if (this.currentWaypoint !== '6') {
            const nextTarget = this.checkpoints[this.currentWaypoint];

            if (!nextTarget) {
                this.choiceNextTarget();
                return;
            }

            const targetVector = new THREE.Vector3(nextTarget.x, girl.position.y, nextTarget.z);

            // Вычисляем направление к цели
            const direction = targetVector.sub(girl.position).normalize();

            const dir_rotation = new THREE.Vector3()
                .subVectors(nextTarget, girl.position)
                .normalize();

            const angle = Math.atan2(dir_rotation.x, dir_rotation.z);

            girl.children[0].rotation.y = angle;

            const step = direction.multiplyScalar(this.speed * (1 / 60))

            girl.position.add(step)

            if (this.currentWaypoint !== '0') {
                enemy.position.add(step)
                enemy.children[0].rotation.y = angle;
            }

            this.camera.position.add(step)

            const distanceToTarget = girl.position.distanceTo(
                new THREE.Vector3(nextTarget.x, girl.position.y, nextTarget.z)
            );

            if (this.currentWaypoint === '0') {
                const worldPosition = this['enemy'].position;
                worldPosition.x += 0.5

                this['enemy'].position.copy(worldPosition)

                this.spawnGirl(0, this['enemy'], this.controllerEnemy)

                this.controllerEnemy.playAnimation('walk', {loop: THREE.LoopRepeat});

                this.currentWaypoint = '1'

                this.updateClothButtons()

            } else if (this.currentWaypoint === '5') {
                if (distanceToTarget < 0.1) {
                    this.isMoved = false

                    this.transferCameraEnd()
                }
            } else {
                if (distanceToTarget < 0.9) {
                    this.speed = 0.1
                    this.controllerYou.setAnimationSpeed(0.2)
                    this.controllerEnemy.setAnimationSpeed(0.2)
                }

                if (this['cloth panel cont'].scale.x === 0 && this.speed === 0.1) {
                    let scale = App.IsPortrait ? 1.25 : 1
                    gsap.to(this['cloth panel cont'].scale, {
                        x: scale, y: scale, z: scale, duration: 0.2, onComplete: () => {
                            this['cloth panel cont'].complete = true
                            this.tutorialTimeout(0)
                        }
                    })
                }

                if (this['cloth panel cont'].scale.x > 0 && this.speed !== 2 && this['cloth panel cont'].complete) {
                    this.currentProgress -= 0.005

                    this.updateProgress(this.currentProgress)

                    if (this.currentProgress <= 0) {
                        this.hideTutorial()

                        let arr = ['icon 1', 'icon 2', 'icon 3']

                        const icon = arr.find(e => this[e].children[0].name.split('-')[0] === 'fairy')

                        this.playSound('sound-error')

                        this.controllerEnemy.changeCloth(this[icon].children[0].name)

                        this['cloth panel cont'].complete = false
                        gsap.to(this['cloth panel cont'].scale, {
                            x: 0, y: 0, z: 0, duration: 0.2, onComplete: () => {
                                this.currentProgress = 1
                                this.updateProgress(this.currentProgress)
                                if (+this.currentWaypoint < 5) this.updateClothButtons()
                            }
                        })
                        this.speed = 2
                        this.controllerYou.setAnimationSpeed(1)
                        this.controllerEnemy.setAnimationSpeed(1)
                        this.choiceNextTarget()
                    }
                }
            }
        }
    },

    conffetiesEffect() {
        setTimeout(() => {
            this.launchStars(this['left bottom corner'], 0, 0, 100, 45)
            this.launchStars(this['right bottom corner'], 0, 0, 100, 135)
        }, 500)
    },

    spawnGirl(index, parent, controller) {
        if (controller.text === 'YOU') {
            if (index === 0) controller.configFirstBase()
        } else {
            gsap.timeline()
                .to(parent.scale, {
                    x: 1, y: 1, z: 1, duration: 0.2, onComplete: () => {
                    }
                })
        }
    },


    preassetGirl(text, parent) {
        const glb_asset = App.ThreeAssets['character']
        const model = this.cloneModel(glb_asset.scene);
        const controller = new AnimatedModelController(model, glb_asset.animations.slice(0), this.camera, text);

        controller.createAnimationSegment('walk', 0, 24.5); // кадры 0-29
        controller.createAnimationSegment('death', 25, 77); // кадры 30-60
        controller.createAnimationSegment('show', 80, 126); // кадры 30-60
        controller.createAnimationSegment('dance', 134, 270);
        controller.createAnimationSegment('idle', 278, 374);
        controller.createAnimationSegment('attack', 375, 480);

        controller.playAnimation('idle', {loop: THREE.LoopRepeat});

        parent.position.set(this.startPoint.x, this.startPoint.y - 0.075, this.startPoint.z)

        parent.add(model)

        model.rotation.y = Math.PI


        if (text !== 'YOU') parent.position.x -= 1;
        else
            parent.position.x += 1

        return controller
    },

    createSpawnTextEffect(index) {
        const text = this['text effect'].children[index]

        text.position.set(this['cloth panel cont'].position.x, this['cloth panel cont'].position.y + 150, text.position.z)

        text.scale.set(0, 0, 0)

        gsap.timeline()
            .to(text.position, {y: text.position.y + 350, duration: 0.25, repeat: 1, yoyo: true})
            .to(text.scale, {x: 1, y: 1, z: 1, duration: 0.5, repeat: 1, yoyo: true}, '<')
    },

    updateClothButtons() {
        const buttons = ['button 1', 'button 2', 'button 3']

        const arr = _.shuffle(['kpop', 'toilet'])


        const index = this.currentWaypoint

        const step = {
            '1': 'top',
            '2': 'hair',
            '3': 'shoes'
        }

        buttons.forEach((e, i) => {
            this[e].children[0].visible = false

            const icon = this[e].children[1]

            if (icon.children[0]) icon.children[0].removeFromParent()

            if (this.correctSubject[index] === this[e].cloth) {
                this.buildThreeChild(icon, {
                    name: 'fairy-' + step[index],
                    size: [460 / 2, 460 / 2],
                    type: 'three-image',
                    image: 'fairy-' + step[index]
                })

            } else {
                this.buildThreeChild(icon, {
                    name: arr[0] + '-' + step[index],
                    size: [460 / 2, 460 / 2],
                    type: 'three-image',
                    image: arr[0] + '-' + step[index]
                })

                arr.shift()
            }
        })
    },

    updateChoiceProgress(value) {
        const size = this.computeGroupSize(this['choice progress line']);
        const halfWidth = size.x / 2;
        const clippingValue = -halfWidth + (size.x * value);

        console.log("choiceProgress", value, "size.x", size.x, "clippingValue", clippingValue);

        // Плавная анимация обрезки
        gsap.to(this.choiceProgressClippingPlane, {
            constant: clippingValue,
            duration: 1.5,
            ease: 'power2.out'
        });
    },

    choiceSubject(elem) {
        if (!this['cloth panel cont'].complete) return;

        let arr = ['icon 1', 'icon 2', 'icon 3'];
        this['cloth panel cont'].complete = false;

        this.hideTutorial();

        gsap.to(this['cloth panel cont'].scale, {
            x: 0, y: 0, z: 0, duration: 0.2, onComplete: () => {
                this.currentProgress = 1;
                this.updateProgress(this.currentProgress);
                if (+this.currentWaypoint < 5) this.updateClothButtons();
            }
        });

        const name_concept = elem.children[1];
        const selectedName = name_concept.children[0].name;
        const selectedOutfitType = selectedName.split('-')[0];

        if (!this.collectedOutfits) this.collectedOutfits = [];
        this.collectedOutfits.push(selectedOutfitType);

        const uniqueOutfits = new Set(this.collectedOutfits);
        let isMixedOutfit = uniqueOutfits.size >= 2;

        if (this.collectedOutfits.length === 1) {
            isMixedOutfit = true;
        }

        let scoreValue = 1;
        if (isMixedOutfit) {
            scoreValue = 6; // высокий балл за уникальность
        }

        // Первый выбор всегда считаем правильным
        if (this.collectedOutfits.length === 1) {
            isMixedOutfit = true;
        }

        // Обновляем одежду персонажей
        if (selectedOutfitType === 'fairy') {
            this.controllerYou.changeCloth(selectedName, scoreValue);
            const notFairyIcon = arr.find(e => this[e].children[0].name.split('-')[0] !== 'fairy');
            if (notFairyIcon) {
                this.controllerEnemy.changeCloth(this[notFairyIcon].children[0].name, 1);
            }
        } else {
            this.controllerYou.changeCloth(selectedName, scoreValue);
            const fairyIcon = arr.find(e => this[e].children[0].name.split('-')[0] === 'fairy');
            if (fairyIcon) {
                this.controllerEnemy.changeCloth(this[fairyIcon].children[0].name, 1);
            }
        }

        if (isMixedOutfit) {
            this.choiceProgress += 1 / 3;
            this.playSound("sound-correct");
            this.createSpawnTextEffect(Math.floor(Math.random() * 3));
        } else {
            this.choiceProgress = 0;
            this.playSound("sound-error");
            this.createSpawnTextEffect(Math.floor(Math.random() * 2) + 3);
        }

        this.choiceProgress = Math.min(this.choiceProgress, 1);
        this.updateChoiceProgress(this.choiceProgress);

        this.choiceNextTarget();

        this.speed = 2;
        this.controllerYou.setAnimationSpeed(1);
        this.controllerEnemy.setAnimationSpeed(1);
    },

    choiceNextTarget() {
        let nextKey = null;
        let check = false

        for (var key in this.checkpoints) {
            if (check && !nextKey) nextKey = key

            if (key === this.currentWaypoint) check = true
        }

        if (!nextKey) nextKey = '5'

        this.currentWaypoint = nextKey
    },

    createChoiceProgressBar() {
        const line = this['choice progress line'].material;
        const clippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
        line.clippingPlanes = [clippingPlane];

        this.choiceProgressClippingPlane = clippingPlane;

        this.updateChoiceProgress(this.choiceProgress); // изначальное состояние
    },

    choiceBody(elem) {
        const number = +elem.name.split(' ')[1]

        if (this.currentGirl === number) return;

        this.playSound("sound-select")

        if (this.step === 1) {
            this.hideTutorial()

            this.step = 2

            this.tutorialTimeout(0)
        }

        this.currentGirl = number

        this.starEmmiter.play(this.time)
        this.shiningEmmiter.play(this.time)

        this.spawnGirl(number - 1, this['girl'], this.controllerYou)

        elem.children[0].visible = true

        gsap.timeline()
            .to(elem.scale, {x: 0.95, y: 0.95, z: 0.95, duration: 0.3})
            .to(elem.scale, {x: 1, y: 1, z: 1, duration: 0.3}, '>')
    },

    updateSettings(name, value) {
        this.resize();

        if (name === 'camera-fov') this.camera.fov = value

        if (name === 'ambient-light-intensity') this['light_ambient'].intensity = value

        if (name === 'directional-light-intensity') this['light_directional'].intensity = value


        this['light_directional'].position.set(
            Settings['directional-light-pos-x'],
            Settings['directional-light-pos-y'],
            Settings['directional-light-pos-z'],
        );

        this.controllerYou.updateSettingCharacter()
        this.controllerEnemy.updateSettingCharacter()

        if (name === "podium-top-color") {
            this.topPodium.forEach(e => {
                e.color = new THREE.Color(this.convertHexColor(Settings["podium-top-color"]))
                if (e.material) {
                    e.material.roughness = Settings["podium-top-glasses"]
                }
            })
        }

        if (name === "podium-bottom-color") {
            this.bottomPodium.forEach(e => {
                e.color = new THREE.Color(this.convertHexColor(Settings["podium-bottom-color"]))
                if (e.material) {
                    e.material.roughness = Settings["podium-bottom-glasses"]
                }
            })
        }


        this['light_directional'].color.set(Settings['directional-light-color']);

        if (
            name === "camera-elevation" ||
            name === "camera-azimuth" ||
            name === "camera-distance"
        ) this.movingCamera()
    },

    createPlaneProgress() {

        const line = this['progress line'].material

        const clippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
        line.clippingPlanes = [clippingPlane];

        this.clippingPlane = clippingPlane

    },

    updateProgress(value) {
        const minValue = 0;

        let topLeft = App.World.ThreeGUI.convertStageTouch({x: 0, y: 0});

        const size = this.computeGroupSize(this['progress line'])

        // Приводим значение к диапазону от 0 до высоты шкалы
        const clippingValue = THREE.MathUtils.lerp(minValue, size.x, value) + topLeft.x + 100

        // Обновляем положение плоскости отсечения
        this.clippingPlane.constant = clippingValue;

    },

    playGame() {
        this.step = 3;

        this.hideTutorial();

        this.controllerYou.textLabel.visible = true;

        gsap.timeline()
            .to(this['choice progress cont'].scale, {
                x: App.IsLandscape ? 0.5 : 1,
                y: App.IsLandscape ? 0.5 : 1,
                z: App.IsLandscape ? 0.5 : 1,
                duration: 0.3
            });

        this['hand'].position.y += 350;

        const newPosition = new THREE.Vector3(this.startPoint.x + 4, this.startPoint.y + 2, this.startPoint.z - 7);
        const newTarget = new THREE.Vector3(this.startPoint.x - 0.5, this.startPoint.y + 1, this.startPoint.z);

        const initialQuaternion = this.camera.quaternion.clone();

        this.camera.lookAt(newTarget);
        const targetQuaternion = this.camera.quaternion.clone();

        this.camera.quaternion.copy(initialQuaternion);

        gsap.timeline()
            .to(this.camera.position, {
                x: newPosition.x,
                y: newPosition.y,
                z: newPosition.z,
                duration: 1,
                ease: 'power2.in'
            });

        gsap.to(this.camera.quaternion, {
            x: targetQuaternion.x,
            y: targetQuaternion.y,
            z: targetQuaternion.z,
            w: targetQuaternion.w,
            duration: 1,
            ease: 'power2.in',
            onUpdate: () => {
                this.camera.quaternion.normalize(); // Обязательно нормализовать
            }
        });

        gsap.to(this['crazyLook'].position, {
            y: this['crazyLook'].position.y - 1000,
            duration: 1,
            ease: 'power2.in',
            onUpdate: () => {
                this['crazyLook'].position.needsUpdate = true;
            }
        });


        gsap.timeline()
            .to(this['choice progress cont'].scale, {
                x: App.IsLandscape ? 0.5 : 1,
                y: App.IsLandscape ? 0.5 : 1,
                z: App.IsLandscape ? 0.5 : 1,
                duration: 0.3,
                onComplete: () => {
                    this.isMoved = true;
                    this.controllerYou.playAnimation('walk', {loop: THREE.LoopRepeat});
                }
            });
    },

    spawnHand(parent = this['spawn hands 2'], evaluations = [5, 3, 10]) {
        if (parent.children.length > 0) return;

        const positions = (parent === this['spawn hands 2'] ?
            [
                new THREE.Vector3(0.800, -0.2, -4.626 + 0.7),
                new THREE.Vector3(1.100, -0.2, -4.508 + 0.7),
                new THREE.Vector3(1.46, -0.2, -4.360 + 0.7)
            ] :
            [
                new THREE.Vector3(-0.651 - 0.3, -0.2, -4.626 + 0.7),
                new THREE.Vector3(-0.956 - 0.3, -0.2, -4.508 + 0.7),
                new THREE.Vector3(-1.261 - 0.3, -0.2, -4.360 + 0.7)
            ])

        const model = this.cloneModel(App.ThreeAssets['hand'].scene.children[0])

        evaluations.forEach((e, i) => {
            const obj = model.clone()

            obj.traverse(child => {
                if (!child.material) return;

                const randomColor = Math.floor(Math.random() * 0x1000000);

                if (child.name.includes('Watch')) child.visible = false

                if (child.material.name.includes('Skin') && child.name !== 'deck') {
                    const material = new THREE.MeshStandardMaterial({color: _.sample([0xFFAA81])})
                    child.material = material.clone()
                    child.material.roughness = 0.4
                    child.material.metalness = 0.1
                } else if (child.material.name.includes('Skin') && child.name === 'deck') {
                    child.material = new THREE.MeshStandardMaterial({color: 0xFF31BE})
                    child.material.roughness = 0.4
                    child.material.metalness = 0.1
                } else {
                    child.material = new THREE.MeshStandardMaterial({color: randomColor})
                }
            })

            obj.position.set(positions[i].x, positions[i].y, positions[i].z)

            obj.scale.set(0, 0, 0)

            this.createSign(obj, e)

            gsap.timeline().to(obj.scale, {
                x: 0.005, y: 0.005, z: 0.005, duration: 0.3, onComplete: () => {
                    let random = this.getRandom(-Math.PI / 4, Math.PI / 4)
                    gsap.timeline({repeat: -1, yoyo: true})
                        .to(obj.rotation, {z: obj.rotation.z + random, duration: 1}, i * 0.1)
                        .to(obj.rotation, {z: obj.rotation.z - random, duration: 1}, '>')
                }
            }, i * 0.1)

            parent.add(obj)
        })

    },

    createSign(parent, evaluation) {
        const group = new THREE.Group()

        let bg = this.buildThreeChild(group, {size: [45, 32.5], type: 'three-image', image: 'hand-bg'})

        bg.material.side = THREE.DoubleSide

        bg.material.depthTest = false

        bg.rotation.x = Math.PI / 2

        const cont = this.buildThreeChild(group, {type: 'three-text', text: 'SCORE_HAND'})

        cont.material.side = THREE.DoubleSide

        cont.material.depthTest = false

        cont.text = '' + evaluation

        cont.rotation.x = Math.PI / 2

        cont.rotation.z = Math.PI

        cont.position.y = -0.2

        cont.scale.set(0.5, 0.5, 0.5)


        group.position.set(0, -11.884, -55)

        parent.add(group)
    },

    createMirror() {
        const cont = new THREE.Group()

        const scale = 2

        const boxes = [
            {width: 0.05, height: 1.15, depth: 0.05, x: 0.275, y: -0.025, z: 0},
            {width: 0.05, height: 1.15, depth: 0.05, x: -0.275, y: -0.025, z: 0},
            {width: 0.550, height: 0.05, depth: 0.05, x: 0, y: 0.525, z: 0},
            {width: 0.550, height: 0.05, depth: 0.05, x: 0, y: -0.525, z: 0}
        ]

        const material = new THREE.MeshStandardMaterial({color: 0xeaa785})

        boxes.forEach((e, i) => {
            const box = new THREE.BoxGeometry(e.width, e.height, e.depth)
            const mesh = new THREE.Mesh(box, material)

            mesh.castShadow = true

            mesh.position.set(e.x, e.y, e.z)

            cont.add(mesh)
        })

        const mirror = new Reflector(new THREE.PlaneGeometry(0.5, 1), {
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0xc6c6c6
        })

        const plane = new THREE.PlaneGeometry(0.5, 1)

        const planeMesh = new THREE.Mesh(plane, material)

        planeMesh.position.z += 0.01

        planeMesh.castShadow = true

        cont.add(planeMesh)

        mirror.rotation.y = -Math.PI

        cont.scale.set(scale, scale, scale)

        cont.position.set(this.startPoint.x + 0.5, this.startPoint.y + ((1.15 * scale) / 2), this.startPoint.z + 1)

        cont.add(mirror)

        this['world'].add(cont)
    },

    transferCameraEnd() {
        this.step = 4

        let sumYou = this.controllerYou.sumScore()

        let sumEnemy = this.controllerEnemy.sumScore()
        if (typeof sum !== 'number' || isNaN(sum)) sumEnemy = 0;

        const steps = [this['enemy'].position.clone(), this['girl'].position.clone()]

        const uniqueOutfits = new Set(this.collectedOutfits);
        const isMixedOutfit = uniqueOutfits.size >= 2;

        const end_pos = this['girl'].position.clone()

        const target = new THREE.Vector3(0, 0, 0)

        end_pos.x = 0

        this.control = null

        gsap.to(this['choice progress cont'].scale, {x: 0, y: 0, z: 0, duration: 0.2})

        this.controllerYou.playAnimation('idle', {loop: THREE.LoopRepeat});
        this.controllerEnemy.playAnimation('show', {loop: THREE.LoopOnce});

        setTimeout(() => {
            this.spawnHand(this['spawn hands 1'], sumEnemy < 6 ? [3, 1, 2] : this.splitIntoThreeParts(sumEnemy))
            this.controllerEnemy.createLastArrows()
            this.playSound("sound-stars")

            this.controllerEnemy.animationText(sumEnemy)
        }, 1000)

        this.controllerYou.textLabel.visible = false
        this.controllerEnemy.textLabel.visible = false

        this.animateCamera(this.camera, new THREE.Vector3(steps[0].x, steps[0].y + 1, steps[0].z), new THREE.Vector3(-1.44, 0.4, -6.8), 0.45, 'circInOut')

        setTimeout(() => {
            this['spawn hands 1'].children.forEach((e, i) => {
                gsap.timeline().to(e.scale, {x: 0, y: 0, z: 0, duration: 0.25}, i * 0.1)
            })

            this.controllerEnemy.arrows.forEach((e, i) => {
                gsap.timeline().to(e.cont.scale, {x: 0, y: 0, z: 0, duration: 0.25}, i * 0.1)
            })
        }, 2500);

        setTimeout(() => {
            this.controllerYou.playAnimation('show', {loop: THREE.LoopOnce})

            setTimeout(() => {
                this.spawnHand(this['spawn hands 2'], sumYou < 6 ? [0, 0, 0] : this.splitIntoThreeParts(sumYou))
                this.controllerYou.createLastArrows()
                this.playSound("sound-stars")
                this.controllerYou.animationText(sumYou)
            }, 1000)

            this.controllerEnemy.playAnimation('idle', {loop: THREE.LoopRepeat});

            this.animateCamera(this.camera, new THREE.Vector3(steps[1].x, steps[1].y + 1, steps[1].z), new THREE.Vector3(1.44, 0.4, -6.8), 0.45, 'circInOut')

            setTimeout(() => {
                this['spawn hands 2'].children.forEach((e, i) => {
                    gsap.timeline().to(e.scale, {x: 0, y: 0, z: 0, alpha: 0, duration: 0.25}, i * 0.1)
                })

                this.controllerYou.arrows.forEach((e, i) => {
                    gsap.timeline().to(e.cont.scale, {x: 0, y: 0, z: 0, duration: 0.25}, i * 0.1)
                })
            }, 2500);

            setTimeout(() => this.attackCharacter(end_pos.clone(), isMixedOutfit), 3000)
        }, 3000)
    },

    attackCharacter(cameraPosition, end = false) {
        let target = new THREE.Vector3(0, 0, 0)

        this.controllerYou.starBgCont.visible = false
        this.controllerEnemy.starBgCont.visible = false

        this.controllerYou.playAnimation('idle', {loop: THREE.LoopRepeat});
        this.controllerEnemy.playAnimation('idle', {loop: THREE.LoopRepeat});

        this.animateCamera(this.camera, new THREE.Vector3(cameraPosition.x, cameraPosition.y + 1, cameraPosition.z), new THREE.Vector3(0, 0.8, -8), 0.5, 'circInOut', () => {
            this.fightDance(end, cameraPosition.clone())
        })
    },

    fightDance(end, cameraPosition) {
        const default_angle = this['girl'].children[0].rotation.y

        gsap.timeline()
            .to(this['girl'].children[0].rotation, {
                y: this.rotationToObject(this['enemy'].position, this['girl'].position),
                duration: 0.2
            })
            .to(this['enemy'].children[0].rotation, {
                y: this.rotationToObject(this['girl'].position, this['enemy'].position),
                duration: 0.2,
                onComplete: () => {
                    if (end) {
                        this['girl'].position.y += 0.05
                        this.controllerYou.playAnimation('attack', {
                            loop: THREE.LoopOnce, timeScale: 1.2, clampWhenFinished: true, onFinish: () => {
                                this.controllerYou.playAnimation('dance', {loop: THREE.LoopRepeat})
                                gsap.to(this['girl'].children[0].rotation, {
                                    y: default_angle, duration: 0.2, onComplete: () => {
                                        this.animationCTAscreen(true)
                                        this.playSound("sound-orkestrom")
                                        this.playSound("sound-aplodismentov")
                                        this.conffetiesEffect()
                                    }
                                })
                            }
                        })
                        setTimeout(() => {
                            this.playSound("sound-kick")
                            this.controllerEnemy.playAnimation('death', {
                                loop: THREE.LoopOnce, timeScale: 2, clampWhenFinished: true, onFinish: () => {
                                    this.transferCameraEndFight(true, cameraPosition)
                                }
                            })
                        }, 900)
                    } else {
                        this['enemy'].position.y += 0.05
                        this.playSound("sound-fail")
                        this.controllerEnemy.playAnimation('attack', {
                            loop: THREE.LoopOnce, timeScale: 1.25, clampWhenFinished: true, onFinish: () => {
                                this.controllerEnemy.playAnimation('dance', {loop: THREE.LoopRepeat})
                                gsap.to(this['enemy'].children[0].rotation, {
                                    y: default_angle, duration: 0.2, onComplete: () => {
                                        this.animationCTAscreen(false)
                                    }
                                })
                            }
                        });
                        setTimeout(() => {
                            this.playSound("sound-kick")
                            this.controllerYou.playAnimation('death', {
                                loop: THREE.LoopOnce, timeScale: 2, clampWhenFinished: true, onFinish: () => {
                                    this.transferCameraEndFight(false, cameraPosition)
                                }
                            })
                        }, 900)
                    }
                }
            }, '<')
    },

    transferCameraEndFight(end, cameraPosition) {
        if (end) this.animateCamera(this.camera, new THREE.Vector3(0.5, 0.8, this['girl'].position.z), new THREE.Vector3(0.5, 0.8, -8), 0.65, 'linear')
        else this.animateCamera(this.camera, new THREE.Vector3(-0.5, 0.8, this['enemy'].position.z), new THREE.Vector3(-0.5, 0.8, -8), 0.65, 'linear')
    },

    rotationToObject(next, prev) {
        const dir_rotation = new THREE.Vector3()
            .subVectors(next, prev)
            .normalize();

        const angle = Math.atan2(dir_rotation.x, dir_rotation.z);

        return angle
    },

    flyMode(x, y, z, enableZoom = true, enableRotate = true, enablePan = true) {
        if (!this.control) this.control = new OrbitControls(App.World.Camera, App.World.Renderer.domElement)

        this.control.target.set(x, y, z);

        this.control.update();

        this.control.enableZoom = enableZoom;
        this.control.enableRotate = enableRotate;
        this.control.enablePan = enablePan;
    },

    syncCameraWithControls() {
        const target = this.control.target.clone();

        // Вычисляем направление камеры относительно target
        const direction = new THREE.Vector3().subVectors(this.camera.position, target).normalize();

        // Если нужно точное совпадение, задаем положение камеры в соответствии с `controls`:
        const distance = this.camera.position.distanceTo(target);
        this.camera.position.copy(direction.multiplyScalar(distance).add(target));

        // Обновляем ориентацию камеры
    },

    startGame() {

        if (window.MraidSDK) MraidSDK.track('Game Starts');
        if (window.MraidSDK) MraidSDK.interaction();
        this.tutorialTimeout(0)

    },

    tutorialTimeout(timeout = Settings["tutorial-timeout"]) {

        this.hideTutorial()

        this.TutorialTimeout = setTimeout(() => {

            if (Settings["tutorial"]) {
                if (this.step === 1 || this.step === 2 || this.step === 3) {
                    let steps = null

                    if (this.step === 1) steps = ['person 1', 'person 2', 'person 3']
                    else if (this.step === 2) steps = ['button']
                    else if (this.step === 3) steps = ['button 1', 'button 2', 'button 3']

                    const startPosition = new THREE.Vector3()

                    this.TutorialAnimation = gsap.timeline({repeat: -1})

                    this['hand cont'].position.set(startPosition.x, startPosition.y - 15, 100)

                    this['hand cont'].visible = true

                    steps.forEach((e, i) => {
                        const position = new THREE.Vector3()
                        if (e.includes("person"))
                            return;
                        this[e].getWorldPosition(position);

                        this.TutorialAnimation
                            .to(this['hand cont'].position, {
                                x: position.x, y: position.y - 15, z: 100, duration: 0.3, onComplete: () => {
                                    if (this.correctSubject[this.currentWaypoint] === i && this.step === 3) this[e].children[0].visible = true
                                }
                            })
                            .to(this[e].scale, {
                                x: 0.95, y: 0.95, z: 0.95, duration: 0.3, repeat: 1, yoyo: true, onComplete: () => {
                                    if (this.correctSubject[this.currentWaypoint] === i && this.step === 3) this[e].children[0].visible = false
                                }
                            }, '<')
                    })
                }

            }

        }, timeout);
    },

    hideTutorial() {

        clearTimeout(this.TutorialTimeout);

        if (this.TutorialAnimation) {
            this.TutorialAnimation.kill()
            this.TutorialAnimation = null
        }

        let steps = null

        if (this.step === 1) steps = ['person 1', 'person 2', 'person 3']
        else if (this.step === 2) steps = ['button']
        else if (this.step === 3) steps = ['button 1', 'button 2', 'button 3']

        this['hand'].scale.set(1, 1, 1)
        this['hand cont'].visible = false
    },

    createPodium() {
        const parent = this['world']

        const model = App.ThreeAssets['scene_podium'].scene.children[0].clone()

        model.traverse((child => {
            if (child.name === 'Podium_Start') {
                const worldPosition = new THREE.Vector3();
                child.getWorldPosition(worldPosition);
                this.startPoint = worldPosition.clone()

                worldPosition.x += 0.75
                worldPosition.z -= 1

                this.checkpoints['0'] = worldPosition
            } else if (child.name.includes('Sign')) {
                const key = child.name.split('_')[2]

                const worldPosition = new THREE.Vector3();
                child.getWorldPosition(worldPosition);

                worldPosition.x += 0.75

                this.checkpoints['' + (+key + 1)] = worldPosition

                //child.children[1].visible = false

                this.createIconTable(+key + 1, child.children[2])

            } else if (child.name.includes('End')) {
                const key = child.name.split('_')[1]

                const worldPosition = new THREE.Vector3();
                child.getWorldPosition(worldPosition);

                worldPosition.x += 0.75

                this.checkpoints['5'] = worldPosition
            }

            if (child.name === 'Plane') {
                child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["plane-color"]))})
            }

            if (!child.material) return;

            if (child.material.name === 'Podium') {
                const items = child.parent.children.filter(e => e !== child)
                child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["podium-top-color"]))})
                child.material.roughness = Settings["podium-top-glasses"]


                child.material.needsUpdate = true;

                this.topPodium.push(child.material)

                items.forEach(e => {
                    if (!e.name.includes('Sprite')) {
                        e.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["podium-bottom-color"]))})
                        e.material.roughness = Settings["podium-bottom-glasses"]

                        this.bottomPodium.push(e.material)

                        e.material.needsUpdate = true;
                    }
                })
            } else if (child.material.name === 'Podium 2') {
                const items = child.parent.children.filter(e => e !== child)
                child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["podium-bottom-color"]))})
                child.material.roughness = Settings["podium-bottom-glasses"]
                child.material.needsUpdate = true;

                this.bottomPodium.push(child.material)

                items.forEach(e => {
                    if (!e.name.includes('Sprite')) {
                        e.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["podium-top-color"]))})
                        child.material.roughness = Settings["podium-top-glasses"]
                        child.material.needsUpdate = true;
                        this.topPodium.push(e.material)
                    }
                })
            } else {
                if (!child.name.includes('Table')) child.material = new THREE.MeshStandardMaterial({color: 0x00CFFF})
            }

            if (child.name !== 'Plane') child.receiveShadow = true
            else child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["plane-color"]))})

            child.traverse((e) => {

            });
        }))

        parent.add(model)
    },

    createIconTable(index, parent) {
        const map = this.getThreeTexture('step-' + index)

        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;

        map.flipY = false

        const geometry = new THREE.PlaneGeometry(500, 500);
        const material = new THREE.MeshStandardMaterial({map, color: 0xFF31BE, side: THREE.DoubleSide})

        material.transparent = true

        const plane = new THREE.Mesh(geometry, material);

        plane.name = 'Table-' + index

        plane.rotation.x = Math.PI / 2

        parent.add(plane);
    },

    generateMaterialJPG(material, basic = false) {
        const map = this.getThreeTexture(material);

        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;

        map.flipY = false

        const options = {
            map: map,
            side: THREE.DoubleSide
        }

        const newMaterial = basic ? new THREE.MeshBasicMaterial(options) : new THREE.MeshStandardMaterial(options)

        newMaterial.name = material;
        return newMaterial;
    },

    createShadow() {
        const sun = this["light_directional"];

        sun.castShadow = true;

        // Настройка области, в которой будут генерироваться тени
        const size = 30;

        sun.shadow.camera.left = -size;
        sun.shadow.camera.right = size;

        sun.shadow.camera.top = size;
        sun.shadow.camera.bottom = -size;

        sun.shadow.camera.near = 0.1;
        sun.shadow.camera.far = 1000;

        sun.shadow.bias = 0.1

        // Настройка разрешения карты теней (больше значение - лучше качество)
        const resolution = 960;
        sun.shadow.mapSize.width = resolution;
        sun.shadow.mapSize.height = resolution;

        this.sun = sun
    },

    updateCamera() {
        this.camera = App.World.Camera

        this.camera.near = 0.1
        this.camera.far = 1000

        this.movingCamera()

        this.camera.fov = Settings["camera-fov"]
        this.camera.lookAt(this.startPoint.x, this.startPoint.y + 0.25, this.startPoint.z)
    },

    movingCamera() {
        const vector = this.sphericalToCartesian(
            Settings["camera-distance"],
            THREE.MathUtils.degToRad(Settings["camera-azimuth"]),
            THREE.MathUtils.degToRad(Settings["camera-elevation"])
        )

        this.camera.position.set(vector.x, vector.y, vector.z);
    },

    sphericalToCartesian(radius, theta, phi) {
        const x = radius * Math.cos(phi) * Math.sin(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        return new THREE.Vector3(x, y, z);
    },

    isPointOnPlane(plane, point) {
        const box = new THREE.Box3().setdFromObject(plane);
        return box.max.x > point.x && box.min.x < point.x && box.max.y > point.y && box.min.y < point.y
    },

    computeGroupSize(group) {
        const box = this.computeGroup(group);  // Ограничивающий прямоугольник вокруг группы
        const size = new THREE.Vector3();
        box.getSize(size);
        return size;
    },

    computeGroup(group) {
        return new THREE.Box3().setFromObject(group);
    },

    launchStars(parent, originX = 0, originY = 0, count = 40, directionDeg = -90) {
        const directionRad = directionDeg * (Math.PI / 180);
        const spread = Math.PI / 3;

        const colors = [
            new THREE.Color("#fc1b00"), // Красный
            new THREE.Color("#ffd027"), // Желтый
            new THREE.Color("#71ff7d"), // Зеленый
            new THREE.Color("#ff268e"), // Розовый
            new THREE.Color("#2629ff")  // Синий
        ]

        for (let i = 0; i < count; i++) {
            // Создание частицы
            const material = new THREE.MeshBasicMaterial({
                map: this.getThreeTexture('confetti'),
                color: _.sample(colors),
                transparent: true,
                opacity: 1,
                depthWrite: false
            });

            const geometry = new THREE.PlaneGeometry(512 / 5, 512 / 5);

            const star = new THREE.Mesh(geometry, material)
            star.position.set(originX, originY, 0);
            star.scale.setScalar(Math.random() * 0.5 + 0.1);

            star.rotation.z = Math.random() * Math.PI * 2;

            parent.add(star);

            // Расчет движения
            const angle = directionRad + (Math.random() - 0.5) * spread;
            const speed = Math.random() * 1000 + 1000;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;


            // Анимация GSAP
            gsap.timeline()
                .to(material, {
                    opacity: 0,
                    duration: 1.5,
                    ease: "power2.out",
                })
                .to(star.rotation, {
                    z: star.rotation.z + Math.random() * 6,
                    duration: 1.5,
                    ease: "power2.out"
                }, '<')
                .to(star.position, {
                    duration: 1.5,
                    ease: "power2.out",
                    x: star.position.x + dx,
                    y: star.position.y + dy,
                    onComplete: () => {
                        parent.remove(star);
                        star.material.dispose();
                    }
                }, '<');
        }
    },

    splitIntoThreeParts(n) {
        if (n < 6) {
            throw new Error("Number must be at least 6");
        }

        let a, b, c;

        do {
            a = Math.floor(Math.random() * (n - 2)) + 1; // Генерация a от 1 до n-2
            b = Math.floor(Math.random() * (n - a - 1)) + 1; // Генерация b от 1 до n-a-1
            c = n - a - b;
        } while (a === b || a === c || b === c); // Проверка уникальности

        return [a, b, c];
    },

    convertWorldToGUI(position, screen) {
        const screenSpacePoint = position.clone().project(App.World.Camera);
        const cameraGUI = App.World.CameraGUI;

        const factorX = Math.abs(cameraGUI.left);
        const factorY = Math.abs(cameraGUI.bottom);

        const globalGUIPosition = new THREE.Vector3(
            factorX * screenSpacePoint.x,
            factorY * screenSpacePoint.y,
            0,
        );
        const localGUIPosition = screen["UIContainer"].worldToLocal(globalGUIPosition.clone());

        return new THREE.Vector3(localGUIPosition.x, localGUIPosition.y, 0);
    },

    choiceStarAnimation() {
        const texture = App.ThreeAssets["star-texture"]
        texture.colorSpace = THREE.NoColorSpace

        const stepParticleSystem = new SimpleParticleSystem.System(
            {capacity: 512, gravity: {x: 0, y: 2, z: 0}},
            {texture},
        );

        const starEmmiter = new SimpleParticleSystem.Emitter(
            {
                system: stepParticleSystem,
                playTime: 0.2,
                spawnRate: 512
            },
            {
                lifeTimeRange: {min: 0.25, max: 0.75},

                positionRange: {
                    min: {x: -0.3, y: 0, z: -0.3},
                    max: {x: 0.4, y: 2, z: 0.4},
                },
                rotationRange: {min: -Math.PI, max: Math.PI},
                scaleOverTime: [
                    {min: 0.05, max: 0.15},
                    {min: 0.2, max: 0.25},
                    {min: 0, max: 0},
                ],
                opacityOverTime: [
                    {min: 0, max: 0},
                    {min: 1, max: 1},
                    {min: 0, max: 0},
                ],

                velocityRange: {
                    theta: {min: 0, max: Math.PI * 2},
                    phi: {min: 0, max: 0.4},
                    magnitude: {min: 0.5, max: 2},
                },
                angularVelocityRange: {min: -Math.PI * 2, max: Math.PI * 2},
            },
        );

        this['girl'].add(starEmmiter);
        starEmmiter.position.set(0, 0, 0);

        this.starEmmiter = starEmmiter
        this.starParticleSystem = stepParticleSystem
    },

    choiceShiningAnimation() {
        const texture = App.ThreeAssets["shining-texture"]
        texture.colorSpace = THREE.NoColorSpace

        const stepParticleSystem = new SimpleParticleSystem.System(
            {capacity: 256, gravity: {x: 0, y: 2, z: 0}},
            {texture},
        );

        const shiningEmmiter = new SimpleParticleSystem.Emitter(
            {
                system: stepParticleSystem,
                playTime: 0.2,
                spawnRate: 128
            },
            {
                lifeTimeRange: {min: 0.25, max: 0.75},

                positionRange: {
                    min: {x: -0.2, y: -0.25, z: -0.2},
                    max: {x: 0.2, y: 0.75, z: 0.2},
                },
                rotationRange: {min: 0, max: 0},
                scaleOverTime: [
                    {min: 0.8, max: 0.9},
                    {min: 1, max: 1.1},
                    {min: 0, max: 0},
                ],
                opacityOverTime: [
                    {min: 0, max: 0},
                    {min: 0.5, max: 0.7},
                    {min: 0, max: 0},
                ],

                velocityRange: {
                    theta: {min: 0, max: 0},
                    phi: {min: 0, max: 0},
                    magnitude: {min: 0, max: 0},
                },
                angularVelocityRange: {min: 0, max: 0},
            },
        );

        this['girl'].add(shiningEmmiter);
        shiningEmmiter.position.set(0, 0.5, 0);

        this.shiningEmmiter = shiningEmmiter
        this.shiningParticleSystem = stepParticleSystem
    },

    getTime() {
        const timestamp = performance.now();

        this.rawDeltaTime = (timestamp - this.lastTime) / 1000;
        this.deltaTime = this.rawDeltaTime * this.timeScale;

        this.rawTime += this.rawDeltaTime;
        this.time += this.deltaTime;

        this.lastTime = timestamp;
    },

    getRandom(min, max) {
        return Math.random() * (max - min) + min;
    },

    convertHexColor(color) {
        return +("0x" + color.substring(1))
    },

    animateCamera(
        camera,
        targetPoint,
        newPosition,
        duration = 1,
        easeType = 'power2.inOut',
        onCompleteCallback = null,
        lookAtWeight = 0.9
    ) {
        // Вычисляем текущую точку, куда смотрит камера
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const currentTarget = new THREE.Vector3()
            .copy(camera.position)
            .add(direction.multiplyScalar(100)); // Используем расстояние 100 единиц

        const cameraProxy = {
            posX: camera.position.x,
            posY: camera.position.y,
            posZ: camera.position.z,
            tarX: currentTarget.x, // Начальное направление из текущей позиции
            tarY: currentTarget.y,
            tarZ: currentTarget.z
        };

        // Останавливаем предыдущие анимации камеры
        if (this.cameraTween) {
            this.cameraTween.kill();
        }

        this.cameraTween = gsap.to(cameraProxy, {
            duration: duration,
            ease: easeType,
            posX: newPosition.x,
            posY: newPosition.y,
            posZ: newPosition.z,
            tarX: targetPoint.x, // Анимируем направление к целевой точке
            tarY: targetPoint.y,
            tarZ: targetPoint.z,
            onUpdate: () => {
                camera.position.set(
                    cameraProxy.posX,
                    cameraProxy.posY,
                    cameraProxy.posZ
                );
                const currentLookAt = new THREE.Vector3(
                    cameraProxy.tarX,
                    cameraProxy.tarY,
                    cameraProxy.tarZ
                ).lerp(targetPoint, lookAtWeight);

                camera.lookAt(currentLookAt);

                // Обновляем матрицу камеры, если необходимо
                camera.updateMatrixWorld();
            },
            onComplete: () => {
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        });
    }
});