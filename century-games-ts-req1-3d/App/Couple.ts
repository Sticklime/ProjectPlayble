import {AnimationMachine, ClipState} from "animouse";
import {gsap} from "gsap";
import {TimeController} from "Libs/Toolbox/TimeController";
import type {
    AnimationAction,
    AnimationActionLoopStyles,
    AnimationClip,
} from "three";
import {
    AnimationMixer,
    AnimationUtils,
    Group,
    LoopOnce,
    LoopRepeat,
    MathUtils,
    SkinnedMesh,
} from "three";
import type {GLTF} from "three/examples/jsm/loaders/GLTFLoader";
import {clone} from "three/examples/jsm/utils/SkeletonUtils";

enum CoupleAnimationEvent {
    FRIGHT = 1,
}

export class Couple extends Group {
    private readonly guyAnimationMachine: AnimationMachine;
    private readonly girlAnimationMachine: AnimationMachine;
    private guySkinnedMesh: SkinnedMesh[] = [];
    private girlSkinnedMesh: SkinnedMesh[] = [];

    constructor() {
        super();
        {
            const asset = App.ThreeAssets["SK_Guy"] as GLTF;
            const scene = clone(asset.scene);
            this.add(scene);

            scene.traverse((child) => {
                if (child instanceof SkinnedMesh) {
                    this.guySkinnedMesh.push(child);
                }
            });

            const mixer = new AnimationMixer(scene);

            const idleClip = asset.animations[2];
            if (!idleClip) {
                console.warn(`No animations available for SK_Guy.`);
            }

            const frightClip = asset.animations[3];
            if (!frightClip) {
                console.warn(`No animations available for SK_Guy.`);
            }

            const idle = new ClipState(
                Couple.buildAction(
                    idleClip,
                    15,
                    50,
                    mixer,
                    LoopRepeat,
                    asset.animations,
                    "Idle",
                ),
            );

            const fright = new ClipState(
                Couple.buildAction(
                    frightClip,
                    15,
                    120,
                    mixer,
                    LoopOnce,
                    asset.animations,
                    "Fright",
                ),
            );

            this.guyAnimationMachine = new AnimationMachine(idle, mixer);
            this.guyAnimationMachine.addEventTransition(CoupleAnimationEvent.FRIGHT, {
                duration: 0.25,
                to: fright,
            });
        }
        {
            const asset = App.ThreeAssets["SK_Girl"] as GLTF;
            const scene = clone(asset.scene);
            this.add(scene);

            scene.traverse((child) => {
                if (child instanceof SkinnedMesh) {
                    this.girlSkinnedMesh.push(child);
                }
            });

            const mixer = new AnimationMixer(scene);

            const idleClip = asset.animations.find((animation) =>
                animation.name === "animation-girl-a2"
            );
            if (!idleClip) {
                console.warn(`Animation "animation-girl-a2" not found for SK_Girl. Available animations: ${asset.animations.map(a => a.name).join(', ')}`);
            }

            const frightClip = asset.animations.find((animation) =>
                animation.name === "animation-girl-a2"
            );
            if (!frightClip) {
                console.warn(`Animation "animation-girl-a2" not found for SK_Girl. Available animations: ${asset.animations.map(a => a.name).join(', ')}`);
            }

            const idle = new ClipState(
                Couple.buildAction(
                    idleClip,
                    15,
                    45,
                    mixer,
                    LoopRepeat,
                    asset.animations,
                    "Idle",
                ),
            );

            const fright = new ClipState(
                Couple.buildAction(
                    frightClip,
                    15,
                    120,
                    mixer,
                    LoopOnce,
                    asset.animations,
                    "Fright",
                ),
            );

            this.girlAnimationMachine = new AnimationMachine(idle, mixer);
            this.girlAnimationMachine.addEventTransition(
                CoupleAnimationEvent.FRIGHT,
                {
                    duration: 0,
                    to: fright,
                },
            );
        }

        TimeController.instance.on(TimeController.Event.TICK, this.onTick);
    }

    public runFrightState() {

        this.guyAnimationMachine.handleEvent(CoupleAnimationEvent.FRIGHT);

        this.girlAnimationMachine.handleEvent(CoupleAnimationEvent.FRIGHT);

        this.animateFrightMorphTargets();
    }

    private animateFrightMorphTargets() {
        const delay = 0.5;
        const duration = 0.25;

        if (this.guySkinnedMesh) {
            for (const mesh of this.guySkinnedMesh) {
                this.animateMorph(mesh, "Fright", delay, duration);
            }
        }
        if (this.girlSkinnedMesh) {
            for (const mesh of this.girlSkinnedMesh) {
                this.animateMorph(mesh, "Fright", delay, duration);
            }
        }
    }

    private animateMorph(
        mesh: SkinnedMesh,
        targetName: string,
        delay: number,
        duration: number,
    ) {
        const dictionary = mesh.morphTargetDictionary;
        const influences = mesh.morphTargetInfluences;
        if (!dictionary || !influences) {
            return;
        }

        const index = dictionary[targetName];
        if (index === undefined) {
            return;
        }

        const helper = {t: 0};
        gsap.to(helper, {
            t: 1,
            delay,
            duration,
            ease: "power1.inOut",
            onUpdate: () => {
                console.log(`Updating morph target influence: ${helper.t}`);
                influences[index] = helper.t;
            },
        });
    }


    private readonly onTick = (deltaTime: number) => {
        this.guyAnimationMachine.update(deltaTime);
        this.girlAnimationMachine.update(deltaTime);
    };

    private static buildFrozenAction(
        clip: AnimationClip | undefined,
        frame: number,
        mixer: AnimationMixer,
        availableAnimations?: AnimationClip[],
        animationName?: string,
    ): AnimationAction {
        if (!clip) {
            const availableNames = availableAnimations?.map(a => a.name).join(', ') || 'none';
            const errorMsg = `Animation clip "${animationName || 'unknown'}" is undefined. Available animations: ${availableNames}`;
            console.error(errorMsg);

            if (availableAnimations && availableAnimations.length > 0) {
                const fallbackClip = availableAnimations[0];
                if (fallbackClip) {
                    console.warn(`Using first available animation as fallback: ${fallbackClip.name}`);
                    clip = fallbackClip;
                } else {
                    throw new Error(errorMsg);
                }
            } else {
                throw new Error(errorMsg);
            }
        }
        if (!clip) {
            throw new Error(`Animation clip "${animationName || 'unknown'}" is still undefined after fallback attempt.`);
        }

        if (!clip.duration || clip.duration < 0.000001) {
            throw new Error(`Animation clip "${animationName || 'unknown'}" has invalid duration: ${clip.duration}`);
        }

        const maxFrame = Math.max(1, Math.floor(clip.duration * 24));
        const validFrame = Math.max(0, Math.min(frame, maxFrame - 1));

        const frameTime = validFrame / 24;
        const nextFrameTime = Math.min((validFrame + 1) / 24, clip.duration);

        const subclip = AnimationUtils.subclip(
            clip,
            MathUtils.generateUUID(),
            validFrame,
            validFrame + 1,
            24,
        );

        if (subclip.duration < 0.000001) {
            const fullSubclip = AnimationUtils.subclip(
                clip,
                MathUtils.generateUUID(),
                0,
                maxFrame,
                24,
            );
            const action = mixer.clipAction(fullSubclip);
            action.paused = true;
            action.time = frameTime;
            action.clampWhenFinished = true;
            return action;
        }

        const action = mixer.clipAction(subclip);
        action.paused = true;
        action.time = 0;
        action.clampWhenFinished = true;
        return action;
    }

    private static buildAction(
        clip: AnimationClip | undefined,
        from: number,
        to: number,
        mixer: AnimationMixer,
        loop: AnimationActionLoopStyles = LoopRepeat,
        availableAnimations?: AnimationClip[],
        animationName?: string,
    ): AnimationAction {
        if (!clip) {
            const availableNames = availableAnimations?.map(a => a.name).join(', ') || 'none';
            const errorMsg = `Animation clip "${animationName || 'unknown'}" is undefined. Available animations: ${availableNames}`;
            console.error(errorMsg);

            if (availableAnimations && availableAnimations.length > 0) {
                const fallbackClip = availableAnimations[0];
                if (fallbackClip) {
                    console.warn(`Using first available animation as fallback: ${fallbackClip.name}`);
                    clip = fallbackClip;
                } else {
                    throw new Error(errorMsg);
                }
            } else {
                throw new Error(errorMsg);
            }
        }
        if (!clip) {
            throw new Error(`Animation clip "${animationName || 'unknown'}" is still undefined after fallback attempt.`);
        }

        if (!clip.duration || clip.duration < 0.000001) {
            throw new Error(`Animation clip "${animationName || 'unknown'}" has invalid duration: ${clip.duration}`);
        }

        const maxFrame = Math.max(1, Math.floor(clip.duration * 24));
        const validFrom = Math.max(0, Math.min(from, maxFrame - 1));
        const validTo = Math.max(validFrom + 1, Math.min(to, maxFrame));

        if (validTo <= validFrom || maxFrame < 1) {
            console.warn(`Invalid frame range for "${animationName || 'unknown'}": from=${from}, to=${to}, maxFrame=${maxFrame}, clip.duration=${clip.duration}. Using full range.`);
            const fullSubclip = AnimationUtils.subclip(
                clip,
                MathUtils.generateUUID(),
                0,
                maxFrame,
                24,
            );
            if (fullSubclip.duration < 0.000001) {
                throw new Error(`Animation clip "${animationName || 'unknown'}" has invalid duration: ${fullSubclip.duration}. Clip duration: ${clip.duration}, maxFrame: ${maxFrame}`);
            }
            const action = mixer.clipAction(fullSubclip);
            action.loop = loop;
            action.clampWhenFinished = loop === LoopOnce;
            return action;
        }

        const subclip = AnimationUtils.subclip(
            clip,
            MathUtils.generateUUID(),
            validFrom,
            validTo,
            24,
        );

        if (subclip.duration < 0.000001) {
            console.warn(`Subclip duration too small (${subclip.duration}) for "${animationName || 'unknown'}": from=${validFrom}, to=${validTo}. Using full range.`);
            const fullSubclip = AnimationUtils.subclip(
                clip,
                MathUtils.generateUUID(),
                0,
                maxFrame,
                24,
            );
            if (fullSubclip.duration < 0.000001) {
                throw new Error(`Animation clip "${animationName || 'unknown'}" has invalid duration: ${fullSubclip.duration}. Clip duration: ${clip.duration}, maxFrame: ${maxFrame}`);
            }
            const action = mixer.clipAction(fullSubclip);
            action.loop = loop;
            action.clampWhenFinished = loop === LoopOnce;
            return action;
        }

        const action = mixer.clipAction(subclip);
        action.loop = loop;
        action.clampWhenFinished = loop === LoopOnce;
        return action;
    }
}
