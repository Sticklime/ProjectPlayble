import * as THREE from 'three';

export interface PlayOptions {
    loop?: THREE.AnimationActionLoopStyles;
    clampWhenFinished?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    timeScale?: number;
    forceRestart?: boolean;
    onFinish?: (() => void) | null;
    repetitions?: number; // для LoopRepeat
}


export class AnimatedModelController {
    public readonly model: THREE.Object3D;
    public readonly mixer: THREE.AnimationMixer;

    // Разрешаем null; undefined не храним — конвертируем в null
    public baseClip: THREE.AnimationClip | null = null;

    private readonly animations: Map<string, THREE.AnimationClip> = new Map();
    private readonly actions: Map<string, THREE.AnimationAction> = new Map();
    private currentAction: THREE.AnimationAction | null = null;

    constructor(model: THREE.Object3D, clips: THREE.AnimationClip[] = []) {
        this.model = model;
        this.mixer = new THREE.AnimationMixer(this.model);

        for (const c of clips) {
            this.animations.set(c.name, c);
        }

        this.baseClip = (clips.length > 0 ? clips[0] : null) as THREE.AnimationClip | null;
    }

    public setBaseClip(clip: THREE.AnimationClip): void {
        this.baseClip = clip;
        if (!this.animations.has(clip.name)) {
            this.animations.set(clip.name, clip);
        }
    }

    public createAnimationSegment(
        name: string,
        startFrame: number,
        endFrame: number,
        fps = 24,
        clip?: THREE.AnimationClip   // <── новый параметр
    ): void {
        const sourceClip = clip || this.baseClip;

        if (!sourceClip) {
            console.warn(
                '[AnimatedModelController] Нет доступного clip. Задайте baseClip через setBaseClip() или передайте clip в аргумент.'
            );
            return;
        }

        const sub = THREE.AnimationUtils.subclip(
            sourceClip,
            name,
            startFrame,
            endFrame,
            fps
        );

        this.animations.set(name, sub);
    }


    public playAnimation(name: string, options: PlayOptions = {}): THREE.AnimationAction | null {
        const clip = this.animations.get(name);
        if (!clip) {
            console.warn(`[AnimatedModelController] Клип "${name}" не найден.`);
            return null;
        }

        const config: Required<PlayOptions> = {
            loop: THREE.LoopRepeat,
            clampWhenFinished: true,
            fadeIn: 0.25,
            fadeOut: 0.25,
            timeScale: 1,
            forceRestart: true,
            onFinish: null,
            repetitions: Infinity,
            ...options
        };

        let action = this.actions.get(name);
        if (!action) {
            action = this.mixer.clipAction(clip);
            this.actions.set(name, action);
        }

        // если уже играет тот же и не форсим рестарт — вернуть
        if (this.currentAction === action && !config.forceRestart) {
            return action;
        }

        // погасить предыдущий

        // настроить новый
        action.reset();
        action.setEffectiveTimeScale(config.timeScale);

        const reps =
            (config.loop === THREE.LoopRepeat || config.loop === THREE.LoopPingPong)
                ? (Number.isFinite(config.repetitions) ? config.repetitions : Infinity)
                : 0; // для LoopOnce

        action.setLoop(config.loop, reps);
        action.clampWhenFinished = !!config.clampWhenFinished;
        action.play();

        // onFinish (для LoopOnce)
        if (config.onFinish) {
            const handleFinish = (e: THREE.Event & { action: THREE.AnimationAction }) => {
                if (e.action === action) {
                    this.mixer.removeEventListener('finished', handleFinish);
                    (config.onFinish as () => void)();
                }
            };
            this.mixer.addEventListener('finished', handleFinish);
        }



        this.currentAction = action;
        return action;
    }

    public retargetClip(clip: THREE.AnimationClip, fromPrefix: string, toPrefix: string): THREE.AnimationClip {
        const tracks = clip.tracks.map(t => {
            const nt = t.clone();
            nt.name = nt.name.replace(fromPrefix, toPrefix);
            return nt;
        });
        return new THREE.AnimationClip(clip.name + '_retarget', clip.duration, tracks);
    }

    public update(deltaSeconds: number): void {
        this.mixer.update(deltaSeconds);
    }
}
