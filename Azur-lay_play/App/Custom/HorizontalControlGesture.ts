import { GestureHandler } from "GestureHandler";
import EventHandler from "Libs/System/EventHandler";
import { MathUtils } from "three";

export enum HorizontalControlGestureEvent {
  CHANGE = "HorizontalControlGestureEvent:CHANGE",
  RESET = "HorizontalControlGestureEvent:RESET",
}

interface IOptions {
  range: number;
  sensitivity: number;
  resetWhenReleased: boolean;
  isActive: boolean;
}

export class HorizontalControlGesture extends EventHandler {
  private _position: number = 0;
  private readonly range: number;
  private readonly sensitivity: number;
  private readonly resetWhenReleased: boolean;
  private _isActive: boolean;
  private gestureUUID: string | null = null;

  public constructor(options: IOptions) {
    super();

    this.range = options.range;
    this.sensitivity = options.sensitivity;
    this.resetWhenReleased = options.resetWhenReleased;
    this._isActive = options.isActive;

    if (this._isActive) {
      this.subscribe();
    }
  }

  public destroy() {
    this.unsubscribe();
  }

  private subscribe() {
    GestureHandler.instance.on(
      GestureHandler.IEvent.START,
      this.onGestureStart,
      this,
    );
    GestureHandler.instance.on(
      GestureHandler.IEvent.MOVE,
      this.onGestureMove,
      this,
    );
    GestureHandler.instance.on(
      GestureHandler.IEvent.END,
      this.onGestureEnd,
      this,
    );
  }

  private unsubscribe() {
    GestureHandler.instance.off(
      GestureHandler.IEvent.START,
      this.onGestureStart,
      this,
    );
    GestureHandler.instance.off(
      GestureHandler.IEvent.MOVE,
      this.onGestureMove,
      this,
    );
    GestureHandler.instance.off(
      GestureHandler.IEvent.END,
      this.onGestureEnd,
      this,
    );
  }

  private onGestureStart(gesture: GestureHandler.IGesture) {
    if (this.gestureUUID === null) {
      this.gestureUUID = gesture.UUID;
    }
  }

  private onGestureMove(gesture: GestureHandler.IGesture) {
    if (this.gestureUUID && this.gestureUUID === gesture.UUID) {
      const delta = gesture.delta.x * this.sensitivity;
      this._position = MathUtils.clamp(
        this._position + delta,
        -this.range,
        this.range,
      );
      this.emit(HorizontalControlGestureEvent.CHANGE, this._position, delta);
    }
  }

  private onGestureEnd(gesture: GestureHandler.IGesture) {
    if (this.gestureUUID && this.gestureUUID === gesture.UUID) {
      this.gestureUUID = null;

      if (this.resetWhenReleased) {
        const delta = -this._position;
        this._position = 0;
        this.emit(HorizontalControlGestureEvent.RESET, this._position, delta);
      }
    }
  }

  public get position(): number {
    return this._position;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public set isActive(value: boolean) {
    if (this._isActive === value) return;
    this._isActive = value;

    if (this._isActive) {
      this.subscribe();
    } else {
      this.unsubscribe();
    }
  }
}
