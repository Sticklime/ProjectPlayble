import { Emitter } from "eventail";
import { Vector2 } from "three";

export enum JoystickGestureEvent {
  change = "change",
  release = "release",
}

export interface JoystickGestureParameters {
  isActive?: boolean;
  pixelDistance?: number;
}

export class JoystickGesture extends Emitter {
  private pointer?: Vector2;
  private isActivePrivate: boolean;
  private pixelDistance: number;

  public constructor(parameters: JoystickGestureParameters = {}) {
    super();
    this.isActivePrivate = parameters.isActive ?? false;
    this.pixelDistance = parameters.pixelDistance ?? 100;

    if (this.isActivePrivate) {
      this.subscribe();
    }
  }

  public get isActive(): boolean {
    return this.isActivePrivate;
  }

  public set isActive(value: boolean) {
    if (this.isActivePrivate === value) return;
    this.isActivePrivate = value;

    if (this.isActivePrivate) {
      this.pointer = undefined;
      this.subscribe();
    } else {
      this.unsubscribe();
    }
  }

  private subscribe() {
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);

    window.addEventListener("touchstart", this.onTouchStart, { passive: false });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchEnd, { passive: false });
  }

  private unsubscribe() {
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);

    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchEnd);
  }

  private onMouseDown = (event: MouseEvent) => {
    if (this.pointer) return;
    this.pointer = new Vector2(event.clientX, event.clientY);
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.pointer) return;

    const direction = new Vector2(event.clientX, event.clientY)
        .sub(this.pointer)
        .divideScalar(this.pixelDistance);

    this.emit(JoystickGestureEvent.change, direction);
  };

  private onMouseUp = (event: MouseEvent) => {
    if (this.pointer) {
      this.pointer = undefined;
      this.emit(JoystickGestureEvent.release);
    }
  };

  private onTouchStart = (event: TouchEvent) => {
    if (this.pointer) return;
    if (event.touches.length > 0) {
      const touch = event.touches[0]!;
      this.pointer = new Vector2(touch.clientX, touch.clientY);
      event.preventDefault();
    }
  };

  private onTouchMove = (event: TouchEvent) => {
    if (!this.pointer) return;
    if (event.touches.length > 0) {
      const touch = event.touches[0]!;
      const direction = new Vector2(touch.clientX, touch.clientY)
          .sub(this.pointer)
          .divideScalar(this.pixelDistance);

      this.emit(JoystickGestureEvent.change, direction);
      event.preventDefault();
    }
  };

  private onTouchEnd = (event: TouchEvent) => {
    if (this.pointer) {
      this.pointer = undefined;
      this.emit(JoystickGestureEvent.release);
      event.preventDefault();
    }
  };
}
