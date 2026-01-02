import { Object3D } from "three";
import type { Component } from "./Component";
import { TimeController } from "./TimeController";

/**
 * A Platform is a Three.js Object3D that manages a collection of Components
 * and provides lifecycle management through the TimeController system.
 *
 * Platforms automatically participate in the time system, receiving onBegin (once)
 * and onTick (every frame) events. Components attached to a Platform are automatically
 * managed and receive the same lifecycle events.
 *
 * Components are executed in priority order (lower values first) during each frame.
 * The Platform itself can also have a priority for execution order relative to other Platforms.
 *
 * @example
 * ```typescript
 * // Create a platform with default priority
 * const platform = new Platform();
 * scene.add(platform);
 *
 * // Create platform with specific priority
 * const highPriorityPlatform = new Platform(10); // Executes before default (100)
 *
 * // Add components
 * const movement = new MovementComponent(platform);
 * const renderer = new RenderComponent(platform, 200); // Lower priority
 * ```
 */
export class Platform extends Object3D {
  /** Array of components attached to this platform, maintained in priority order */
  private readonly components: Component[] = [];

  /**
   * Creates a new Platform and registers it with the TimeController system.
   *
   * @param priority - Execution priority for this platform (lower values execute first, default: 100)
   */
  constructor(priority = 100) {
    super();
    TimeController.instance.once(
      TimeController.Event.TICK,
      this.onBegin,
      this,
      priority,
    );
    TimeController.instance.on(
      TimeController.Event.TICK,
      this.onTick,
      this,
      priority,
    );
  }

  /**
   * Destroys the platform and all its components.
   *
   * This method:
   * 1. Unregisters from the TimeController system
   * 2. Destroys all attached components (which automatically removes them)
   * 3. Removes itself from its parent Object3D
   *
   * After calling destroy(), this platform will no longer receive updates
   * and should not be used.
   */
  public destroy(): void {
    TimeController.instance.off(TimeController.Event.TICK, this.onTick, this);
    const snapshot = this.components.slice();
    for (let i = 0; i < snapshot.length; i++) {
      this.components[i]?.destroy();
    }
    this.parent?.remove(this);
  }

  /**
   * Finds and returns the first component of the specified type attached to this platform.
   *
   * @typeParam T - The component type to search for
   * @param constructor - The constructor function of the component class to find
   * @returns The first matching component instance, or undefined if not found
   *
   * @example
   * ```typescript
   * const movement = platform.getComponent(MovementComponent);
   * if (movement) {
   *   movement.setSpeed(10);
   * }
   * ```
   */
  public getComponent<T extends Component>(
    constructor: new (...args: unknown[]) => T,
  ): T | undefined {
    return this.components.find((c) => c instanceof constructor) as T;
  }

  /**
   * Adds a component to this platform and sorts the component list by priority.
   * This method is called automatically by Component constructors.
   *
   * @param component - The component to add
   * @throws Error if the component is already attached to this platform
   */
  protected addComponent(component: Component): void {
    if (this.components.includes(component)) {
      throw new Error(
        `Component ${component.constructor.name} already exists!`,
      );
      return;
    }

    this.components.push(component);
    // Sort components by priority (lower values execute first)
    this.components.sort((a, b) => a["priority"] - b["priority"]);
  }

  /**
   * Removes a component from this platform.
   * This method is called automatically by Component.destroy().
   *
   * @param component - The component to remove
   */
  protected removeComponent(component: Component): void {
    const index = this.components.indexOf(component);
    if (index !== -1) {
      this.components.splice(index, 1);
    }
  }

  /**
   * Platform lifecycle method called once when the TimeController first starts.
   * Calls onBegin() on all attached components with the current scaled time.
   */
  private onBegin(): void {
    const time = TimeController.instance.time;
    for (let i = 0; i < this.components.length; i++) {
      this.components[i]?.["onBegin"](time);
    }
  }

  /**
   * Platform lifecycle method called every frame by the TimeController.
   * Calls onTick() on all active components with the current scaled delta time.
   *
   * @param deltaTime - Time elapsed since last frame in seconds (scaled by TimeController)
   */
  private onTick(deltaTime: number): void {
    // Execute onTick for all active components in priority order
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (component?.isActive) {
        component["onTick"](deltaTime);
      }
    }
  }
}
