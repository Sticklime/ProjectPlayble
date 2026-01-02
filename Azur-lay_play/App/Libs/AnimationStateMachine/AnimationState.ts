import EventHandler from "Libs/System/EventHandler";
import * as THREE from "three";

export enum AnimationStateEvent {
  ENTER = "AnimationStateEvent:ENTER",
  EXIT = "AnimationStateEvent:EXIT",
}

export class AnimationState extends EventHandler {
  private action: THREE.AnimationAction;
  private factor: number;

  public constructor(action: THREE.AnimationAction) {
    super();
    this.action = action;
    this.action.weight = 0;
    this.factor = 0;
  }

  public get power() {
    return this.factor;
  }

  public set power(value) {
    if (this.factor !== value) {
      if (this.factor === 0 && value > 0) {
        this.action.play();
        this.emit(AnimationStateEvent.ENTER, this);
      } else if (this.factor > 0 && value === 0) {
        this.emit(AnimationStateEvent.EXIT, this);
        this.action.stop();
      }

      this.factor = THREE.MathUtils.clamp(value, 0, 1);
      this.action.weight = this.factor;
    }
  }
}
