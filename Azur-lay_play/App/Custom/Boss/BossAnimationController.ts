import { AnimationState } from "AnimationState";
import { AnimationStateMachine } from "AnimationStateMachine";
import * as THREE from "three";

enum EEvent {
  HIT = "HIT",
  ATTACK = "ATTACK",
  DEATH = "DEATH",
  WIN = "WIN",
}

interface IOptions {
  mixer: THREE.AnimationMixer;
  idleClip: THREE.AnimationClip;
  hitClip: THREE.AnimationClip;
  attackClip: THREE.AnimationClip;
  deathClip: THREE.AnimationClip;
  winClip: THREE.AnimationClip;
}

export class BossAnimationController {
  private controller: AnimationStateMachine;

  public constructor(options: IOptions) {
    const { mixer, idleClip, hitClip, attackClip, deathClip, winClip } =
      options;

    const speed = 0.5;

    const idleState = new AnimationState(
      this.buildAction(mixer, idleClip, THREE.LoopRepeat, speed),
    );
    const hitState = new AnimationState(
      this.buildAction(mixer, hitClip, THREE.LoopOnce, speed),
    );
    const attackState = new AnimationState(
      this.buildAction(mixer, attackClip, THREE.LoopOnce, speed),
    );
    const deathState = new AnimationState(
      this.buildAction(mixer, deathClip, THREE.LoopOnce, speed),
    );
    const winState = new AnimationState(
      this.buildAction(mixer, winClip, THREE.LoopRepeat, speed),
    );

    this.controller = new AnimationStateMachine(idleState, mixer);
    this.controller.addTransition(null, hitState, 0.25, EEvent.HIT);
    this.controller.addTransition(null, attackState, 0.25, EEvent.ATTACK);
    this.controller.addTransition(null, deathState, 0.25, EEvent.DEATH);
    this.controller.addTransition(null, winState, 0.25, EEvent.WIN);
  }

  private buildAction(
    mixer: THREE.AnimationMixer,
    clip: THREE.AnimationClip,
    wrap: THREE.AnimationActionLoopStyles,
    speed: number,
  ) {
    const action = new THREE.AnimationAction(mixer, clip);
    action.loop = wrap;
    action.timeScale = speed;
    if (wrap === THREE.LoopOnce) action.clampWhenFinished = true;
    return action;
  }

  public runHitState() {
    this.controller.handleEvent(EEvent.HIT, {});
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
