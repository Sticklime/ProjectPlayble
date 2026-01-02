import EventHandler, { EventCallback } from "Libs/System/EventHandler";
import { TimeHandler } from "TimeHandler";

export enum BehaviorStateEvent {
  ENTER = "BehaviorStateEvent:ENTER",
  EXIT = "BehaviorStateEvent:EXIT",
  TICK = "BehaviorStateEvent:TICK",
}

export class BehaviorState extends EventHandler {
  public isActive: boolean = false;
  private tickSubscriptionCount: number = 0;

  public override on(
    type: string,
    callback: EventCallback,
    context?: unknown,
    priority = 100,
  ): this {
    if (type === BehaviorStateEvent.TICK) {
      this.updateTickSubscriptionCount(1);
    }
    return super.on(type, callback, context, priority);
  }

  public override off(
    type: string,
    callback?: EventCallback,
    context?: unknown,
  ): this {
    if (type === BehaviorStateEvent.TICK) {
      this.updateTickSubscriptionCount(-1);
    }
    return super.off(type, callback, context);
  }

  private updateTickSubscriptionCount(delta: number) {
    const currentCount = this.tickSubscriptionCount;
    this.tickSubscriptionCount = Math.max(
      0,
      this.tickSubscriptionCount + delta,
    );

    if (currentCount === 0 && this.tickSubscriptionCount > 0) {
      TimeHandler.instance.on(TimeHandler.EEvent.TICK, this.onTick, this);
    } else if (currentCount > 0 && this.tickSubscriptionCount === 0) {
      TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);
    }
  }

  private onTick(deltaTime: number) {
    if (this.isActive && this.tickSubscriptionCount > 0) {
      this.emit(BehaviorStateEvent.TICK, deltaTime);
    }
  }

  protected enter() {
    if (this.isActive) return;
    this.isActive = true;
    this.emit(BehaviorStateEvent.ENTER, this);

    if (this.tickSubscriptionCount > 0) {
      TimeHandler.instance.on(TimeHandler.EEvent.TICK, this.onTick, this);
    }
  }

  protected exit() {
    if (!this.isActive) return;
    this.isActive = false;
    this.emit(BehaviorStateEvent.EXIT, this);

    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);
  }
}
