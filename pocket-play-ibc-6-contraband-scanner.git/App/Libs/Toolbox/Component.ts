import { Eventail } from "eventail";
import type { Platform } from "./Platform";

/**
 * Base class for components that attach to a Platform.
 *
 * Extends Eventail and participates in Platform lifecycle through onBegin and onTick methods.
 * Can be enabled/disabled via isActive flag. Sorted by priority (lower values first).
 *
 * @example
 * ```typescript
 * class MovementComponent extends Component {
 *   protected onTick(deltaTime: number): void {
 *     this.platform.position.x += this.speed * deltaTime;
 *   }
 * }
 *
 * const movement = new MovementComponent(platform, 50);
 * ```
 */
export abstract class Component extends Eventail {
  /**
   * Controls whether this component receives onTick calls.
   * When false, onTick is skipped but onBegin is still called once.
   */
  public isActive = true;

  /**
   * Creates component and registers it with Platform.
   *
   * @param platform - Platform to attach to
   * @param priority - Execution priority (lower values first, default: 100)
   */
  constructor(
    protected readonly platform: Platform,
    protected readonly priority = 100,
  ) {
    super();
    this.platform["addComponent"](this);
  }

  /**
   * Removes component from Platform. Component will no longer receive lifecycle events.
   */
  public destroy(): void {
    this.platform["removeComponent"](this);
  }

  /**
   * Called once when Platform starts. Override for initialization.
   *
   * @param time - Current scaled time in seconds
   */
  protected onBegin(time: number): void {
    void time;
  }

  /**
   * Called every frame when component is active. Override for update logic.
   *
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  protected onTick(deltaTime: number): void {
    void deltaTime;
  }
}
