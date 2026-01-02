import gsap from 'gsap';
import * as THREE from 'three';

export class AnimatedModelController {
    constructor(model, animations, camera, text) {
        this.model = model;
        this.camera = camera;
        this.mixer = new THREE.AnimationMixer(model);
        this.animations = new Map();
        this.currentAction = null;
        this.textLabel = null;
        this.textPoint = null;
        this.text = text;
        if (animations && animations.length > 0) {
            this.baseClip = animations[0];
        }
        this.arrows = [];
        this.score = {
            'bottom': 0,
            'top': 0,
            'hair': 0,
            'shoes': 0
        };
        this.updateMaterials();
        this.createTextLabel();
    }

    configFirstBase() {

    }

    configSecondBase() {
        this.model.traverse(child => {
            if (['SetBottom', 'SetTop', 'Set_1_Top', 'Set_1_Accs'].includes(child.name)) child.visible = false;
            if (['Set_2_Top', 'Set_2_Gloves', 'Set_2_Shoes'].includes(child.name)) child.visible = true;

            if (child.name === 'Set_2_Hair' || child.name === 'Sport1Hair') child.visible = false;
            if (child.name === 'StoreHairF') child.visible = true;
        });
    }

    configThirdBase() {
        const toHide = [
            'Set_1_Top', 'Set_1_Accs',
            'Set_2_Top', 'Set_2_Accs', 'Set_2_Gloves', 'Set_2_Shoes', 'Set_2_Hair',
            'Set_3_Top', 'Set_3_Accs', 'Set_3_Gloves', 'Set_3_Shoes', 'Set_3_Legs',
            'SetTop', 'SetBottom', "Set_3_Accs_2",
            'StoreHairF', 'StoreHair', "Set_1_Shoes"
        ];
        this.model.traverse(child => {
            if (toHide.includes(child.name)) child.visible = false;
            if (['SetTop', 'SetBottom'].includes(child.name)) {
                child.visible = true;
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(Settings["girl-color-top-swimsuit"]),
                    roughness: 0.6,
                    metalness: 0.1
                });
            }
            if (child.name === 'Sport1Hair') {
                child.visible = true;
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(Settings["hair-color"]),
                    roughness: 0.6,
                    metalness: 0.1
                });
            }
        });
    }

    updateMaterials() {
    }

    changeCloth(step, name) {
        const scoreMap = {
            '1': 'shoes',
            '2': 'top',
            '3': 'hair',
            '4': 'bottom'
        };

        switch (step) {
            case '1':
                if (name === 'ToiletSet') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_2_Shoes') child.visible = true;
                        if (child.name === 'SetShoes001') child.visible = false;
                    });
                } else if (name === 'GoodChose') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_1_Shoes') child.visible = true;
                        if (child.name === 'SetShoes001') child.visible = false;
                    });
                } else if (name === 'Clownish') {
                    this.model.traverse(child => {
                        if (child.name === "Set_3_Shoes") child.visible = true;
                        if (child.name === "SetShoes001") child.visible = false;
                    });
                }
                break;
            case '2':
                this.model.traverse(child => {
                    if (child.name === 'SetTop' || child.name === 'SetBottom') child.visible = false;
                });
                if (name === 'ToiletSet') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_2_Top') child.visible = true;
                    });
                } else if (name === 'GoodChose') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_1_Top') {
                            child.visible = true;

                            child.traverse(subChild => {
                                console.log(subChild.name);
                                if (subChild.name === "Set_1_Top_1") {
                                    subChild.material = new THREE.MeshStandardMaterial({
                                        color: new THREE.Color(Settings["topFirstColor"]),
                                        transparent: true,
                                        opacity: 1.0
                                    });
                                }

                                if (subChild.name === "Dress1Top003_1") {
                                    subChild.material = new THREE.MeshStandardMaterial({
                                        color: new THREE.Color(Settings["topSecondColor"]),
                                        transparent: true,
                                        opacity: 1.0
                                    });
                                }
                            })
                        }
                    });
                } else if (name === 'Clownish') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_3_Top' || child.name === "Set_3_Legs") {
                            child.visible = true;
                        }
                    });
                }
                break;

            case '4':
                this.model.traverse(child => {
                    if (child.name === 'Sport1Hair') child.visible = false;
                });
                if (name === 'ToiletSet') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_2_Hair') child.visible = true;
                    });
                } else if (name === 'GoodChose') {
                    this.model.traverse(child => {
                        if (child.name === 'StoreHairF') {
                            child.visible = true;
                            child.material = new THREE.MeshStandardMaterial({
                                color: new THREE.Color(Settings["storeHair-color"]),
                                roughness: 0.6,
                                metalness: 0.1
                            });
                        }
                    });
                } else if (name === 'Clownish') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_3_Accs') child.visible = true;
                    });
                }
                break;

            case '3':
                if (name === 'ToiletSet') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_2_Gloves') child.visible = true;
                    });
                } else if (name === 'GoodChose') {
                    this.model.traverse(child => {
                        if (child.name === 'Set_1_Accs') child.visible = true;
                    });
                } else if (name === 'Clownish') {
                    this.model.traverse(child => {
                        if (child.name === "Set_3_Accs_2") {
                            child.visible = true;

                            if (child.name === "Set_3_Accs_2") {
                                child.material.transparent = true;
                                child.material.opacity = 1;
                                child.material.alphaTest = 0.1;
                                child.material.depthWrite = true;
                                child.material.side = THREE.DoubleSide;
                            }
                        }
                    });
                }
                break;
        }

        if(name === 'GoodChose') {
            App.Gameplay.showEmojiEffect("emoji_1");
        }
        else{
            App.Gameplay.showEmojiEffect("emoji_3");
        }

        const part = scoreMap[step];

        if (part) {
            this.score[part] = (name === 'GoodChose') ? 1 : 0;
        }
    }

    createLastArrows() {
        const x = this.text === 'YOU' ? 0 : 0.5;

        const config = [
            { part: 'shoes', offset: new THREE.Vector3(x, 1.64-0.5, 0) },
            { part: 'top', offset: new THREE.Vector3(x, 2- 0.5, 0) },
            { part: 'bottom', offset: new THREE.Vector3(x, 2.4- 0.5, 0) },
            { part: 'hair', offset: new THREE.Vector3(x, 0.2- 0.5, 0) }
        ];

        const basePosition = new THREE.Vector3();
        this.model.getWorldPosition(basePosition);

        config.forEach(({ part, offset }, index) => {
            const score = this.score[part];
            const worldPos = basePosition.clone().add(offset);
            const cont = App.Gameplay.createArrows(score, worldPos, index);
            this.arrows.push({ offset: offset.clone(), cont });
        });
    }

    createTextLabel(offset = new THREE.Vector3(0, 2.4, 0)) {
        const group = new THREE.Group();
        group.position.copy(offset);
        this.model.add(group);
        this.textPoint = group;
    }

    createAnimationSegment(name, startFrame, endFrame,fps = 24) {
        if (!this.baseClip) return;
        const clip = THREE.AnimationUtils.subclip(
            this.baseClip,
            name,
            startFrame,
            endFrame,
            fps);
        this.animations.set(name, clip);
    }

    createExplosion(radius = 150, count = 30, onComplete = () => {
    }) {
        const parent = this.starBgCont;

        for (let i = 0; i < count; i++) {
            const sprite = App.Gameplay.buildThreeChild(parent, {type: 'three-image', image: 'star'});
            const scale = 0.5 + Math.random() * 0.5;
            sprite.scale.set(scale, scale, scale);
            sprite.position.set(0, 0);

            const angle = Math.random() * Math.PI * 2;
            const distance = radius * (0.5 + Math.random() * 0.5);
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            gsap.timeline()
                .to(sprite.material, {opacity: 0, duration: 1, ease: 'power2.out'})
                .to(sprite.scale, {x: 0, y: 0, z: 0, duration: 1, ease: 'power2.out'}, '<')
                .to(sprite.position, {
                    x: dx, y: dy, duration: 1, ease: 'power2.out',
                    onComplete: () => {
                        sprite.removeFromParent();
                        if (i === count - 1) onComplete();
                    }
                }, '<');
        }
    }

    playAnimation(name, options = {}) {

        const config = {
            loop: THREE.LoopRepeat,
            clampWhenFinished: true,
            fadeIn: 0.25,
            fadeOut: 0.25,
            timeScale: 1,
            onFinish: null,
            ...options
        };

        const clip = this.animations.get(name);
        if (!this.actions) this.actions = new Map();
        let action = this.actions.get(name);

        if (!action) {
            action = this.mixer.clipAction(clip);
            this.actions.set(name, action);
        }

        if (this.currentAction === action && !config.forceRestart) {
            return action;
        }

        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(config.fadeOut);
        }

        if (config.forceRestart || this.currentAction !== action) {
            if (config.forceRestart) action.reset();
            action.setLoop(config.loop, Infinity);
            action.clampWhenFinished = config.clampWhenFinished;
            action.setEffectiveTimeScale(config.timeScale);
            action.fadeIn(config.fadeIn).play();
        }

        if (config.onFinish) {
            const handleFinish = e => {
                if (e.action === action) {
                    action.getMixer().removeEventListener('finished', handleFinish);
                    config.onFinish();
                }
            };
            action.getMixer().addEventListener('finished', handleFinish);
        }

        this.currentAction = action;
        return action;
    }

    setAnimationSpeed(speed) {
        if (this.currentAction) {
            this.currentAction.setEffectiveTimeScale(speed);
        }
    }

    update(delta) {
        if (this.mixer) this.mixer.update(delta);

        if (this.textLabel) {
            const worldPosition = new THREE.Vector3();
            this.textPoint.getWorldPosition(worldPosition);
            const converted_coord = App.Gameplay.convertWorldToGUI(worldPosition, App.Gameplay);
            this.textLabel.text = this.text;
            this.textLabel.position.copy(converted_coord);
            this.starBgCont.position.copy(converted_coord.add(new THREE.Vector3(0, 100, 0)));
        }
    }

    dispose() {
        this.mixer.stopAllAction();
    }

    sumScore() {
        return Object.values(this.score).reduce((a, b) => a + b, 0);
    }
}
