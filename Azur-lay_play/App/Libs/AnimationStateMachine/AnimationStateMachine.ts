import * as THREE from "three";
import { TimeHandler } from "TimeHandler";
import { AnimationState } from "./AnimationState";
import { AnimationState1D } from "./AnimationState1D";
import { AnimationState2D } from "./AnimationState2D";

type State = AnimationState | AnimationState1D | AnimationState2D;

type Transition = {
  from: State | null;
  to: State;
  condition: (data: any) => boolean;
  duration: number;
};

export class AnimationStateMachine {
  private currentState: State;
  private fadingStates: State[] = [];
  private mixer: THREE.AnimationMixer;
  private transitions: Map<string, Transition[]> = new Map();
  private elapsedTime: number;

  public constructor(initialState: State, mixer: THREE.AnimationMixer) {
    this.currentState = initialState;
    this.currentState.power = 1;

    this.mixer = mixer;
    this.transitions = new Map();
    this.elapsedTime = 0;
    TimeHandler.instance.on(TimeHandler.EEvent.TICK, this.onTick, this);
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);
  }

  public addTransition(
    from: State | null,
    to: State,
    duration: number,
    eventName = "*",
    condition = () => true,
  ) {
    const transitions = this.transitions.get(eventName) || [];
    this.transitions.set(eventName, transitions);
    transitions.push({ from, to, condition, duration });
  }

  public handleEvent(eventName: string, data: any) {
    const transitions = [
      ...(this.transitions.get(eventName) || []),
      ...(this.transitions.get("*") || []),
    ];

    for (const { from, to, duration, condition } of transitions) {
      const validFromState = !from || from === this.currentState;
      if (validFromState && condition(data)) {
        this.transitionTo(to, duration);
        return true;
      }
    }

    return false;
  }

  private transitionTo(state: State, duration: number) {
    if (this.currentState === state) return;
    this.fadingStates = this.fadingStates.filter((s) => s !== state);

    const lastState = this.currentState;
    this.currentState = state;

    this.fadingStates.push(lastState);
    this.elapsedTime = duration;
  }

  private onTick(deltaTime: number) {
    if (this.elapsedTime > 0) {
      const t = Math.min(1, deltaTime / this.elapsedTime);

      for (const state of this.fadingStates) {
        state.power = THREE.MathUtils.lerp(state.power, 0, t);
      }

      this.currentState.power = THREE.MathUtils.lerp(
        this.currentState.power,
        1,
        t,
      );

      this.elapsedTime = Math.max(0, this.elapsedTime - deltaTime);

      if (this.elapsedTime === 0) {
        for (const state of this.fadingStates) state.power = 0;
        this.fadingStates = [];
        this.currentState.power = 1;
      }
    }

    this.mixer.update(deltaTime);
  }
}
