import { Eventail } from "eventail";
import type { Platform } from "./Platform";

/**
 * Base class for Platform components (analogous to MonoBehavior in Unity or component scripts in CocosCreator).
 *
 * Extends Eventail and receives lifecycle events: onBegin (once), onTick (frame), onFixedTick, onLateFixedTick.
 * Execution priority: lower values execute first. Can be toggled via isActive flag.
 */
export abstract class Component extends Eventail {
  /**
   * Toggles onTick callbacks. onBegin always fires regardless.
   */
  public isActive = true;

  /**
   * @param platform - Platform to attach to
   * @param priority - Execution priority (lower = earlier, default: 100)
   */
  constructor(
    public readonly platform: Platform,
    protected readonly priority = 100,
  ) {
    super();
    this.platform["addComponent"](this);
  }

  /**
   * Unregisters from Platform and stops receiving lifecycle events.
   */
  public destroy(): void {
    this.platform["removeComponent"](this);
  }

  /**
   * Invoked once at Platform initialization.
   *
   * @param time - Current scaled time (seconds)
   */
  protected onBegin?(time: number): void;

  /**
   * Invoked every frame if isActive is true.
   *
   * @param deltaTime - Time since last frame (seconds)
   */
  protected onTick?(deltaTime: number): void;

  /**
   * Invoked before physics step if isActive is true.
   *
   * @param fixedDeltaTime - Fixed time step (seconds)
   */
  protected onFixedTick?(fixedDeltaTime: number): void;

  /**
   * Invoked after physics step if isActive is true.
   *
   * @param fixedDeltaTime - Fixed time step (seconds)
   */
  protected onLateFixedTick?(fixedDeltaTime: number): void;
}
