import EventHandler from "Libs/System/EventHandler";
import * as THREE from "three";

export enum AnimationState2DEvent {
  ENTER = "AnimationState1DEvent:ENTER",
  EXIT = "AnimationState1DEvent:EXIT",
}

export class AnimationState2D extends EventHandler {
  private xPositive: THREE.AnimationAction;
  private xNegative: THREE.AnimationAction;
  private yPositive: THREE.AnimationAction;
  private yNegative: THREE.AnimationAction;
  private center: THREE.AnimationAction;
  private factor: number;
  private blend: THREE.Vector2;

  public constructor(
    xPositive: THREE.AnimationAction,
    xNegative: THREE.AnimationAction,
    yPositive: THREE.AnimationAction,
    yNegative: THREE.AnimationAction,
    center: THREE.AnimationAction,
  ) {
    super();

    this.xPositive = xPositive;
    this.xPositive.weight = 0;

    this.xNegative = xNegative;
    this.xNegative.weight = 0;

    this.yPositive = yPositive;
    this.yPositive.weight = 0;

    this.yNegative = yNegative;
    this.yNegative.weight = 0;

    this.center = center;
    this.center.weight = 0;

    this.factor = 0;
    this.blend = new THREE.Vector2(0, 0);
  }

  public setBlend(x: number, y: number) {
    this.blend.set(x, y);
    this.blend.clampLength(0, 1);
    this.update();
  }

  private updateAction(action: THREE.AnimationAction, weight: number) {
    if (weight === 0 && action.weight > 0) action.stop();
    else if (weight > 0 && action.weight === 0) action.play();
    action.weight = weight;
  }

  private update() {
    const epsilon = 0.0001;
    const squaredLength = this.blend.lengthSq();

    if (squaredLength < epsilon) {
      this.updateAction(this.center, this.power);
      this.updateAction(this.xPositive, 0);
      this.updateAction(this.xNegative, 0);
      this.updateAction(this.yPositive, 0);
      this.updateAction(this.yNegative, 0);
    } else {
      const length = Math.sqrt(this.blend.length());
      const normalized = this.blend.clone().divideScalar(length);
      const absX = Math.abs(normalized.x);
      const absY = Math.abs(normalized.y);
      const maxXY = Math.max(absX, absY);
      const sumXY = absX + absY;
      const centerWeight = 1 - maxXY;

      const weightX = sumXY > 0 ? absX / (sumXY + centerWeight) : 0;
      const weightY = sumXY > 0 ? absY / (sumXY + centerWeight) : 0;
      const weightC = 1 - (weightX + weightY);

      const powerX = weightX * this.factor;
      const powerY = weightY * this.factor;
      const powerC = weightC * this.factor;

      this.updateAction(this.xPositive, normalized.x > 0 ? powerX : 0);
      this.updateAction(this.xNegative, normalized.x < 0 ? powerX : 0);
      this.updateAction(this.yPositive, normalized.y > 0 ? powerY : 0);
      this.updateAction(this.yNegative, normalized.y < 0 ? powerY : 0);
      this.updateAction(this.center, powerC);
    }
  }

  public get power() {
    return this.factor;
  }

  public set power(value) {
    const clampedValue = Math.clamp01(value);
    if (this.factor !== clampedValue) {
      if (this.factor === 0 && clampedValue > 0) {
        this.emit(AnimationState2DEvent.ENTER, this);
      } else if (this.factor > 0 && clampedValue === 0) {
        this.emit(AnimationState2DEvent.EXIT, this);
      }

      this.factor = clampedValue;
      this.update();
    }
  }
}
