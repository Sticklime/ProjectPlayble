import {
  AnimationState0D,
  AnimationState1D,
  AnimationStateMachine,
} from "animouse";
import { Component, Platform } from "Libs/Toolbox/Platform";
import {
  AnimationAction,
  AnimationActionLoopStyles,
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  MathUtils,
} from "three";

enum AnimationEvent {
  movement = "movement",
  attack = "attack",
  death = "death",
}

interface Parameters {
  mixer: AnimationMixer;
  idleClip: AnimationClip;
  runClip: AnimationClip;
  attackClip: AnimationClip;
  deathClip: AnimationClip;
}

export class EnemyAnimationController extends Component {
  private readonly movementState: AnimationState1D;
  private readonly machine: AnimationStateMachine;

  public constructor(platform: Platform, parameters: Parameters) {
    super(platform, 100);
    const { mixer, idleClip, runClip, attackClip, deathClip } = parameters;

    this.movementState = new AnimationState1D([
      { action: this.buildAction(mixer, idleClip, LoopRepeat), value: 0 },
      { action: this.buildAction(mixer, runClip, LoopRepeat), value: 1 },
    ]);

    const attackState = new AnimationState0D(
      this.buildAction(
        mixer,
        attackClip,
        LoopRepeat,
        MathUtils.randFloat(0.75, 1.25),
      ),
    );

    const deathState = new AnimationState0D(
      this.buildAction(mixer, deathClip, LoopOnce),
    );

    this.machine = new AnimationStateMachine(this.movementState, mixer);
    this.machine.addTransition(AnimationEvent.movement, {
      to: this.movementState,
      duration: 0.25,
    });

    this.machine.addTransition(AnimationEvent.attack, {
      to: attackState,
      duration: 0.25,
    });

    this.machine.addTransition(AnimationEvent.death, {
      to: deathState,
      duration: 0.15,
    });
  }

  private buildAction(
    mixer: AnimationMixer,
    clip: AnimationClip,
    wrap: AnimationActionLoopStyles,
    speed: number = 1,
  ): AnimationAction {
    const action = mixer.clipAction(clip);
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
    this.machine.handleEvent(AnimationEvent.attack);
  }

  public runDeathState(): void {
    this.machine.handleEvent(AnimationEvent.death);
  }

  protected override onTick(deltaTime: number): void {
    this.machine.update(deltaTime);
  }
}
