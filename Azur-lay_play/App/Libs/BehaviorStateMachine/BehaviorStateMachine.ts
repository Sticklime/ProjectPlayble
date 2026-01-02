import { BehaviorState } from "./BehaviorState";

type AnyState = BehaviorState | BehaviorStateMachine;

type Transition = {
  from: AnyState | null;
  to: AnyState;
  condition: (data: any) => boolean;
};

export class BehaviorStateMachine extends BehaviorState {
  private _currentState: AnyState | null;
  private _transitions: Map<string, Transition[]>;

  constructor(initialState: AnyState | null) {
    super();
    this._currentState = initialState;
    this._transitions = new Map();
  }

  protected override enter() {
    super.enter();
    //TODO: Fix TS-IGNORE!
    //@ts-ignore
    if (this._currentState) this._currentState.enter();
  }

  protected override exit() {
    super.exit();
    //TODO: Fix TS-IGNORE!
    //@ts-ignore
    if (this._currentState) this._currentState.exit();
  }

  public addTransition(
    from: AnyState | null,
    to: AnyState,
    eventName = "*",
    condition = () => true,
  ) {
    const transitions = this._transitions.get(eventName) || [];
    this._transitions.set(eventName, transitions);
    transitions.push({ from, to, condition });
  }

  public handleEvent(eventName: string, data: any) {
    const transitions = [
      ...(this._transitions.get(eventName) || []),
      ...(this._transitions.get("*") || []),
    ];

    for (const { from, to, condition } of transitions) {
      const validFromState = !from || from === this._currentState;
      if (validFromState && condition(data)) {
        this.transitionTo(to);
        return true;
      }
    }

    if (this._currentState instanceof BehaviorStateMachine) {
      this._currentState.handleEvent(eventName, data);
    }

    return false;
  }

  private transitionTo(state: AnyState) {
    if (this._currentState === state) return;

    //TODO: Fix TS-IGNORE!

    //@ts-ignore
    this._currentState?.exit();
    this._currentState = state;
    //@ts-ignore
    this._currentState?.enter();
  }
}
