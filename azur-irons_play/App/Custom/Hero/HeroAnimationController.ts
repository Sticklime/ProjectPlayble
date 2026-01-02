import {
    AnimationState0D,
    AnimationState1D,
    AnimationStateMachine,
} from "animouse";
import {Component, Platform} from "Libs/Toolbox/Platform";
import {
    AnimationAction,
    AnimationActionLoopStyles,
    AnimationClip,
    AnimationMixer, AnimationUtils,
    LoopOnce,
    LoopRepeat,
    MathUtils,
} from "three";

enum AnimationEvent {
    movement = "movement",
    attack = "attack",
    win = "win",
    ready = "ready",
}

interface Parameters {
    mixer: AnimationMixer;
    idleClip: AnimationClip;
    runClip: AnimationClip;
    attackClips: AnimationClip[];
    winClip: AnimationClip;
    readyClip: AnimationClip;
    showLeg: AnimationClip;
    showHand: AnimationClip;
    allClip: AnimationClip;
}

export class HeroAnimationController extends Component {
    private readonly movementState: AnimationState1D;
    private readonly machine: AnimationStateMachine;
    private readonly attackStates: AnimationState0D[] = [];

    private readonly showLegState: AnimationState0D;
    private readonly showHandState: AnimationState0D;

    public constructor(platform: Platform, parameters: Parameters) {
        super(platform, 100);
        const {
            mixer,
            idleClip,
            runClip,
            attackClips,
            winClip,
            readyClip,
            showLeg,
            showHand,
            allClip,
        } = parameters;

        this.movementState = new AnimationState1D([
            {action: this.buildAction(mixer, idleClip, LoopRepeat, 0.25), value: 0},
            {action: this.buildAction(mixer, runClip, LoopRepeat), value: 1},
        ]);
        const winState = new AnimationState0D(
            this.buildAction(mixer, winClip, LoopRepeat),
        );

        this.machine = new AnimationStateMachine(this.movementState, mixer);
        this.machine.addTransition(AnimationEvent.movement, {
            to: this.movementState,
            duration: 0.25,
        });

        this.machine.addTransition(AnimationEvent.win, {
            to: winState,
            duration: 0.25,
        });

        this.showLegState = new AnimationState0D(
            this.buildAction(mixer, showLeg, LoopRepeat),
        );
        this.machine.addTransition("showLeg", {
            to: this.showLegState,
            duration: 0.25,
        });

        this.showHandState = new AnimationState0D(
            this.buildAction(mixer, showHand, LoopRepeat),
        );
        this.machine.addTransition("showHand", {
            to: this.showHandState,
            duration: 0.25,
        });

        for (let i = 0; i < attackClips.length; i++) {
            const clip = attackClips[i] as AnimationClip;
            const state = new AnimationState0D(
                this.buildAction(mixer, clip, LoopRepeat),
            );

            const eventName = this.buildAttackEventName(i);
            this.machine.addTransition(eventName, {
                to: state,
                duration: 0.25,
            });

            const readyState = new AnimationState0D(
                this.buildAction(mixer, readyClip, LoopRepeat),
            );

            this.machine.addTransition(AnimationEvent.ready, {
                to: readyState,
                duration: 0.25,
            });

            this.attackStates.push(state);
        }
    }

    private buildAttackEventName(attackID: number): string {
        return `${AnimationEvent}${attackID}`;
    }

    private buildAction(
        mixer: AnimationMixer,
        clip: AnimationClip,
        wrap: AnimationActionLoopStyles,
        speed: number = 1,
    ): AnimationAction {
        const action = new AnimationAction(mixer, clip);
        action.timeScale = speed;
        action.loop = wrap;
        if (wrap === LoopOnce) action.clampWhenFinished = true;
        return action;
    }

    public setMovementSpeed(value: number): void {
        const clampedValue = MathUtils.clamp(value, 0, 1);
        this.movementState.setBlend(clampedValue);
    }

    public runMovementState(): void {
        this.machine.handleEvent(AnimationEvent.movement);
    }

    public runAttackState(): void {
        const randomID = Math.floor(Math.random() * this.attackStates.length);
        const eventName = this.buildAttackEventName(randomID);
        this.machine.handleEvent(eventName);
    }

    public runWinState(): void {
        this.machine.handleEvent(AnimationEvent.win);
    }

    public runReadyState(): void {
        this.machine.handleEvent(AnimationEvent.ready);
    }

    public runShowLeg(): void {
        this.machine.handleEvent("showLeg");
    }

    public runShowHand(): void {
        this.machine.handleEvent("showHand");
    }

    protected override onTick(deltaTime: number): void {
        this.machine.update(deltaTime);
    }
}
