import { AnimationState } from "AnimationState";
import { AnimationState1D } from "AnimationState1D";
import { AnimationStateMachine } from "AnimationStateMachine";
import {
  AnimationAction,
  AnimationActionLoopStyles,
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
} from "three";

enum EEvent {
  ATTACK = "ATTACK",
  DEATH = "DEATH",
  WIN = "WIN",
}

interface IOptions {
  mixer: AnimationMixer;
  idleClip: AnimationClip;
  runClip: AnimationClip;
  attackClip: AnimationClip;
  deathClip: AnimationClip;
  winClip: AnimationClip;
  maximumSpeed: number;
}

export class CharacterAnimationController {
  private movementState: AnimationState1D;
  private controller: AnimationStateMachine;
  private readonly maximumSpeed: number;

  public constructor(options: IOptions) {
    const {
      mixer,
      idleClip,
      runClip,
      attackClip,
      deathClip,
      winClip,
      maximumSpeed,
    } = options;

    this.maximumSpeed = maximumSpeed;

    this.movementState = new AnimationState1D([
      { action: this.buildAction(mixer, idleClip, LoopRepeat), value: 0 },
      { action: this.buildAction(mixer, runClip, LoopRepeat), value: 1 },
    ]);
    const attackState = new AnimationState(
      this.buildAction(mixer, attackClip, LoopOnce),
    );
    const deathState = new AnimationState(
      this.buildAction(mixer, deathClip, LoopOnce),
    );
    const winState = new AnimationState(
      this.buildAction(mixer, winClip, LoopRepeat),
    );

    this.controller = new AnimationStateMachine(this.movementState, mixer);
    this.controller.addTransition(null, attackState, 0.25, EEvent.ATTACK);
    this.controller.addTransition(null, deathState, 0.25, EEvent.DEATH);
    this.controller.addTransition(null, winState, 0.25, EEvent.WIN);
  }

  private buildAction(
    mixer: AnimationMixer,
    clip: AnimationClip,
    wrap: AnimationActionLoopStyles,
  ) {
    const action = new AnimationAction(mixer, clip);
    action.loop = wrap;
    if (wrap === LoopOnce) action.clampWhenFinished = true;
    return action;
  }

  public setMovementSpeed(speed: number) {
    this.movementState.setBlend(speed / this.maximumSpeed);
  }

  public runAttackState() {
    this.controller.handleEvent(EEvent.ATTACK, {});
  }

  public runDeathState() {
    this.controller.handleEvent(EEvent.DEATH, {});
  }

  public runWinState() {
    this.controller.handleEvent(EEvent.WIN, {});
  }
}
