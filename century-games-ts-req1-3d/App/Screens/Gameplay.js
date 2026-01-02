// App/Gameplay.ts
// Экран с логикой «прожига» + FPS-руки поверх сцены (holder синхронизируется с камерой каждый кадр)

import Screen from 'Screen'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import {AnimatedModelController} from 'AnimatedModelController'
import {HoverTransparency} from 'HoverTransparency'
import Broadcast from "Broadcast";
import {Hands, HandsState, WaterGunType} from "Hands";
import {CoinCollector} from "CoinCollector";
import {UICoinAnimator} from 'UICoinAnimator'
import {CameraTransitionAnimator} from 'CameraTransitionAnimator'
import {SceneTraversal} from 'three-zoo'
import {Couple} from 'Couple'
import {ParticleEmitter, ParticleSystem} from 'Libs/TinyParticleSystem'
import {Vector3} from "three";

// AssetKeeper provides direct access to texture assets
const AssetKeeper = App.ThreeAssets;

App.Gameplay = new Screen({

    Name: 'Gameplay',

    Containers: [
        {
            name: 'MainContainer',
            scaleStrategyLandscape: ['fit-to-screen', 1920, 1080],
            scaleStrategyPortrait: ['fit-to-screen', 1080, 1920],
            childs: [
                {
                    name: 'sun_light',
                    type: 'three-directional-light',
                    color: '#fff9e6',
                    intensity: 1.3,
                    position: [-100, 200, -100]
                },
                {name: 'ambient_light', type: 'three-ambient-light', color: '#ffffff', intensity: 1},
                {name: 'game container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: []},
                {name: 'fx_container', type: 'three-group', position: [0, 0, 0], rotation: [0, 0, 0], childs: []},
                // {name: 'ui_logo', type: 'three-image', image: 'logo', anchor: ['top', 'right'], offset: [-280, 24]},

            ]
        },
        {
            name: 'UIContainer',
            type: 'three-ui',
            childs: [
                {
                    name: 'UIBubbleContainer',
                    positionLandscape: [0, 0.5],
                    positionPortrait: [0, 0.5],
                    LTRBLandscape: "T",
                    LTRBPortrait: "T",
                    stickinessLandscape: [0.99, 0.99],
                    stickinessPortrait: [0.99, 0.99],
                    childs: [{
                        name: "ui_bubble",
                        type: 'three-image',
                        image: 'oh-no-this-is-my-wife-bubble',
                        scale: 1.25,
                        childs: [{
                            name: "angry-smiley",
                            type: 'three-image',
                            image: 'angry-smiley-particle',
                            scale: 0.5,
                            position: [200, 70]
                        }]
                    }]
                },
                {
                    name: 'ui_logo',
                    positionLandscape: [-0.99, 0.99],
                    positionPortrait: [-0.99, 0.99],
                    LTRBLandscape: "TL",
                    LTRBPortrait: "TL",
                    stickinessLandscape: [0.99, 0.99],
                    stickinessPortrait: [0.99, 0.99],
                    childs: [{
                        name: "T_Download_Button",
                        type: 'three-image',
                        image: 'logo',
                        position: [150, -150],
                        event: "download_button",
                    }]
                },
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
                            image: "coin-wallet",
                            position: [-200, -100],
                            childs: [
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
                            image: "download",
                            position: [200, 100],
                            event: "download_button",
                        },
                    ],
                },


                {
                    name: 'UIClickTutorialContainer', type: 'three-ui', childs: [
                        {
                            name: 'ui-click-tutorial-title',
                            type: 'three-image',
                            image: 'tap-to-play-image',
                            position: [0, -150]
                        },
                        {
                            name: 'ui-click-tutorial-circle-0',
                            type: 'three-image',
                            image: 'tap-circle-1',
                            position: [0, -350]
                        },
                        {
                            name: 'ui-click-tutorial-circle-1',
                            type: 'three-image',
                            image: 'tap-circle-2',
                            position: [0, -350]
                        },
                        {
                            name: 'ui-click-tutorial-hand',
                            type: 'three-image',
                            image: 'hand',
                            scale: 0.4,
                            anchor: [0.3, 0.025],
                            position: [0, -350]
                        },
                    ]
                },

                {
                    name: 'UIInactionTutorialContainer', type: 'three-ui', childs: [
                        {
                            name: 'ui-inaction-tutorial-background',
                            type: 'three-image',
                            image: 'infinity-ui',
                            position: [0, -360],
                            childs: [
                                {
                                    name: 'ui-inaction-tutorial-hand',
                                    type: 'three-image',
                                    image: 'hand',
                                    scale: 0.4,
                                    anchor: [0.3, 0.025],
                                },
                            ]
                        },
                    ]
                },

                {
                    name: 'UIWaterGunContainer', type: 'three-ui', childs: [
                        {
                            name: 'ui-water-gun-title',
                            type: 'three-image',
                            image: 'upgrade-your-tool-image',
                            position: [0, 450]
                        },
                        {
                            name: 'ui-water-gun-1',
                            type: 'three-image',
                            image: 'ui-water-gun-1',
                            event: "water-gun-1",
                            position: [-310, -300],
                            scale: 0.9,
                        },
                        {
                            name: 'ui-water-gun-1-glow',
                            type: 'three-image',
                            image: 'ui-glow',
                            event: "water-gun-1",
                            position: [-310, -300],
                            scale: 0.9,
                        },
                        {
                            name: 'ui-water-gun-2',
                            type: 'three-image',
                            image: 'ui-water-gun-2',
                            event: "water-gun-2",
                            position: [0, -300],
                            scale: 0.9,
                        },
                        {
                            name: 'ui-water-gun-2-glow',
                            type: 'three-image',
                            image: 'ui-glow',
                            event: "water-gun-2",
                            position: [0, -300],
                            scale: 0.9,
                        },
                        {
                            name: 'ui-water-gun-3',
                            type: 'three-image',
                            image: 'ui-water-gun-3',
                            event: "water-gun-3",
                            position: [310, -300],
                            scale: 0.9,
                        },
                        {
                            name: 'ui-water-gun-3-glow',
                            type: 'three-image',
                            image: 'ui-glow',
                            event: "water-gun-3",
                            position: [310, -300],
                            scale: 0.9,
                        },
                        {
                            name: 'ui-water-gun-hand',
                            type: 'three-image',
                            image: 'hand',
                            scale: 0.7,
                            anchor: [0.3, 0.025],
                            position: [20, -270]
                        },
                    ]
                },

                {
                    name: 'UIClearGlass', type: 'three-ui', childs: [
                        {name: 'ui-clear-glass', type: 'three-image', image: 'T_Clear_Glass', position: [0, 450]},
                    ]
                },

                {
                    name: 'UIWeaponContainer', type: 'three-ui', childs: [
                        {
                            name: 'ui-weapon-1',
                            type: 'three-image',
                            image: 'ui-bomb',
                            event: "download_button",
                            position: [-350, -300]
                        },
                        {
                            name: 'ui-weapon-1-glow',
                            type: 'three-image',
                            image: 'ui-glow',
                            event: "download_button",
                            position: [-350, -300]
                        },
                        {
                            name: 'ui-weapon-2',
                            type: 'three-image',
                            image: 'ui-gun',
                            event: "download_button",
                            position: [0, -300]
                        },
                        {
                            name: 'ui-weapon-2-glow',
                            type: 'three-image',
                            image: 'ui-glow',
                            event: "download_button",
                            position: [0, -300]
                        },
                        {
                            name: 'ui-weapon-3',
                            type: 'three-image',
                            image: 'ui-lighter',
                            event: "download_button",
                            position: [350, -300]
                        },
                        {
                            name: 'ui-weapon-3-glow',
                            type: 'three-image',
                            image: 'ui-glow',
                            event: "download_button",
                            position: [350, -300]
                        },
                        {
                            name: 'ui-weapon-hand',
                            type: 'three-image',
                            image: 'hand',
                            event: "download_button",
                            scale: 0.7,
                            anchor: [0.3, 0.025],
                            position: [350, -450]
                        },
                    ]
                },
            ]
        },
    ],

    camera: null,
    sceneClone: null,
    manClone: null,
    girlClone: null,
    animationController: null,
    girlanimationController: null,

    pickupMesh: null,
    hoverCtrl: null,

    lastPointer: null,
    rendererDom: null,

    isPainting: false,
    isHandsControlMode: false,
    handsControlStartPoint: null,
    paintSpacing: 0.08,
    _lastPaintPos: null,
    frontWindshieldCleaned: false,
    _tmpRaycaster: new THREE.Raycaster(),
    _tmpNDC: new THREE.Vector2(),

    Hooks: {
        beforeBuild() {
            App.World.Scene.fog = new THREE.FogExp2(0x6b9fa8, 0.015);
            this.camera = App.World.Camera
            if (this.camera) {
                this.camera.near = 0.01
                this.camera.updateProjectionMatrix()
                this.camera.position.set(-4, 1.7, 11)
                this.camera.far = 1000;
                this.camera.fov = 50;
            }

            this.updateChildParamsByName(Settings[this.Name]);

            for (const key in App.ThreeAssets) {
                const object = App.ThreeAssets[key];
                if (!object.image) continue;

                object.minFilter = THREE.LinearMipmapLinearFilter;
                object.colorSpace = THREE.SRGBColorSpace;
            }

            const spawnCoins = async (toUIElementName, count = 10) => {
                const uiContainer = App.Gameplay["UIContainer"];
                const toUIElement = uiContainer.getObjectByName(toUIElementName);
                if (!toUIElement) {
                    console.error("UI element not found:", toUIElementName);
                    return;
                }

                const delayStep = 0.5 / count;
                const promises = [];
                for (let i = 0; i < count; i++) {
                    promises.push(
                        UICoinAnimator.animateFromUIToUI(
                            this["T_Wallet_Background"],
                            {x: -90, y: 10},
                            toUIElement,
                            {x: 0, y: 0},
                            i * delayStep
                        )
                    );
                }
                await Promise.all(promises);
            };


            let isBuyingGun = false;

            Broadcast.on("Gameplay water-gun-1 Down", async () => {
                if (!isBuyingGun) {
                    console.log("Work1")
                    this.playSound("click");
                    this.playSound("purchase");
                    isBuyingGun = true;
                    this.selectWaterGun(1);
                    await spawnCoins("ui-water-gun-1");
                    this.hands.waterGunType = WaterGunType.POWERFUL;
                    this.OnChoiseGun();
                    this.hands.setColorGun(Settings["First-yellow-color"], Settings["Second-yellow-color"]);
                    this.coinCollect.removeCoin(200);
                    isBuyingGun = false;
                }
            }, this);
            Broadcast.on("Gameplay water-gun-2 Down", async () => {
                if (!isBuyingGun) {
                    console.log("Work2")
                    this.playSound("click");
                    this.playSound("purchase");
                    isBuyingGun = true;
                    this.selectWaterGun(2);
                    await spawnCoins("ui-water-gun-2");
                    this.hands.waterGunType = WaterGunType.POWERFUL;
                    this.OnChoiseGun();
                    this.hands.setColorGun(Settings["First-blue-color"], Settings["Second-blue-color"]);
                    this.coinCollect.removeCoin(400);
                    isBuyingGun = false;
                }
            }, this);
            Broadcast.on("Gameplay water-gun-3 Down", async () => {
                if (!isBuyingGun) {
                    console.log("Work3")
                    this.playSound("click");
                    this.playSound("purchase");
                    isBuyingGun = true;
                    this.selectWaterGun(3);
                    await spawnCoins("ui-water-gun-3");
                    this.hands.waterGunType = WaterGunType.POWERFUL;
                    this.OnChoiseGun();
                    this.hands.setColorGun(Settings["First-orange-color"], Settings["Second-orange-color"]);
                    this.coinCollect.removeCoin(800);
                    isBuyingGun = false;
                }
            }, this);

        },

        build() {
            this.couple = new Couple();
            if (this.couple.children.length > 0) {
                this.couple.children[0].position.x += 0.04;
            }
            App.World.Scene.add(this.couple);

            this.onFront = false;
            this.spawnScene()

            this.spawnHand();

            this.spawnOldMan()
            this.prepareInactionTutorial();
            this.prepareWaterGunPanel();
            this.prepareWeaponPanel();

            this["ui-clear-glass"].visible = false;

            if (this.pickupMesh) {
                this.hoverCtrl = new HoverTransparency(this.pickupMesh, {
                    radius: 0.25, feather: 0.7, enabledOnStart: true, maxBrushes: 200,
                })
            }

            App.World.Renderer.shadowMap.enabled = true;

            App.World.Renderer.shadowMap.needsUpdate = true;

            App.World.Renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            App.World.Renderer.localClippingEnabled = true;

            App.World.Renderer.sortObjects = true;


            App.World.Scene.background = new THREE.Color("#00BFFF");

            const sun = this['sun_light'];
            sun.position.set(10, 20, 10);
            sun.castShadow = true;
            sun.shadow.mapSize.width = 2048;
            sun.shadow.mapSize.height = 2048;
            sun.shadow.radius = 2;
            sun.shadow.bias = -0.0001;

            Broadcast.on(
                "Gameplay download_button Down",
                () => {
                    if (window.MraidSDK) MraidSDK.open("end screen button");
                    else alert("Click Out: end screen button");
                    this.playSound("S_Button");
                },
                this,
            );
        },

        resize() {
        },

        show() {
            this.rendererDom = this.getRendererDom()
            this.updateSettings()
            this.startGame()
        },

        update() {
            if (this.hands && this.hands.isChangingGunAnimation) {
                return;
            }

            if (this.isHandsControlMode && this.isPainting && this.camera) {

                const forward = new THREE.Vector3(0, 0, -1);
                forward.applyQuaternion(this.camera.quaternion);


                this._tmpRaycaster.set(this.camera.position, forward);

                const parking = this.sceneClone?.getObjectByName("parking");
                const targets = [];
                if (this.pickupMesh) targets.push(this.pickupMesh);
                if (parking) targets.push(parking);

                const hit = this._tmpRaycaster.intersectObjects(targets, true).find(h => h.object && h.object.isMesh);

                if (hit) {
                    const p = hit.point.clone();

                    p.x -= 0.1;

                    this.hands.setStreamTarget(p);


                    if (this.lastPointer && this.rendererDom && this.handsControlStartPoint && !this.isCameraTransitioning && !this.endGame && !this._cameraLookTween && !this.isChoiseGunWeapon) {
                        const rect = this.rendererDom.getBoundingClientRect();


                        const centerX = this.handsControlStartPoint.x;
                        const centerY = this.handsControlStartPoint.y;


                        const normalizeSize = Math.min(rect.width, rect.height);
                        const deltaX = ((this.lastPointer.x - centerX) / normalizeSize) * 2;
                        const deltaY = ((centerY - this.lastPointer.y) / normalizeSize) * 2;


                        const rotationSpeed = 0.05;


                        const yawDelta = -deltaX * rotationSpeed;
                        const pitchDelta = deltaY * rotationSpeed;


                        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');


                        euler.y += yawDelta;
                        euler.x += pitchDelta;


                        euler.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, euler.x));


                        const maxYawLeft = Math.PI / 2;
                        const maxYawRight = Math.PI / 100;
                        euler.y = Math.max(-maxYawLeft, Math.min(maxYawRight, euler.y));


                        const targetQuaternion = new THREE.Quaternion().setFromEuler(euler);
                        this.camera.quaternion.slerp(targetQuaternion, 0.5);
                    }


                    const isPickup = hit.object === this.pickupMesh || hit.object.parent === this.pickupMesh;
                    if (isPickup && this.hoverCtrl) {
                        if (!this._lastPaintPos || p.distanceTo(this._lastPaintPos) >= this.paintSpacing) {
                            UICoinAnimator.animateFromWorldToUI(p, this['T_Wallet_Background'], {x: -90, y: 10});
                            if (!this.lastCoinPlayTime || Date.now() - this.lastCoinPlayTime > 75) {
                                this.lastCoinPlayTime = Date.now();
                                this.playSound("drop-coin");
                            }

                            this.coinCollect.collectCoin(Settings["coin-per-second"]);

                            if (this.isGunReady) {
                                this.hoverCtrl.addStampAt(p, this.hoverCtrl.getRadius());
                                this._lastPaintPos = p.clone();

                                const frontWindshieldZone = new THREE.Sphere(new THREE.Vector3(1.4, 1.4, 8.7), 0.4);
                                const frontWindshieldCleaned = this.hoverCtrl.brushes.some(b => frontWindshieldZone.containsPoint(b.center));

                                if (frontWindshieldCleaned && !this.frontWindshieldCleaned) {
                                    this.frontWindshieldCleaned = true;
                                }

                                const zone = new THREE.Sphere(new THREE.Vector3(1.4, 1.4, 8.7), 0.3);
                                const cleaned = this.hoverCtrl.brushes.some(b => zone.containsPoint(b.center));

                                if (cleaned && !this.gameEnded) {
                                    this.gameEnded = true;
                                    setTimeout(() => {
                                        this.onEndGame();
                                    }, 700);
                                }

                                if (this.coinCollect.getCoin() >= 2000) {
                                    this.onEndGame();
                                }

                                this.dropDirtParticles(p);
                            } else {
                                const zone = new THREE.Sphere(new THREE.Vector3(1, 1.9, 8.3), 1);
                                if (!zone.containsPoint(p)) {
                                    this.hoverCtrl.addStampAt(p, this.hoverCtrl.getRadius());
                                    this._lastPaintPos = p.clone();
                                }

                                if (this.coinCollect.getCoin() >= 1000) {
                                    this.showWaterGunPanel();
                                    this.isChoiseGunWeapon = true;
                                    this.isGunReady = true;
                                    this.isPainting = false;
                                    this.isHandsControlMode = false;
                                    this._lastPaintPos = null;

                                    if (this.hoverCtrl) {
                                        this.hoverCtrl.setEnabled(false);
                                    }
                                }
                            }
                        }
                    } else {
                        this._lastPaintPos = null;
                    }
                } else {

                    const farPoint = new THREE.Vector3();
                    forward.multiplyScalar(10);
                    farPoint.copy(this.camera.position).add(forward);

                    farPoint.x -= 0.1;
                    this.hands.setStreamTarget(farPoint);


                    if (this.lastPointer && this.rendererDom && this.handsControlStartPoint && !this.isCameraTransitioning && !this.endGame) {
                        const rect = this.rendererDom.getBoundingClientRect();


                        const centerX = this.handsControlStartPoint.x;
                        const centerY = this.handsControlStartPoint.y;

                        const normalizeSize = Math.min(rect.width, rect.height);
                        const deltaX = ((this.lastPointer.x - centerX) / normalizeSize) * 2;
                        const deltaY = ((centerY - this.lastPointer.y) / normalizeSize) * 2;

                        const rotationSpeed = 0.05;

                        const yawDelta = -deltaX * rotationSpeed;
                        const pitchDelta = deltaY * rotationSpeed;


                        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');


                        euler.y += yawDelta;
                        euler.x += pitchDelta;


                        euler.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, euler.x));


                        const maxYawLeft = Math.PI / 4;
                        const maxYawRight = Math.PI / 3;
                        euler.y = Math.max(-maxYawLeft, Math.min(maxYawRight, euler.y));


                        const targetQuaternion = new THREE.Quaternion().setFromEuler(euler);
                        this.camera.quaternion.slerp(targetQuaternion, 0.5);
                    }
                }
            } else if (this.hoverCtrl && this.lastPointer && this.rendererDom && this.isPainting) {
                const point = this.hoverCtrl.updateFromPointer(this.camera, this.lastPointer, this.rendererDom);
                if (point) {

                    const adjustedPoint = point.clone();
                    adjustedPoint.x -= 0.1;
                    this.hands.setStreamTarget(adjustedPoint);
                }
            }

            const clock = App.World?.Clock;
            const delta = clock ? clock.getDelta() : (this._lastTime ? (performance.now() - this._lastTime) / 1000 : 0);
            this._lastTime = performance.now();

            if (this.OldMananimationController) this.OldMananimationController.update(delta);


            const isLandscape = window.innerWidth > window.innerHeight;
            this.oldManBubble.scale.set(isLandscape ? 0.9 : 1.25, isLandscape ? 0.9 : 1.25, isLandscape ? 0.9 : 1.25);
        },


        hide() {
        }
    },

    Events: {
        'global:Stage Hover Move': function (e, pos) {
            this.lastPointer = this._toClientXY(pos)
        },

        'global:Stage Press Down': function (e, pos) {
            if (!this.isBackgroundMusicPlaying) {
                this.isBackgroundMusicPlaying = true;
                this.playSound("bg-1");
            }

            console.log("work")

            if (this.endGame) {
                if (window.MraidSDK) MraidSDK.open("end screen button");
                this.removeInactionTutorialTimer();


                return;
            }

            this.hideInactionTutorial();
            this.hideClickTutorial();

            if (this.isChoiseGunWeapon)
                return;

            if (this.hands && this.hands.isChangingGunAnimation)
                return;

            this.setInactionTutorialTimer();

            this.lastPointer = this._toClientXY(pos)

            if (!this.rendererDom) {
                this.rendererDom = this.getRendererDom();
            }
            if (!this.rendererDom) return;

            const rect = this.rendererDom.getBoundingClientRect();
            if (!rect) return;

            this.hands.state = HandsState.PULL;
            this.isPainting = true;
            this.isHandsControlMode = true;

            this.handsControlStartPoint = {x: this.lastPointer.x, y: this.lastPointer.y};
                return;
        },

        'global:Stage Press Move': function (e, pos) {


            if (this.isChoiseGunWeapon) {
                this.hands.state = HandsState.PUSH;
                if (!this._stopLookAtPointCalled) {
                    this._stopLookAtPointCalled = true;
                    this.stopLookAtPoint({duration: 1.2, immediate: false, defaultTarget: this.pickupMesh?.position});
                }
                return;
            } else {
                this._stopLookAtPointCalled = false;
            }

            if (this.endGame) {
                this.hands.state = HandsState.PUSH;
                this.stopLookAtPoint({duration: 0.4, immediate: false, defaultTarget: this.pickupMesh?.position});
                return;
            }

            if (this.hands && this.hands.isChangingGunAnimation) {
                return;
            }

            this.lastPointer = this._toClientXY(pos);

            if (this.isHandsControlMode && this.isPainting) {
                if (!this.isChoiseGunWeapon) {
                    this.setInactionTutorialTimer();
                }

                if (!this.lastWaterPlayTime || Date.now() - this.lastWaterPlayTime > 1000) {
                    this.lastWaterPlayTime = Date.now();
                    this.playSound("running-water");
                }
                return;
            }

            if (!this.isPainting || !this.hoverCtrl || !this.rendererDom) return;

            const rect = this.rendererDom.getBoundingClientRect();
            const x = ((this.lastPointer.x - rect.left) / rect.width) * 2 - 1;
            const y = -((this.lastPointer.y - rect.top) / rect.height) * 2 + 1;
            this._tmpNDC.set(x, y);
            this._tmpRaycaster.setFromCamera(this._tmpNDC, this.camera);

            const parking = this.sceneClone.getObjectByName("parking");

            const targets = [];
            if (this.pickupMesh) targets.push(this.pickupMesh);
            if (parking) targets.push(parking);

            const hit = this._tmpRaycaster.intersectObjects(targets, true).find(h => h.object && h.object.isMesh);
            if (!hit) return;

            const p = hit.point.clone();

            p.x -= 0.1;
            this.hands.setStreamTarget(p);

            if (!this.isChoiseGunWeapon) {
            this.setInactionTutorialTimer();
            }

            this.startLookAtPoint(p, {duration: 1, offset: new THREE.Vector3(0, 0.12, 0), immediate: false});

            if (!this.lastWaterPlayTime || Date.now() - this.lastWaterPlayTime > 1000) {
                this.lastWaterPlayTime = Date.now();
                this.playSound("running-water");
            }

            const isPickup = hit.object === this.pickupMesh || hit.object.parent === this.pickupMesh;

            if (isPickup) {
                if (!this._lastPaintPos || p.distanceTo(this._lastPaintPos) >= this.paintSpacing) {


                    UICoinAnimator.animateFromWorldToUI(p, this['T_Wallet_Background'], {x: -90, y: 10});
                    if (!this.lastCoinPlayTime || Date.now() - this.lastCoinPlayTime > 75) {
                        this.lastCoinPlayTime = Date.now();
                        this.playSound("drop-coin");
                    }

                    this.coinCollect.collectCoin(Settings["coin-per-second"]);

                    if (this.isGunReady) {
                        this.hoverCtrl.addStampAt(p, this.hoverCtrl.getRadius());
                        this._lastPaintPos = p.clone();

                        const frontWindshieldZone = new THREE.Sphere(new THREE.Vector3(1.4, 1.4, 8.7), 0.4);
                        const frontWindshieldCleaned = this.hoverCtrl.brushes.some(b => frontWindshieldZone.containsPoint(b.center));

                        if (frontWindshieldCleaned && !this.frontWindshieldCleaned) {
                            this.frontWindshieldCleaned = true;
                        }

                        const zone = new THREE.Sphere(new THREE.Vector3(1.4, 1.4, 8.7), 0.3);
                        const cleaned = this.hoverCtrl.brushes.some(b => zone.containsPoint(b.center));

                        if (cleaned && !this.gameEnded) {
                            this.gameEnded = true;
                            setTimeout(() => {
                                this.onEndGame();
                            }, 700);
                        }

                        if (this.coinCollect.getCoin() >= 2000) {
                            this.onEndGame();
                        }


                        this.dropDirtParticles(p);

                    } else {
                        const zone = new THREE.Sphere(new THREE.Vector3(1, 1.9, 8.3), 1);

                        if (!zone.containsPoint(p)) {
                            this.hoverCtrl.addStampAt(p, this.hoverCtrl.getRadius());
                            this._lastPaintPos = p.clone();
                        }

                        if (this.coinCollect.getCoin() >= 1000) {
                            this.showWaterGunPanel();
                            this.isChoiseGunWeapon = true;
                            this.isGunReady = true;
                            this.isPainting = false;
                            this._lastPaintPos = null;

                            if (this.hoverCtrl) {
                                this.hoverCtrl.setEnabled(false);
                            }
                        }
                    }
                }
            } else {
                this._lastPaintPos = null;
            }

            if (!this._lastPaintPos || p.distanceTo(this._lastPaintPos) >= this.paintSpacing) {

                this._lastPaintPos = p.clone();
            }


        },

        'global:Stage Press Up': function () {
            this.isPainting = false
            this.isHandsControlMode = false;
            this.handsControlStartPoint = null;
            this._lastPaintPos = null
            this.hands.state = HandsState.PUSH;
            this.stopDirtParticles();

            if (this.hoverCtrl) {
                this.hoverCtrl.setEnabled(true)
                this.hoverCtrl.hoverCenter.set(999, 999, 999)
                this.hoverCtrl._updateUniforms()
            }

            if (this.endGame) {
                return;
            }

            if (!this.isChoiseGunWeapon) {
            this.setInactionTutorialTimer();
            }
        },

        "global:Setting Changed": function (name, value) {

            this.updateSettings(name, value);
        },
    },

    updateSettings() {
        this.resize()

        this["ambient_light"].position.set(
            Settings["ambient-light-pos-x"],
            Settings["ambient-light-pos-y"],
            Settings["ambient-light-pos-z"]
        );

        this['ambient_light'].color.set(Settings["ambient-light-color"]);
        this['ambient_light'].intensity = Settings["ambient-light-intensity"];

        this["sun_light"].position.set(
            Settings["directional-light-pos-x"],
            Settings["directional-light-pos-y"],
            Settings["directional-light-pos-z"]
        );

        this['sun_light'].color.set(Settings["directional-light-color"]);
        this['sun_light'].intensity = Settings["directional-light-intensity"];

    },

    startGame: function () {
        this.showClickTutorial();

        if (window.MraidSDK) MraidSDK.track('Game Starts');
        if (window.MraidSDK) MraidSDK.interaction();

        let pickup = this.pickupMesh
        if (!pickup && this.sceneClone) {
            this.sceneClone.traverse(x => {
                if (!pickup && x.name === 'pickup-moss') pickup = x
            })
        }

        this.coinCollect = new CoinCollector(this["T_Coin_Text"]);
        this.camera.lookAt(this.pickupMesh.position.clone())
    },

    setInactionTutorialTimer: function () {
        if (this.isChoiseGunWeapon) {
            return;
        }

        if (this.inactionTutorialTimer) {
            clearTimeout(this.inactionTutorialTimer);
        }

        this.inactionTutorialTimer = setTimeout(() => {
            this.showInactionTutorial();
        }, 4000);
    },

    removeInactionTutorialTimer: function () {
        if (this.inactionTutorialTimer) {
            clearTimeout(this.inactionTutorialTimer);
            this.inactionTutorialTimer = null;
        }
    },

    prepareInactionTutorial: function () {
        this["UIInactionTutorialContainer"].visible = false;
    },

    onEndGame() {
        this.endGame = true;

        if (this.endScrean)
            return;

        this.endScrean = true;

        this.hands.disableModel();

        this.pickupMesh.visible = false;
        this.hideInactionTutorial();
        this.removeInactionTutorialTimer();

        this.isCameraTransitioning = true;
        CameraTransitionAnimator.animate({
            camera: this.camera,
            targetPosition: {x: 1.15, y: 1.7, z: 10.0006},
            targetLookAt: {x: 1.30763, y: 1.55391, z: 8.72079},
            targetFov: 40,
            duration: 2
        }).then(() => {
            this.isChoiseGunWeapon = false;
        });

        this.playSound("mmmmm");
        this.couple.runFrightState();

        setTimeout(() => {

            CameraTransitionAnimator.animate({
                camera: this.camera,
                targetPosition: {x: 0.85469, y: 1.7, z: 11.4184},
                targetLookAt: {x: 1.56528, y: 1.55391, z: 9.12441},
                targetFov: 70,
                duration: 2
            }).then(() => {
                this.isCameraTransitioning = false;
                this.isChoiseGunWeapon = false;
            });


            setTimeout(() => {
                this.OldManClone.visible = true;
                this.oldManBubble.visible = true;

                setTimeout(() => {
                    this.playSound("shock-female");
                }, 500);
                this.showAngryEmoji(new THREE.Vector3(1.94835 + 0.35, 1.8, 9.57326 - 0.25));
                this.playSound("angry-growl-man-2");
                this.OldMananimationController.play('idle', {
                    loop: THREE.LoopOnce,
                    clampWhenFinished: true,
                    forceRestart: true,
                });
                setTimeout(() => {
                    this.showWeaponPanel();
                }, 1500)
            }, 1000)
        }, 1500)
    },

    showInactionTutorial() {
        if (this.isChoiseGunWeapon) {
            return;
        }

        if (this.inactionTutorialAnimation) {
            return;
        }

        this["UIInactionTutorialContainer"].visible = true;

        const tutorialHand = this["ui-inaction-tutorial-hand"];
        const tutorialBackground = this["ui-inaction-tutorial-background"];

        const animationAmplitudeX = 160;
        const animationAmplitudeY = 110;

        const helper = {t: 0};
        this.inactionTutorialAnimation = gsap.timeline()
            .fromTo([tutorialHand.material, tutorialBackground.material], {opacity: 0}, {
                opacity: 1,
                duration: 0.25,
                ease: "power1.inOut",
            })
            .to(helper, {
                t: Math.PI * 2,
                duration: 3,
                ease: "none",
                repeat: -1,
                onUpdate: () => {
                    const t = helper.t;
                    tutorialHand.position.x = animationAmplitudeX * Math.sin(t);
                    tutorialHand.position.y = animationAmplitudeY * Math.sin(t * 2) * 0.5;
                }
            });
    },

    hideInactionTutorial() {
        if (!this.inactionTutorialAnimation) {
            return;
        }

        this.inactionTutorialAnimation.kill();
        this.inactionTutorialAnimation = null;

        gsap.timeline().to([this["ui-inaction-tutorial-hand"].material, this["ui-inaction-tutorial-background"].material], {
            opacity: 0,
            duration: 0.25,
            ease: "power1.inOut",
            onComplete: () => {
                this["UIInactionTutorialContainer"].visible = false;
            }
        });
    },

    showClickTutorial() {
        if (this.clickTutorialAnimation) {
            return;
        }

        this["UIClickTutorialContainer"].visible = true;

        const tutorialTitle = this["ui-click-tutorial-title"];
        const tutorialHand = this["ui-click-tutorial-hand"];
        const tutorialCircle0 = this["ui-click-tutorial-circle-0"];
        const tutorialCircle1 = this["ui-click-tutorial-circle-1"];

        const durationIn = 0.25;
        const durationActive = 0.5;

        this.clickTutorialAnimation = gsap.timeline()
            .fromTo([tutorialTitle.material, tutorialHand.material, tutorialCircle0.material, tutorialCircle1.material], {opacity: 0}, {
                opacity: 1,
                duration: durationIn,
                ease: "power1.inOut",
            })
            .fromTo(tutorialHand.scale, {x: 0.4, y: 0.4}, {
                x: 0.3,
                y: 0.3,
                duration: durationActive,
                ease: "power1.inOut",
                repeat: -1,
                yoyo: true
            }, durationIn)
            .fromTo(tutorialCircle0.scale, {x: 1, y: 1}, {
                x: 1.1,
                y: 1.1,
                duration: durationActive,
                ease: "power1.inOut",
                repeat: -1,
                yoyo: true
            }, durationIn)
            .fromTo(tutorialCircle1.scale, {x: 1, y: 1}, {
                x: 1.2,
                y: 1.2,
                duration: durationActive,
                ease: "power1.inOut",
                repeat: -1,
                yoyo: true
            }, durationIn);
    },

    hideClickTutorial() {
        if (!this.clickTutorialAnimation) {
            return;
        }

        this.clickTutorialAnimation.kill();
        this.clickTutorialAnimation = null;

        const tutorialTitle = this["ui-click-tutorial-title"];
        const tutorialHand = this["ui-click-tutorial-hand"];
        const tutorialCircle0 = this["ui-click-tutorial-circle-0"];
        const tutorialCircle1 = this["ui-click-tutorial-circle-1"];

        gsap.timeline()
            .to([tutorialTitle.material, tutorialHand.material, tutorialCircle0.material, tutorialCircle1.material], {
                opacity: 0,
                duration: 0.25,
                ease: "power1.inOut",
                onComplete: () => {
                    this["UIClickTutorialContainer"].visible = false;
                }
            })
    },

    prepareWaterGunPanel() {
        this.preparePanel(this["UIWaterGunContainer"]);
    },

    showWaterGunPanel() {
        this.removeInactionTutorialTimer();
        this.hideInactionTutorial();

        const container = this["UIWaterGunContainer"];
        const appearMaterials = [
            this["ui-water-gun-1"].material,
            this["ui-water-gun-2"].material,
            this["ui-water-gun-3"].material,
            this["ui-water-gun-title"].material,
            this["ui-water-gun-1-glow"].material,
            this["ui-water-gun-hand"].material,
        ];
        const glowMaterials = [
            this["ui-water-gun-1-glow"].material,
            this["ui-water-gun-2-glow"].material,
            this["ui-water-gun-3-glow"].material
        ];
        const cardPositions = [
            this["ui-water-gun-1"].position,
            this["ui-water-gun-2"].position,
            this["ui-water-gun-3"].position
        ];
        const tutorialHand = this["ui-water-gun-hand"];

        this.showPanel(container, appearMaterials, glowMaterials, cardPositions, tutorialHand);
    },

    selectWaterGun(gunIndex) {
        this.selectItemOnPanel(gunIndex, this["UIWaterGunContainer"]);
    },

    hideWaterGunPanel() {
        this.hidePanel(this["UIWaterGunContainer"]);

        this["ui-clear-glass"].visible = true;
        gsap.timeline()
            .fromTo(this["ui-clear-glass"].material,
                {opacity: 0},
                {
                    delay: 0.5,
                    opacity: 1,
                    duration: 0.25,
                    ease: "power2.inOut",
                }
            )
            .to(this["ui-clear-glass"].material,
                {
                    opacity: 0,
                    delay: 1.5,
                    duration: 0.25,
                    ease: "power2.inOut",
                    onComplete: () => {
                        this["ui-clear-glass"].visible = false;
                    }
                }
            );
    },

    prepareWeaponPanel() {
        this.preparePanel(this["UIWeaponContainer"]);
    },


    showWeaponPanel() {
        const container = this["UIWeaponContainer"];
        const appearMaterials = [
            this["ui-weapon-1"].material,
            this["ui-weapon-2"].material,
            this["ui-weapon-3"].material,
            this["ui-weapon-1-glow"].material,
            this["ui-weapon-hand"].material,
        ];
        const glowMaterials = [
            this["ui-weapon-1-glow"].material,
            this["ui-weapon-2-glow"].material,
            this["ui-weapon-3-glow"].material
        ];
        const cardPositions = [
            this["ui-weapon-1"].position,
            this["ui-weapon-2"].position,
            this["ui-weapon-3"].position
        ];
        const tutorialHand = this["ui-weapon-hand"];

        this.showPanel(container, appearMaterials, glowMaterials, cardPositions, tutorialHand);
    },

    selectWeapon(weaponIndex) {
        this.selectItemOnPanel(weaponIndex, this["UIWeaponContainer"]);
    },

    hideWeaponPanel() {
        this.hidePanel(this["UIWeaponContainer"]);
    },

    preparePanel(container) {
        container.visible = false;

        const materials = [];
        SceneTraversal.enumerateObjectsByType(container, THREE.Mesh, (m) => materials.push(m.material));

        for (let material of materials) {
            material.opacity = 0;
        }
    },

    showPanel(container, appearMaterials, glowMaterials, cardPositions, tutorialHand) {
        if (this.panelTutorialAnimation) {
            return;
        }

        container.visible = true;

        for (const glowMaterial of glowMaterials) {
            glowMaterial.opacity = 0;
        }

        const defaultHandVerticalOffset = -75;
        tutorialHand.position.x = cardPositions[0].x;
        tutorialHand.position.y = cardPositions[0].y + defaultHandVerticalOffset;

        console.log(tutorialHand.position.x)
        console.log(tutorialHand.position.y + defaultHandVerticalOffset)

        this.panelTutorialAnimation = gsap.timeline()
            .to(appearMaterials, {
                opacity: 1,
                duration: 0.25,
                ease: "power1.inOut",
                onComplete: () => {
                    this.panelTutorialAnimation = gsap.timeline({repeat: -1});

                    let currentDuration = 0;
                    const stepDuration = 1;
                    const ease = "power2.inOut";

                    for (let i = 0; i < cardPositions.length; i++) {
                        const currentCardPosition = cardPositions[i];
                        const nextCardPosition = cardPositions[(i + 1) % cardPositions.length];

                        const currentGlowMaterial = glowMaterials[i];
                        const nextGlowMaterial = glowMaterials[(i + 1) % glowMaterials.length];

                        const helper = {t: 0};

                        this.panelTutorialAnimation.fromTo(
                            helper,
                            {t: 0},
                            {
                                t: 1,
                                duration: stepDuration,
                                ease,
                                delay: 0.01,
                                onUpdate: () => {
                                    if (helper.t === 0) {

                                    } else {
                                        const offset = Math.sin(helper.t * Math.PI) * 100;
                                        tutorialHand.position.x = THREE.MathUtils.lerp(currentCardPosition.x, nextCardPosition.x, helper.t);
                                        tutorialHand.position.y = THREE.MathUtils.lerp(currentCardPosition.y, nextCardPosition.y, helper.t) + offset + defaultHandVerticalOffset;
                                    }

                                }
                            }
                        )
                            .to(
                                currentGlowMaterial,
                                {
                                    opacity: 0,
                                    duration: stepDuration,
                                    ease,
                                },
                                currentDuration
                            )
                            .to(
                                nextGlowMaterial,
                                {
                                    opacity: 1,
                                    duration: stepDuration,
                                    ease,
                                },
                                currentDuration
                            );
                        currentDuration += stepDuration;
                    }
                }
            })
    },

    selectItemOnPanel(itemIndex, container) {
        if (!this.panelTutorialAnimation) {
            return;
        }

        this.panelTutorialAnimation.kill();

        const components = [];
        SceneTraversal.enumerateObjectsByType(container, THREE.Mesh, (m) => components.push(m));

        for (const component of components) {
            gsap.to(component.material, {
                opacity: component.name.includes(String(itemIndex)) ? 1 : 0,
                duration: 0.25,
                ease: "power1.inOut",
            })
        }
    },

    hidePanel(container) {
        if (!this.panelTutorialAnimation) {
            return;
        }

        this.panelTutorialAnimation.kill();
        this.panelTutorialAnimation = null;

        const materials = [];
        SceneTraversal.enumerateObjectsByType(container, THREE.Mesh, (m) => materials.push(m.material));

        gsap.timeline()
            .to(materials, {
                opacity: 0,
                duration: 0.25,
                ease: "power1.inOut",
                onComplete: () => {
                    container.visible = false;
                }
            })
    },

    restoreGame() {
    },

    OnChoiseGun() {
        this.hideInactionTutorial();
        this.hideWaterGunPanel();
        let pickup = null;


        this.sceneClone.traverse(obj => {
            if (obj.name === "pickup-moss") pickup = obj;
        })

        this.hoverCtrl.increaseRadius(0.3);

        this._stopLookAtPointCalled = false;
        this.isHandsControlMode = false;
        this.isPainting = false;

        if (this._cameraLookTween) {
            try {
                gsap.killTweensOf(this._cameraLook);
            } catch (e) {
            }
            this._cameraLookTween = null;
        }

        this.stopLookAtPoint({duration: 1.0, immediate: false, defaultTarget: this.pickupMesh?.position});

        this.isCameraTransitioning = false;
        this.isChoiseGunWeapon = false;

        setTimeout(() => {
            this.isGunReady = true;
            this.setInactionTutorialTimer();
        }, 900)

    },

    spawnOldMan() {
        const glb = App.ThreeAssets['man-2-anim'];
        const ohThisIsMyWify = App.ThreeAssets["oh-no-this-is-my-wife-bubble"];

        this.OldManClone = SkeletonUtils.clone(glb.scene);
        const clips = glb.animations;

        this.OldMananimationController = new AnimatedModelController(this.OldManClone, clips);
        this.OldMananimationController.setBaseClip(clips[0]);
        this.OldMananimationController.createAnimationSegment('idle', 54, 200, 24, clips[0]);
        this.OldMananimationController.createAnimationSegment('greeting', 40, 80, 24, clips[0]);

        this.OldManClone.position.set(1.94835 + 0.35, 0, 9.57326 - 0.25);
        this.OldManClone.rotation.set(0, -Math.PI / 6 + 0.5, 0);
        this.OldManClone.scale.set(1, 1, 1);
        App.World.Scene.add(this.OldManClone);

        this.OldMananimationController.play('idle', {
            loop: THREE.LoopOnce,
            clampWhenFinished: true,
            forceRestart: true,
        });

        this.oldManBubble = this["ui_bubble"];
        this.oldManBubble.visible = false;
        this.OldManClone.visible = false;
    },

    startLookAtPoint(worldPoint, opts = {}) {
        if (!this.camera || this.isCameraTransitioning || this.endGame) return;
        const options = Object.assign({duration: 0.3, offset: new THREE.Vector3(0, 0, 0), immediate: false}, opts);

        if (!this._cameraLook) {

            this._cameraLook = {x: 0, y: 0, z: 0};
            this._cameraLookVec = new THREE.Vector3();

            this._cameraLookTween = null;
        }


        const target = (worldPoint.isVector3) ? worldPoint.clone() : new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z);
        if (options.offset) target.add(options.offset);

        const pickupPos = this.pickupMesh?.position?.clone() || new THREE.Vector3();

        const maxRadius = 2.5;

        const offsetFromPickup = target.clone().sub(pickupPos);
        if (offsetFromPickup.length() > maxRadius) {
            offsetFromPickup.setLength(maxRadius);
            target.copy(pickupPos.clone().add(offsetFromPickup));
        }


        if (this._cameraLookTween) {
            try {
                gsap.killTweensOf(this._cameraLook);
            } catch (e) { /*ignore*/
            }
            this._cameraLookTween = null;
        }


        if (options.immediate) {
            this._cameraLook.x = target.x;
            this._cameraLook.y = target.y;
            this._cameraLook.z = target.z;
            this._cameraLookVec.set(this._cameraLook.x, this._cameraLook.y, this._cameraLook.z);
            this.camera.lookAt(this._cameraLookVec);
            return;
        }


        if (this._cameraLook.x === 0 && this._cameraLook.y === 0 && this._cameraLook.z === 0) {

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

            const start = new THREE.Vector3().copy(this.camera.position).add(dir.multiplyScalar(10));
            this._cameraLook.x = start.x;
            this._cameraLook.y = start.y;
            this._cameraLook.z = start.z;
        }

        this._cameraLookTween = gsap.to(this._cameraLook, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: Math.max(0.01, options.duration || 0.3),
            ease: "power2.out",
            onUpdate: () => {
                this._cameraLookVec.set(this._cameraLook.x, this._cameraLook.y, this._cameraLook.z);
                if (this.camera) this.camera.lookAt(this._cameraLookVec);
            },
            onComplete: () => {
                this._cameraLookTween = null;
            }
        });
    },


    stopLookAtPoint(opts = {}) {
        if (!this.camera || this.isCameraTransitioning || this.endGame) return;

        const options = Object.assign({duration: 1.0, defaultTarget: null, immediate: false, stopOnly: false}, opts);

        if (!this._cameraLook) {

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const currentLookPoint = new THREE.Vector3().copy(this.camera.position).add(dir.multiplyScalar(10));
            this._cameraLook = {x: currentLookPoint.x, y: currentLookPoint.y, z: currentLookPoint.z};
            this._cameraLookVec = new THREE.Vector3(currentLookPoint.x, currentLookPoint.y, currentLookPoint.z);

            const def = options.defaultTarget || (this.pickupMesh?.position) || new THREE.Vector3(0, 0, 0);
            if (options.immediate) {
                this.camera.lookAt(def);
                this._cameraLook.x = def.x;
                this._cameraLook.y = def.y;
                this._cameraLook.z = def.z;
            } else {

            }

        }

        if (options.stopOnly) {
            if (this._cameraLookTween) {
                try {
                    gsap.killTweensOf(this._cameraLook);
                } catch (e) {
                }
                this._cameraLookTween = null;
            }
            return;
        }


        let def = options.defaultTarget;
        if (!def) {

            if (this.pickupMesh && this.pickupMesh.position) def = this.pickupMesh.position;
            else def = new THREE.Vector3(0, 0, 0);
        }
        const target = (def.isVector3) ? def.clone() : new THREE.Vector3(def.x, def.y, def.z);

        if (this._cameraLookTween) {
            try {
                gsap.killTweensOf(this._cameraLook);
            } catch (e) {
            }
            this._cameraLookTween = null;
        }

        if (options.immediate) {
            this._cameraLook.x = target.x;
            this._cameraLook.y = target.y;
            this._cameraLook.z = target.z;
            this._cameraLookVec.set(this._cameraLook.x, this._cameraLook.y, this._cameraLook.z);
            this.camera.lookAt(this._cameraLookVec);
            return;
        }


        if (!this._cameraLook.x && !this._cameraLook.y && !this._cameraLook.z) {
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const start = new THREE.Vector3().copy(this.camera.position).add(dir.multiplyScalar(10));
            this._cameraLook.x = start.x;
            this._cameraLook.y = start.y;
            this._cameraLook.z = start.z;
        }

        this._cameraLookTween = gsap.to(this._cameraLook, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: Math.max(0.01, options.duration || 1.0),
            ease: "power1.inOut",
            onUpdate: () => {
                this._cameraLookVec.set(this._cameraLook.x, this._cameraLook.y, this._cameraLook.z);
                if (this.camera) this.camera.lookAt(this._cameraLookVec);
            },
            onComplete: () => {
                this._cameraLookTween = null;
            }
        });
    },

    spawnHand() {
        App.World.Scene.add(App.World.Camera);
        this.hands = new Hands(App.World.Camera, App.ThreeAssets["SK_Hands"], App.ThreeAssets["SK_Stream"]);
    },

    spawnScene() {
        const glb = App.ThreeAssets["Scene"];
        this.sceneClone = glb.scene.clone(true)
        this['game container'].add(this.sceneClone)

        this.sceneClone.traverse(obj => {
            if (obj.isMesh) {

                obj.castShadow = true
                obj.receiveShadow = true

                if (obj.name.startsWith('park')) {
                    obj.castShadow = false
                    obj.receiveShadow = true
                }
                if (obj.name.startsWith('pickup')) {

                    obj.castShadow = true
                    obj.receiveShadow = false

                    obj.renderOrder = 0;

                    if (obj.isMesh) {
                        obj.material.roughness = Settings["roughnessCar"];
                        obj.material.metalness = Settings["metalnessCar"];
                    }
                }
            }
        })

        this.pickupMesh = null
        this.sceneClone.traverse(obj => {
            if (obj.name === 'pickup-moss') {

                if (obj.isMesh) {
                    this.pickupMesh = obj
                    this.pickupMesh.material.displacementMap = App.ThreeAssets["T_White_Square"];
                    this.pickupMesh.material.displacementScale = 1;

                } else {
                    obj.traverse(o => {
                        o.visible = false;
                    });
                    let found = null
                    if (found) {
                        this.pickupMesh = found
                    }
                }
            }
        })


    },


    getRendererDom() {
        return (
            (App && App.Renderer && App.Renderer.domElement) ||
            (App && App.World && App.World.Renderer && App.World.Renderer.domElement) ||
            (typeof renderer !== 'undefined' && renderer && renderer.domElement) ||
            document.querySelector('canvas')
        )
    },

    _toClientXY(pos) {
        if (typeof pos?.x === 'number' && typeof pos?.y === 'number' && (pos.x > 1 || pos.y > 1)) {
            return {x: pos.x, y: pos.y}
        }
        const dom = this.rendererDom ?? this.getRendererDom()
        if (!dom) return {x: pos?.x ?? 0, y: pos?.y ?? 0}
        const rect = dom.getBoundingClientRect()
        return {
            x: rect.left + (pos?.x ?? 0) * rect.width,
            y: rect.top + (pos?.y ?? 0) * rect.height,
        }
    },

    showAngryEmoji(position) {
        const particleSystem = new ParticleSystem(
            {
                capacity: 1024,
                gravity: {x: 0, y: 1, z: 0},
            },
            {
                texture: App.ThreeAssets["angry-smiley-particle"],
                color: new THREE.Color(0xffffff),
            },
        );

        if (particleSystem.mesh) {
            particleSystem.mesh.renderOrder = 500;
        }

        const emitter = new ParticleEmitter(
            {
                playByDefault: true,
                playTime: 100,
                spawnRate: 8,
                system: particleSystem,
            },
            {
                lifeTimeRange: {min: 1.5, max: 2},
                positionRange: {min: position.clone(), max: position.clone()},
                rotationRange: {min: 0, max: 0},
                scaleOverTime: [
                    {min: 0.1, max: 0.15},
                ],
                opacityOverTime: [
                    {min: 0, max: 0},
                    {min: 0.25, max: 1},
                    {min: 0, max: 0},
                ],
                velocityRange: {
                    theta: {min: -Math.PI, max: Math.PI},
                    phi: {min: -Math.PI, max: Math.PI},
                    magnitude: {min: 0.5, max: 1},
                },
                angularVelocityRange: {min: 0, max: 0},
            },
        );
    },

    stopDirtParticles() {
        if (this.dirtParticleEmitter) {
            this.dirtParticleEmitter.stop();
        }
    },

    dropDirtParticles(position) {
        if (this.endGame || this.gameEnded) {
            return;
        }

        if (!this.dirtParticleSystem) {
            this.dirtParticleSystem = new ParticleSystem(
                {
                    capacity: 1024,
                    gravity: {x: 0, y: -9.81, z: 0},
                },
                {
                    texture: App.ThreeAssets["dirt-particles-7"],
                    alphaTest: 0.95,
                },
            );
        }

        if (!this.dirtParticleEmitter) {
            this.dirtParticleEmitter = new ParticleEmitter(
                {
                    playByDefault: false,
                    playTime: 8192,
                    spawnRate: 256,
                    system: this.dirtParticleSystem,
                },
                {
                    lifeTimeRange: {min: 0.15, max: 0.25},
                    positionRange: {min: position.clone(), max: position.clone()},
                    rotationRange: {min: -Math.PI, max: Math.PI},
                    scaleOverTime: [
                        {min: 0, max: 0},
                        {min: 0.05, max: 0.1},
                        {min: 0, max: 0},
                    ],
                    opacityOverTime: [
                        {min: 1, max: 1},
                    ],
                    velocityRange: {
                        theta: {min: -Math.PI, max: Math.PI},
                        phi: {min: -Math.PI, max: Math.PI},
                        magnitude: {min: 1, max: 3},
                    },
                    angularVelocityRange: {min: -Math.PI * 5, max: Math.PI * 5},
                },
            );
        }

        this.dirtParticleEmitter.play();
        this.dirtParticleEmitter.setPositionRange(position.clone(), position.clone());
    }
})