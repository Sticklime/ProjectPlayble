import EventHandler from "Libs/System/EventHandler";
import * as THREE from "three";

export type Action1D = {
  action: THREE.AnimationAction;
  value: number;
};

export enum AnimationState1DEvent {
  ENTER = "AnimationState1DEvent:ENTER",
  EXIT = "AnimationState1DEvent:EXIT",
}

export class AnimationState1D extends EventHandler {
  private actions: Action1D[] = [];
  private factor: number = 0;
  private blend: number = 0;

  public constructor(actions: Action1D[]) {
    super();
    if (actions.length < 2) throw new Error("Need at least 2 actions");

    for (const action of actions) {
      this.actions.push(action);
      action.action.weight = 0;
    }

    this.actions.sort((a, b) => a.value - b.value);

    const first = this.actions[0];
    const last = this.actions[this.actions.length - 1];

    if (!first || !last) {
      throw new Error("Invalid animation action");
    }

    first.value = 0;
    last.value = 1;
  }

  public setBlend(value: number) {
    this.blend = THREE.MathUtils.clamp(value, 0, 1);
    this.update();
  }

  private updateAction(action: THREE.AnimationAction, weight: number) {
    if (weight === 0 && action.weight > 0) action.stop();
    else if (weight > 0 && action.weight === 0) action.play();
    action.weight = weight;
  }

  private update() {
    for (let i = 0; i < this.actions.length - 1; i++) {
      const left = this.actions[i];
      const right = this.actions[i + 1];

      if (!left || !right) {
        throw new Error("Invalid animation action");
      }

      if (this.blend < left.value) {
        this.updateAction(right.action, 0);
      } else if (this.blend > right.value) {
        this.updateAction(left.action, 0);
      } else {
        const difference =
          (this.blend - left.value) / (right.value - left.value);
        this.updateAction(left.action, (1 - difference) * this.factor);
        this.updateAction(right.action, difference * this.factor);
      }
    }
  }

  public get power() {
    return this.factor;
  }

  public set power(value: number) {
    const clampedValue = THREE.MathUtils.clamp(value, 0, 1);

    if (this.factor !== clampedValue) {
      if (this.factor === 0 && clampedValue > 0) {
        this.emit(AnimationState1DEvent.ENTER, this);
      } else if (this.factor > 0 && clampedValue === 0) {
        this.emit(AnimationState1DEvent.EXIT, this);
      }

      this.factor = clampedValue;
      this.update();
    }
  }
}
