import { Object3D } from "three";
import type { Component } from "./Component";
import { TimeController } from "./TimeController";

/**
 * Three.js Object3D that manages a collection of Components with lifecycle events.
 *
 * Receives onBegin (once) and onTick (every frame) events from TimeController.
 * Components are executed in priority order (lower values first).
 *
 * @example
 * ```typescript
 * const platform = new Platform();
 * scene.add(platform);
 *
 * const movement = new MovementComponent(platform);
 * ```
 */
export class Platform extends Object3D {
  /** Components attached to this platform in priority order */
  private readonly components: Component[] = [];

  /**
   * Creates a Platform and registers it with TimeController.
   *
   * @param priority - Execution priority (lower values first, default: 100)
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
   * Destroys the platform and all components.
   * Unregisters from TimeController, destroys components, removes from parent.
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
   * Finds first component of specified type.
   *
   * @typeParam T - Component type to search for
   * @param constructor - Constructor of component class
   * @returns First matching component or undefined
   *
   * @example
   * ```typescript
   * const movement = platform.getComponent(MovementComponent);
   * ```
   */
  public getComponent<T extends Component>(
    constructor: new (...args: unknown[]) => T,
  ): T | undefined {
    return this.components.find((c) => c instanceof constructor) as T;
  }

  /**
   * Adds component and sorts by priority. Called by Component constructors.
   *
   * @param component - Component to add
   * @throws Error if component already attached
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
   * Removes component. Called by Component.destroy().
   *
   * @param component - Component to remove
   */
  protected removeComponent(component: Component): void {
    const index = this.components.indexOf(component);
    if (index !== -1) {
      this.components.splice(index, 1);
    }
  }

  /**
   * Called once when TimeController starts. Calls onBegin() on all components.
   */
  private onBegin(): void {
    const time = TimeController.instance.time;
    for (let i = 0; i < this.components.length; i++) {
      this.components[i]?.["onBegin"](time);
    }
  }

  /**
   * Called every frame by TimeController. Calls onTick() on active components.
   *
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  private onTick(deltaTime: number): void {
    // Execute onTick for active components in priority order
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (component?.isActive) {
        component["onTick"](deltaTime);
      }
    }
  }
}
