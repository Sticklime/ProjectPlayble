import gsap from 'gsap';
import Screen from 'Screen';
import {OrbitControls, Reflector} from 'three/examples/jsm/Addons.js';
import {AnimatedModelController} from '../Libs/Character';
import * as SimpleParticleSystem from "../Libs/SimpleParticleSystem/index";
import {AnimatedManModelController} from "Libs/Character/AnimatedManModelController";
import ThreeText from "ThreeText";
import * as THREE from "three";
import {LoopOnce} from "three";
import loader from "Loader";

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
                {
                    name: 'date-container',
                    type: 'three-group',
                    LTRB: "TR",
                    childs: [{
                        name: "date_banner",
                        type: 'three-image',
                        image: "date_banner",
                        position: [-17, 2000, 0],
                        scale: [1.2, 1.2, 1.2],
                        LTRB: "TC",
                    }]
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
                        {name: 'hand', anchor: [0, 0], type: 'three-image', image: 'hand-tutorial'}
                    ]
                }
            ]
        },
    ],

    Hooks: {
        beforeBuild() {

            this._emojiCameraLayer = new THREE.Group();
            App.World.Scene.add(this._emojiCameraLayer);
            this.updateChildParamsByName(Settings[this.Name]);

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

            App.World.Scene.background = new THREE.Color(0x0CBCE8);

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
            }

            this.correctSubject = {
                '1': 2,
                '2': 2,
                '3': 2,
            }


            this.firstClick = false;

            this.currentProgress = 1

            this.bottomPodium = []

            this.topPodium = []
        },

        build() {
            this.createShadow()
            this.createPodium()
            this.updateCamera()
            this.createPlaneProgress()

            loader.load('character.fbx', (fbx) => {
                const animations = fbx.animations;
                this.controllerYou = this.preassetGirl('YOU', parent, fbx, animations);
            });

            this.controllerEnemy = this.preassetMen("Man", this["enemy"]);

            this.controllerYou.configThirdBase()


            this['hand cont'].visible = false
            this['light_ambient'].intensity = Settings["ambient-light-intensity"]
            this['light_directional'].intensity = Settings["directional-light-intensity"]

            Broadcast.on(
                "Gameplay next_level Down",
                () => {
                    if (window.MraidSDK) MraidSDK.open("end screen button");
                    else alert("Click Out: end screen button");
                },
                this,
            );

            setTimeout(() => {
                gsap.to(this['date_banner'].position, {
                    y: 750,
                    duration: 1,
                    ease: "bounce.out"
                });
            }, 1000)
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

            this.updateProgress(this.currentProgress)
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
            const cam = this.camera;
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
            const emojiPos = cam.position.clone().add(forward.multiplyScalar(5)); // 5 — расстояние перед камерой

            this._emojiCameraLayer.position.copy(emojiPos);
            this._emojiCameraLayer.quaternion.copy(cam.quaternion);
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
                else this.playSound("sound-bg");
            }

            setTimeout(() => {
                gsap.killTweensOf(this['date_banner'].position);

                gsap.to(this['date_banner'].position, {
                    y: 2500,
                    duration: 1,
                    ease: "back.inOut(1.7)",
                    onComplete: () => {
                    }
                });
            }, 500)

            const pos = App.World.ThreeGUI.convertStageTouch(event);

            if (this.step === 1 && !this.firstClick) {
                this.transformEnemyThenStartGame();
                this.firstClick = true;
                return;
            }

            if (this.isPointOnPlane(this['button 1'], pos)) {
                this.choiceSubject(this['button 1'])
            } else if (this.isPointOnPlane(this['button 2'], pos)) {
                this.choiceSubject(this['button 2'])
            } else if (this.isPointOnPlane(this['button 3'], pos)) {
                this.choiceSubject(this['button 3'])
            } else {
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

            this['girl'].children[0].rotation.y += deltaX * 0.01;

            this.previousMouseX = pos.x;
        },

        'global:Stage Press Up': function (event, position) {
            this.isDragging = false
        },

        'global:Setting Changed': function (name, value) {

            this.updateSettings(name, value);

        }


    },

    transformEnemyThenStartGame() {
        this.spawnWhirlwindStarsWithTrails(
            this['enemy'],
            App.ThreeAssets["star-texture"],
            App.ThreeAssets["whirl-circle"],
        );

        setTimeout(() => {
            this.controllerEnemy.playAnimation('show', {
                loop: THREE.LoopOnce,
                onFinish: () => {
                    this.controllerEnemy.playAnimation('idle');
                    this.playGame();

                }
            });
        }, 0)


        setTimeout(() => {
            this.controllerEnemy.setManOutfitMode("wolf3d");
            this.makeEnemyFlashWhite();
        }, 900)
    },

    moveTargetPosition(girl, enemy) {
        if (!this.isMoved) return;

        if (this.currentWaypoint !== '6') {
            const nextTarget = this.checkpoints[this.currentWaypoint].clone();

            const targetVector = new THREE.Vector3(nextTarget.x, girl.position.y, nextTarget.z);

            const direction = targetVector.sub(girl.position).normalize();

            const dir_rotation = new THREE.Vector3()
                .subVectors(nextTarget, girl.position)
                .normalize();

            const angle = Math.atan2(dir_rotation.x, dir_rotation.z);

            girl.children[0].rotation.y = angle;

            const step = direction.multiplyScalar(this.speed * (1 / 60))

            girl.position.add(step)

            enemy.position.add(step)
            enemy.children[0].rotation.y = angle;

            this.camera.position.add(step)

            const distanceToTarget = girl.position.distanceTo(
                new THREE.Vector3(nextTarget.x, girl.position.y, nextTarget.z)
            );

            if (this.currentWaypoint === '0') {
                if (distanceToTarget < 0.1) {
                    this.spawnGirl(0, this['enemy'], this.controllerEnemy)

                    this.currentWaypoint = '1'

                    this.updateClothButtons()
                }
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

                        const icon = arr.find(e => this[e].children[0].name.split('-')[0] === 'beach')

                        this.playSound("sound-error");

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

    makeEnemyFlashWhite() {
        const model = this["enemy"].children[0];

        model.traverse(child => {
            if (child.isMesh && child.material && child.material.color) {
                if (!child.material.userData.originalColor) {
                    child.material.userData.originalColor = child.material.color.clone();
                }

                const originalColor = child.material.userData.originalColor;

                child.material.color.set(0xffffff);

                gsap.to(child.material.color, {
                    r: originalColor.r,
                    g: originalColor.g,
                    b: originalColor.b,
                    duration: 0.4,
                    ease: "power2.out"
                });
            }
        });
    },

    spawnWhirlwindStarsWithTrails(parent, starTexture, trailTexture,
                                  trailCount = 10,
                                  starCount = 15,
                                  radius = 0.01,
                                  height = 1.5,
                                  duration = 1.5,
                                  starSize = 0.35,
                                  trailSize = [1.5, 0.3]) {
        const fadeInTime = 0.3;
        const maxStagger = duration * 0.5;
        const amplitude = 0.5;

        for (let i = 0; i < trailCount; i++) {
            const trailMaterial = new THREE.MeshBasicMaterial({
                map: trailTexture,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                opacity: 0
            });
            const trailGeometry = this.createCurvedPlaneGeometry(0.8, Math.PI / 2, 12, trailSize[1]);
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            parent.add(trail);

            const angleOffset = Math.random() * Math.PI * 2;
            const spiralSpeed = 1 + Math.random() * 2;
            const baseY = 0.5 + Math.random() * height;
            const randomRadius = radius * (0.7 + Math.random() * 0.6);
            const startDelay = Math.random() * maxStagger;

            const tl = gsap.timeline({delay: startDelay});
            tl.to(trailMaterial, {opacity: 0.8, duration: fadeInTime}, 0)
                .to(trail.position, {
                    duration: duration,
                    onUpdate: function () {
                        const p = this.progress();
                        const angle = angleOffset + spiralSpeed * Math.PI * 2 * p;
                        const x = Math.cos(angle) * randomRadius;
                        const z = Math.sin(angle) * randomRadius;
                        const y = baseY + Math.sin(p * 20) * 0.2;
                        trail.position.set(x, y, z);
                        trail.rotation.y = -angle + Math.PI;
                    },
                    ease: "sine.inOut"
                }, 0)
                .to(trailMaterial, {opacity: 0, duration: 0.5}, duration - 0.5)
                .eventCallback("onComplete", () => {
                    parent.remove(trail);
                    trailGeometry.dispose();
                    trailMaterial.dispose();
                });
        }

        for (let i = 0; i < starCount; i++) {
            const starMaterial = new THREE.MeshBasicMaterial({
                map: starTexture,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                opacity: 0
            });
            const starGeometry = new THREE.PlaneGeometry(starSize, starSize);
            const star = new THREE.Mesh(starGeometry, starMaterial);
            parent.add(star);

            const angleOffset = Math.random() * Math.PI * 2;
            const baseY = 0.5 + Math.random() * height + 0.4;
            const randomRadius = radius + 0.5 * (0.7 + Math.random() * 0.6);
            const noiseStrength = 0.4 + Math.random() * 0.2;
            const startDelay = Math.random() * maxStagger;

            const initialX = Math.cos(angleOffset) * randomRadius;
            const initialZ = Math.sin(angleOffset) * randomRadius;

            const tl = gsap.timeline({delay: startDelay});
            tl.to(starMaterial, {opacity: 0.8, duration: fadeInTime}, 0)
                .to(star.position, {
                    duration: duration,
                    onUpdate: function () {
                        const p = this.progress();
                        const noiseX = Math.sin(p * 20 + i) * noiseStrength * (1 - p);
                        const noiseZ = Math.cos(p * 25 + i) * noiseStrength * (1 - p);
                        const x = initialX + noiseX;
                        const z = initialZ + noiseZ;
                        const y = baseY - height * p;
                        star.position.set(x, y, z);
                    },
                    ease: "none"
                }, 0)
                .to(star.rotation, {z: Math.random() * Math.PI * 8, duration: duration, ease: "sine.inOut"}, 0)
                .to(starMaterial, {opacity: 0, duration: 0.5}, duration - 0.5)
                .eventCallback("onComplete", () => {
                    parent.remove(star);
                    starGeometry.dispose();
                    starMaterial.dispose();
                });
        }
    },


    createCurvedPlaneGeometry(radius = 1, angle = Math.PI / 3, segments = 12, width = 0.3) {
        const geometry = new THREE.BufferGeometry();

        const positions = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const theta = -angle / 2 + angle * t;

            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;

            positions.push(x, width / 2, z);
            positions.push(x, -width / 2, z);

            uvs.push(t, 1);
            uvs.push(t, 0);

            if (i < segments) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }
        }

        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        geometry.rotateY(Math.PI);

        return geometry;
    },

    spawnGirl(index, parent, controller) {
        if (controller.text === 'YOU') {
            if (index === 1) controller.configSecondBase()
            else if (index === 2) controller.configThirdBase()
        } else {
            gsap.timeline()
                .to(parent.scale, {
                    x: 1, y: 1, z: 1, duration: 0.2, onComplete: () => {
                    }
                })
        }
    }
    ,


    preassetGirl(text, parent, fbx_scene, animations) {
        const model = this.cloneModel(fbx_scene);


        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });

        let girlBaseGroup = null;

        model.traverse(child => {
            if (child.name === "Model_Girl_Base" && child.type === "Group") {
                girlBaseGroup = child;

                if (child.isMesh) {
                    child.material.roughness = 0.45;
                    child.material.metalness = 0.1;
                }
            }

            if (child.name === "Eyelashes") {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(Settings["eyelashe-color"]),
                    roughness: 0.45,
                    metalness: 0.1
                });
            }

            if (child.name === "Lips") {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(Settings["lip-color"]),
                    roughness: 0.45,
                    metalness: 0.1
                });
            }
        });

        model.rotation.y = Math.PI


        if (girlBaseGroup) {
            girlBaseGroup.traverse(subChild => {
                if (subChild.name === "Model_Girl_Base_1") {

                    let color = Settings["model-1-skin-color"];

                    subChild.material = new THREE.MeshStandardMaterial({
                        color: color,
                        roughness: Settings["model-girl-roughness"],
                        metalness: Settings["model-girl-gloss"],
                        skinning: !!subChild.skeleton
                    });
                }
                if (subChild.name === "Model_Girl_Base") {

                    let color = 0xff0000;

                    subChild.material = new THREE.MeshStandardMaterial({
                        color: color,

                        skinning: !!subChild.skeleton
                    });
                }

            });
        }

        const controller = new AnimatedModelController(model, glb_asset.animations.slice(0), this.camera, text);

        controller.createAnimationSegment('idle', 0, 104);
        controller.createAnimationSegment('walk', 135, 165.5);
        controller.createAnimationSegment('show', 170, 246);
        controller.createAnimationSegment('crying', 252, 291);
        controller.createAnimationSegment('cryingLoop', 291, 309);

        controller.playAnimation('idle')

        parent.position.set(this.startPoint.x + 0.7, this.startPoint.y, this.startPoint.z)

        parent.add(model)

        return controller
    }
    ,

    preassetMen(text, parent) {
        const glb_asset = App.ThreeAssets["man"]

        const model = this.cloneModel(glb_asset.scene)

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.material.metalness = Settings["model-man-gloss"];
                child.material.roughness = Settings["model-man-roughness"];
            }

            if (child.name === "Shirt") {
                const shirtColor = Settings["shirt-color"];
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(shirtColor),
                    roughness: Settings["model-man-roughness"] ?? 0.45,
                    metalness: Settings["model-man-gloss"] ?? 0.1
                });
            }

            if(child.name === "Wolf3D_Outfit_Footwear"){
                child.material = new THREE.MeshStandardMaterial({
                    roughness: 0.8
                });
            }

            if (child.name === "ManBody006_2") {
                const bodyColor = Settings["hair-man-color"];
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(bodyColor),
                    roughness: Settings["model-man-roughness"] ?? 0.45,
                    metalness:0.5
                });
            }
        });

        const controller = new AnimatedManModelController(model, glb_asset.animations.slice(0), this.camera, text);

        controller.createAnimationSegment('idle', 1, 203);
        controller.createAnimationSegment('walk', 211.5, 244);
        controller.createAnimationSegment('show', 250, 298);
        controller.createAnimationSegment('mockery', 307, 333);
        controller.createAnimationSegment('mockeryLoop', 320, 345);
        controller.createAnimationSegment('kiss', 386, 418);
        controller.createAnimationSegment('kissLoop', 418, 433);
        parent.position.set(this.startPoint.x - 0.7, this.startPoint.y, this.startPoint.z)

        parent.add(model)

        controller.playAnimation("idle");
        model.rotation.y = Math.PI

        parent.scale.set(1, 1, 1)
        setTimeout(() => {

        }, 2000)

        return controller
    },


    createSpawnTextEffect(index) {
        const text = this['text effect'].children[index]

        text.position.set(this['cloth panel cont'].position.x, this['cloth panel cont'].position.y + 150, text.position.z)

        text.scale.set(0, 0, 0)

        gsap.timeline()
            .to(text.position, {y: text.position.y + 350, duration: 0.25, repeat: 1, yoyo: true})
            .to(text.scale, {x: 1.2, y: 1.2, z: 1.2, duration: 0.8, repeat: 1, yoyo: true}, '<')
    }
    ,

    updateClothButtons() {
        this.steps = {
            '1': ['ToiletSet', 'GoodChose', 'Clownish'],
            '2': ['ToiletSet', 'GoodChose', 'Clownish'],
            '3': ['ToiletSet', 'GoodChose', 'Clownish'],
            '4': ['ToiletSet', 'GoodChose', 'Clownish'],
        };

        const partMap = {
            '1': 'Shoes',
            '2': 'Top',
            '3': 'Accessories',
            '4': 'Hair'
        };

        const buttons = ['button 1', 'button 2', 'button 3'];
        const index = this.currentWaypoint;
        const clothesForStep = this.steps[index];

        const shuffled = _.shuffle(clothesForStep);
        const correctIndex = shuffled.findIndex(name => name === 'GoodChose');
        this.correctSubject[this.currentWaypoint] = correctIndex;

        buttons.forEach((btnName, i) => {
            const btn = this[btnName];
            const icon = btn.children[1];

            btn.children[0].visible = false;
            if (icon.children[0]) icon.children[0].removeFromParent();

            const modelName = shuffled[i];

            const part = partMap[this.currentWaypoint];
            const imageKey = `${modelName}_${part}`;

            this.buildThreeChild(icon, {
                size: [230, 230],
                type: 'three-image',
                image: imageKey,
                userData: {modelName, index}
            });

            btn.cloth = modelName;
        });
    }
    ,

    choiceSubject(elem) {
        if (!this['cloth panel cont'].complete) return;

        this['cloth panel cont'].complete = false;
        this.hideTutorial();

        gsap.to(this['cloth panel cont'].scale, {
            x: 0, y: 0, z: 0, duration: 0.2, onComplete: () => {
                this.currentProgress = 1
                this.updateProgress(this.currentProgress)
                if (+this.currentWaypoint < 5) this.updateClothButtons()
            }
        });

        const name_concept = elem.children[1];
        const iconImage = name_concept.children[0];

        const modelName = iconImage.userData.modelName;
        const modelIndex = iconImage.userData.index;

        this.controllerYou.changeCloth(modelIndex, modelName);

        this.speed = 2;
        this.controllerYou.setAnimationSpeed(1);
        this.controllerEnemy.setAnimationSpeed(1);

        const index = (modelName === "GoodChose") ? _.random(0, 2) : _.random(3, 5);
        const index2 = (modelName === "GoodChose") ? 0 : _.sample([1, 2]);

        if (index2) {
            this.playSound("sound-error");
        } else {
            this.playSound("sound-correct");
        }
        this.createSpawnTextEffect(index);

        this.choiceNextTarget();
    }
    ,

    choiceNextTarget() {
        let nextKey = null;
        let check = false

        for (var key in this.checkpoints) {
            if (check && !nextKey) nextKey = key

            if (key === this.currentWaypoint) check = true
        }

        this.currentWaypoint = nextKey
    }
    ,

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

        if (name === "podium-top-color") {
            this.topPodium.forEach(e => {
                e.color = new THREE.Color(this.convertHexColor(Settings["podium-top-color"]))
            })
        }

        if (name === "podium-bottom-color") {
            this.bottomPodium.forEach(e => {
                e.color = new THREE.Color(this.convertHexColor(Settings["podium-bottom-color"]))
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

    }
    ,

    updateProgress(value) {
        const minValue = 0;

        let topLeft = App.World.ThreeGUI.convertStageTouch({x: 0, y: 0});
        const size = this.computeGroupSize(this['progress line'])

        const clippingValue = THREE.MathUtils.lerp(minValue, size.x, value) + topLeft.x + 100
        this.clippingPlane.constant = clippingValue;
    }
    ,

    playGame() {
        if (this.step === 1) {
            this.step = 2;
            this.hideTutorial();


            this.animateCamera(
                this.camera,
                new THREE.Vector3(this.startPoint.x - 4, this.startPoint.y, this.startPoint.z + 4),
                new THREE.Vector3(this.startPoint.x + 4, this.startPoint.y + 1.4, this.startPoint.z - 7),
                1,
                'power2.in'
            );

            let target = new THREE.Vector3(this.startPoint.x , this.startPoint.y+ 1.4, this.startPoint.z);

            gsap.timeline()
                .to(target, {
                    x: this.startPoint.x - 0.2,
                    y: this.startPoint.y + 1.4,
                    z: this.startPoint.z,
                    duration: 1,
                    onUpdate: () => {
                        const clone = target.clone();
                        this.camera.lookAt(clone);
                    },
                    onComplete: () => {
                        this.isMoved = true;
                        this.controllerYou.playAnimation('walk');
                        this.controllerEnemy.playAnimation('walk');
                        this.step = 3;
                    }
                });
        }
    },

    transferCameraEnd() {
        this.step = 4;

        this.control = null;

        const centerPoint = new THREE.Vector3(0.4, 1, 0);
        const offset = new THREE.Vector3(-0.6, 0, -16);

        const camOneSide = this.startPoint.clone().add(offset);
        let sumYou = this.controllerYou.sumScore();

        const direction = new THREE.Vector3().subVectors(centerPoint, camOneSide);
        const newPosition = centerPoint.clone().add(direction);

        setTimeout(() => {
            this.controllerYou.playAnimation('show', {loop: THREE.LoopOnce});

            setTimeout(() => {
                this.controllerYou.createLastArrows();
                this.playSound("sound-stars");
            }, 1000);

            this.controllerEnemy.playAnimation('idle', {loop: THREE.LoopRepeat});

            this.animateCamera(
                this.camera,
                new THREE.Vector3(this["girl"].position.x, this["girl"].position.y + 1, this["girl"].position.z),
                new THREE.Vector3(1.44, 1.5, -8),
                0.45,
                'circInOut'
            );

            setTimeout(() => {
                this.controllerYou.arrows.forEach((e, i) => {
                    gsap.timeline().to(e.cont.scale, {x: 0, y: 0, z: 0, duration: 0.25}, i * 0.1);
                });
            });
        });

        setTimeout(() => {
            this['arrows cont'].visible = false;
            this.OnEnd();
        }, 2000)

        this.controllerEnemy.playAnimation('idle', {loop: THREE.LoopOnce});
        this.controllerYou.playAnimation('show', {loop: THREE.LoopOnce});
    },

    startHeartLoop(target, textureKey = "heart") {
        if (!this._heartLoops) this._heartLoops = new Map();
        const heartKeys = ["heart"];

        const spawnHeart = () => {
            const randomKey = heartKeys[Math.floor(Math.random() * heartKeys.length)];
            const texture = App.ThreeAssets[randomKey];
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                //color: new THREE.Color(0xff0000),
                transparent: true,
                depthWrite: false,
                depthTest: false,
                opacity: 1,
                side: THREE.DoubleSide
            });

            const size = 0.9;
            const geometry = new THREE.PlaneGeometry(size, size);
            const heart = new THREE.Mesh(geometry, material);
            heart.renderOrder = 9999;

            const radius = 0.2 + Math.random() * 0.2;
            const angle = Math.random() * Math.PI * 2;

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = 0.6 + Math.random() * 0.3;

            heart.position.set(x, y, z);
            heart.scale.set(0.2, 0.2, 0.2);
            target.add(heart);

            const floatY = 1.2 + Math.random() * 0.3;

            gsap.to(heart.position, {
                x: x + (Math.random() - 0.5) * 0.1,
                y: y + floatY,
                z: z + (Math.random() - 0.5) * 0.1,
                duration: 1.8,
                ease: "sine.out"
            });

            gsap.to(heart.scale, {
                x: 0.35,
                y: 0.35,
                z: 0.35,
                duration: 0.8,
                repeat: 1,
                yoyo: true,
                ease: "sine.inOut"
            });

            gsap.to(material, {
                opacity: 0,
                duration: 1.5,
                ease: "sine.in",
                onComplete: () => {
                    target.remove(heart);
                    heart.geometry.dispose();
                    heart.material.dispose();
                }
            });

            const nextDelay = Math.random() * 500;
            const loopId = setTimeout(spawnHeart, nextDelay);
            this._heartLoops.set(target.uuid, loopId);
        };

        spawnHeart();
    },

    OnEnd() {
        let sumYou = this.controllerYou.sumScore();

        let centerPoint = new THREE.Vector3();
        let offset = new THREE.Vector3();

        let camOneSide = this.startPoint.clone().add(offset);

        let direction = new THREE.Vector3();
        let newPosition = new THREE.Vector3();

        if (sumYou < 4) {

            this.controllerYou.playAnimation('crying', {
                loop: THREE.LoopOnce, forceRestart: true, onFinish: () => {
                    this.controllerYou.playAnimation('cryingLoop', {loop: THREE.LoopPingPong, forceRestart: true});
                }
            });
            this.controllerEnemy.model.lookAt(this['girl'].position);
            this.controllerEnemy.playAnimation('mockery', {
                loop: THREE.LoopOnce, onFinish: () => {
                    this.controllerEnemy.playAnimation('mockeryLoop', {loop: THREE.LoopPingPong, timeScale: 0.8});
                }
            });


            centerPoint = new THREE.Vector3(0, 1, 0);
            offset = new THREE.Vector3(0, 0, -14);

            camOneSide = this.startPoint.clone().add(offset);

            direction = new THREE.Vector3().subVectors(centerPoint, camOneSide);
            newPosition = centerPoint.clone().add(direction);

            this.animateCamera(
                this.camera,
                centerPoint,
                newPosition,
                0.8,
                'power2.inOut',
            );

            setTimeout(() => this.showEndCard(false), 1100);
        } else {
            this.controllerEnemy.playAnimation('walk', {loop: THREE.LoopOnce});
            const girlPos = this['girl'].position.clone();
            girlPos.x -= 0.4;
            const duration = 1.0;
            centerPoint = new THREE.Vector3(0.4, 1, 0);
            offset = new THREE.Vector3(-0.6, 0, -14);

            camOneSide = this.startPoint.clone().add(offset);

            direction = new THREE.Vector3().subVectors(centerPoint, camOneSide);
            newPosition = centerPoint.clone().add(direction);

            this.animateCamera(
                this.camera,
                centerPoint,
                newPosition,
                0.6,
                'power2.inOut',
            );

            gsap.to(this['enemy'].position, {
                x: girlPos.x + 0.2,
                y: girlPos.y,
                z: girlPos.z - 0.4,
                duration: duration,
                ease: 'power1.inOut',
                onUpdate: () => {
                    this.controllerEnemy.model.lookAt(this['girl'].position);
                },
                onComplete: () => {
                    this.controllerYou.model.lookAt(this['enemy'].position);
                    this.controllerEnemy.model.lookAt(this['girl'].position);

                    this.controllerEnemy.playAnimation('kiss', {
                        loop: THREE.LoopOnce, onFinish: () => {
                            this.controllerEnemy.playAnimation('kissLoop', {loop: THREE.LoopPingPong, timeScale: 0.8});
                            this.startHeartLoop(this["girl"]);
                            this.startHeartLoop(this["enemy"]);
                            for (let i = 0; i < 1; i++) {
                                setTimeout(() => {
                                    if (window.MraidSDK) {
                                        MraidSDK.playSound("sound-kiss");
                                    } else {
                                        this.playSound("sound-kiss");
                                    }
                                }, i * 1000);
                            }
                        }
                    });
                }
            });
            this.controllerEnemy.model.lookAt(this['girl'].position);
            this.controllerYou.playAnimation('idle', {
                loop: THREE.LoopRepeat,
                forceRestart: true,
                fadeIn: 0.2
            });
            setTimeout(() => this.showEndCard(true), 1600);
        }
    },

    showEmojiEffect(emojiKey, count = 7, area = 1, height = 0, duration = 1.5) {
        const texture = App.ThreeAssets[emojiKey];

        const spawnOrigin = new THREE.Vector3(
            (Math.random() - 0.5) * area,
            (Math.random() - 0.5) * area,
            0
        );

        for (let i = 0; i < count; i++) {
            const delay = i * 0.07;

            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                opacity: 1,
                side: THREE.DoubleSide
            });

            const geometry = new THREE.PlaneGeometry(0.15, 0.15);
            const emoji = new THREE.Mesh(geometry, material);


            const angle = (i / count) * Math.PI * 2;
            const radius = 0.2;
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;

            emoji.position.set(
                spawnOrigin.x + offsetX,
                spawnOrigin.y + offsetY,
                spawnOrigin.z
            );

            this._emojiCameraLayer.add(emoji);

            gsap.to(emoji.position, {
                y: emoji.position.y +0.4+ Math.random() * 1,
                duration: duration,
                ease: "power1.out",
                delay: delay
            });

            gsap.to(material, {
                opacity: 0,
                duration: duration,
                ease: "power2.in",
                delay: delay,
                onComplete: () => {
                    this._emojiCameraLayer.remove(emoji);
                    geometry.dispose();
                    material.dispose();
                }
            });
        }
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
            image: score === 1 ? _.sample(['emoji_1', 'emoji_2']) : 'emoji_3'
        })

        emoji.position.x = 275

        cont.position.copy(converted_coord)

        cont.scale.set(0, 0, 0)

        gsap.timeline().to(cont.scale, {x: 1, y: 1, z: 1, duration: 0.4}, index * 0.1)

        parent.add(cont)

        return cont
    },

    showEndCard(isWin) {
        this['buttons cta cont'].children.forEach(e => {
            e.scale.set(0, 0, 0);
        });

        if (isWin) {
            //this.showEmojiEffect(this['girl'], 'emoji_1', 25, 2.2);

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

            const btn = this['buttons cta cont'].children.find(e => e.image === "button-next-level");
            gsap.to(btn.scale, {x: 1, y: 1, z: 1, duration: 0.3, delay: 0.7});

            btn.userData = btn.userData || {};
            btn.userData._clickHandler = () => {
                if (window.MraidSDK) MraidSDK.open("end screen button");
                else alert("Click Out: end screen button");
            };
            btn.event = "next_level";
        } else {
            // this.showEmojiEffect(this['girl'], 'emoji_3', 15, 1.1);

            const btn = this['buttons cta cont'].children.find(e => e.image === "button-try-again");
            gsap.to(btn.scale, {x: 1, y: 1, z: 1, duration: 0.3, delay: 0.7});

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

            btn.userData = btn.userData || {};
            btn.userData._clickHandler = () => {
                if (window.MraidSDK) MraidSDK.open("end screen button");
                else alert("Click Out: end screen button");
            };
            btn.event = "next_level";
        }
    }
    ,

    flyMode(x, y, z, enableZoom = true, enableRotate = true, enablePan = true) {
        if (!this.control) this.control = new OrbitControls(App.World.Camera, App.World.Renderer.domElement)

        this.control.target.set(x, y, z);

        this.control.update();

        this.control.enableZoom = enableZoom;
        this.control.enableRotate = enableRotate;
        this.control.enablePan = enablePan;
    }
    ,

    syncCameraWithControls() {
        if (!this.control) return;


        const target = this.control.target.clone();

        const direction = new THREE.Vector3().subVectors(this.camera.position, target).normalize();

        const distance = this.camera.position.distanceTo(target);


        const basePosition = direction.clone().multiplyScalar(distance).add(target);

        const left = new THREE.Vector3().crossVectors(this.camera.up, direction).normalize();
        const offset = 10;

        const finalPosition = basePosition.clone().add(left.multiplyScalar(offset));

        this.camera.position.copy(finalPosition);
        this.camera.lookAt(target);
    }
    ,

    startGame() {
        if (window.MraidSDK) MraidSDK.track('Game Starts');

        this.step = 1;
        this.tutorialTimeout(0);
    }
    ,

    tutorialTimeout(timeout = Settings["tutorial-timeout"]) {
        this.hideTutorial();

        this.TutorialTimeout = setTimeout(() => {
            if (Settings["tutorial"]) {
                if (this.step === 1) {

                    const center = new THREE.Vector3(0, 0, 0);
                    this['hand cont'].position.set(center.x, center.y - 50, 100);
                    this['hand cont'].visible = true;
                    this.TutorialAnimation = gsap.timeline({
                        repeat: -1,
                        repeatDelay: 0,
                        yoyo: true,
                        ease: "sine.inOut"
                    })
                        .to(this['hand'].scale, {
                            x: 0.85,
                            y: 0.85,
                            z: 0.85,
                            duration: 0.3,
                            ease: "out"
                        })
                        .to(this['hand'].scale, {
                            x: 1.0,
                            y: 1.0,
                            z: 1.0,
                            duration: 0.25,
                            ease: "back.out"
                        });
                } else if (this.step === 2) {

                    const startPosition = new THREE.Vector3();
                    this['button'].getWorldPosition(startPosition);

                    this.TutorialAnimation = gsap.timeline({repeat: -1});
                    this['hand cont'].position.set(startPosition.x, startPosition.y - 15, 100);
                    this['hand cont'].visible = true;

                    this.TutorialAnimation
                        .to(this['hand'].scale, {x: 0.95, y: 0.95, z: 0.95, duration: 0.3, repeat: 1, yoyo: true})
                        .to(this['button'].scale, {
                            x: 0.95,
                            y: 0.95,
                            z: 0.95,
                            duration: 0.3,
                            repeat: 1,
                            yoyo: true
                        }, '<');
                } else if (this.step === 3) {
                    const steps = ['button 1', 'button 2', 'button 3'];
                    const startPosition = new THREE.Vector3();
                    this[steps[0]].getWorldPosition(startPosition);

                    this.TutorialAnimation = gsap.timeline({repeat: -1});
                    this['hand cont'].position.set(startPosition.x, startPosition.y - 15, 100);
                    this['hand cont'].visible = true;

                    steps.forEach((e, i) => {
                        const position = new THREE.Vector3();
                        this[e].getWorldPosition(position);

                        this.TutorialAnimation
                            .to(this['hand cont'].position, {
                                x: position.x,
                                y: position.y - 15,
                                z: 100,
                                duration: 0.3,
                                onComplete: () => {
                                    if (this.correctSubject[this.currentWaypoint] === i) {
                                        this[e].children[0].visible = true;
                                    }
                                }
                            })
                            .to(this['hand'].scale, {
                                x: 0.95,
                                y: 0.95,
                                z: 0.95,
                                duration: 0.3,
                                repeat: 1,
                                yoyo: true
                            })
                            .to(this[e].scale, {
                                x: 0.95,
                                y: 0.95,
                                z: 0.95,
                                duration: 0.3,
                                repeat: 1,
                                yoyo: true,
                                onComplete: () => {
                                    if (this.correctSubject[this.currentWaypoint] === i) {
                                        this[e].children[0].visible = false;
                                    }
                                }
                            }, '<');
                    });
                }
            }
        }, timeout);
    }
    ,

    hideTutorial() {
        clearTimeout(this.TutorialTimeout);

        if (this.TutorialAnimation) {
            this.TutorialAnimation.kill();
            this.TutorialAnimation = null;
        }

        let steps = null;

        if (this.step === 2) {
            steps = ['button'];
        } else if (this.step === 3) {
            steps = ['button 1', 'button 2', 'button 3'];
        }

        if (steps) {
            steps.forEach(e => {
                if (this[e]) {
                    this[e].scale.set(1, 1, 1);
                }
            });
        }

        if (this['hand']) {
            this['hand'].scale.set(1, 1, 1);
        }
        if (this['hand cont']) {
            this['hand cont'].visible = false;
        }
    }
    ,

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


                this.createIconTable(+key + 1, child.children[2])

            } else if (child.name.includes('End')) {
                const key = child.name.split('_')[1]

                const worldPosition = new THREE.Vector3();
                child.getWorldPosition(worldPosition);

                worldPosition.x += 0.75

                this.checkpoints['5'] = worldPosition
            }

            if (child.name === "SC_Bld_14_Brown") {
                child.position.x -= 1700;
            }

            if (child.name === "SC_Bld_EiffelTower") {
                child.position.x += 800;
                child.position.y += 600;
            }

            if (child.name === "SC_Bld_11_Brown") {
                child.position.x += 900;
                child.position.y += 600;
            }

            if (child.name === "Tree_A_(1)") {
                child.position.y += 2500;
                child.visible = false;
            }

            if (!child.material) return;

            if (child.material.name === 'Podium') {
                const items = child.parent.children.filter(e => e !== child)
                child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["podium-top-color"]))})
                this.topPodium.push(child.material)

                items.forEach(e => {
                    if (!e.name.includes('Sprite')) {
                        e.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["podium-bottom-color"]))})

                        this.bottomPodium.push(e.material)
                    }
                })
            } else if (child.material.name === 'Podium 2') {
                const items = child.parent.children.filter(e => e !== child)
                child.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["podium-bottom-color"]))})

                this.bottomPodium.push(child.material)

                items.forEach(e => {
                    if (!e.name.includes('Sprite')) {
                        e.material = new THREE.MeshStandardMaterial({color: new THREE.Color(this.convertHexColor(Settings["podium-top-color"]))})
                        this.topPodium.push(e.material)
                    }
                })
            } else {
                if (!child.name.includes('Table')) child.material = new THREE.MeshStandardMaterial({color: 0x00CFFF})
            }

            if (child.name !== 'Plane') child.receiveShadow = true
            else child.material = new THREE.MeshBasicMaterial({color: 0xffffff})
        }))

        parent.add(model)
    }
    ,

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
    }
    ,

    createShadow() {
        const sun = this["light_directional"];

        sun.castShadow = true;

        const size = 30;

        sun.shadow.camera.left = -size;
        sun.shadow.camera.right = size;

        sun.shadow.camera.top = size;
        sun.shadow.camera.bottom = -size;

        sun.shadow.camera.near = 0.1;
        sun.shadow.camera.far = 1000;

        sun.shadow.bias = 0.1

        const resolution = 960;
        sun.shadow.mapSize.width = resolution;
        sun.shadow.mapSize.height = resolution;

        this.sun = sun
    }
    ,

    updateCamera() {
        this.camera = App.World.Camera

        this.camera.near = 0.1
        this.camera.far = 1000

        this.movingCamera()

        this.camera.fov = Settings["camera-fov"]

        this.cameratOriginalPosition = new THREE.Vector3();
        this.cameratOriginalPosition.copy(this.camera.rotation);

        this.camera.position.set(this.startPoint.x, this.startPoint.y + 2.3, this.startPoint.z - 5.5)
        this.camera.lookAt(this.startPoint.x, this.startPoint.y + 1.4, this.startPoint.z)
    }
    ,

    movingCamera() {
        const vector = this.sphericalToCartesian(
            Settings["camera-distance"],
            THREE.MathUtils.degToRad(Settings["camera-azimuth"]),
            THREE.MathUtils.degToRad(Settings["camera-elevation"])
        )

        this.camera.position.set(vector.x + 1, vector.y, vector.z + 1);
    }
    ,

    sphericalToCartesian(radius, theta, phi) {
        const x = radius * Math.cos(phi) * Math.sin(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        return new THREE.Vector3(x, y, z);
    }
    ,

    isPointOnPlane(plane, point) {
        const box = new THREE.Box3().setFromObject(plane);
        return box.max.x > point.x && box.min.x < point.x && box.max.y > point.y && box.min.y < point.y
    }
    ,

    computeGroupSize(group) {
        const box = this.computeGroup(group);
        const size = new THREE.Vector3();
        box.getSize(size);
        return size;
    }
    ,

    computeGroup(group) {
        return new THREE.Box3().setFromObject(group);
    }
    ,

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
    }
    ,

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
    }
    ,

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
    }
    ,

    getTime() {
        const timestamp = performance.now();

        this.rawDeltaTime = (timestamp - this.lastTime) / 1000;
        this.deltaTime = this.rawDeltaTime * this.timeScale;

        this.rawTime += this.rawDeltaTime;
        this.time += this.deltaTime;

        this.lastTime = timestamp;
    }
    ,

    getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }
    ,

    convertHexColor(color) {
        return +("0x" + color.substring(1))
    }
    ,

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
})
;