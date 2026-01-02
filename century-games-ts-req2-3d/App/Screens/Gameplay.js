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
import MraidSDK from "webpack-dev-server/bin/cli-flags";
import {UICoinAnimator} from 'UICoinAnimator'
import {CameraTransitionAnimator} from 'CameraTransitionAnimator'
import {SceneTraversal} from 'three-zoo'
import {Couple} from 'Couple'
import {ParticleEmitter, ParticleSystem} from 'Libs/TinyParticleSystem'
import {Vector3} from "three";

App.Gameplay = new Screen({

    Name: 'Gameplay',

    ArrayMatch: [
        [1, 1, 1, 0, 0, 0],
        [2, 3, 1, 0, 0, 0],
        [2, 3, 1, 0, 0, 0],
        [3, 2, 3, 3, 1, 1],
        [2, 3, 1, 1, 1, 1],
        [2, 3, 1, 1, 1, 1],
    ],

    ArrayPos: [-142.5 * 2.5, -142.5 * 1.5, -142.5 * 0.5, 142.5 * 0.5, 142.5 * 1.5, 142.5 * 2.5],

    ArrayColor: ['blue', 'yellow', 'red', 'pink', 'green'],

    MatchActive: false,

    TutorMatchEnd: false,

    CurrentBlock: '',

    BallMove: false,

    CheckNow: true,

    Swap: true,

    MatchNow: false,

    CheckMatch: false,

    ColorBallActive: false,
    MatchTutorActive: false,

    MatchWin: false,

    ChooseGun: 1,

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
                        {name: 'ui-weapon-1', type: 'three-image', image: 'ui-bomb', position: [-350, -300]},
                        {name: 'ui-weapon-1-glow', type: 'three-image', image: 'ui-glow', position: [-350, -300]},
                        {name: 'ui-weapon-2', type: 'three-image', image: 'ui-gun', position: [0, -300]},
                        {name: 'ui-weapon-2-glow', type: 'three-image', image: 'ui-glow', position: [0, -300]},
                        {name: 'ui-weapon-3', type: 'three-image', image: 'ui-lighter', position: [350, -300]},
                        {name: 'ui-weapon-3-glow', type: 'three-image', image: 'ui-glow', position: [350, -300]},
                        {
                            name: 'ui-weapon-hand',
                            type: 'three-image',
                            image: 'hand',
                            scale: 0.7,
                            anchor: [0.3, 0.025],
                            position: [350, -450]
                        },
                    ]
                },

                {name: 'MatchContainer', scale: 0.8, childs: [
                    {name: 'board', type: 'three-image', image: 'board', visible: false, childs: [
                        {name: 'balls'},
                        {name: 'rectanle', type: 'three-image', image: 'rectangle', position: [215, -215], childs: [
                            // {name: 'water gun 1', type: 'three-image', image: 'water-gun-1', visible: false},
                            // {name: 'water gun 2', type: 'three-image', image: 'water-gun-2', visible: false},
                            // {name: 'water gun 3', type: 'three-image', image: 'water-gun-3', visible: false},
                        ]},
                    ]},
                    {name: 'particles'},
                    {name: 'bg match', type: 'three-image', image: 'bg-match3', position: [190, 200], visible: false, scale: 2},
                    {name: 'hand match', type: 'three-image', image: 'hand', visible: false, anchor: [0.2, 0]},

                    {name: 'water gun match', position: [215, -215], childs: [
                        {name: 'water gun 1', type: 'three-image', image: 'water-gun-1', visible: false},
                        {name: 'water gun 2', type: 'three-image', image: 'water-gun-2', visible: false},
                        {name: 'water gun 3', type: 'three-image', image: 'water-gun-3', visible: false},

                        {name: 'water gun glow', type: 'three-image', image: 'gun-glow', visible: false, scale: 0.5},
                    ]},

                    {name: 'explosion effect'},
                ]},

                {name: 'TimerContainer', LTRBPortrait: 'T', stickinessPortrait: [1, 1], positionPortrait: [0, 0.89], LTRBLandscape: 'T', stickinessLandscape: [1, 1], positionLandscape: [0, 0.8], childs: [
                    {name: 'timer', type: 'three-image', image: 'timer', visible: false, childs: [
                        {name: 'timer text', type: 'three-text', text: 'TIMER TEXT', position: [40, 0]}
                    ]}
                ]},
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
    paintSpacing: 0.08,
    _lastPaintPos: null,
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

            const spawnCoins = async (toUIElement, count = 10) => {
                const delayStep = 0.5 / count;
                const promises = [];
                for (let i = 0; i < count; i++) {
                    promises.push(UICoinAnimator.animateFromUIToUI(this['T_Wallet_Background'], {
                        x: -90,
                        y: 10
                    }, toUIElement, {x: 0, y: 0}, i * delayStep));
                }
                await Promise.all(promises);
            };

            let isBuyingGun = false;

            Broadcast.on("Gameplay water-gun-1 Down", async () => {
                this.isGunReady = true;
        
                if (!this.MatchActive) {
                    // isBuyingGun = true
                    
                    this.startMatch3(1)
                }
                
              if (!isBuyingGun) {
                this.playSound("click");
                this.playSound("purchase");
                isBuyingGun = true;
                this.ChooseGun = 1
                this.selectWaterGun(1);
                this.hideWaterGunPanel();
                this.hands.setColorGun(Settings["First-yellow-color"], Settings["Second-yellow-color"]);
                // await spawnCoins(this["ui-water-gun-1"]);
                // this.hands.waterGunType = WaterGunType.POWERFUL;
                // this.OnChoiseGun(1);
                // this.hands.setColorGun("#FFFF00", "#CCCC00");
                // isBuyingGun = false;
              }
            }, this);
            Broadcast.on("Gameplay water-gun-2 Down", async () => {
                this.isGunReady = true;
        
                if (!this.MatchActive) {
                    // isBuyingGun = true
                    
                    this.startMatch3(2)
                }

              if (!isBuyingGun) {
                this.playSound("click");
                this.playSound("purchase");
                isBuyingGun = true;
                this.ChooseGun = 2
                this.selectWaterGun(2);
                this.hideWaterGunPanel();
                this.hands.setColorGun(Settings["First-blue-color"], Settings["Second-blue-color"]);
                // await spawnCoins(this["ui-water-gun-2"]);
                // this.hands.waterGunType = WaterGunType.POWERFUL;
                // this.OnChoiseGun(2);
                // this.hands.setColorGun("#0000FF", "#00008B");
                // isBuyingGun = false;
              }
            }, this);
            Broadcast.on("Gameplay water-gun-3 Down", async () => {
                this.isGunReady = true;
        
                if (!this.MatchActive) {
                    // isBuyingGun = true
                    
                    this.startMatch3(3)
                }

              if (!isBuyingGun) {
                this.playSound("click");
                this.playSound("purchase");
                isBuyingGun = true;
                this.ChooseGun = 3
                this.selectWaterGun(3);
                this.hideWaterGunPanel();
                this.hands.setColorGun(Settings["First-orange-color"], Settings["Second-orange-color"]);
                // await spawnCoins(this["ui-water-gun-3"]);
                // this.hands.waterGunType = WaterGunType.POWERFUL;
                // this.OnChoiseGun(3);
                // this.hands.setColorGun("#FFA500", "#FF8C00");
                // spawnCoins(10);
                // isBuyingGun = false;
              }
            }, this);

        },

        build() {
            this.couple = new Couple();
            App.World.Scene.add(this.couple);

            this.spawnScene()
            // this.spawnMan()
            this.spawnHand();

            this.spawnOldMan()
            // this.spawnGirl()
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
            if (this.hoverCtrl && this.lastPointer && this.rendererDom && this.isPainting) {
                const point = this.hoverCtrl.updateFromPointer(this.camera, this.lastPointer, this.rendererDom);
                if (point) {
                    this.hands.setStreamTarget(point);
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
            if (this.MatchActive) {
                if (this.TutorMatchEnd) {
                    this.ShotStart(e)
                }
                else {
                    this.checkClick(e, pos)
                }
            }

            if (!this.isBackgroundMusicPlaying) {
                this.isBackgroundMusicPlaying = true;
                this.playSound("bg-1");
            }

            if (this.endGame) {
                this.removeInactionTutorialTimer();
                if (window.MraidSDK) {
                    MraidSDK.open("end screen button");
                }
                return;
            }

            this.hideInactionTutorial();
            this.setInactionTutorialTimer();
            this.hideClickTutorial();

            if (this.isChoiseGunWeapon)
                return;
            this.hands.state = HandsState.PULL;

            this.lastPointer = this._toClientXY(pos)
            this.isPainting = true

            if (this.hoverCtrl && this.rendererDom) {
                this.hoverCtrl.stampFromPointer(this.camera, this.lastPointer, this.rendererDom)
                this._lastPaintPos = null
            }


            const target = this.pickupMesh || this.sceneClone;
            const hit = this._tmpRaycaster.intersectObject(target, true).find(h => h.object && h.object.isMesh);

            if (hit) {
                const p = hit.point;
                this.startLookAtPoint(p, {duration: 0.4, offset: new THREE.Vector3(0, 0.12, 0), immediate: false});
            }


            if (this.endGame) {
                this.hands.state = HandsState.PUSH;

                this.stopLookAtPoint({duration: 0.4, immediate: false, defaultTarget: this.pickupMesh?.position});
                return;
            }
        },

        'global:Stage Press Move': function (e, pos) {
            if (this.isChoiseGunWeapon) {
                this.hands.state = HandsState.PUSH;
                this.stopLookAtPoint({ duration: 0.4, immediate: false, defaultTarget: this.pickupMesh?.position });
                return;
            }

            if (this.endGame) {
                this.hands.state = HandsState.PUSH;
                this.stopLookAtPoint({ duration: 0.4, immediate: false, defaultTarget: this.pickupMesh?.position });
                return;
            }

            this.lastPointer = this._toClientXY(pos);
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

            const p = hit.point;
            this.hands.setStreamTarget(p);

            this.setInactionTutorialTimer();

            this.startLookAtPoint(p, { duration: 1, offset: new THREE.Vector3(0, 0.12, 0), immediate: false });

            if (!this.lastWaterPlayTime || Date.now() - this.lastWaterPlayTime > 1000) {
                this.lastWaterPlayTime = Date.now();
                this.playSound("running-water");
            }

            const isPickup = hit.object === this.pickupMesh || hit.object.parent === this.pickupMesh;

            if (isPickup) {
                if (!this._lastPaintPos || p.distanceTo(this._lastPaintPos) >= this.paintSpacing) {
                    this.hoverCtrl.addStampAt(p, this.hoverCtrl.getRadius());
                    this._lastPaintPos = p.clone();

                    UICoinAnimator.animateFromWorldToUI(p, this['T_Wallet_Background'], { x: -90, y: 10 });
                    if (!this.lastCoinPlayTime || Date.now() - this.lastCoinPlayTime > 75) {
                        this.lastCoinPlayTime = Date.now();
                        this.playSound("drop-coin");
                    }

                    this.coinCollect.collectCoin(Settings["coin-per-second"]);

                    if (this.isGunReady) {
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

        'global:Stage Press Up': function (e, pos) {
            if (this.MatchActive && this.BallMove) {
                if (this.TutorMatchEnd) {
                    this.ShotEnd(e)
                }
                else {
                    this.checkClick(e, pos)
                }
            }

            this.isPainting = false
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
            this.stopLookAtPoint({duration: 0.4, immediate: false, defaultTarget: this.pickupMesh?.position});

            this.setInactionTutorialTimer();
        },

        "global:Setting Changed": function (name, value) {
            //Здесь нужно автоматически применить изменения в настройках Settings
            //Это нужно только для Dashboard чтобы не перезагружать фрейм игры
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
        this.hands.disableModel();

        this.pickupMesh.visible = false;

        this.hideInactionTutorial();
        this.removeInactionTutorialTimer();
        this.endGame = true;

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
                this.couple.runFrightState();
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

    OnChoiseGun(number) {
        this.hideInactionTutorial();
        this.hideWaterGunPanel();

        let pickup = null;

        this.sceneClone.traverse(obj => {
            if (obj.name === "pickup-moss") pickup = obj;
        })

        this.hoverCtrl.increaseRadius(0.3);

        this.isCameraTransitioning = true;
        CameraTransitionAnimator.animate({
            camera: this.camera,
            targetPosition: {x: 3, y: 1.8, z: 12},
            targetLookAt: pickup.position,
            duration: 2
        }).then(() => {
            this.isCameraTransitioning = false;
            this.isChoiseGunWeapon = false;
        });

        setTimeout(() => {
            this.isGunReady = true;
        }, 900)

    },

    // spawnWaterSplashFX(worldPos, count = 15, spread = 0.5, speed = 1, lifetime = 1) {
    //     if (!App.World.Scene) return;

    //     const textures = [
    //         'particle-water-1', 'particle-water-2', 'particle-water-3', 'particle-water-4', 'particle-water-5',
    //         'particle-water-6', 'particle-water-7', 'particle-water-8', 'particle-water-9', 'particle-water-10',
    //         'particle-water-11', 'particle-water-12', 'particle-water-13', 'particle-water-14', 'particle-water-15',
    //         'particle-water-16', 'particle-water-17', 'particle-water-18', 'particle-water-19', 'particle-water-20',
    //         'particle-water-21', 'particle-water-22', 'particle-water-23', 'particle-water-24', 'particle-water-25',
    //         'particle-water-26', 'particle-water-27', 'particle-water-28', 'particle-water-29'
    //     ];

    //     for (let i = 0; i < count; i++) {
    //         const texName = textures[Math.floor(Math.random() * textures.length)];
    //         const tex = App.ThreeAssets[texName];
    //         if (!tex) continue;

    //         const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, transparent: true}));
    //         sprite.position.copy(worldPos);
    //         sprite.scale.set(0.1, 0.1, 0.1);
    //         sprite.material.depthWrite = false;

    //         const dir = new THREE.Vector3(
    //             (Math.random() - 0.5) * spread,
    //             Math.random() * spread,
    //             (Math.random() - 0.5) * spread
    //         ).multiplyScalar(speed);

    //         App.World.Scene.add(sprite);

    //         gsap.to(sprite.position, {
    //             x: sprite.position.x + dir.x,
    //             y: sprite.position.y + dir.y - 0.1,
    //             z: sprite.position.z + dir.z,
    //             duration: lifetime,
    //             ease: "power2.out",
    //         });
    //         gsap.to(sprite.material, {
    //             opacity: 0,
    //             duration: lifetime,
    //             ease: "power1.in",
    //             onComplete: () => {
    //                 if (sprite.parent) sprite.parent.remove(sprite);
    //                 sprite.material.dispose();
    //                 sprite.geometry?.dispose();
    //             }
    //         });
    //     }
    // },

    spawnOldMan() {
        const glb = App.ThreeAssets['man-2-anim'];
        const ohThisIsMyWify = App.ThreeAssets["oh-no-this-is-my-wife-bubble"]; // это Texture или {texture:...} ?

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
        const options = Object.assign({duration: 0.5, defaultTarget: null, immediate: false, stopOnly: false}, opts);

        if (!this._cameraLook) {
            const def = options.defaultTarget || (this.pickupMesh?.position) || new THREE.Vector3(0, 0, 0);
            if (options.immediate) {
                this.camera.lookAt(def);
            } else {
                const tmp = {x: def.x, y: def.y, z: def.z};
                this._cameraLookVec = new THREE.Vector3(tmp.x, tmp.y, tmp.z);
                this.camera.lookAt(this._cameraLookVec);
            }
            return;
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
            // if (this.girlClone && this.girlClone.position) def = this.girlClone.position;
            // else
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

        this._cameraLookTween = gsap.to(this._cameraLook, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: Math.max(0.01, options.duration || 0.5),
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
                    let found = null
                    obj.traverse(o => {
                        if (!found && o.isMesh) found = o
                    })
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
      if (!this.dirtParticleSystem) {
        this.dirtParticleSystem = new ParticleSystem(
          {
            capacity: 1024,
            gravity: { x: 0, y: -9.81, z: 0 },
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
            lifeTimeRange: { min: 0.15, max: 0.25 },
            positionRange: { min: position.clone(), max: position.clone() },
            rotationRange: { min: -Math.PI, max: Math.PI },
            scaleOverTime: [
              { min: 0, max: 0 },
              { min: 0.05, max: 0.1 },
              { min: 0, max: 0 },
            ],
            opacityOverTime: [
              { min: 1, max: 1 },
            ],
            velocityRange: {
              theta: { min: -Math.PI, max: Math.PI },
              phi: { min: -Math.PI, max: Math.PI },
              magnitude: { min: 1, max: 3 },
            },
            angularVelocityRange: { min: -Math.PI * 5, max: Math.PI * 5 },
          },
        );
      }

      this.dirtParticleEmitter.play();
      this.dirtParticleEmitter.setPositionRange(position.clone(), position.clone());
    },

     startMatch3 (typeWaterGun) {
        this.MatchActive = true

        let board = this['board']

        this[`water gun ${typeWaterGun}`].visible = true

        this['timer'].visible = true

        this['timer'].material.opacity = 0

        gsap.to(
            this['timer'].material, {opacity: 1, duration: 0.5}
        )

        let time = 60

        const timerInterval = setInterval(() => {
            if (this.MatchActive) {
                time--
                this['timer text'].text = time
            }

            if (time === 0 && !this.MatchWin) {
                MraidSDK.open("end time match")
            }
        }, 1000)

        board.visible = true
        board.material.opacity = 0

        gsap.to(
            board.material, {opacity: 1, duration: 0.5}
        )

        setTimeout(() => {
            this.createBoardMatch3()

            setTimeout(() => {
                let shadow = this['bg match']

                shadow.visible = true
                shadow.material.opacity = 0

                gsap.to (
                    shadow.material, {opacity: 1, duration: 0.5}
                )
            }, 1200)
        }, 500)

        this['hand match'].position.set(-142.5 * 2.5, 71)
        this.handMatchAni()
    },

    createBoardMatch3 () {
        let randomColor2 = Math.floor(Math.random() * 4)

        let color2 = this.ArrayColor[randomColor2]
        let color3 = this.ArrayColor[randomColor2 + 1]

        for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
                //setTimeout(() => {
                    if (this.ArrayMatch[i - 1][j - 1] !== 0) {
                        let randomColor = Math.floor(Math.random() * 5)
                        let color = this.ArrayColor[randomColor]
    
                        let pos = { x: 0, y: 0 }
    
                        let cofPos = 142.5
    
                        pos.y = (i - 3.5) * cofPos
                        pos.x = (j - 3.5) * cofPos
    
                        if (this.ArrayMatch[i - 1][j - 1] === 2) {
                            color = color2
                        }
                        if (this.ArrayMatch[i - 1][j - 1] === 3) {
                            color = color3
                        }

                        if (this.ArrayMatch[i - 1][j - 1] === 1) {
                            if (color2 === color || color3 === color) {
                                j--
                                continue
                            }

                            if (i >= 3 && j >= 3) {
                                if (this.ArrayMatch[i - 1][j - 1] !== 0 && this.ArrayMatch[i - 2][j - 1] !== 0 && this.ArrayMatch[i - 3][j - 1] !== 0) {
                                    if (this[`ball ${i - 1} ${j}`].colorType === this[`ball ${i - 2} ${j}`].colorType && this[`ball ${i - 1} ${j}`].colorType === color
                                    ) {
                                        j--
                                        continue
                                    }
                                }
                                
                                if (this[`ball ${i} ${j - 1}`].colorType === this[`ball ${i} ${j - 2}`].colorType && this[`ball ${i} ${j - 1}`].colorType === color) {
                                    j--
                                    continue
                                }
                            }
                        }

                        if (i === 1 && j === 1) {
                            if (randomColor2 <= 2) {
                                color = this.ArrayColor[3]
                            }
                            else if (randomColor2 >= 3) {
                                color = this.ArrayColor[0]
                            }
                        }
                        if (i === 1 && j === 2) {
                            if (randomColor2 <= 2) {
                                color = this.ArrayColor[4]
                            }
                            else if (randomColor2 >= 3) {
                                color = this.ArrayColor[1]
                            }
                        }
    
                        let ball = this.buildThreeChild(this['balls'], {name: `ball ${i} ${j}`, type: 'three-image', image: color, colorType: color, position: [pos.x, pos.y], scale: 0, typeRemove: this.ArrayMatch[i - 1][j - 1]})

                        // gsap.to(
                        //     ball.scale, {x: 1.4, y: 1.4, duration: 0.5}
                        // )

                        // setTimeout(() => {
                        //     gsap.to(
                        //         ball.scale, {x: 1.2, y: 1.2, duration: 0.2}
                        //     )
                        // }, 500)
                    }
                //}, i * j * 25)
            }
        }

        for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
                if (this.ArrayMatch[i - 1][j - 1] !== 0) {
                    setTimeout(() => {
                        gsap.to(
                            this[`ball ${i} ${j}`].scale, {x: 1.4, y: 1.4, duration: 0.5}
                        )
        
                        setTimeout(() => {
                            gsap.to(
                                this[`ball ${i} ${j}`].scale, {x: 1.2, y: 1.2, duration: 0.2}
                            )
                        }, 500)
                    }, i * j * 25)
                }
            }
        }
    },

    isPointOnPlane( plane, point ) {
		const box = new THREE.Box3().setFromObject(plane);
		return box.max.x > point.x && box.min.x < point.x && box.max.y > point.y && box.min.y < point.y
	},

    checkClick(event, position) {
		const pos = App.World.ThreeGUI.convertStageTouch(event)

        if (this.BallMove) {
            if (!this.ColorBallActive) {
                if (this.isPointOnPlane(this['ball 4 2'], pos) && this['ball 4 2'].visible) {
                    this.BallMove = false
    
                    this.swapBall('ball 4 1', 'ball 4 2')
    
                    setTimeout(() => {
                        this.removeBall()
    
                        setTimeout(() => {
                            // this.checkVisBlock()

                            setTimeout(() => {
                                this.CheckNow = true

                                this.checkMatch3()
                            }, 500)

                            this.TutorMatchEnd = true

                            // const checkInterval = setInterval(() => {
                            //     if (this.CheckNow) {
                            //         this.checkMatch3()
                            //     }
                            //     else {
                            //         clearInterval(checkInterval)
                            //     }
                            // }, 700)
                        }, 100)
                    }, 500)
                }
            }
            else {
                if (this.isPointOnPlane(this['ball 2 1'], pos) && this['ball 2 1'].visible) {
                    this.BallMove = false
    
                    this.swapBall('ball 2 2', 'ball 2 1')

                    setTimeout(() => {
                        this.bombAni()
                        setTimeout(() => {
                            this.removeAllBalls()

                            setTimeout(() => {
                                this.winMatch()
                            }, 150)
                        }, 100)
                    }, 500)
                }
            }
        }
        else {
            if (!this.ColorBallActive) {
                if (this.isPointOnPlane(this['ball 4 1'], pos) && this['ball 4 1'].visible) {
                    this.BallMove = true
    
                    this['bg match'].visible = false
                    this['hand match'].visible = false
                }
            }
            else {
                if (this.isPointOnPlane(this['ball 2 2'], pos) && this['ball 2 2'].visible) {
                    this.BallMove = true
    
                    this['bg match'].visible = false
                    this['hand match'].visible = false
                }
            }
        }
	},

	ShotStart(event) {
        this.BallMove = true

        const pos = App.World.ThreeGUI.convertStageTouch(event)

        for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
                if (this.ArrayMatch[i - 1][j - 1] !== 0) {
                    if (this.isPointOnPlane(this[`ball ${i} ${j}`], pos) && this[`ball ${i} ${j}`].visible) {
                        this.CurrentBlock = `${i} ${j}`
                    }
                }
            }
        }
	},

	ShotEnd() {
        this.BallMove = false

        const pos = App.World.ThreeGUI.convertStageTouch(event)

        for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
                if (this.ArrayMatch[i - 1][j - 1] !== 0) {
                    if (this.isPointOnPlane(this[`ball ${i} ${j}`], pos) && this[`ball ${i} ${j}`].visible) {
                        if (this.CurrentBlock !== `${i} ${j}`) {
                            if ((this[`ball ${this.CurrentBlock}`].position.x - this[`ball ${i} ${j}`].position.x > -150 && this[`ball ${this.CurrentBlock}`].position.x - this[`ball ${i} ${j}`].position.x < 150 && this[`ball ${this.CurrentBlock}`].position.y - this[`ball ${i} ${j}`].position.y > -10 && this[`ball ${this.CurrentBlock}`].position.y - this[`ball ${i} ${j}`].position.y < 10) ||
                                (this[`ball ${this.CurrentBlock}`].position.y - this[`ball ${i} ${j}`].position.y > -150 && this[`ball ${this.CurrentBlock}`].position.y - this[`ball ${i} ${j}`].position.y < 150 && this[`ball ${this.CurrentBlock}`].position.x - this[`ball ${i} ${j}`].position.x > -10 && this[`ball ${this.CurrentBlock}`].position.x - this[`ball ${i} ${j}`].position.x < 10)
                            ) {
                                this.Swap = true

                                this.swapBall(`ball ${this.CurrentBlock}`, `ball ${i} ${j}`)
    
                                this.CurrentBlock = ``

                                // this['hand match'].position.set(-142.5 * 2.5, -142.5 * 1.5)
                                // this['hand match'].visible = true
                                // // this['hand match'].material.opacity = 0
                                // this.handMatchAni()
                            }

                            // setTimeout(() => {
                            //     this.checkMatch3()
                            // }, 500)
                        }
                    }
                }
            }
        }
	},

    checkMatch3() {
		let arrayRemove = []

		for (let i = 1; i <= 6; i++) {
			for (let j = 1; j <= 6; j++) {
				if (i <= 4) {
					if (this.ArrayMatch[i - 1][j - 1] !== 0 && this.ArrayMatch[i][j - 1] !== 0 && this.ArrayMatch[i + 1][j - 1] !== 0 && this[`ball ${i} ${j}`].visible) {
						if (this[`ball ${i} ${j}`].colorType === this[`ball ${i + 1} ${j}`].colorType && this[`ball ${i + 1} ${j}`].colorType === this[`ball ${i + 2} ${j}`].colorType) {
							arrayRemove.push({ x: i, y: j })
							arrayRemove.push({ x: i + 1, y: j })
							arrayRemove.push({ x: i + 2, y: j })
						}
					}
				}
				if (j <= 4) {
					if (this.ArrayMatch[i - 1][j - 1] !== 0 && this.ArrayMatch[i - 1][j] !== 0 && this.ArrayMatch[i - 1][j + 1] !== 0 && this[`ball ${i} ${j}`].visible) {
						if (this[`ball ${i} ${j}`].colorType === this[`ball ${i} ${j + 1}`].colorType && this[`ball ${i} ${j + 1}`].colorType === this[`ball ${i} ${j + 2}`].colorType) {
							arrayRemove.push({ x: i, y: j })
							arrayRemove.push({ x: i, y: j + 1 })
							arrayRemove.push({ x: i, y: j + 2 })
						}
					}
				}
			}
		}

		let uniqueArrayRemove = arrayRemove.filter((value, index, self) => self.indexOf(value) === index);

		for (let i = 0; i < uniqueArrayRemove.length; i++) {
			// this.deleteBlok(uniqueArrayRemove[i].x, uniqueArrayRemove[i].y)

            this[`ball ${uniqueArrayRemove[i].x} ${uniqueArrayRemove[i].y}`].visible = false

            this.ballParticlesAni(`ball ${uniqueArrayRemove[i].x} ${uniqueArrayRemove[i].y}`)
		}

        if (uniqueArrayRemove.length >= 1) {
            this.MatchNow = true
        }

		if (uniqueArrayRemove.length >= 1 || this.CheckNow) {
			this.CheckNow = false

            setTimeout(() => {
                this.checkMatch3()
            }, 500)
		}
        else {
            this.CheckNow = false
        }

        // this.checkVisBlock()
        setTimeout(() => {
            if (!this.CheckMatch) {
                this.checkVisBlock()
            }
        }, 75)
	},

    winMatch() {
        let gunGlow = this['water gun glow']

        this.playSound('win')

        // for (let i = 1; i <= 6; i++) {
        //     for (let j = 1; j <= 6; j++) {
        //         if (this.ArrayMatch[i - 1][j - 1] !== 0) {
        //             gsap.to(
        //                 this[`ball ${i} ${j}`].material, {opacity: 0, duration: 0.3}
        //             )
        //         }
        //     }
        // }

        setTimeout(() => {
            this[`balls`].visible = false
        }, 300)

        gsap.to(
            this['timer'].material, {opacity: 0, duration: 0.3}
        )

        gsap.to(
            this['timer text'].material, {opacity: 0, duration: 0.3}
        )

        gunGlow.visible = true
        gunGlow.material.opacity = 0

        gsap.to(
            gunGlow.material, {opacity: 1, duration: 0.3}
        )

        gsap.to(
            this['board'].material, {opacity: 0, duration: 0.3}
        )
        gsap.to(
            this['rectanle'].material, {opacity: 0, duration: 0.3}
        )

        for (let i = 0; i <= 20; i++) {
            setTimeout(() => {
                let randomTime = Math.random() * 50

                setTimeout(() => {
                    let randomX = Math.random() * 400 - 200
                    let randomY = Math.random() * 400 - 200

                    let randomScale = (Math.floor(Math.random() * 5) + 5) / 10

                    let randomType = Math.floor(Math.random() * 4) + 1

                    let glow = this.buildThreeChild(gunGlow, {type: 'three-image', image: `glow-${randomType}`, scale: 0, position: [randomX, randomY]})

                    gsap.to(
                        glow.scale, {x: randomScale, y: randomScale, duration: 0.3}
                    )

                    setTimeout(() => {
                        gsap.to(
                            glow.scale, {x: 0, y: 0, duration: 0.2}
                        )
                    }, 400)

                    setTimeout(() => {
                        gunGlow.remove(glow)
                    }, 700)
                }, randomTime)
            }, i * 100)
        }

        gsap.to(
            this['water gun match'].scale, {x: 2, y: 2, duration: 1}
        )

        gsap.to(
            this['water gun match'].position, {x: 0, y: 0, duration: 1}
        )

        setTimeout(() => {
            gsap.to(
                this['water gun 1'].material, {opacity: 0, duration: 1}
            )
            gsap.to(
                this['water gun 2'].material, {opacity: 0, duration: 1}
            )
            gsap.to(
                this['water gun 3'].material, {opacity: 0, duration: 1}
            )
            gsap.to(
                this['water gun glow'].material, {opacity: 0, duration: 1}
            )

            this.MatchWin = true
        }, 1500)

        setTimeout(() => {
            // await spawnCoins(this["ui-water-gun-3"]);
            this.hands.waterGunType = WaterGunType.POWERFUL;
            console.log(this.ChooseGun)
            this.OnChoiseGun(this.ChooseGun);
            // this.hands.setColorGun(Settings["First-yellow-color"], Settings["Second-yellow-color"]);

            // this.hands.setColorGun("#FFA500", "#FF8C00");
            // spawnCoins(10);
        }, 2500)
        
    },

    bombAni() {
        this.playSound('explosion')

        for (let i = 1; i <= 25; i++) {
            let explosionEffect = this.buildThreeChild(this['explosion effect'], {name: `explosion effect ${i}`, type: 'three-image', image: `explosion-effect-${i}`, visible: false, scale: 15})
        }

        for (let i = 1; i <= 25; i++) {
            setTimeout(() => {
                this[`explosion effect ${i}`].visible = true

                setTimeout(() => {
                    this[`explosion effect ${i}`].visible = false
                }, 20)
            }, i * 20)
        }
    },

    removeAllBalls() {
        for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
                if (this.ArrayMatch[i - 1][j - 1] !== 0) {
                    this[`ball ${i} ${j}`].visible = false

                    if (this[`ball ${i} ${j}`].colorType !== 'color-ball') {
                        this.ballParticlesAni(`ball ${i} ${j}`)
                    }
                }
            }
        }
    },

    swapBall(swapBall1, swapBall2) {
        this.playSound('swipe')

        let ball1 = this[swapBall1]
        let ball2 = this[swapBall2]

        let pos1 = { x: ball1.position.x, y: ball1.position.y }
        let pos2 = { x: ball2.position.x, y: ball2.position.y }

        gsap.to(
            ball1.position, {x: pos2.x, y: pos2.y, duration: 0.35}
        )
        gsap.to(
            ball2.position, {x: pos1.x, y: pos1.y, duration: 0.35}
        )

        setTimeout(() => {
            if (this.TutorMatchEnd && this.Swap) {
                if (ball1.colorType === ball2.colorType && ball2.colorType === 'color-ball') {
                    setTimeout(() => {
                        this.bombAni()
                        setTimeout(() => {
                            this.removeAllBalls()

                            setTimeout(() => {
                                this.winMatch()
                            }, 150)
                        }, 100)
                    }, 50)
                }
                else {
                    let color1 = ball1.colorType
                    let color2 = ball2.colorType
    
                    let scale1 = 1.2
                    let scale2 = 1.2
    
                    if (color1 === 'color-ball') {
                        scale1 = 0.9
                    }
                    if (color2 === 'color-ball') {
                        scale2 = 0.9
                    }
    
                    this['balls'].remove(ball1)
                    this['balls'].remove(ball2)
    
                    let ballNew1 = this.buildThreeChild(this['balls'], {name: swapBall2, type: 'three-image', image: color1, colorType: color1, position: [pos2.x, pos2.y], scale: scale1})
    
                    let ballNew2 = this.buildThreeChild(this['balls'], {name: swapBall1, type: 'three-image', image: color2, colorType: color2, position: [pos1.x, pos1.y], scale: scale2})
    
                    this.CheckNow = true

                    this.MatchNow = false

                    this.checkMatch3()
    
                    if (!this.MatchNow && this.Swap) {
                        this.swapBall(swapBall1, swapBall2)

                        this.MatchNow = false
    
                        this.Swap = false
                    }
                    else if (!this.Swap) {
                        this.Swap = true
                    }
                }
            }
        }, 350)
    },

    removeBall() {
        for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
                if (this[`ball ${i} ${j}`]) {
                    if (this[`ball ${i} ${j}`].typeRemove === 2 || this[`ball ${i} ${j}`].typeRemove === 3) {
                        this[`ball ${i} ${j}`].visible = false
    
                        this.ballParticlesAni(`ball ${i} ${j}`)
                    }
                }
            }
        }

        this.createColorBalls()
    },

    createColorBalls() {
        let pos1 = { x: this['ball 4 1'].position.x, y: this['ball 4 1'].position.y }
        let pos2 = { x: this['ball 4 2'].position.x, y: this['ball 4 2'].position.y }

        this['balls'].remove(this['ball 2 1'])
        this['balls'].remove(this['ball 2 2'])

        let ball1 = this.buildThreeChild(this['balls'], {name: 'ball 2 1', type: 'three-image', image: 'color-ball', position: [pos1.x, pos1.y], scale: 0, colorType: 'color-ball'})

        let ball2 = this.buildThreeChild(this['balls'], {name: 'ball 2 2', type: 'three-image', image: 'color-ball', position: [pos2.x, pos2.y], scale: 0, colorType: 'color-ball'})

        gsap.to(
            ball1.scale, {x: 0.9, y: 0.9, duration: 0.3}
        )
        gsap.to(
            ball1.position, {y: ball1.position.y - 283, duration: 0.3}
        )
        gsap.to(
            ball2.scale, {x: 0.9, y: 0.9, duration: 0.3}
        )
        gsap.to(
            ball2.position, {y: ball2.position.y - 283, duration: 0.3}
        )
    },

    checkVisBlock() {
        let counter = 0

        this.CheckMatch = true

        this.createNewBalls()

        let checkMove = false

        for (let i = 6; i > 1; i--) {
            for (let j = 1; j <= 6; j++) {
                if (this.ArrayMatch[i - 1][j - 1] > 0) {
                    if (this[`ball ${i} ${j}`].visible) {
                        if (this.ArrayMatch[i - 2][j - 1] > 0) {
                            if (!this[`ball ${i - 1} ${j}`].visible) {
                                checkMove = true

                                gsap.to(
                                    this[`ball ${i} ${j}`].position, {y: this.ArrayPos[i - 2], duration: 0.100}
                                )

                                counter++
    
                                setTimeout(() => {
                                    this['balls'].remove(this[`ball ${i - 1} ${j}`])

                                    let scaleCof = 1.2

                                    if (this[`ball ${i} ${j}`].colorType === 'color-ball') {
                                        scaleCof = 0.9
                                    }
    
                                    let ball = this.buildThreeChild(this['balls'], {name: `ball ${i - 1} ${j}`, type: 'three-image', image: this[`ball ${i} ${j}`].image, position: [this[`ball ${i} ${j}`].position.x, this[`ball ${i} ${j}`].position.y], colorType: this[`ball ${i} ${j}`].colorType, scale: scaleCof})
    
                                    this[`ball ${i} ${j}`].visible = false
                                    this[`ball ${i} ${j}`].position.y = this[`ball ${i} ${j}`].position.y + 142.5
                                }, 100)
                            }
                        }
                        if (j > 1 && !checkMove) {
                            if (this.ArrayMatch[i - 2][j - 2] > 0) {
                                if (!this[`ball ${i - 1} ${j - 1}`].visible) {
                                    gsap.to(
                                        this[`ball ${i} ${j}`].position, {y: this.ArrayPos[i - 2], x: this.ArrayPos[j - 2], duration: 0.100}
                                    )
    
                                    counter++
        
                                    setTimeout(() => {
                                        this['balls'].remove(this[`ball ${i - 1} ${j - 1}`])
    
                                        let scaleCof = 1.2
    
                                        if (this[`ball ${i} ${j}`].colorType === 'color-ball') {
                                            scaleCof = 0.9
                                        }
        
                                        let ball = this.buildThreeChild(this['balls'], {name: `ball ${i - 1} ${j - 1}`, type: 'three-image', image: this[`ball ${i} ${j}`].image, position: [this[`ball ${i} ${j}`].position.x, this[`ball ${i} ${j}`].position.y], colorType: this[`ball ${i} ${j}`].colorType, scale: scaleCof})
        
                                        this[`ball ${i} ${j}`].visible = false
                                        this[`ball ${i} ${j}`].position.y = this[`ball ${i} ${j}`].position.y + 142.5
                                    }, 100)
                                }
                            }
                        }
                    }
                }
            }
        }

        if (counter > 0) {
            setTimeout(() => {
                this.checkVisBlock()
                this.createNewBalls()
            }, 100)
        }
        else {
            this.CheckMatch = false

            setTimeout(() => {
                this['hand match'].position.set(-2.5 * 142.5, -1.5 * 142.5)
            }, 1000)

            this.ColorBallActive = true

            //this.handMatchAni()
        }
    },

    createNewBalls() {
        for (let j = 1; j <= 6; j++) {
            if (!this[`ball 6 ${j}`].visible) {
                let pos = { x: (j - 3.5) * 142.5, y: (6 - 3.5) * 142.5 }

                let randomColor = Math.floor(Math.random() * 5)

                this['balls'].remove(this[`ball 6 ${j}`])

                let ball = this.buildThreeChild(this['balls'], {name: `ball 6 ${j}`, type: 'three-image', image: this.ArrayColor[randomColor], position: [pos.x, pos.y + 142.5], opacity: 0, colorType: this.ArrayColor[randomColor], scale: 1.2})

                gsap.to(
                    ball.material, {opacity: 1, duration: 0.075}
                )
                gsap.to(
                    ball.position, {y: ball.position.y - 142.5, duration: 0.075}
                )
            }
        }
    },

    ballParticlesAni(type) {
        this.playSound('crash')

        for (let i = 0; i <= 3; i++) {
            let random = Math.floor(Math.random() * 2) + 1
			let randomScale = (Math.random() * 5 + 11) / 10
		
			let randomMinusX = Math.floor(Math.random() * 2) + 1
		
			let posX = Math.random() * 100 - 50
			let posY = 0
		
			if (randomMinusX === 1) {
				posX = -posX
			}

            let particle = this.buildThreeChild(this['particles'], {type: 'three-image', image: `${this[type].colorType}-particles-${random}`, position: [this[type].position.x + posX, this[type].position.y], scale: randomScale})

            gsap.to(
                particle.material, {opacity: 0, duration: 1.2}
            )
            gsap.to(
                particle.position, {x: particle.position.x + posX * 5, y: particle.position.y - 1000, duration: 1.2}
            )

            setTimeout(() => {
                this['particles'].remove(particle)
            }, 2000)
        }
    },

    handMatchAni() {
        let hand = this['hand match']

        hand.visible = true
        hand.material.opacity = 0
        hand.scale.set(0.6, 0.6)

        const handInterval = setInterval(() => {
            if (!hand.visible) {
                clearInterval(handInterval)
            }
            gsap.to(
                hand.material, {opacity: 1, duration: 0.5}
            )

            setTimeout(() => {
                if (!hand.visible) {
                    clearInterval(handInterval)
                }
                gsap.to(
                    hand.scale, {x: 0.5, y: 0.5, duration: 0.5}
                )

                setTimeout(() => {
                    if (!hand.visible) {
                        clearInterval(handInterval)
                    }
                    gsap.to(
                        hand.position, {x: hand.position.x + 142.5, duration: 0.5}
                    )

                    setTimeout(() => {
                        if (!hand.visible) {
                            clearInterval(handInterval)
                        }
                        gsap.to(
                            hand.scale, {x: 0.6, y: 0.6, duration: 0.5}
                        )
                        gsap.to(
                            hand.material, {opacity: 0, duration: 0.5}
                        )

                        setTimeout(() => {
                            hand.position.x = hand.position.x - 142.5
                        }, 500)
                    }, 500)
                }, 500)
            }, 500)
        }, 2200)
    },

})
