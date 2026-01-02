import gsap from 'gsap';
import * as THREE from 'three';

export class AnimatedManModelController {
    constructor(model, animations, camera, text) {
        this.model = model;
        this.camera = camera;
        this.mixer = new THREE.AnimationMixer(model);
        this.animations = new Map();
        this.currentAction = null;
        this.text = text;

        if (animations && animations.length > 0) {
            animations.forEach(clip => {
                this.animations.set(clip.name.toLowerCase(), clip);
            });
        }

        if (animations && animations.length > 0) {
            this.baseClip = animations[0];
        }

        this.updateMaterials();
        this.setManOutfitMode('default');
    }

    setManOutfitMode(mode) {
        const useWolf3D = mode === 'wolf3d';
        this.model.traverse(child => {
            const name = child.name;

            if(child.name === "ManBody"){
                child.traverse(child => {
                    if(child.name === "ManBody006"){
                        child.material.color = new THREE.Color("#FFC9B8");
                    }
                })
            }


            if ([
                'Jeans', 'Shirt', 'Sneakers', 'Wolf3D_Outfit_Footwear'
            ].includes(name)) {
                child.visible = useWolf3D ? name === 'Wolf3D_Outfit_Footwear' : name !== 'Wolf3D_Outfit_Footwear';
            }
        });
    }

    createAnimationSegment(name, startFrame, endFrame, fps = 24) {
        const startTime = startFrame;
        const endTime = endFrame;

        const clip = THREE.AnimationUtils.subclip(
            this.baseClip,
            name,
            startTime,
            endTime,
            fps
        );

        this.animations.set(name, clip);
    }

    updateMaterials() {
        this.model.traverse(child => {
            if (!child.material) return;

        });
    }

    changeCloth(name) {
        const [type, part] = name.split('-');

        this.model.traverse(child => {
            if (
                child.name === 'Jeans' ||
                child.name === 'Shirt' ||
                child.name === 'Sneakers' ||
                child.name === 'Wolf3D_Outfit_Footwear'
            ) {
                child.visible = false;
            }

            if (
                child.name.toLowerCase().includes(type) &&
                child.name.toLowerCase().includes(part)
            ) {
                child.visible = true;
            }

            if (type === 'wolf3d' && part === 'outfit') {
                if (child.name === 'Wolf3D_Outfit_Footwear') {
                    child.visible = true;
                }
            }
        });
    }

    updateSettingCharacter() {
        this.model.traverse(child => {
            if (!child.material) return;

            if (child.name === 'Shirt') {
                child.material.color = new THREE.Color(this.convertHexColor(Settings["man-shirt-color"]));
            }

            if (child.name === 'Jeans') {
                child.material.color = new THREE.Color(this.convertHexColor(Settings["man-jeans-color"]));
            }

            if (child.name === 'Sneakers') {
                child.material.color = new THREE.Color(this.convertHexColor(Settings["man-shoes-color"]));
            }
        });
    }

    playAnimation(name, options = {}) {
        if (!this.animations.has(name)) return null;

        const config = {
            loop: THREE.LoopRepeat,
            clampWhenFinished: true,
            fadeIn: 0.1,
            fadeOut: 0.1,
            timeScale: 1,
            forceRestart: false,
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

        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.enabled = true;
            action.reset().play();
            this.currentAction.crossFadeTo(action, config.fadeIn, false);
        } else {
            action.reset().fadeIn(config.fadeIn).play();
        }

        action.setLoop(config.loop, Infinity);
        action.clampWhenFinished = config.clampWhenFinished;
        action.setEffectiveTimeScale(config.timeScale);

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
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }

    dispose() {
        this.mixer.stopAllAction();
        this.model.traverse(child => {
            if (child.material && child.material.dispose) {
                child.material.dispose();
            }
        });
    }
}
