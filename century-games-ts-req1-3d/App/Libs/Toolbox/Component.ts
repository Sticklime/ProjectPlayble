import { Eventail } from "eventail";
import type { Platform } from "./Platform";

/**
 * Abstract base class for all components that can be attached to a Platform.
 *
 * Components extend Eventail to provide event-driven functionality and are automatically
 * managed by their parent Platform. They participate in the Platform's lifecycle through
 * onBegin and onTick methods, and can be enabled/disabled via the isActive flag.
 *
 * Components are automatically sorted by priority when added to a Platform, with lower
 * priority values executing first.
 *
 * @example
 * ```typescript
 * class MovementComponent extends Component {
 *   protected onTick(deltaTime: number): void {
 *     // Update position based on deltaTime
 *     this.platform.position.x += this.speed * deltaTime;
 *   }
 * }
 *
 * const platform = new Platform();
 * const movement = new MovementComponent(platform, 50); // Priority 50
 * ```
 */
export abstract class Component extends Eventail {
  /**
   * Controls whether this component participates in the Platform's update cycle.
   * When false, onTick will not be called, but onBegin will still be called once.
   */
  public isActive = true;

  /**
   * Creates a new component and automatically registers it with the specified Platform.
   *
   * @param platform - The Platform this component will be attached to
   * @param priority - Execution priority (lower values execute first, default: 100)
   */
  constructor(
    protected readonly platform: Platform,
    protected readonly priority = 100,
  ) {
    super();
    this.platform["addComponent"](this);
  }

  /**
   * Removes this component from its Platform and cleans up resources.
   * After calling destroy(), this component will no longer receive lifecycle events.
   */
  public destroy(): void {
    this.platform["removeComponent"](this);
  }

  /**
   * Called once when the Platform first starts its update cycle.
   * Override this method to perform initialization that requires the Platform
   * to be fully set up and connected to the time system.
   *
   * @param time - The current scaled time in seconds from TimeController
   */
  protected onBegin(time: number): void {
    void time;
  }

  /**
   * Called every frame while the component is active.
   * Override this method to implement the component's main update logic.
   * Only called when isActive is true.
   *
   * @param deltaTime - Time elapsed since last frame in seconds (scaled by TimeController)
   */
  protected onTick(deltaTime: number): void {
    void deltaTime;
  }
}
